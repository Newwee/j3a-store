import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Fetching products catalog...');
  const prodRes = await pool.query('SELECT id, slug, name, download_url, delivery_note FROM products');
  const prods = prodRes.rows;
  console.log(`Found ${prods.length} products in catalog.`);

  const prodMap = new Map();
  for (const p of prods) {
    if (p.id) prodMap.set(p.id.toLowerCase(), p);
    if (p.slug) prodMap.set(p.slug.toLowerCase(), p);
    if (p.name) prodMap.set(p.name.toLowerCase(), p);
  }

  const orderRes = await pool.query('SELECT id, items FROM orders');
  console.log(`Found ${orderRes.rows.length} total orders to check.`);

  let updatedCount = 0;
  for (const row of orderRes.rows) {
    if (!Array.isArray(row.items)) continue;

    let modified = false;
    const updatedItems = row.items.map((item) => {
      const pid = (item.productId || item.id || '').toLowerCase();
      const pslug = (item.slug || '').toLowerCase();
      const pname = (item.name || '').toLowerCase();

      const live = prodMap.get(pid) || prodMap.get(pslug) || prodMap.get(pname);
      if (live) {
        let newUrl = live.download_url || item.downloadUrl;
        let newNote = live.delivery_note || item.deliveryNote;

        if (newUrl && newUrl.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
          newUrl = 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing';
        }

        if (item.downloadUrl !== newUrl || item.deliveryNote !== newNote) {
          modified = true;
          return {
            ...item,
            downloadUrl: newUrl,
            deliveryNote: newNote,
          };
        }
      }
      return item;
    });

    if (modified) {
      await pool.query('UPDATE orders SET items = $1, updated_at = NOW() WHERE id = $2', [
        JSON.stringify(updatedItems),
        row.id,
      ]);
      console.log(`Successfully synced order ${row.id} with latest product download link.`);
      updatedCount++;
    }
  }

  console.log(`Finished syncing: ${updatedCount} orders updated.`);
  await pool.end();
}

main().catch(console.error);
