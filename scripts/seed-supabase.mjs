import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING.split('?')[0],
  ssl: { rejectUnauthorized: false },
});

const products = [
  {
    id: 'prod_discord_profile',
    name: 'J3A Discord Profile',
    slug: 'j3a-discord-profile',
    description: 'ยกระดับโปรไฟล์ Discord ของคุณให้โดดเด่นและเป็นมืออาชีพในคลิกเดียว ควบคุมสถานะ Discord Rich Presence (Playing...) ระดับพรีเมียม ใส่ปุ่มลิงก์ได้ 2 ปุ่ม ปรับแต่งข้อความและรูปภาพอิสระ พร้อม Live Preview และระบบ Auto-Save ปลอดภัย 100% ไม่โดนแบน',
    price: 30,
    compare_price: 50,
    image: '/products/j3a-discord-profile.jpg',
    images: JSON.stringify(['/products/j3a-discord-profile.jpg']),
    category: 'ซอฟต์แวร์ Discord',
    stock: 999,
    status: 'active',
    featured: true,
    tags: JSON.stringify(['discord', 'profile', 'software', 'license', 'rpc']),
    download_url: 'https://drive.google.com/file/d/1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385/view?usp=sharing',
    delivery_note: '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
    delivery_type: 'both',
    rating: 5.0,
    review_count: 1,
  },
  {
    id: 'prod_discord_manager',
    name: 'J3A Discord Manager',
    slug: 'j3a-discord-manager',
    description: 'The Ultimate Discord Architecture & Server Management Studio โปรแกรมเดสก์ท็อปแบบ All-in-One สำหรับออกแบบ สร้าง และบริหารจัดการเซิร์ฟเวอร์ Discord แบบ One-Click Architecture พร้อม Role Studio, สัญลักษณ์ตกแต่ง 150+ รูปแบบ และคลังแนะนำบอท',
    price: 50,
    compare_price: 80,
    image: '/products/j3a-discord-manager.jpg',
    images: JSON.stringify(['/products/j3a-discord-manager.jpg']),
    category: 'ระบบเซิร์ฟเวอร์ & บอท',
    stock: 999,
    status: 'active',
    featured: true,
    tags: JSON.stringify(['discord', 'manager', 'server', 'software', 'license', 'bot']),
    download_url: 'https://drive.google.com/file/d/1meSdpyuMvpWAUqiWcMybYZNRd-_T43zM/view?usp=sharing',
    delivery_note: '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
    delivery_type: 'both',
    rating: 5.0,
    review_count: 1,
  },
];

const bundles = [
  {
    id: 'bundle_discord_suite',
    name: '[Bundle] DiscordProfile , DiscordManager',
    slug: 'discordprofile-discordmanager',
    description: 'แพ็กเกจสุดคุ้มรวม 2 โปรแกรมระดับพรีเมียม: J3A Discord Profile และ J3A Discord Manager ในราคาพิเศษ พร้อมรับ License Key ใช้งานได้ทันที',
    price: 70,
    compare_price: 80,
    image: '/products/j3a-discord-manager.jpg',
    items: JSON.stringify(['prod_discord_profile', 'prod_discord_manager']),
    featured: true,
    status: 'active',
    rating: 5.0,
    review_count: 1,
  },
];

const redeemCodes = [
  {
    id: 'code_j3a_opening',
    code: 'J3AOPENING',
    credits: 20,
    max_uses: 9999,
    used_count: 0,
    used_by: JSON.stringify([]),
    is_active: true,
  },
];

async function seed() {
  console.log('🌱 Seeding Supabase database...');
  const client = await pool.connect();
  try {
    for (const p of products) {
      await client.query(
        `INSERT INTO public.products (id, name, slug, description, price, compare_price, image, images, category, stock, status, featured, tags, download_url, delivery_note, delivery_type, rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           price = EXCLUDED.price,
           download_url = EXCLUDED.download_url,
           delivery_note = EXCLUDED.delivery_note;`,
        [p.id, p.name, p.slug, p.description, p.price, p.compare_price, p.image, p.images, p.category, p.stock, p.status, p.featured, p.tags, p.download_url, p.delivery_note, p.delivery_type, p.rating, p.review_count]
      );
      console.log(`✅ Seeded Product: ${p.name}`);
    }

    for (const b of bundles) {
      await client.query(
        `INSERT INTO public.bundles (id, name, slug, description, price, compare_price, image, items, featured, status, rating, review_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           price = EXCLUDED.price;`,
        [b.id, b.name, b.slug, b.description, b.price, b.compare_price, b.image, b.items, b.featured, b.status, b.rating, b.review_count]
      );
      console.log(`✅ Seeded Bundle: ${b.name}`);
    }

    for (const c of redeemCodes) {
      await client.query(
        `INSERT INTO public.redeem_codes (id, code, credits, max_uses, used_count, used_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (code) DO NOTHING;`,
        [c.id, c.code, c.credits, c.max_uses, c.used_count, c.used_by, c.is_active]
      );
      console.log(`✅ Seeded Redeem Code: ${c.code}`);
    }

    console.log('🎉 Supabase initial seed completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
