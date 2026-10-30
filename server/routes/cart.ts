import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper to get or create cart for authenticated user
async function getOrCreateCart(userId: number): Promise<number> {
  const existing = await query<{ id: number }>('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const created = await query<{ id: number }>(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
    [userId]
  );
  return created.rows[0].id;
}

// GET /api/cart - Get user's current cart items and totals
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cartId = await getOrCreateCart(userId);

    const itemsSql = `
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        m.id as menu_item_id,
        m.name,
        m.price,
        m.image_url,
        m.is_veg,
        m.is_available,
        m.restaurant_id,
        r.name as restaurant_name,
        (ci.quantity * m.price)::NUMERIC(10, 2) as item_total
      FROM cart_items ci
      JOIN menu_items m ON ci.menu_item_id = m.id
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE ci.cart_id = $1
      ORDER BY ci.id ASC;
    `;

    const itemsRes = await query(itemsSql, [cartId]);
    const items = itemsRes.rows;

    let subtotal = 0;
    let restaurantId: number | null = null;
    let restaurantName: string | null = null;

    if (items.length > 0) {
      restaurantId = items[0].restaurant_id;
      restaurantName = items[0].restaurant_name;
      subtotal = items.reduce((sum, item) => sum + parseFloat(item.item_total), 0);
    }

    res.json({
      cartId,
      restaurantId,
      restaurantName,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/items - Add item or increment
router.post('/items', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { menuItemId, quantity = 1, forceReset = false } = req.body;

    if (!menuItemId || quantity < 1) {
      res.status(400).json({ error: 'Valid menuItemId and quantity required.' });
      return;
    }

    // Verify menu item exists and fetch its restaurant
    const itemRes = await query<{ id: number; restaurant_id: number; is_available: boolean; price: string }>(
      'SELECT id, restaurant_id, is_available, price FROM menu_items WHERE id = $1',
      [menuItemId]
    );

    if (itemRes.rows.length === 0) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }

    const item = itemRes.rows[0];
    if (!item.is_available) {
      res.status(400).json({ error: 'Sorry, this menu item is currently out of stock.' });
      return;
    }

    const cartId = await getOrCreateCart(userId);

    // Check if cart already has items from another restaurant
    const existingRestaurantRes = await query<{ restaurant_id: number; restaurant_name: string }>(
      `SELECT DISTINCT m.restaurant_id, r.name as restaurant_name 
       FROM cart_items ci
       JOIN menu_items m ON ci.menu_item_id = m.id
       JOIN restaurants r ON m.restaurant_id = r.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (existingRestaurantRes.rows.length > 0) {
      const activeRest = existingRestaurantRes.rows[0];
      if (activeRest.restaurant_id !== item.restaurant_id) {
        if (!forceReset) {
          res.status(409).json({
            error: 'Cart contains items from another restaurant.',
            differentRestaurant: true,
            currentRestaurant: activeRest.restaurant_name,
          });
          return;
        } else {
          // Clear previous restaurant items
          await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
        }
      }
    }

    // Upsert item
    await query(
      `INSERT INTO cart_items (cart_id, menu_item_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, menu_item_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, menuItemId, quantity]
    );

    res.json({ message: 'Item added to cart successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cart/items/:id - Update item quantity
router.patch('/items/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cartItemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;

    const cartId = await getOrCreateCart(userId);

    if (typeof quantity !== 'number' || quantity <= 0) {
      await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cartId]);
      res.json({ message: 'Item removed from cart.' });
      return;
    }

    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3', [
      quantity,
      cartItemId,
      cartId,
    ]);

    res.json({ message: 'Quantity updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/items/:id - Remove item
router.delete('/items/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cartItemId = parseInt(req.params.id, 10);
    const cartId = await getOrCreateCart(userId);

    await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cartId]);
    res.json({ message: 'Item removed from cart.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cartId = await getOrCreateCart(userId);

    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ message: 'Cart cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/sync - Sync local guest cart items into authenticated user's PostgreSQL cart
router.post('/sync', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.json({ message: 'No items to sync.' });
      return;
    }

    const cartId = await getOrCreateCart(userId);

    for (const it of items) {
      const menuItemId = parseInt(it.menuItemId, 10);
      const quantity = Math.max(1, parseInt(it.quantity, 10) || 1);
      if (!menuItemId) continue;

      // Check item
      const itemRes = await query<{ id: number; restaurant_id: number; is_available: boolean }>(
        'SELECT id, restaurant_id, is_available FROM menu_items WHERE id = $1',
        [menuItemId]
      );
      if (itemRes.rows.length === 0 || !itemRes.rows[0].is_available) continue;

      const restId = itemRes.rows[0].restaurant_id;

      // Check existing restaurant in cart
      const existingRestRes = await query<{ restaurant_id: number }>(
        `SELECT DISTINCT m.restaurant_id 
         FROM cart_items ci
         JOIN menu_items m ON ci.menu_item_id = m.id
         WHERE ci.cart_id = $1`,
        [cartId]
      );

      if (existingRestRes.rows.length > 0 && existingRestRes.rows[0].restaurant_id !== restId) {
        // Clear previous conflicting restaurant items
        await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
      }

      await query(
        `INSERT INTO cart_items (cart_id, menu_item_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, menu_item_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
        [cartId, menuItemId, quantity]
      );
    }

    res.json({ message: 'Cart synchronized successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
