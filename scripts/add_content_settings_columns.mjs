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
    await client.query(`
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_tagline TEXT DEFAULT 'Next-Gen E-Commerce & Digital Store';
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_description TEXT DEFAULT 'สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ';
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS privacy_policy TEXT DEFAULT '1. ข้อมูลที่เราเก็บรวบรวม\nJ3A STORE เก็บรวบรวมข้อมูลที่จำเป็นต่อการให้บริการ เช่น ชื่อ-นามสกุล, ที่อยู่อีเมล, เบอร์โทรศัพท์, และประวัติการทำรายการ เพื่อใช้ในการจัดส่งสินค้าดิจิทัลและยืนยันสถานะการชำระเงิน\n\n2. การรักษาความปลอดภัยของข้อมูล\nข้อมูลรหัสผ่านทั้งหมดได้รับการจัดการและเข้ารหัสผ่าน Supabase Authentication ซึ่งเป็นไปตามมาตรฐานความปลอดภัยชั้นนำระดับโลก เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก';
      ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS footer_description TEXT DEFAULT 'แพลตฟอร์มศูนย์รวมสินค้าและบริการดิจิทัลชั้นนำ เติมเกม ไอดีเกม บัตรเติมเงิน และอุปกรณ์ระดับพรีเมียม ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% พร้อมบริการตลอด 24 ชั่วโมง';
    `);
    console.log('✅ Added hero_tagline, hero_description, privacy_policy, footer_description columns successfully!');
    
    const res = await client.query('SELECT * FROM public.settings WHERE id = $1', ['store']);
    console.log('Store settings updated columns:', Object.keys(res.rows[0]));
  } catch (err) {
    console.error('Error adding content columns:', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

run();
