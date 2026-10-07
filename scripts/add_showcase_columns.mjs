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
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS showcase_youtube_url TEXT DEFAULT '';
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS showcase_title TEXT DEFAULT 'วิธีใช้งานร้านค้า J3A STORE';
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS showcase_subtitle TEXT DEFAULT 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ';
    `);
    console.log('✅ Added showcase columns to public.settings successfully!');
    
    const res = await client.query('SELECT * FROM public.settings WHERE id = $1', ['store']);
    console.log('Current store settings row:', res.rows[0]);
  } catch (err) {
    console.error('Error adding showcase columns:', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

run();
