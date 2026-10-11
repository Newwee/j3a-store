import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL_NON_POOLING) process.exit(0);

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS order_number TEXT,
      ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS shipping NUMERIC(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS discount_code TEXT,
      ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
    `);
    console.log('Orders columns updated successfully!');
  } catch (err) {
    console.warn('Orders migration note:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
