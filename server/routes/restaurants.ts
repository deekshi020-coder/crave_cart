import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/restaurants - Filtered and sorted restaurant listing
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      cuisine,
      category,
      minRating,
      pureVeg,
      hasOffers,
      priceBracket,
      sortBy = 'recommended',
    } = req.query;

    const conditions: string[] = ['r.is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    // Search filter across restaurant name, cuisine, and menu item names
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push(
        `(r.name ILIKE $${paramIndex} OR r.cuisine_type ILIKE $${paramIndex} OR EXISTS (
            SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name ILIKE $${paramIndex}
         ))`
      );
      params.push(term);
      paramIndex++;
    }

    // Cuisine filter
    if (cuisine && typeof cuisine === 'string' && cuisine !== 'all') {
      conditions.push(`r.cuisine_type ILIKE $${paramIndex}`);
      params.push(`%${cuisine}%`);
      paramIndex++;
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'all') {
      conditions.push(`EXISTS (
        SELECT 1 FROM restaurant_categories rc 
        JOIN categories c ON rc.category_id = c.id 
        WHERE rc.restaurant_id = r.id AND (c.name ILIKE $${paramIndex} OR c.id::text = $${paramIndex})
      )`);
      params.push(category);
      paramIndex++;
    }

    // Rating 4.0+ filter (Directly connects to DA2 Query 2 requirement)
    if (minRating) {
      const ratingThreshold = parseFloat(minRating as string);
      if (!isNaN(ratingThreshold)) {
        conditions.push(`COALESCE(rev.avg_rating, 0.0) >= $${paramIndex}`);
        params.push(ratingThreshold);
        paramIndex++;
      }
    }

    // Pure Veg filter
    if (pureVeg === 'true') {
      conditions.push('r.is_pure_veg = true');
    }

    // Price bracket filter: 'low' (< 400), 'mid' (400-600), 'high' (> 600)
    if (priceBracket === 'low') {
      conditions.push('r.price_for_two < 400');
    } else if (priceBracket === 'mid') {
      conditions.push('r.price_for_two >= 400 AND r.price_for_two <= 600');
    } else if (priceBracket === 'high') {
      conditions.push('r.price_for_two > 600');
    }

    // Sort options
    let orderByClause = 'r.id ASC';
    if (sortBy === 'rating_desc') {
      orderByClause = 'COALESCE(rev.avg_rating, 0.0) DESC, rev.review_count DESC';
    } else if (sortBy === 'price_asc') {
      orderByClause = 'r.price_for_two ASC';
    } else if (sortBy === 'price_desc') {
      orderByClause = 'r.price_for_two DESC';
    } else if (sortBy === 'popular') {
      orderByClause = 'COALESCE(ord.order_count, 0) DESC, COALESCE(rev.avg_rating, 0.0) DESC';
    } else {
      // recommended
      orderByClause = 'COALESCE(rev.avg_rating, 0.0) DESC, r.delivery_time_mins ASC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sqlQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.cuisine_type,
        r.image_url,
        r.address,
        r.city,
        r.is_pure_veg,
        r.delivery_time_mins,
        r.price_for_two,
        COALESCE(rev.avg_rating, 0.0)::NUMERIC(3, 1) as avg_rating,
        COALESCE(rev.review_count, 0)::INT as review_count,
        COALESCE(ord.order_count, 0)::INT as order_count,
        ARRAY['50% OFF up to ₹150', 'Flat ₹100 OFF'] as active_offers
      FROM restaurants r
      LEFT JOIN (
        SELECT restaurant_id, 
               ROUND(AVG(rating)::numeric, 1) as avg_rating, 
               COUNT(*) as review_count
        FROM reviews
        GROUP BY restaurant_id
      ) rev ON r.id = rev.restaurant_id
      LEFT JOIN (
        SELECT restaurant_id, COUNT(*) as order_count
        FROM orders
        WHERE status != 'Cancelled'
        GROUP BY restaurant_id
      ) ord ON r.id = ord.restaurant_id
      ${whereClause}
      ORDER BY ${orderByClause};
    `;

    const result = await query(sqlQuery, params);

    // Fetch distinct cuisines for filter panel
    const cuisinesRes = await query<{ cuisine_type: string }>(
      'SELECT DISTINCT cuisine_type FROM restaurants WHERE is_active = true ORDER BY cuisine_type'
    );

    // Fetch categories
    const categoriesRes = await query(
      'SELECT id, name, description, image_url FROM categories ORDER BY id'
    );

    res.json({
      restaurants: result.rows,
      total: result.rows.length,
      cuisines: cuisinesRes.rows.map((c) => c.cuisine_type),
      categories: categoriesRes.rows,
    });
  } catch (err: any) {
    console.error('Error fetching restaurants:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id - Single restaurant details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    if (isNaN(restaurantId)) {
      res.status(400).json({ error: 'Invalid restaurant ID.' });
      return;
    }

    const restSql = `
      SELECT 
        r.*,
        COALESCE(rev.avg_rating, 0.0)::NUMERIC(3, 1) as avg_rating,
        COALESCE(rev.review_count, 0)::INT as review_count,
        COALESCE(ord.order_count, 0)::INT as order_count
      FROM restaurants r
      LEFT JOIN (
        SELECT restaurant_id, 
               ROUND(AVG(rating)::numeric, 1) as avg_rating, 
               COUNT(*) as review_count
        FROM reviews
        GROUP BY restaurant_id
      ) rev ON r.id = rev.restaurant_id
      LEFT JOIN (
        SELECT restaurant_id, COUNT(*) as order_count
        FROM orders
        WHERE status != 'Cancelled'
        GROUP BY restaurant_id
      ) ord ON r.id = ord.restaurant_id
      WHERE r.id = $1;
    `;

    const result = await query(restSql, [restaurantId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Restaurant not found.' });
      return;
    }

    res.json({ restaurant: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/menu - Menu items with filters & sorting
router.get('/:id/menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    if (isNaN(restaurantId)) {
      res.status(400).json({ error: 'Invalid restaurant ID.' });
      return;
    }

    const { categoryId, vegOnly, sortBy, search } = req.query;

    const conditions: string[] = ['m.restaurant_id = $1', 'm.is_available = true'];
    const params: any[] = [restaurantId];
    let paramIndex = 2;

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
      conditions.push(`m.category_id = $${paramIndex}`);
      params.push(parseInt(categoryId, 10));
      paramIndex++;
    }

    if (vegOnly === 'true') {
      conditions.push('m.is_veg = true');
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push(`(m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    let orderBy = 'c.id ASC, m.price ASC';
    if (sortBy === 'price_asc') {
      orderBy = 'm.price ASC';
    } else if (sortBy === 'price_desc') {
      orderBy = 'm.price DESC';
    } else if (sortBy === 'popular') {
      orderBy = 'COALESCE(sales.sold_qty, 0) DESC, m.price ASC';
    }

    const whereClause = conditions.join(' AND ');

    // Query also calculates whether each item is above the restaurant average price (DA2 Query 5 logic)
    const sqlQuery = `
      WITH rest_avg AS (
        SELECT AVG(price) as avg_price 
        FROM menu_items 
        WHERE restaurant_id = $1
      )
      SELECT 
        m.*,
        c.name as category_name,
        COALESCE(sales.sold_qty, 0)::INT as sold_qty,
        ROUND((SELECT avg_price FROM rest_avg)::numeric, 2) as restaurant_avg_price,
        (m.price > (SELECT avg_price FROM rest_avg)) as is_above_restaurant_avg
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      LEFT JOIN (
        SELECT menu_item_id, SUM(quantity) as sold_qty
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'Cancelled'
        GROUP BY menu_item_id
      ) sales ON m.id = sales.menu_item_id
      WHERE ${whereClause}
      ORDER BY ${orderBy};
    `;

    const result = await query(sqlQuery, params);

    // Get categories available for this restaurant
    const catsRes = await query(
      `SELECT DISTINCT c.id, c.name 
       FROM menu_items m
       JOIN categories c ON m.category_id = c.id
       WHERE m.restaurant_id = $1
       ORDER BY c.name`,
      [restaurantId]
    );

    res.json({
      items: result.rows,
      categories: catsRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id/reviews - Restaurant customer reviews
router.get('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    const revSql = `
      SELECT 
        r.id,
        r.rating,
        r.review_text,
        r.created_at,
        u.name as customer_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.restaurant_id = $1
      ORDER BY r.created_at DESC;
    `;

    const result = await query(revSql, [restaurantId]);
    res.json({ reviews: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/restaurants/:id/reviews - Submit review
router.post('/:id/reviews', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = parseInt(req.params.id, 10);
    const { rating, reviewText, orderId } = req.body;
    const customerId = req.user!.id;

    if (!rating || rating < 1.0 || rating > 5.0) {
      res.status(400).json({ error: 'Valid rating between 1.0 and 5.0 is required.' });
      return;
    }

    const insertSql = `
      INSERT INTO reviews (customer_id, restaurant_id, order_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      customerId,
      restaurantId,
      orderId || null,
      rating,
      reviewText || '',
    ]);

    res.status(201).json({
      message: 'Review submitted successfully.',
      review: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
