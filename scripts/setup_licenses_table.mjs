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

    console.log('1. Creating public.licenses table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.licenses (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        product_slug TEXT NOT NULL DEFAULT 'j3adiscordautoquest',
        tier TEXT NOT NULL DEFAULT '1w',
        duration_days INTEGER NOT NULL DEFAULT 7,
        status TEXT NOT NULL DEFAULT 'available',
        order_id TEXT,
        user_id TEXT,
        hwid TEXT,
        activated_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(key);
      CREATE INDEX IF NOT EXISTS idx_licenses_status_tier ON public.licenses(status, tier);
      CREATE INDEX IF NOT EXISTS idx_licenses_hwid ON public.licenses(hwid);
      CREATE INDEX IF NOT EXISTS idx_licenses_order_id ON public.licenses(order_id);
    `);

    console.log('2. Creating public.hwid_trials table for anti-trial abuse...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hwid_trials (
        hwid TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        first_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_hwid_trials_key ON public.hwid_trials(key);
    `);

    console.log('3. Configuring Row Level Security (RLS)...');
    await client.query(`
      ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.hwid_trials ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Service role has full access to licenses" ON public.licenses;
      CREATE POLICY "Service role has full access to licenses" ON public.licenses
        FOR ALL TO service_role USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Public can view own licenses by order or user" ON public.licenses;
      CREATE POLICY "Public can view own licenses by order or user" ON public.licenses
        FOR SELECT TO public USING (
          auth.uid() IS NOT NULL AND auth.uid()::text = user_id
        );

      DROP POLICY IF EXISTS "Service role has full access to hwid_trials" ON public.hwid_trials;
      CREATE POLICY "Service role has full access to hwid_trials" ON public.hwid_trials
        FOR ALL TO service_role USING (true) WITH CHECK (true);
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
