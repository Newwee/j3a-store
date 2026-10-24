import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const cs = process.env.POSTGRES_URL_NON_POOLING.split('?')[0];
const pool = new pg.Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        is_pinned BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Public can view announcements table" ON public.announcements;
      CREATE POLICY "Public can view announcements table" ON public.announcements FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Anyone can manage announcements table" ON public.announcements;
      CREATE POLICY "Anyone can manage announcements table" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log('✅ announcements table ready!');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
