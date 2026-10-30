import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/profile - Customer profile
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              COALESCE(lc.eligible_order_count, 0) as eligible_orders,
              COALESCE(lc.discount_percentage, 0) as discount_pct,
              COALESCE(lc.total_spending, 0) as total_spent
       FROM users u
       LEFT JOIN loyalty_customers lc ON u.id = lc.customer_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ profile: userRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/loyalty - Detailed loyalty status and bracket requirements
router.get('/loyalty', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Direct query against the PostgreSQL view: loyalty_customers
    const loyaltyRes = await query<{
      customer_id: number;
      name: string;
      email: string;
      eligible_order_count: string;
      discount_percentage: number;
      total_spending: string;
    }>(
      'SELECT * FROM loyalty_customers WHERE customer_id = $1',
      [userId]
    );

    const data = loyaltyRes.rows[0] || {
      customer_id: userId,
      eligible_order_count: '0',
      discount_percentage: 0,
      total_spending: '0.00',
    };

    const count = parseInt(data.eligible_order_count, 10);
    let nextTierMessage = '';
    let nextTierThreshold = 3;

    if (count < 3) {
      nextTierThreshold = 3;
      nextTierMessage = `${3 - count} more order(s) needed to unlock 10% Gold Loyalty discount.`;
    } else if (count <= 5) {
      nextTierThreshold = 6;
      nextTierMessage = `${6 - count} more order(s) needed to unlock 20% Platinum Loyalty discount.`;
    } else {
      nextTierMessage = 'You have unlocked the highest Platinum Loyalty tier (20% discount on all orders)!';
    }

    res.json({
      loyalty: {
        customerId: userId,
        eligibleOrders: count,
        discountPercentage: data.discount_percentage,
        totalSpending: parseFloat(data.total_spending),
        nextTierMessage,
        tierName: count > 5 ? 'Platinum (20% OFF)' : count >= 3 ? 'Gold (10% OFF)' : 'Member (0% OFF)',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/addresses - User saved delivery addresses
router.get('/addresses', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await query(
      'SELECT id, label, street_address, landmark, city, state, postal_code, is_default FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
      [userId]
    );
    res.json({ addresses: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profile/addresses - Add delivery address
router.post('/addresses', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { label = 'Home', streetAddress, street_address, landmark, city = 'Chennai', postalCode, postal_code, isDefault = false, is_default } = req.body;
    const street = street_address || streetAddress;
    const postal = postal_code || postalCode;
    const def = is_default !== undefined ? is_default : Boolean(isDefault);

    if (!street || !postal) {
      res.status(400).json({ error: 'Street address and postal code are required.' });
      return;
    }

    if (def) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const insertRes = await query(
      `INSERT INTO addresses (user_id, label, street_address, landmark, city, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, label, street, landmark || null, city, postal, def]
    );

    res.status(201).json({
      message: 'Address saved.',
      address: insertRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile/addresses/:id - Update existing delivery address
router.put('/addresses/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const addressId = parseInt(req.params.id, 10);
    const { label = 'Home', street_address, streetAddress, landmark, city = 'Chennai', postal_code, postalCode, is_default, isDefault } = req.body;

    const street = street_address || streetAddress;
    const postal = postal_code || postalCode;
    const def = is_default !== undefined ? is_default : Boolean(isDefault);

    if (def) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const updateRes = await query(
      `UPDATE addresses 
       SET label = $1, street_address = $2, landmark = $3, city = $4, postal_code = $5, is_default = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [label, street, landmark || null, city, postal, def, addressId, userId]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Address not found.' });
      return;
    }

    res.json({ message: 'Address updated.', address: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile/addresses/:id - Delete address
router.delete('/addresses/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const addressId = parseInt(req.params.id, 10);
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    res.json({ message: 'Address removed.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
