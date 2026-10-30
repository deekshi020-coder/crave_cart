import { Router, Request, Response } from 'express';
import { getPool, query } from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/orders - Place order with server-side loyalty calculation and transaction safety
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: 'Database connection unavailable.' });
    return;
  }

  const client = await pool.connect();
  try {
    const customerId = req.user!.id;
    const { addressId, addressText, couponCode, paymentMethod = 'UPI' } = req.body;

    await client.query('BEGIN');

    // 1. Fetch user's cart
    const cartRes = await client.query<{ id: number }>('SELECT id FROM carts WHERE user_id = $1', [customerId]);
    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Cart is empty.' });
      return;
    }
    const cartId = cartRes.rows[0].id;

    // 2. Fetch cart items with CURRENT menu prices (never trust client prices!)
    const itemsRes = await client.query<{
      cart_item_id: number;
      quantity: number;
      menu_item_id: number;
      name: string;
      price: string;
      restaurant_id: number;
      is_available: boolean;
    }>(
      `SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        m.id as menu_item_id,
        m.name,
        m.price,
        m.restaurant_id,
        m.is_available
       FROM cart_items ci
       JOIN menu_items m ON ci.menu_item_id = m.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Cart has no items to order.' });
      return;
    }

    const items = itemsRes.rows;
    // Check availability
    for (const item of items) {
      if (!item.is_available) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Item "${item.name}" is no longer available.` });
        return;
      }
    }

    const restaurantId = items[0].restaurant_id;

    // Calculate subtotal from authoritative DB prices
    let itemSubtotal = 0;
    for (const item of items) {
      const price = parseFloat(item.price);
      itemSubtotal += price * item.quantity;
    }
    itemSubtotal = Math.round(itemSubtotal * 100) / 100;

    // 3. Query PostgreSQL view: loyalty_customers (DA2 Query 9 requirement)
    // Determines actual loyalty discount percentage (0%, 10%, or 20%)
    const loyaltyRes = await client.query<{
      eligible_order_count: string;
      discount_percentage: number;
    }>(
      'SELECT eligible_order_count, discount_percentage FROM loyalty_customers WHERE customer_id = $1',
      [customerId]
    );

    const loyaltyPct = loyaltyRes.rows[0]?.discount_percentage || 0;
    const loyaltyDiscount = loyaltyPct > 0 
      ? Math.round((itemSubtotal * (loyaltyPct / 100)) * 100) / 100
      : 0.00;

    // 4. Coupon validation if code supplied
    let couponDiscount = 0.00;
    let appliedCoupon: string | null = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
      const codeClean = couponCode.trim().toUpperCase();

      // Check WELCOME100: only for new customers (0 prior orders)
      if (codeClean === 'WELCOME100') {
        const priorOrdersRes = await client.query<{ count: string }>(
          'SELECT COUNT(*) FROM orders WHERE customer_id = $1',
          [customerId]
        );
        const priorCount = parseInt(priorOrdersRes.rows[0]?.count || '0', 10);
        if (priorCount > 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'WELCOME100 is only valid on your first CraveCart order.' });
          return;
        }
      }

      // Check BIRYANI100: must contain Biryani
      if (codeClean === 'BIRYANI100') {
        const biryaniCheck = await client.query(
          `SELECT 1 FROM cart_items ci 
           JOIN menu_items m ON ci.menu_item_id = m.id 
           JOIN categories c ON m.category_id = c.id 
           WHERE ci.cart_id = $1 AND c.name ILIKE '%Biryani%'`,
          [cartId]
        );
        if (biryaniCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'BIRYANI100 is only applicable on orders containing Biryani delicacies.' });
          return;
        }
      }

      // Check SWEETTOOTH: must contain Desserts & Sweets
      if (codeClean === 'SWEETTOOTH') {
        const sweetsCheck = await client.query(
          `SELECT 1 FROM cart_items ci 
           JOIN menu_items m ON ci.menu_item_id = m.id 
           JOIN categories c ON m.category_id = c.id 
           WHERE ci.cart_id = $1 AND (c.name ILIKE '%Dessert%' OR c.name ILIKE '%Sweet%')`,
          [cartId]
        );
        if (sweetsCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(400).json({ error: 'SWEETTOOTH is only applicable on orders containing Desserts & Sweets.' });
          return;
        }
      }

      const couponRes = await client.query<{
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: string;
        min_order_value: string;
        max_discount: string | null;
        is_active: boolean;
      }>('SELECT * FROM coupons WHERE code = $1 AND is_active = true', [codeClean]);

      if (couponRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Coupon code "${codeClean}" is invalid or expired.` });
        return;
      }

      const c = couponRes.rows[0];
      const minVal = parseFloat(c.min_order_value);
      if (itemSubtotal < minVal) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: `Coupon "${codeClean}" requires a minimum order value of ₹${minVal}.` });
        return;
      }

      appliedCoupon = c.code;
      if (c.discount_type === 'percentage') {
        const rawDiscount = itemSubtotal * (parseFloat(c.discount_value) / 100);
        const maxD = c.max_discount ? parseFloat(c.max_discount) : rawDiscount;
        couponDiscount = Math.min(rawDiscount, maxD);
      } else {
        couponDiscount = parseFloat(c.discount_value);
      }
      couponDiscount = Math.min(couponDiscount, itemSubtotal);
      couponDiscount = Math.round(couponDiscount * 100) / 100;
    }

    const deliveryFee = 40.00;
    const taxAmount = 0.00;
    const finalTotal = Math.max(0, Math.round((itemSubtotal - couponDiscount - loyaltyDiscount + deliveryFee + taxAmount) * 100) / 100);

    // 5. Get Address snapshot (Chennai by default)
    let snapshotAddress = addressText || 'Chennai Delivery Address';
    if (addressId) {
      const addrRes = await client.query<{ street_address: string; landmark: string | null; city: string; postal_code: string }>(
        'SELECT street_address, landmark, city, postal_code FROM addresses WHERE id = $1 AND user_id = $2',
        [addressId, customerId]
      );
      if (addrRes.rows.length > 0) {
        const a = addrRes.rows[0];
        snapshotAddress = `${a.street_address}${a.landmark ? ', ' + a.landmark : ''}, ${a.city} - ${a.postal_code}`;
      }
    }

    // 6. Insert Order (Note: Status default is 'Placed', tested via Trigger fn_set_initial_order_status)
    const orderInsertRes = await client.query<{ id: number }>(
      `INSERT INTO orders (
        customer_id,
        restaurant_id,
        delivery_address_id,
        delivery_address_snapshot,
        status,
        item_subtotal,
        coupon_discount,
        loyalty_discount,
        delivery_fee,
        tax_amount,
        final_total,
        applied_coupon_code,
        loyalty_percentage
      ) VALUES ($1, $2, $3, $4, 'Placed', $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        customerId,
        restaurantId,
        addressId || null,
        snapshotAddress,
        itemSubtotal,
        couponDiscount,
        loyaltyDiscount,
        deliveryFee,
        taxAmount,
        finalTotal,
        appliedCoupon,
        loyaltyPct,
      ]
    );

    const orderId = orderInsertRes.rows[0].id;

    // 7. Insert Historical Order Items
    for (const item of items) {
      const unitPrice = parseFloat(item.price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.menu_item_id, item.name, item.quantity, unitPrice, lineTotal]
      );
    }

    // 8. Insert Payment Record
    const isCOD = paymentMethod === 'Cash on Delivery';
    const paymentStatus = isCOD ? 'Pending' : 'Completed';
    const txnRef = `TXN_${Date.now()}_ORD${orderId}`;
    await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_ref, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, paymentMethod, finalTotal, paymentStatus, txnRef, isCOD ? null : new Date()]
    );

    // 9. Insert initial status history (clean customer-facing wording)
    const initialNotes = isCOD
      ? 'Order placed with Cash on Delivery. Cash payment will be collected upon delivery.'
      : `Order placed and payment confirmed via ${paymentMethod}.`;

    await client.query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes)
       VALUES ($1, NULL, 'Placed', 'Customer', $2)`,
      [orderId, initialNotes]
    );

    // 10. Clear customer's cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId,
      finalTotal,
      loyaltyDiscount,
      loyaltyPercentage: loyaltyPct,
      couponDiscount,
      status: 'Placed',
      transactionRef: txnRef,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err.message);
    res.status(500).json({ error: 'Failed to place order: ' + err.message });
  } finally {
    client.release();
  }
});

// GET /api/orders - Fetch customer's orders
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const ordersSql = `
      SELECT 
        o.*,
        r.name as restaurant_name,
        r.image_url as restaurant_image,
        r.cuisine_type,
        p.payment_method,
        p.status as payment_status,
        p.transaction_ref,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'itemName', oi.item_name,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'lineTotal', oi.line_total
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = $1
      GROUP BY o.id, r.id, p.id
      ORDER BY o.created_at DESC;
    `;

    const result = await query(ordersSql, [customerId]);
    res.json({ orders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id - Single order details with status history timeline
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const orderRes = await query(
      `SELECT 
        o.*,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.cuisine_type,
        u.name as customer_name,
        u.phone as customer_phone,
        p.payment_method,
        p.status as payment_status,
        p.transaction_ref,
        p.paid_at
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const order = orderRes.rows[0];

    // Access control: customer can only view own order unless admin or delivery agent
    if (userRole === 'customer' && order.customer_id !== userId) {
      res.status(403).json({ error: 'Access denied to this order.' });
      return;
    }

    const itemsRes = await query(
      'SELECT id, item_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1 ORDER BY id ASC',
      [orderId]
    );

    const historyRes = await query(
      'SELECT id, previous_status, new_status, actor, notes, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );

    // Call PL/pgSQL function calculate_order_total(orderId) (DA2 Procedural Exercise 2 requirement)
    const totalCheckRes = await query<{ calculated_total: string }>(
      'SELECT calculate_order_total($1) as calculated_total',
      [orderId]
    );

    res.json({
      order,
      items: itemsRes.rows,
      timeline: historyRes.rows,
      calculatedSubtotal: parseFloat(totalCheckRes.rows[0]?.calculated_total || '0'),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/cancel - Customer cancel order
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    // Check order
    const orderRes = await query<{ customer_id: number; status: string }>(
      'SELECT customer_id, status FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const order = orderRes.rows[0];
    if (order.customer_id !== userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'You do not have permission to cancel this order.' });
      return;
    }

    if (order.status !== 'Placed' && order.status !== 'Confirmed') {
      res.status(400).json({
        error: `Order cannot be cancelled because it is already in "${order.status}" status.`,
      });
      return;
    }

    // Call stored procedure update_order_status (DA2 Procedural Exercise 1)
    await query('CALL update_order_status($1, $2, $3)', [
      orderId,
      'Cancelled',
      req.user!.role === 'admin' ? 'Admin' : 'Customer',
    ]);

    res.json({ message: 'Order successfully cancelled.', status: 'Cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
