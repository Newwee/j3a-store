import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL_NON_POOLING) {
  console.log('No POSTGRES_URL_NON_POOLING found, skipping Postgres migration');
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Migrating redeem_codes schema...');
    await client.query(`
      ALTER TABLE public.redeem_codes 
      ADD COLUMN IF NOT EXISTS code_type TEXT NOT NULL DEFAULT 'credit',
      ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed',
      ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS min_spend NUMERIC(10, 2) DEFAULT 0.00;
    `);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.warn('Migration warning:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
