import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const emailClean = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailClean]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const assignedRole = role === 'admin' || role === 'delivery_agent' ? role : 'customer';
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const insertResult = await query<{ id: number; name: string; email: string; role: 'customer' | 'admin' | 'delivery_agent' }>(
      `INSERT INTO users (name, email, password_hash, role, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, role`,
      [name.trim(), emailClean, passwordHash, assignedRole, phone || null]
    );

    const user = insertResult.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed. ' + err.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailClean = email.trim().toLowerCase();
    const result = await query<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      role: 'customer' | 'admin' | 'delivery_agent';
      phone: string | null;
      is_active: boolean;
    }>('SELECT * FROM users WHERE email = $1', [emailClean]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. ' + err.message });
  }
});

// Get current user session info
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
              COALESCE(lc.eligible_order_count, 0) as eligible_order_count,
              COALESCE(lc.discount_percentage, 0) as loyalty_discount_percentage,
              COALESCE(lc.total_spending, 0) as total_spending
       FROM users u
       LEFT JOIN loyalty_customers lc ON u.id = lc.customer_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: userRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
