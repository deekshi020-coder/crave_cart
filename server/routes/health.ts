import { Router, Request, Response } from 'express';
import { checkDbConnection } from '../db/pool.js';
import { runMigrationsAndSeeds } from '../db/init.js';

const router = Router();

// Health check endpoint for database
router.get('/db', async (req: Request, res: Response) => {
  try {
    const status = await checkDbConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      configured: false,
      error: err.message,
    });
  }
});

// Run or re-run migrations and seeds
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const result = await runMigrationsAndSeeds();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to execute migrations.',
      error: err.message,
    });
  }
});

export default router;
