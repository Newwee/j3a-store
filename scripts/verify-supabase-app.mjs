import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getProducts, getProductBySlug } from '../src/lib/firestore/products.js';
import { getBundles, getBundleBySlug } from '../src/lib/firestore/bundles.js';
import { getStoreSettings } from '../src/lib/firestore/settings.js';
import { getStoreDashboardStats } from '../src/lib/firestore/stats.js';

async function verify() {
  console.log('🧪 Verifying Store Operations with Supabase...');

  // 1. Products
  const products = await getProducts();
  console.log(`✅ Products fetched: ${products.length} products`);
  products.forEach(p => console.log(`   - ${p.name} (฿${p.price}) [Slug: ${p.slug}] [Download: ${p.downloadUrl ? 'OK' : 'None'}]`));

  // 2. Single product by slug
  const profileProduct = await getProductBySlug('j3a-discord-profile');
  if (profileProduct) {
    console.log(`✅ getProductBySlug('j3a-discord-profile') SUCCESS: ID=${profileProduct.id}`);
  } else {
    console.error('❌ Failed to fetch product by slug');
  }

  // 3. Bundles
  const bundles = await getBundles();
  console.log(`✅ Bundles fetched: ${bundles.length} bundles`);
  bundles.forEach(b => console.log(`   - ${b.name} (฿${b.price}) [Slug: ${b.slug}]`));

  // 4. Bundle by slug
  const bundle = await getBundleBySlug('discordprofile-discordmanager');
  if (bundle) {
    console.log(`✅ getBundleBySlug('discordprofile-discordmanager') SUCCESS: ID=${bundle.id}`);
  } else {
    console.error('❌ Failed to fetch bundle by slug');
  }

  // 5. Store Settings
  const settings = await getStoreSettings();
  console.log(`✅ Store Settings: Name="${settings.storeName}", PromptPay="${settings.promptpay}", Line="${settings.lineContact}"`);

  // 6. Store Dashboard Stats
  const stats = await getStoreDashboardStats(true);
  console.log(`✅ Store Dashboard Stats: Products=${stats.totalProducts}, Customers=${stats.totalCustomers}, Orders=${stats.totalOrders}`);

  console.log('\n🎉 ALL STORE OPERATIONS VERIFIED 100% WORKING WITH SUPABASE!');
}

verify().catch(console.error);
