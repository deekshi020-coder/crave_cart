import { Router, Request, Response } from 'express';
import { query, getPool } from '../db/pool.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes: require authentication and 'admin' role
router.use(authMiddleware);
router.use(requireRole('admin'));

// 1. OVERVIEW KPIS
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const countsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM restaurants WHERE is_active = true) as total_restaurants,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(final_total), 0) FROM orders WHERE status != 'Cancelled') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'Out for Delivery') as active_deliveries
    `);

    // Recent orders
    const recentOrdersRes = await query(`
      SELECT 
        o.id,
        o.created_at,
        o.status,
        o.final_total,
        u.name as customer_name,
        r.name as restaurant_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      ORDER BY o.created_at DESC
      LIMIT 6;
    `);

    // Daily order trend
    const trendsRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as order_date,
        COUNT(*) as order_count,
        SUM(final_total) as daily_revenue
      FROM orders
      WHERE status != 'Cancelled'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY order_date DESC
      LIMIT 7;
    `);

    res.json({
      metrics: countsRes.rows[0],
      recentOrders: recentOrdersRes.rows,
      trends: trendsRes.rows.reverse(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DA2 10 SQL QUERIES INTEGRATED ENDPOINTS
// ==========================================

// DA2 Query 1: Customers with > 5 orders in September 2026
router.get('/analytics/monthly-customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        u.id as customer_id,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        COUNT(o.id)::INT as september_order_count,
        SUM(o.final_total)::NUMERIC(10, 2) as september_spending,
        'September 2026' as period_name
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      WHERE o.status != 'Cancelled'
        AND o.created_at >= DATE '2026-09-01'
        AND o.created_at < DATE '2026-10-01'
      GROUP BY u.id, u.name, u.email, u.phone
      HAVING COUNT(o.id) > 5
      ORDER BY september_order_count DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 2: Restaurants with average rating above 4.0
router.get('/analytics/top-rated-restaurants', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        r.id as restaurant_id,
        r.name as restaurant_name,
        r.cuisine_type,
        r.is_pure_veg,
        ROUND(AVG(rev.rating)::numeric, 2) as avg_rating,
        COUNT(rev.id)::INT as review_count
      FROM restaurants r
      JOIN reviews rev ON r.id = rev.restaurant_id
      GROUP BY r.id, r.name, r.cuisine_type, r.is_pure_veg
      HAVING AVG(rev.rating) > 4.0
      ORDER BY avg_rating DESC, review_count DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 3: Top 3 customers by total eligible paid spending
router.get('/analytics/top-customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        u.id as customer_id,
        u.name as customer_name,
        u.email as customer_email,
        SUM(p.amount)::NUMERIC(10, 2) as total_paid_spending,
        COUNT(DISTINCT o.id)::INT as paid_order_count
      FROM users u
      JOIN orders o ON u.id = o.customer_id
      JOIN payments p ON o.id = p.order_id
      WHERE p.status = 'Completed' AND o.status != 'Cancelled'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_paid_spending DESC
      LIMIT 3;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 4: Customers spending above average customer spending
router.get('/analytics/above-average-spending', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      WITH customer_spend AS (
        SELECT 
          u.id as customer_id,
          u.name as customer_name,
          u.email as customer_email,
          COALESCE(SUM(o.final_total), 0.00)::NUMERIC(10, 2) as total_spending,
          COUNT(o.id)::INT as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.customer_id AND o.status != 'Cancelled'
        WHERE u.role = 'customer'
        GROUP BY u.id, u.name, u.email
      ),
      spend_benchmark AS (
        SELECT AVG(total_spending) as avg_customer_spending
        FROM customer_spend 
        WHERE total_spending > 0
      )
      SELECT 
        cs.customer_id,
        cs.customer_name,
        cs.customer_email,
        cs.total_spending,
        cs.order_count,
        ROUND((SELECT avg_customer_spending FROM spend_benchmark)::numeric, 2) as benchmark_avg_spending,
        ROUND((cs.total_spending - (SELECT avg_customer_spending FROM spend_benchmark))::numeric, 2) as spend_surplus
      FROM customer_spend cs
      WHERE cs.total_spending > (SELECT avg_customer_spending FROM spend_benchmark)
      ORDER BY cs.total_spending DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 5: Menu items priced above their restaurant's average
router.get('/analytics/menu-price-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      WITH rest_averages AS (
        SELECT restaurant_id, AVG(price) as avg_menu_price
        FROM menu_items
        GROUP BY restaurant_id
      )
      SELECT 
        r.name as restaurant_name,
        m.id as menu_item_id,
        m.name as menu_item_name,
        m.price as item_price,
        ROUND(ra.avg_menu_price::numeric, 2) as restaurant_avg_price,
        ROUND((m.price - ra.avg_menu_price)::numeric, 2) as price_delta
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      JOIN rest_averages ra ON m.restaurant_id = ra.restaurant_id
      WHERE m.price > ra.avg_menu_price
      ORDER BY r.name ASC, m.price DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 6: Highest rated restaurants, including ties
router.get('/analytics/highest-rated-ties', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      WITH rest_ratings AS (
        SELECT 
          r.id as restaurant_id,
          r.name as restaurant_name,
          r.cuisine_type,
          r.image_url,
          ROUND(AVG(rev.rating)::numeric, 2) as avg_rating,
          COUNT(rev.id)::INT as review_count
        FROM restaurants r
        JOIN reviews rev ON r.id = rev.restaurant_id
        GROUP BY r.id, r.name, r.cuisine_type, r.image_url
      )
      SELECT 
        restaurant_id,
        restaurant_name,
        cuisine_type,
        image_url,
        avg_rating,
        review_count
      FROM rest_ratings
      WHERE avg_rating = (SELECT MAX(avg_rating) FROM rest_ratings)
      ORDER BY restaurant_name ASC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 7: Food categories with more than two items sold
router.get('/analytics/category-sales', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        SUM(oi.quantity)::INT as total_units_sold,
        COUNT(DISTINCT o.id)::INT as total_orders,
        SUM(oi.line_total)::NUMERIC(10, 2) as category_revenue
      FROM categories c
      JOIN menu_items m ON c.id = m.category_id
      JOIN order_items oi ON m.id = oi.menu_item_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      GROUP BY c.id, c.name
      HAVING SUM(oi.quantity) > 2
      ORDER BY total_units_sold DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 8: Orders above average order value
router.get('/analytics/high-value-orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `
      WITH calculated_orders AS (
        SELECT 
          o.id as order_id,
          o.created_at,
          u.name as customer_name,
          r.name as restaurant_name,
          SUM(oi.quantity * oi.unit_price)::NUMERIC(10, 2) as order_item_value
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status != 'Cancelled'
        GROUP BY o.id, o.created_at, u.name, r.name
      ),
      aov_benchmark AS (
        SELECT AVG(order_item_value) as avg_order_value FROM calculated_orders
      )
      SELECT 
        co.order_id,
        co.created_at,
        co.customer_name,
        co.restaurant_name,
        co.order_item_value,
        ROUND((SELECT avg_order_value FROM aov_benchmark)::numeric, 2) as benchmark_aov,
        ROUND((co.order_item_value - (SELECT avg_order_value FROM aov_benchmark))::numeric, 2) as surplus_value
      FROM calculated_orders co
      WHERE co.order_item_value > (SELECT avg_order_value FROM aov_benchmark)
      ORDER BY co.order_item_value DESC;
    `;
    const result = await query(sql);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 9: loyalty_customers PostgreSQL View
router.get('/analytics/loyalty-customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        customer_id,
        name,
        email,
        phone,
        eligible_order_count,
        discount_percentage,
        total_spending
      FROM loyalty_customers
      ORDER BY eligible_order_count DESC, total_spending DESC;
    `);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Query 10: restaurant_performance PostgreSQL View
router.get('/analytics/restaurant-performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        restaurant_id,
        restaurant_name,
        cuisine_type,
        is_pure_veg,
        menu_items_count,
        average_rating,
        review_count,
        total_orders,
        total_revenue
      FROM restaurant_performance
      ORDER BY total_revenue DESC, average_rating DESC;
    `);
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Procedural Exercise 3: Cursor-based Active Customers Report
router.get('/analytics/cursor-report', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM get_active_customers_cursor();');
    res.json({ data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DA2 Procedural Exercise 5: Anonymous Block for Customer ID 1 Execution
router.post('/execute-loyalty-block', async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: 'Database unavailable.' });
    return;
  }

  const client = await pool.connect();
  try {
    const notices: string[] = [];
    client.on('notice', (msg: any) => {
      if (msg.message) notices.push(msg.message);
    });

    const anonymousBlockSql = `
      DO $$
      DECLARE
          v_customer_id INT := 1;
          v_customer_name VARCHAR(100);
          v_order_count INT;
          v_discount_pct INT;
      BEGIN
          SELECT name INTO v_customer_name FROM users WHERE id = v_customer_id;
          IF NOT FOUND THEN
              RAISE NOTICE 'Customer ID % not found in CraveCart database.', v_customer_id;
              RETURN;
          END IF;

          SELECT COUNT(id) INTO v_order_count
          FROM orders
          WHERE customer_id = v_customer_id AND status != 'Cancelled';

          IF v_order_count > 5 THEN
              v_discount_pct := 20;
          ELSIF v_order_count >= 3 THEN
              v_discount_pct := 10;
          ELSE
              v_discount_pct := 0;
          END IF;

          RAISE NOTICE 'Customer ID: % (%) has % eligible orders. Loyalty Discount: %% %', 
              v_customer_id, v_customer_name, v_order_count, v_discount_pct;
      END $$;
    `;

    await client.query(anonymousBlockSql);

    // Also fetch current customer 1 details to return alongside notices
    const custRes = await client.query('SELECT * FROM loyalty_customers WHERE customer_id = 1');

    res.json({
      message: 'Anonymous DO block executed successfully.',
      notices,
      customerDetails: custRes.rows[0],
      blockCode: anonymousBlockSql.trim(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// ADMIN ORDER MANAGEMENT & STATUS UPDATE
// ==========================================

// Get all orders with filtering
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (status && status !== 'all') {
      conditions.push(`o.status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push(`(u.name ILIKE $${pIdx} OR r.name ILIKE $${pIdx} OR o.id::text = $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const ordersSql = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        r.name as restaurant_name,
        p.status as payment_status,
        p.payment_method
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      ${whereClause}
      ORDER BY o.created_at DESC;
    `;

    const result = await query(ordersSql, params);
    res.json({ orders: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status via Stored Procedure: update_order_status (DA2 Procedural Exercise 1)
router.patch('/orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { newStatus } = req.body;

    if (!newStatus) {
      res.status(400).json({ error: 'Target newStatus is required.' });
      return;
    }

    // Call PostgreSQL procedure
    await query('CALL update_order_status($1, $2, $3)', [
      orderId,
      newStatus,
      `Admin (${req.user!.name})`,
    ]);

    res.json({
      message: `Order #${orderId} status updated to "${newStatus}" via PostgreSQL stored procedure update_order_status.`,
      newStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN RESTAURANT & MENU CRUD MANAGEMENT
// ==========================================

// Add or edit restaurant
router.post('/restaurants', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, cuisineType, imageUrl, address, isPureVeg, deliveryTimeMins, priceForTwo } = req.body;
    if (!name || !cuisineType || !address) {
      res.status(400).json({ error: 'Name, cuisine type, and address are required.' });
      return;
    }

    const insertSql = `
      INSERT INTO restaurants (name, description, cuisine_type, image_url, address, is_pure_veg, delivery_time_mins, price_for_two)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await query(insertSql, [
      name,
      description || '',
      cuisineType,
      imageUrl || '/src/assets/images/woodfire_pizza_1793294053970.jpg',
      address,
      Boolean(isPureVeg),
      parseInt(deliveryTimeMins || '30', 10),
      parseFloat(priceForTwo || '400'),
    ]);

    res.status(201).json({ message: 'Restaurant added.', restaurant: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add menu item
router.post('/menu-items', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, categoryId, name, description, price, imageUrl, isVeg, isAvailable } = req.body;
    if (!restaurantId || !categoryId || !name || price === undefined) {
      res.status(400).json({ error: 'Restaurant, category, name, and price are required.' });
      return;
    }

    const insertSql = `
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_veg, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await query(insertSql, [
      parseInt(restaurantId, 10),
      parseInt(categoryId, 10),
      name,
      description || '',
      parseFloat(price),
      imageUrl || '/src/assets/images/woodfire_pizza_1793294053970.jpg',
      Boolean(isVeg),
      isAvailable !== false,
    ]);

    res.status(201).json({ message: 'Menu item created.', item: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
