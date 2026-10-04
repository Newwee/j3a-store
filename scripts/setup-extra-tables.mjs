import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sqlStatements = [
  // 1. TOPUPS TABLE
  `CREATE TABLE IF NOT EXISTS public.topups (
    id TEXT PRIMARY KEY,
    topup_number TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    payment_slip_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_topups_user_id ON public.topups(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_topups_status ON public.topups(status)`,
  `ALTER TABLE public.topups ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "Users can read own topups or admin" ON public.topups`,
  `CREATE POLICY "Users can read own topups or admin" ON public.topups FOR SELECT
    USING ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Users can insert topups" ON public.topups`,
  `CREATE POLICY "Users can insert topups" ON public.topups FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL)`,

  `DROP POLICY IF EXISTS "Admin can update topups" ON public.topups`,
  `CREATE POLICY "Admin can update topups" ON public.topups FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  // 2. SETTINGS TABLE
  `CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    store_name TEXT DEFAULT 'J3A STORE',
    promptpay TEXT DEFAULT '0812345678',
    line_contact TEXT DEFAULT '@153nhgvs',
    discord_contact TEXT DEFAULT 'https://discord.gg/UtWykPvTYF',
    announcement TEXT DEFAULT 'ยินดีต้อนรับสู่ J3A STORE ซอฟต์แวร์ Discord และบริการดิจิทัลอัตโนมัติ 24 ชม.',
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    free_shipping_threshold NUMERIC(10, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings`,
  `CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings`,
  `CREATE POLICY "Admin can manage settings" ON public.settings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  // Insert default settings
  `INSERT INTO public.settings (id, store_name, promptpay, line_contact, discord_contact, announcement)
   VALUES ('store', 'J3A STORE', '0812345678', '@153nhgvs', 'https://discord.gg/UtWykPvTYF', 'ยินดีต้อนรับสู่ J3A STORE ซอฟต์แวร์ Discord และบริการดิจิทัลอัตโนมัติ 24 ชม.')
   ON CONFLICT (id) DO NOTHING`,
];

async function run() {
  console.log('📦 Setting up topups and settings tables in Supabase...');
  const client = await pool.connect();
  try {
    for (const sql of sqlStatements) {
      await client.query(sql);
    }
    console.log('✅ Topups and settings tables created successfully!');
  } finally {
    client.release();
    await pool.end();
  }

  // Create public storage bucket 'store-images'
  console.log('🪣 Ensuring public storage bucket exists...');
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'store-images');
    if (!exists) {
      const { data, error } = await supabase.storage.createBucket('store-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      });
      if (error) {
        console.warn('Storage bucket create note:', error.message);
      } else {
        console.log('✅ Created public bucket: store-images');
      }
    } else {
      console.log('✅ Public bucket store-images already exists!');
    }
  } catch (err) {
    console.warn('Storage check note:', err.message);
  }
}

run();
