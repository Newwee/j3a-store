import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const conn = (process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '').split('?')[0];
  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    console.log('1. Creating store_stats table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.store_stats (
        id TEXT PRIMARY KEY DEFAULT 'live',
        members INTEGER DEFAULT 0,
        orders INTEGER DEFAULT 0,
        products INTEGER DEFAULT 0,
        rating NUMERIC(3,2) DEFAULT 5.00,
        total_reviews INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE public.store_stats ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Public can view store stats" ON public.store_stats;
      CREATE POLICY "Public can view store stats" ON public.store_stats
        FOR SELECT TO public USING (true);
    `);

    console.log('2. Dropping old functions and creating recalculation functions...');
    await client.query(`
      DROP FUNCTION IF EXISTS public.recalculate_store_stats() CASCADE;
      DROP FUNCTION IF EXISTS public.trg_recalculate_store_stats() CASCADE;

      CREATE OR REPLACE FUNCTION public.recalculate_store_stats()
      RETURNS VOID AS $$
      DECLARE
        v_members INTEGER;
        v_orders INTEGER;
        v_products INTEGER;
        v_rating NUMERIC(3,2);
        v_reviews INTEGER;
      BEGIN
        -- 1. Member count
        SELECT count(*) INTO v_members FROM public.profiles;
        
        -- 2. Valid orders (strictly excluding cancelled and refunded)
        SELECT count(*) INTO v_orders 
        FROM public.orders 
        WHERE status NOT IN ('cancelled', 'refunded');

        -- 3. Products in stock / active
        SELECT count(*) INTO v_products 
        FROM public.products 
        WHERE status = 'active';

        -- 4. Store review rating & review count
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.00), count(*)
        INTO v_rating, v_reviews
        FROM public.reviews;

        -- Upsert into store_stats
        INSERT INTO public.store_stats (id, members, orders, products, rating, total_reviews, updated_at)
        VALUES ('live', GREATEST(1, v_members), v_orders, v_products, COALESCE(v_rating, 5.00), v_reviews, NOW())
        ON CONFLICT (id) DO UPDATE SET
          members = EXCLUDED.members,
          orders = EXCLUDED.orders,
          products = EXCLUDED.products,
          rating = EXCLUDED.rating,
          total_reviews = EXCLUDED.total_reviews,
          updated_at = NOW();
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION public.trg_recalculate_store_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM public.recalculate_store_stats();
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('3. Attaching triggers...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_orders_store_stats ON public.orders;
      CREATE TRIGGER trg_orders_store_stats
        AFTER INSERT OR UPDATE OR DELETE ON public.orders
        FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalculate_store_stats();

      DROP TRIGGER IF EXISTS trg_profiles_store_stats ON public.profiles;
      CREATE TRIGGER trg_profiles_store_stats
        AFTER INSERT OR DELETE ON public.profiles
        FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalculate_store_stats();

      DROP TRIGGER IF EXISTS trg_products_store_stats ON public.products;
      CREATE TRIGGER trg_products_store_stats
        AFTER INSERT OR UPDATE OR DELETE ON public.products
        FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalculate_store_stats();

      DROP TRIGGER IF EXISTS trg_reviews_store_stats ON public.reviews;
      CREATE TRIGGER trg_reviews_store_stats
        AFTER INSERT OR UPDATE OR DELETE ON public.reviews
        FOR EACH STATEMENT EXECUTE FUNCTION public.trg_recalculate_store_stats();
    `);

    console.log('4. Adding to supabase_realtime publication...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'store_stats'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.store_stats;
        END IF;
      END
      $$;
    `);

    console.log('5. Executing initial calculation...');
    await client.query(`SELECT public.recalculate_store_stats();`);

    const res = await client.query(`SELECT * FROM public.store_stats WHERE id = 'live';`);
    console.log('Current Live Stats in DB:', res.rows[0]);

    await client.end();
    console.log('Setup finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during setup:', err);
    try {
      await client.end();
    } catch {}
    process.exit(1);
  }
}

main();
