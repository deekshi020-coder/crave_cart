import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('delivery_agent', 'admin'));

// GET /api/delivery/tasks - Orders needing delivery or active
router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const tasksSql = `
      SELECT 
        o.id,
        o.status,
        o.final_total,
        o.delivery_fee,
        o.delivery_address_snapshot,
        o.created_at,
        u.name as customer_name,
        u.phone as customer_phone,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.cuisine_type,
        p.payment_method,
        p.status as payment_status
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.status IN ('Ready for Pickup', 'Out for Delivery', 'Preparing')
      ORDER BY 
        CASE o.status 
          WHEN 'Out for Delivery' THEN 1 
          WHEN 'Ready for Pickup' THEN 2 
          ELSE 3 
        END,
        o.created_at ASC;
    `;

    const result = await query(tasksSql);

    // Agent vehicle info
    const agentRes = await query(
      `SELECT da.id, da.phone, da.current_area, v.vehicle_type, v.registration_number
       FROM delivery_agents da
       LEFT JOIN vehicles v ON da.id = v.delivery_agent_id
       WHERE da.user_id = $1`,
      [req.user!.id]
    );

    res.json({
      tasks: result.rows,
      agentInfo: agentRes.rows[0] || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/delivery/history - Past completed deliveries
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const historySql = `
      SELECT 
        o.id,
        o.status,
        o.final_total,
        o.delivery_address_snapshot,
        o.created_at,
        o.updated_at,
        u.name as customer_name,
        r.name as restaurant_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status = 'Delivered'
      ORDER BY o.updated_at DESC
      LIMIT 15;
    `;

    const result = await query(historySql);
    res.json({ deliveries: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/delivery/orders/:id/status - Update delivery status via Stored Procedure
router.patch('/orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { newStatus } = req.body;

    if (!newStatus || !['Out for Delivery', 'Delivered'].includes(newStatus)) {
      res.status(400).json({ error: 'Delivery agents can only update status to "Out for Delivery" or "Delivered".' });
      return;
    }

    // Call stored procedure update_order_status (DA2 Procedural Exercise 1)
    await query('CALL update_order_status($1, $2, $3)', [
      orderId,
      newStatus,
      `Delivery Agent (${req.user!.name})`,
    ]);

    res.json({
      message: `Order #${orderId} updated to ${newStatus} successfully.`,
      status: newStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/delivery/orders/:id/confirm-cash - Confirm cash collection on COD orders
router.post('/orders/:id/confirm-cash', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.params.id, 10);
    await query(
      `UPDATE payments SET status = 'Completed', paid_at = CURRENT_TIMESTAMP WHERE order_id = $1 AND payment_method = 'Cash on Delivery'`,
      [orderId]
    );
    await query(
      `INSERT INTO order_status_history (order_id, previous_status, new_status, actor, notes)
       VALUES ($1, 'Delivered', 'Delivered', $2, 'Cash payment collected in full by delivery partner.')`,
      [orderId, `Delivery Agent (${req.user!.name})`]
    );
    res.json({ message: 'Cash collection confirmed and marked as Completed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
