import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // 1. PROFILES
  `CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    tier TEXT NOT NULL DEFAULT 'general',
    credits NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (credits >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email)`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role)`,

  // 2. PRODUCTS
  `CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    compare_price NUMERIC(10, 2) CHECK (compare_price >= 0),
    image TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    category TEXT NOT NULL DEFAULT 'Discord',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status TEXT NOT NULL DEFAULT 'active',
    featured BOOLEAN NOT NULL DEFAULT false,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    rating NUMERIC(3, 1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    showcase_url TEXT,
    download_url TEXT,
    delivery_note TEXT,
    delivery_type TEXT NOT NULL DEFAULT 'both',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status)`,
  `CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured)`,

  // 3. BUNDLES
  `CREATE TABLE IF NOT EXISTS public.bundles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    compare_price NUMERIC(10, 2) CHECK (compare_price >= 0),
    image TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    featured BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active',
    rating NUMERIC(3, 1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bundles_slug ON public.bundles(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_bundles_status ON public.bundles(status)`,

  // 4. ORDERS
  `CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    payment_proof_url TEXT,
    delivery_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC)`,

  // 5. REVIEWS
  `CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id)`,

  // 6. REDEEM CODES
  `CREATE TABLE IF NOT EXISTS public.redeem_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    credits NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (credits >= 0),
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    used_by JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON public.redeem_codes(code)`,

  // 7. LICENSE KEYS
  `CREATE TABLE IF NOT EXISTS public.license_keys (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    key TEXT NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_license_keys_product ON public.license_keys(product_id, is_used)`,
  `CREATE INDEX IF NOT EXISTS idx_license_keys_order ON public.license_keys(order_id)`,

  // 8. DELETION REQUESTS
  `CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    credits NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending',
    user_reason TEXT,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.deletion_requests(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests(status)`,

  // 9. ENABLE RLS
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY`,

  // 10. HELPER FUNCTION
  `CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR lower(email) IN ('pongpataradanai@gmail.com', 'admin@j3astore.com', 'mynameisyee0@gmail.com', 'ratchadejchaisomvit@gmail.com'))
    );
  $$`,

  // 11. RLS POLICIES
  `DROP POLICY IF EXISTS "Public profiles read" ON public.profiles`,
  `CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,
  `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles`,
  `CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Anyone can read products" ON public.products`,
  `CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Admin full access products" ON public.products`,
  `CREATE POLICY "Admin full access products" ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Anyone can read bundles" ON public.bundles`,
  `CREATE POLICY "Anyone can read bundles" ON public.bundles FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Admin full access bundles" ON public.bundles`,
  `CREATE POLICY "Admin full access bundles" ON public.bundles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Users can read own orders or admin" ON public.orders`,
  `CREATE POLICY "Users can read own orders or admin" ON public.orders FOR SELECT
    USING ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Users can create orders" ON public.orders`,
  `CREATE POLICY "Users can create orders" ON public.orders FOR INSERT
    WITH CHECK (true)`,

  `DROP POLICY IF EXISTS "Admin can update orders" ON public.orders`,
  `CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews`,
  `CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Authenticated can create reviews" ON public.reviews`,
  `CREATE POLICY "Authenticated can create reviews" ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL)`,

  `DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews`,
  `CREATE POLICY "Admin can manage reviews" ON public.reviews FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Read codes" ON public.redeem_codes`,
  `CREATE POLICY "Read codes" ON public.redeem_codes FOR SELECT USING (true)`,

  `DROP POLICY IF EXISTS "Admin manage codes" ON public.redeem_codes`,
  `CREATE POLICY "Admin manage codes" ON public.redeem_codes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Users read own license keys" ON public.license_keys`,
  `CREATE POLICY "Users read own license keys" ON public.license_keys FOR SELECT
    USING ((auth.uid() IS NOT NULL AND used_by = auth.uid()) OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Admin manage license keys" ON public.license_keys`,
  `CREATE POLICY "Admin manage license keys" ON public.license_keys FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin())`,

  `DROP POLICY IF EXISTS "Users read own deletion request or admin" ON public.deletion_requests`,
  `CREATE POLICY "Users read own deletion request or admin" ON public.deletion_requests FOR SELECT
    USING ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR public.is_admin())`,

  `DROP POLICY IF EXISTS "Users create deletion request" ON public.deletion_requests`,
  `CREATE POLICY "Users create deletion request" ON public.deletion_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid())`,

  `DROP POLICY IF EXISTS "Admin or user manage deletion request" ON public.deletion_requests`,
  `CREATE POLICY "Admin or user manage deletion request" ON public.deletion_requests FOR ALL
    TO authenticated
    USING (public.is_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_admin() OR user_id = auth.uid())`,

  // 12. NEW USER TRIGGER FUNCTION
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url, role, tier, credits)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL),
      CASE 
        WHEN lower(new.email) IN ('pongpataradanai@gmail.com', 'admin@j3astore.com', 'mynameisyee0@gmail.com', 'ratchadejchaisomvit@gmail.com') THEN 'admin'
        ELSE 'customer'
      END,
      'general',
      0.00
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
  END;
  $$`,

  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  `CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`,
];

async function setup() {
  console.log('🚀 Running discrete migrations...');
  const client = await pool.connect();
  try {
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      try {
        await client.query(sql);
      } catch (err) {
        console.error(`❌ Migration failed at index ${i}:`, err.message);
      }
    }

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('✅ Success! Tables now in Supabase public schema:');
    res.rows.forEach(r => console.log(' • ' + r.table_name));
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
