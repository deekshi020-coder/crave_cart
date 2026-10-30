import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.js';
import healthRoutes from './server/routes/health.js';
import restaurantRoutes from './server/routes/restaurants.js';
import cartRoutes from './server/routes/cart.js';
import orderRoutes from './server/routes/orders.js';
import profileRoutes from './server/routes/profile.js';
import adminRoutes from './server/routes/admin.js';
import deliveryRoutes from './server/routes/delivery.js';
import aiRoutes from './server/routes/ai.js';
import { checkDbConnection, query } from './server/db/pool.js';
import { runMigrationsAndSeeds } from './server/db/init.js';
import { seedExpandedDatabase } from './server/db/seed_expanded.js';
import { runChennaiAndFeaturesMigration } from './server/db/chennai_migration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/delivery', deliveryRoutes);
  app.use('/api/ai', aiRoutes);

  // Serve Vite in development or static dist in production
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[CraveCart] Server listening on http://0.0.0.0:${PORT}`);
    
    // Check and initialize PostgreSQL if DATABASE_URL is configured
    try {
      const dbStatus = await checkDbConnection();
      if (dbStatus.connected) {
        console.log(`[CraveCart] Connected to PostgreSQL (version ${dbStatus.version})`);
        if (!dbStatus.tablesReady) {
          console.log('[CraveCart] Tables not detected, running schema migrations and seed data...');
          const initRes = await runMigrationsAndSeeds();
          console.log(`[CraveCart] Migration outcome: ${initRes.message}`);
          await seedExpandedDatabase();
        } else {
          console.log(`[CraveCart] Database tables and views already verified (${dbStatus.tablesCount} tables present).`);
          try {
            const countRes = await query<{ count: string }>('SELECT count(*) FROM restaurants');
            const rCount = parseInt(countRes.rows[0]?.count || '0', 10);
            if (rCount < 20) {
              console.log(`[CraveCart] Seeding expanded catalog (${rCount} restaurants detected)...`);
              const expandedRes = await seedExpandedDatabase();
              console.log(`[CraveCart] Expanded seed: ${expandedRes.restaurantsCount} restaurants, ${expandedRes.menuItemsCount} dishes.`);
            }
            await runChennaiAndFeaturesMigration();
          } catch (seedErr: any) {
            console.warn('[CraveCart] Migration check warning:', seedErr.message);
          }
        }
      } else {
        console.log(`[CraveCart] Database pending setup: ${dbStatus.error || 'DATABASE_URL not set'}`);
      }
    } catch (err: any) {
      console.warn('[CraveCart] Initial DB check warning:', err.message);
    }
  });
}

startServer().catch((err) => {
  console.error('[CraveCart Server Startup Fatal Error]:', err);
});
