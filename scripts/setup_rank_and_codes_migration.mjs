import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const conn = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').split('?')[0];
  if (!conn) {
    console.error('No Postgres connection string found in .env.local');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    console.log('1. Adding limit_per_user to redeem_codes table...');
    await client.query(`
      ALTER TABLE public.redeem_codes 
      ADD COLUMN IF NOT EXISTS limit_per_user BOOLEAN DEFAULT true;
    `);

    console.log('2. Adding rank_settings to settings table...');
    await client.query(`
      ALTER TABLE public.settings 
      ADD COLUMN IF NOT EXISTS rank_settings JSONB DEFAULT '{
        "enabled": true,
        "ranks": [
          { "id": "bronze", "name": "Bronze", "minSpent": 0, "discountPercent": 0, "badgeColor": "#cd7f32" },
          { "id": "silver", "name": "Silver", "minSpent": 500, "discountPercent": 3, "badgeColor": "#94a3b8" },
          { "id": "gold", "name": "Gold", "minSpent": 1500, "discountPercent": 5, "badgeColor": "#eab308" },
          { "id": "platinum", "name": "Platinum", "minSpent": 5000, "discountPercent": 10, "badgeColor": "#06b6d4" },
          { "id": "vip", "name": "VIP", "minSpent": 10000, "discountPercent": 15, "badgeColor": "#a855f7" }
        ]
      }'::jsonb;
    `);

    console.log('3. Updating existing default settings row with default rank_settings if null...');
    await client.query(`
      UPDATE public.settings 
      SET rank_settings = '{
        "enabled": true,
        "ranks": [
          { "id": "bronze", "name": "Bronze", "minSpent": 0, "discountPercent": 0, "badgeColor": "#cd7f32" },
          { "id": "silver", "name": "Silver", "minSpent": 500, "discountPercent": 3, "badgeColor": "#94a3b8" },
          { "id": "gold", "name": "Gold", "minSpent": 1500, "discountPercent": 5, "badgeColor": "#eab308" },
          { "id": "platinum", "name": "Platinum", "minSpent": 5000, "discountPercent": 10, "badgeColor": "#06b6d4" },
          { "id": "vip", "name": "VIP", "minSpent": 10000, "discountPercent": 15, "badgeColor": "#a855f7" }
        ]
      }'::jsonb
      WHERE id = 'store' AND (rank_settings IS NULL OR rank_settings = '{}'::jsonb);
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
