# 🎮 J3A STORE — Modern Next-Gen Digital Commerce & Gaming Store

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel%20Ready-white?style=flat&logo=vercel)](https://vercel.com/)

**J3A STORE** คือแพลตฟอร์ม E-Commerce สำหรับสินค้าดิจิทัลและเกมระดับพรีเมียม (Digital Store / Modern Gamer Commerce) แบบ Production-Ready ที่พัฒนาด้วย Next.js App Router, TypeScript, Tailwind CSS และเชื่อมต่อระบบหลังบ้านด้วย Firebase (Authentication, Cloud Firestore, Firebase Storage) ครบวงจร พร้อม Admin Dashboard และระบบจัดการสินค้าที่ทำงานได้จริงทุกฟังก์ชัน

---

## 🌟 จุดเด่นของระบบ (Key Features)

### 🛒 หน้าร้านสำหรับลูกค้า (Customer Storefront)
- **Home Page**:
  - Hero Section สไตล์ Cyberpunk / Gamer Modern พร้อมโลโก้ J3A STORE และเอฟเฟกต์เรืองแสง
  - **Live Stats Widget**: สถิติสมาชิกระบบ คำสั่งซื้อสะสม และสถานะระบบแบบ Real-time
  - **สินค้ายอดนิยม (Featured Products)**: แสดงสินค้าแนะนำพร้อม Carousel Navigation
  - **สินค้ามาใหม่ (New Arrivals)**: เรียงลำดับตามวันที่สร้างล่าสุด
  - **หมวดหมู่สินค้า (Category Filter Pills)**
  - **Banner โปรโมชั่น & สิทธิประโยชน์พิเศษ**
  - **Why J3A STORE**: แสดงจุดเด่นด้านความรวดเร็ว ความปลอดภัย และบริการ 24 ชม.
- **Shop & Catalog (`/shop`)**:
  - ค้นหาสินค้าแบบ Live Text Search
  - กรองตามหมวดหมู่ (Category Filter)
  - กรองสินค้าที่มีของพร้อมส่ง (In-Stock Only)
  - จัดเรียงตามราคา (ต่ำไปสูง / สูงไปต่ำ), ใหม่ล่าสุด, หรือชื่อสินค้า
  - Loading Skeleton UI เมื่อโหลดข้อมูล
- **Product Details (`/products/[slug]`)**:
  - Image Gallery พร้อมพรีวิวและเลือกภาพย่อย
  - ป้ายราคาพิเศษ คำนวณส่วนลด % และสต็อกแบบ Real-time
  - ปรับจำนวนสินค้า (- / +)
  - ปุ่ม **"เพิ่มลงตะกร้า"** และปุ่ม **"ซื้อทันที (Buy Now)"**
- **ตะกร้าสินค้า (`/cart` & Cart Drawer)**:
  - เพิ่ม/ลดจำนวน หรือลบสินค้า
  - คำนวณ Subtotal, ค่าจัดส่งฟรีอัตโนมัติเมื่อครบยอด, และ Total
  - รองรับ Cart Persistence เก็บข้อมูลใน LocalStorage ไม่หายเมื่อรีเฟรช
- **ระบบชำระเงิน (`/checkout`)**:
  - ฟอร์มข้อมูลลูกค้า (ชื่อ, อีเมล, เบอร์โทร, ที่อยู่/UID)
  - ช่องทางชำระเงิน: พร้อมเพย์ (PromptPay QR), โอนผ่านธนาคาร (Bank Transfer), และยอดเครดิตในบัญชี (Store Credits)
  - อัปโหลดสลิปหลักฐานการโอนเงินขึ้น Firebase Storage
  - Animation ฉลองคำสั่งซื้อสำเร็จ (Confetti)
  - บันทึกคำสั่งซื้อลง Cloud Firestore อัตโนมัติ
- **ประวัติการสั่งซื้อ (`/orders` & `/orders/[id]`)**:
  - ติดตามสถานะคำสั่งซื้อ (รอชำระ, ชำระแล้ว, กำลังดำเนินการ, สำเร็จ, ยกเลิก)
  - อัปโหลดสลิปย้อนหลังได้หากยังค้างชำระ
- **ระบบสมาชิก & กระเป๋าเงิน (`/profile`)**:
  - ตรวจสอบยอดเครดิตคงเหลือ (Balance ฿)
  - ระดับสมาชิก (Tier: Bronze, Silver, Gold, VIP)
  - ฟังก์ชันเติมเงินเข้ากระเป๋าเครดิต (Top-up Balance)
  - แก้ไขข้อมูลส่วนตัว

---

### 🛡️ ระบบความปลอดภัย & แอดมิน (Admin Dashboard)
- **Route Protection**: เข้าถึง `/admin/*` ได้เฉพาะผู้ใช้ที่มีสถานะ `role === "admin"` เท่านั้น (ตรวจสอบทั้งระดับ Client Guard และ Firebase Security Rules)
- **Dashboard Overview (`/admin`)**:
  - สรุปรายได้รวม (Total Revenue)
  - จำนวนคำสั่งซื้อทั้งหมด (Total Orders)
  - จำนวนสินค้าในระบบ (Total Products)
  - จำนวนลูกค้าสมาชิก (Total Customers)
  - ตารางคำสั่งซื้อและสินค้าล่าสุด
- **จัดการสินค้า (`/admin/products`)**:
  - ตารางสินค้าครบทุกคอลัมน์ (ภาพ, ชื่อ, หมวดหมู่, ราคา, สต็อก, สถานะ, แนะนำ, วันที่สร้าง)
  - ค้นหา กรองหมวดหมู่ และกรองสถานะ
  - สวิตช์สลับสถานะทันที (พร้อมขาย / ฉบับร่าง / สินค้าหมด)
  - สวิตช์เปิด/ปิด สินค้าแนะนำ (Featured Toggle)
  - ลบสินค้าพร้อมกล่องยืนยัน (Confirmation Dialog) และลบรูปภาพที่เกี่ยวข้องใน Firebase Storage อัตโนมัติ ไม่ทิ้ง orphan files
- **สร้างสินค้าใหม่ (`/admin/products/new`)**:
  - ฟอร์มครบทุกฟิลด์ พร้อมสร้าง Slug อัตโนมัติ
  - อัปโหลดรูปภาพขึ้น Firebase Storage พร้อม Progress Bar (0-100%) และ Image Preview
- **แก้ไขสินค้า (`/admin/products/[id]/edit`)**:
  - แก้ไขข้อมูลทั้งหมด ปรับราคา เปลี่ยนรูปภาพเดิม
- **จัดการคำสั่งซื้อ (`/admin/orders`)**:
  - ตรวจสอบรายการสั่งซื้อ
  - เปลี่ยนสถานะคำสั่งซื้อ (`pending` -> `paid` -> `processing` -> `completed` -> `cancelled`)
  - ตรวจสอบรูปภาพสลิปการโอนเงิน (Slip Preview Modal) พร้อมปุ่มอนุมัติทันที
- **จัดการลูกค้า (`/admin/customers`)**:
  - แสดงรายชื่อผู้ใช้ อีเมล วันที่สมัคร ยอดเครดิต และ Tier
  - แอดมินสามารถปรับเปลี่ยนสิทธิ์ผู้ใช้เป็น ADMIN หรือ CUSTOMER ได้

---

## 🏗️ โครงสร้างโปรเจกต์ (Project Structure)

```text
d:\J3ASTOREWEBSITE
├── public/
│   └── logo.png                          # โลโก้หลัก J3A STORE
├── src/
│   ├── app/
│   │   ├── (store)/                      # หน้าร้านค้า (Customer Pages)
│   │   │   ├── layout.tsx                # Store Layout (Navbar + Footer)
│   │   │   ├── page.tsx                  # Home Page
│   │   │   ├── shop/page.tsx             # Shop / Product Listing
│   │   │   ├── products/[slug]/page.tsx  # Product Detail
│   │   │   ├── cart/page.tsx             # Cart Page
│   │   │   ├── checkout/page.tsx         # Checkout Page
│   │   │   ├── orders/page.tsx           # Orders History
│   │   │   ├── orders/[id]/page.tsx      # Order Detail
│   │   │   ├── login/page.tsx            # Login Page
│   │   │   ├── register/page.tsx         # Register Page
│   │   │   ├── forgot-password/page.tsx  # Password Reset
│   │   │   ├── profile/page.tsx          # Profile & Topup
│   │   │   ├── about/page.tsx            # About J3A
│   │   │   ├── terms/page.tsx            # Terms of Service
│   │   │   ├── privacy/page.tsx          # Privacy Policy
│   │   │   └── contact/page.tsx          # Contact Support
│   │   ├── admin/                        # หน้าแอดมิน (Admin Control Panel)
│   │   │   ├── layout.tsx                # Admin Guard & Sidebar Layout
│   │   │   ├── page.tsx                  # Admin Dashboard Stats
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # Products Table
│   │   │   │   ├── new/page.tsx          # Create Product Form
│   │   │   │   └── [id]/edit/page.tsx    # Edit Product Form
│   │   │   ├── orders/page.tsx           # Orders Management
│   │   │   ├── customers/page.tsx        # Customers Management
│   │   │   └── settings/page.tsx         # Store Settings
│   │   ├── sitemap.ts                    # Dynamic SEO Sitemap
│   │   ├── robots.ts                     # SEO Robots
│   │   ├── layout.tsx                    # Root Layout + Providers
│   │   └── globals.css                   # Tailwind v4 & Glassmorphism
│   ├── components/
│   │   ├── ui/                           # Button, Input, Modal, Badge, Skeleton, EmptyState
│   │   ├── navbar/                       # Navbar, UserDropdown, MobileMenu
│   │   ├── footer/                       # Footer
│   │   ├── home/                         # HeroSection, LiveStatsSection, FeaturedProducts, etc.
│   │   ├── product/                      # ProductCard, ProductGrid, ProductFilter, ImageGallery
│   │   ├── cart/                         # CartDrawer
│   │   └── admin/                        # AdminSidebar, AdminHeader, StatCard, DeleteConfirmModal, ProductForm
│   ├── context/
│   │   ├── AuthContext.tsx               # Firebase Auth State & User Profile
│   │   ├── CartContext.tsx               # Cart State & LocalStorage Persistence
│   │   └── ToastContext.tsx              # Global Toast Notifications
│   ├── lib/
│   │   ├── firebase/client.ts            # Firebase Client SDK Singleton
│   │   ├── firestore/                    # Firestore Products, Orders, Users, Stats
│   │   ├── storage/upload.ts             # Firebase Storage Image Upload & Delete
│   │   ├── services/payment.ts           # Payment Gateway Abstraction
│   │   └── utils/                        # formatters, cn
│   └── types/                            # TypeScript Data Interfaces
├── scripts/
│   ├── set-admin.mjs                     # สคริปต์แต่งตั้งแอดมินคนแรกอย่างปลอดภัย
│   └── seed-products.mjs                 # สคริปต์ใส่สินค้าตัวอย่างลง Firestore
├── firestore.rules                       # Production Firestore Security Rules
├── storage.rules                         # Production Storage Security Rules
├── .env.example                          # Environment Variables Template
└── package.json
```

---

## ⚙️ การตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:

```bash
cp .env.example .env.local
```

กรอกข้อมูล Firebase Project ของท่าน (ดูได้จาก Firebase Console -> Project Settings -> General -> Your apps -> Web app):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

NEXT_PUBLIC_STORE_NAME=J3A STORE
NEXT_PUBLIC_STORE_CURRENCY=THB
NEXT_PUBLIC_STORE_URL=https://j3a-store.vercel.app

NEXT_PUBLIC_PROMPTPAY_NUMBER=0812345678
NEXT_PUBLIC_STORE_CONTACT_LINE=@j3astore
NEXT_PUBLIC_STORE_CONTACT_DISCORD=https://discord.gg/j3astore
```

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Installation & Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development
```bash
npm run dev
```
เปิดบราวเซอร์ที่ `http://localhost:3000`

### 3. ใส่ข้อมูลสินค้าตัวอย่าง (Optional Seed)
หากต้องการใส่สินค้าตัวอย่างลง Firestore ทันที:
```bash
npm run seed
```

### 4. Build ตรวจสอบ Production
```bash
npm run build
npm run start
```

---

## 👑 การกำหนด Admin คนแรก (Admin Initial Setup)

เพื่อความปลอดภัยสูงสุด ระบบไม่อนุญาตให้ผู้ใช้ทั่วไปเปลี่ยน Role ตัวเองจาก Frontend:

1. ให้แอดมินเข้าไปที่หน้าเว็บ แล้วกด **สมัครสมาชิก (Register)** ด้วยอีเมลที่ต้องการ เช่น `admin@j3astore.com`
2. รันคำสั่งแต่งตั้งผ่าน Terminal:
```bash
node scripts/set-admin.mjs admin@j3astore.com
# หรือ
npm run set-admin admin@j3astore.com
```
3. สคริปต์จะทำการอัปเดตเอกสารผู้ใช้ในคอลเลกชัน `users` เป็น `role: "admin"`
4. ล็อกอินเข้าสู่ระบบ จะสามารถเข้าใช้งานหน้า `/admin` ได้ทันที

---

## 🔒 กฎความปลอดภัย (Security Rules)

### 1. Cloud Firestore Rules (`firestore.rules`)
- **Users**: ผู้ใช้สามารถอ่านและแก้ไขข้อมูลโปรไฟล์ของตนเองได้เท่านั้น (ไม่สามารถเปลี่ยน `role` เป็น admin ได้) แอดมินสามารถอ่านและแก้ไขได้ทุกคน
- **Products**: บุคคลทั่วไปสามารถอ่านสินค้าที่มีสถานะ `active` เท่านั้น เฉพาะแอดมินเท่านั้นที่สามารถ Create, Update, Delete สินค้า
- **Orders**: ลูกค้าสามารถอ่านคำสั่งซื้อของตนเองเท่านั้น แอดมินสามารถดูและปรับปรุงสถานะคำสั่งซื้อได้ทั้งหมด

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 2. Firebase Storage Rules (`storage.rules`)
- **Product Images (`/products/*`)**: เปิดให้อ่านสาธารณะ แต่จำกัดสิทธิ์การอัปโหลดและลบเฉพาะแอดมินเท่านั้น และจำกัดไฟล์รูปภาพไม่เกิน 5MB
- **Payment Slips (`/slips/*`)**: ลูกค้าสามารถอัปโหลดรูปสลิปได้ เฉพาะแอดมินและเจ้าของคำสั่งซื้อที่สามารถเข้าดูได้

Deploy rules:
```bash
firebase deploy --only storage
```

---

## 🌐 การ Deploy ขึ้น Vercel (Deployment Steps)

1. นำโค้ดขึ้น Git Repository (GitHub / GitLab / Bitbucket)
2. เข้าสู่ [Vercel Dashboard](https://vercel.com/) และกด **Add New Project**
3. เลือก Repository `J3ASTOREWEBSITE`
4. ในส่วน **Environment Variables** ให้คัดลอกตัวแปรทั้งหมดจาก `.env.local` หรือ `.env.example` ไปใส่บน Vercel:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_STORE_NAME`
   - `NEXT_PUBLIC_PROMPTPAY_NUMBER`
5. กด **Deploy** — Vercel จะทำการ Build และ Deploy เว็บไซต์ให้ใช้งานได้จริงทันที!

---

© 2026 **J3A STORE**. All Rights Reserved.
