import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const cs = process.env.POSTGRES_URL_NON_POOLING.split('?')[0];
const pool = new pg.Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });

const sqlStatements = [
  // 1. SITE_POPUPS TABLE
  `CREATE TABLE IF NOT EXISTS public.site_popups (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'welcome',
    image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    discount_code TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    frequency TEXT DEFAULT 'once',
    audience TEXT DEFAULT 'all',
    priority TEXT DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_site_popups_is_active ON public.site_popups(is_active)`,
  `ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "Public can view active popups" ON public.site_popups`,
  `CREATE POLICY "Public can view active popups" ON public.site_popups FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Anyone can manage popups" ON public.site_popups`,
  `CREATE POLICY "Anyone can manage popups" ON public.site_popups FOR ALL USING (true) WITH CHECK (true)`,

  // 2. SITE_ANNOUNCEMENTS TABLE
  `CREATE TABLE IF NOT EXISTS public.site_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    link_text TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_site_announcements_active ON public.site_announcements(active)`,
  `ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY`,

  `DROP POLICY IF EXISTS "Public can view announcements" ON public.site_announcements`,
  `CREATE POLICY "Public can view announcements" ON public.site_announcements FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Anyone can manage announcements" ON public.site_announcements`,
  `CREATE POLICY "Anyone can manage announcements" ON public.site_announcements FOR ALL USING (true) WITH CHECK (true)`,

  // 3. STORAGE POLICIES FOR store-images BUCKET
  `DROP POLICY IF EXISTS "Public can view store images" ON storage.objects`,
  `CREATE POLICY "Public can view store images" ON storage.objects
    FOR SELECT USING (bucket_id = 'store-images')`,

  `DROP POLICY IF EXISTS "Anyone can upload store images" ON storage.objects`,
  `CREATE POLICY "Anyone can upload store images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'store-images')`,

  `DROP POLICY IF EXISTS "Anyone can update store images" ON storage.objects`,
  `CREATE POLICY "Anyone can update store images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'store-images')`,

  `DROP POLICY IF EXISTS "Anyone can delete store images" ON storage.objects`,
  `CREATE POLICY "Anyone can delete store images" ON storage.objects
    FOR DELETE USING (bucket_id = 'store-images')`
];

async function run() {
  console.log('📦 Creating site_popups, site_announcements, and storage policies in Supabase...');
  const client = await pool.connect();
  try {
    for (const sql of sqlStatements) {
      await client.query(sql);
    }
    console.log('✅ Tables and storage policies created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
