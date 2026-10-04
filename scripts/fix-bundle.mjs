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
    const properItems = JSON.stringify([
      {
        productId: 'prod_discord_profile',
        name: 'J3A Discord Profile',
        price: 30,
        image: '/products/j3a-discord-profile.jpg',
        category: 'ซอฟต์แวร์ Discord',
      },
      {
        productId: 'prod_discord_manager',
        name: 'J3A Discord Manager',
        price: 50,
        image: '/products/j3a-discord-manager.jpg',
        category: 'ระบบเซิร์ฟเวอร์ & บอท',
      },
    ]);

    await client.query(
      'UPDATE public.bundles SET items = $1, compare_price = $2, price = $3 WHERE id = $4',
      [properItems, 80, 70, 'bundle_discord_suite']
    );
    console.log('✅ Updated bundle items in Supabase successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run();
