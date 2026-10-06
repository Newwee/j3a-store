'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'th' | 'en';

export interface Translations {
  [key: string]: {
    th: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  nav_home: { th: 'หน้าแรก', en: 'Home' },
  nav_shop: { th: 'ร้านค้า', en: 'Shop' },
  nav_categories: { th: 'หมวดหมู่', en: 'Categories' },
  nav_search_placeholder: { th: 'ค้นหาเกม / บัตรเติมเงิน / สินค้า...', en: 'Search games / gift cards / products...' },
  nav_login: { th: 'เข้าสู่ระบบ', en: 'Login' },
  nav_register: { th: 'สมัครสมาชิก', en: 'Register' },
  nav_cart: { th: 'ตะกร้าสินค้า', en: 'Cart' },
  nav_admin_panel: { th: 'Admin Panel', en: 'Admin Panel' },

  // User Dropdown
  user_balance: { th: 'BALANCE', en: 'BALANCE' },
  user_admin_dashboard: { th: 'Admin Dashboard', en: 'Admin Dashboard' },
  user_account_overview: { th: 'ภาพรวมบัญชี', en: 'Account Overview' },
  user_topup: { th: 'เติมเงิน', en: 'Top-up' },
  user_order_history: { th: 'ประวัติการทำรายการ', en: 'Order History' },
  user_account_settings: { th: 'ตั้งค่าบัญชี', en: 'Account Settings' },
  user_help: { th: 'ช่วยเหลือ', en: 'Help & Support' },
  user_logout: { th: 'ออกจากระบบ', en: 'Logout' },
  user_theme_dark: { th: 'Dark Theme', en: 'Dark Theme' },
  user_theme_light: { th: 'Light Theme', en: 'Light Theme' },
  user_theme_system: { th: 'System Theme', en: 'System Theme' },
  user_lang_th: { th: 'Thai (TH)', en: 'Thai (TH)' },
  user_lang_en: { th: 'English (EN)', en: 'English (EN)' },

  // Hero Section
  hero_new_version: { th: 'เวอร์ชันใหม่เปิดให้บริการแล้ว! ระบบอัตโนมัติ 24 ชม.', en: 'New version live! 24/7 Automated Delivery.' },
  hero_title_tag: { th: 'Next-Gen E-Commerce & Digital Store', en: 'Next-Gen E-Commerce & Digital Store' },
  hero_description: {
    th: 'สัมผัสประสบการณ์ช้อปปิ้งยุคใหม่ที่ J3A STORE ศูนย์รวมไอเทมเกม บัตรเติมเงิน และบริการดิจิทัลระดับพรีเมียม ทำรายการรวดเร็ว ปลอดภัย ด้วยระบบตรวจสอบอัตโนมัติ',
    en: 'Experience next-gen digital commerce at J3A STORE. Premium game items, gift cards, and automated digital delivery. Fast, safe, and transparent.'
  },
  hero_shop_now: { th: 'เลือกซื้อสินค้า (Shop Now)', en: 'Shop Now' },
  hero_topup_wallet: { th: 'เติมเครดิตบัญชี', en: 'Top-up Wallet' },
  hero_feature_fast: { th: '< 1 นาที จัดส่งระบบออโต้', en: '< 1 min Instant Delivery' },
  hero_feature_safe: { th: '100% ปลอดภัย การันตีทุกคำสั่งซื้อ', en: '100% Secure & Guaranteed' },
  hero_feature_reviews: { th: 'รีวิวจากผู้ใช้จริง', en: 'Verified User Reviews' },

  // Live Stats Section
  stats_title: { th: 'สถิติการใช้งาน', en: 'Usage Statistics' },
  stats_subtitle: { th: 'ข้อมูลจริงจากระบบ J3A STORE', en: 'Real-time data from J3A STORE system' },
  stats_live_badge: { th: 'อัปเดตเรียลไทม์', en: 'Live Updates' },
  stats_members: { th: 'สมาชิกทั้งหมด', en: 'Total Members' },
  stats_members_sub: { th: 'คนที่สมัครทั้งหมด', en: 'All Registered Users' },
  stats_unit_people: { th: 'คน', en: 'Users' },
  stats_orders: { th: 'คำสั่งซื้อสะสม', en: 'Total Orders' },
  stats_orders_sub: { th: 'ทั้งหมด', en: 'All Completed' },
  stats_unit_orders: { th: 'รายการ', en: 'Orders' },
  stats_products: { th: 'สินค้าในคลัง', en: 'Products in Stock' },
  stats_products_sub: { th: 'พร้อมจำหน่าย', en: 'Available Now' },
  stats_reviews: { th: 'คะแนนรีวิวร้านค้า', en: 'Store Reviews' },
  stats_reviews_sub: { th: 'รีวิวจากผู้ซื้อจริง', en: 'Reviews from Buyers' },
  stats_reviews_satisfied: { th: 'พึงพอใจ 100%', en: '100% Satisfaction' },

  // Cart & Checkout
  cart_title: { th: 'ตะกร้าสินค้า', en: 'Shopping Cart' },
  cart_empty: { th: 'ไม่มีสินค้าในตะกร้า', en: 'Your cart is empty' },
  cart_empty_sub: { th: 'เลือกดูสินค้าที่น่าสนใจและเพิ่มลงในตะกร้าได้เลย', en: 'Explore our catalog and add items to your cart.' },
  cart_browse_products: { th: 'เลือกดูสินค้า', en: 'Browse Products' },
  cart_items_count: { th: 'รายการ', en: 'items' },
  cart_clear: { th: 'ล้างตะกร้า', en: 'Clear Cart' },
  cart_subtotal: { th: 'ยอดรวมสินค้า', en: 'Subtotal' },
  cart_shipping: { th: 'การจัดส่ง', en: 'Delivery' },
  cart_free_delivery: { th: 'ฟรี (จัดส่งอัตโนมัติ)', en: 'Free (Instant Delivery)' },
  cart_total: { th: 'ยอดชำระสุทธิ', en: 'Total' },
  cart_checkout_btn: { th: 'ชำระเงินทันที (Checkout)', en: 'Checkout Now' },
  cart_view_full: { th: 'ดูตะกร้าสินค้าฉบับเต็ม', en: 'View Full Cart' },
  cart_secure_100: { th: 'ชำระเงินปลอดภัย 100%', en: '100% Secure Checkout' },
  cart_instant: { th: 'ได้รับสินค้าทันที', en: 'Instant Delivery' },
  checkout_title: { th: 'เช็คเอาท์และชำระเงิน (Checkout)', en: 'Checkout & Payment' },
  checkout_subtitle: { th: 'กรอกข้อมูลผู้รับและเลือกช่องทางการชำระเงินเพื่อเสร็จสิ้นคำสั่งซื้อ', en: 'Fill in your details and select a payment method to complete order.' },
  checkout_customer_info: { th: 'ข้อมูลผู้สั่งซื้อ (Customer Information)', en: 'Customer Information' },
  checkout_payment_method: { th: 'เลือกช่องทางชำระเงิน (Payment Method)', en: 'Payment Method' },
  checkout_order_summary: { th: 'สรุปคำสั่งซื้อ (Order Summary)', en: 'Order Summary' },
  checkout_place_order: { th: 'ดำเนินการชำระเงิน', en: 'Place Order & Pay' },

  // Footer
  footer_desc: {
    th: 'แพลตฟอร์มศูนย์รวมสินค้าและบริการดิจิทัลชั้นนำ เติมเกม ไอดีเกม บัตรเติมเงิน และอุปกรณ์ระดับพรีเมียม ระบบอัตโนมัติ รวดเร็ว ปลอดภัย 100% พร้อมบริการตลอด 24 ชั่วโมง',
    en: 'Leading digital commerce platform for gaming top-ups, game accounts, gift cards, and premium services. 100% automated, fast, and secure 24/7.'
  },
  footer_delivery_badge: { th: 'จัดส่งทันใจใน 1 นาที', en: '< 1 min Instant Delivery' },
  footer_secure_badge: { th: 'ปลอดภัย 100%', en: '100% Secure Guarantee' },
  footer_menu_main: { th: 'เมนูหลัก', en: 'Main Menu' },
  footer_menu_help: { th: 'ข้อกำหนด & การช่วยเหลือ', en: 'Terms & Support' },
  footer_menu_contact: { th: 'ติดต่อเรา', en: 'Contact Us' },
  footer_contact_desc: { th: 'มีข้อสงสัยหรือต้องการความช่วยเหลือ? ทีมงานแอดมินพร้อมตอบคำถามตลอดเวลา', en: 'Have questions or need assistance? Our support team is here 24/7.' },
  footer_about: { th: 'เกี่ยวกับเรา (About J3A)', en: 'About J3A' },
  footer_terms: { th: 'เงื่อนไขการใช้บริการ (Terms of Service)', en: 'Terms of Service' },
  footer_privacy: { th: 'นโยบายความเป็นส่วนตัว (Privacy Policy)', en: 'Privacy Policy' },
  footer_support: { th: 'ติดต่อฝ่ายซัพพอร์ต (Contact Support)', en: 'Contact Support' },
  footer_server_online: { th: 'ออนไลน์', en: 'Online' },

  // Toast / General
  toast_lang_switched: { th: 'เปลี่ยนภาษาเป็น ภาษาไทย (TH) แล้ว', en: 'Switched language to English (EN)' },
  toast_theme_dark: { th: 'เปลี่ยนเป็น Dark Theme (โหมดมืด)', en: 'Switched to Dark Theme' },
  toast_theme_light: { th: 'เปลี่ยนเป็น Light Theme (โหมดสว่าง)', en: 'Switched to Light Theme' },
  toast_theme_system: { th: 'ปรับตามระบบเครื่อง (System Theme)', en: 'Switched to System Theme' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'th',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('th');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('j3a_language') as Language | null;
      if (saved && (saved === 'th' || saved === 'en')) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('j3a_language', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'th' ? 'en' : 'th';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
