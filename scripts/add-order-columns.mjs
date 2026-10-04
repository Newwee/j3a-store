import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
    `);
    console.log('✅ Added order extra columns successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
