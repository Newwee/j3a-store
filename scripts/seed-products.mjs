/**
 * J3A STORE - Seed Initial Products into Cloud Firestore
 *
 * Usage:
 *   node scripts/seed-products.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Firebase environment variables not set in .env.local');
  process.exit(1);
}

const sampleProducts = [
  {
    name: 'J3A Discord Profile',
    slug: 'j3a-discord-profile',
    description: 'โปรแกรมตกแต่งและปรับแต่งสถานะ Discord Profile อัตโนมัติ (Rich Presence) ส่งมอบ License Key ทันทีหลังสั่งซื้อ ใช้งานง่าย ปลอดภัย 100% รองรับ Windows 10/11',
    price: 199,
    comparePrice: 299,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'ซอฟต์แวร์',
    stock: 999,
    status: 'active',
    featured: true,
    tags: ['discord', 'profile', 'software', 'license', 'rpc'],
  },
  {
    name: 'Steam Wallet Card 1,000 THB (TH Key)',
    slug: 'steam-wallet-card-1000-thb',
    description: 'บัตรเติมเงิน Steam Wallet มูลค่า 1,000 บาท สำหรับบัญชีสตรีมโซนไทย จัดส่งรหัสทันทีแบบอัตโนมัติ 24 ชม.',
    price: 990,
    comparePrice: 1050,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'บัตรเติมเงิน',
    stock: 50,
    status: 'active',
    featured: true,
    tags: ['steam', 'wallet', 'pc', 'giftcard'],
  },
  {
    name: 'Valorant Points 1,650 VP (Riot Direct Top-up)',
    slug: 'valorant-points-1650-vp',
    description: 'เติม Riot Points / VP เกม Valorant เข้าไอดีโดยตรง รวดเร็ว ปลอดภัย 100% ไม่ต้องให้รหัสผ่าน เพียงระบุ Riot ID',
    price: 499,
    comparePrice: 550,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'เกมยอดนิยม',
    stock: 120,
    status: 'active',
    featured: true,
    tags: ['valorant', 'riot', 'points', 'fps'],
  },
  {
    name: 'ROV 510 Coupons (การีน่าเติมเร็ว)',
    slug: 'rov-510-coupons',
    description: 'คูปองเกม RoV: Realm of Valor การันตีเข้าบัญชีใน 1 นาที ผ่านระบบเชื่อมต่อตรงกับเซิร์ฟเวอร์การีน่า',
    price: 150,
    comparePrice: 175,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'เกมยอดนิยม',
    stock: 99,
    status: 'active',
    featured: true,
    tags: ['rov', 'moba', 'garena', 'coupons'],
  },
  {
    name: 'Discord Nitro 1 Month (Full Subscription)',
    slug: 'discord-nitro-1-month',
    description: 'แพ็กเกจ Discord Nitro เต็มรูปแบบ 1 เดือน ปลดล็อกอีโมจิแบบเคลื่อนไหว เพิ่มขนาดอัปโหลด 500MB และสตรีม HD 4K 60FPS',
    price: 290,
    comparePrice: 349,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'บริการดิจิทัล',
    stock: 35,
    status: 'active',
    featured: true,
    tags: ['discord', 'nitro', 'subscription'],
  },
  {
    name: 'Razer Gold PIN 500 THB',
    slug: 'razer-gold-pin-500-thb',
    description: 'รหัสเติมเงิน Razer Gold PIN มูลค่า 500 บาท ใช้เติมเกมและบริการออนไลน์ได้มากกว่า 42,000 รายการทั่วโลก',
    price: 495,
    comparePrice: 520,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'บัตรเติมเงิน',
    stock: 40,
    status: 'active',
    featured: false,
    tags: ['razer', 'gold', 'pin'],
  },
  {
    name: 'ไอดีเริ่มต้น Genshin Impact: AR10 + 50 Wish',
    slug: 'genshin-impact-starter-account-ar10',
    description: 'ไอดีเซิร์ฟเวอร์เอเชีย เลเวลนักผจญภัย 10 พร้อมหินสุ่ม Wish มากกว่า 50 ชิ้น ปลอดภัย ไม่ผ่านโปรแกรมช่วยเล่น 100%',
    price: 199,
    comparePrice: 250,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'ไอดีเกม & สกิน',
    stock: 15,
    status: 'active',
    featured: false,
    tags: ['genshin', 'anime', 'starter', 'account'],
  },
  {
    name: 'Windows 11 Pro Genuine OEM Key (Lifetime)',
    slug: 'windows-11-pro-oem-key',
    description: 'คีย์แท้สำหรับเปิดใช้งานระบบปฏิบัติการ Windows 11 Pro 64-bit ใช้งานได้ตลอดชีพ รองรับการอัปเดตทุกฟีเจอร์อย่างเป็นทางการ',
    price: 450,
    comparePrice: 890,
    image: '/logo.png',
    images: ['/logo.png'],
    category: 'ซอฟต์แวร์ & คีย์',
    stock: 25,
    status: 'active',
    featured: true,
    tags: ['windows', 'microsoft', 'software', 'license'],
  },
];

async function seed() {
  console.log(`🌱 Seeding sample products into Firestore (${firebaseConfig.projectId})...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const item of sampleProducts) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Seeded: ${item.name} (ID: ${docRef.id})`);
    } catch (err) {
      console.error(`❌ Failed to seed ${item.name}:`, err);
    }
  }

  console.log('\n🎉 Finished seeding initial products!');
}

seed();
