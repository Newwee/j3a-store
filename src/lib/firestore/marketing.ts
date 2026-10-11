import { supabase } from '@/lib/supabase/client';
import { SitePopup, SiteAnnouncement, MarketingCampaign } from '@/types/marketing';

const DEFAULT_POPUPS: SitePopup[] = [
  {
    id: 'popup_welcome_01',
    title: 'ร้านเปิดใหม่แล้ว! ยินดีต้อนรับสู่ J3A STORE',
    description: 'ขอบคุณที่เข้ามาใช้บริการ รับส่วนลดสำหรับการสั่งซื้อครั้งแรก เพียงกรอกโค้ดส่วนลดด้านล่าง',
    type: 'welcome',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    ctaText: 'เลือกซื้อสินค้าเลย',
    ctaLink: '/shop',
    discountCode: 'WELCOME10',
    frequency: 'once',
    audience: 'all',
    priority: 'normal',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'popup_news_02',
    title: 'อัปเดตระบบร้านค้า & สินค้าดิจิทัลใหม่',
    description: 'วันนี้เราเพิ่มสินค้าใหม่และปรับปรุงระบบส่งมอบสินค้าอัตโนมัติ เพื่อให้การสั่งซื้อสะดวกรวดเร็วยิ่งขึ้น',
    type: 'news',
    ctaText: 'ดูรายการสินค้า',
    ctaLink: '/shop',
    frequency: 'daily',
    audience: 'all',
    priority: 'normal',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'popup_maint_03',
    title: 'แจ้งปรับปรุงระบบชำระเงินชั่วคราว',
    description: 'ระบบเติมเงินอั่งเปาและพร้อมเพย์จะปิดปรับปรุงเวลา 02:00–02:30 น. เพื่ออัปเกรดความเร็วของระบบ',
    type: 'maintenance',
    frequency: 'always',
    audience: 'all',
    priority: 'urgent',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_ANNOUNCEMENTS: SiteAnnouncement[] = [
  {
    id: 'ann_01',
    title: 'ยินดีต้อนรับสู่ J3A STORE โฉมใหม่',
    content: 'เว็บไซต์จำหน่ายสินค้าดิจิทัล บอท และบริการครบวงจร พร้อมระบบชำระเงินอัตโนมัติ 24 ชม.',
    category: 'general',
    isPinned: true,
    publishedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: 'ann_02',
    title: 'ช่องทางชำระเงินรองรับ PromptPay และ Wallet แล้ว',
    content: 'สามารถชำระเงินได้ทั้งโอนเงินผ่านพร้อมเพย์ และใช้เครดิตในกระเป๋าเงิน (Wallet) จัดส่งรวดเร็วทันใจ',
    category: 'payment',
    isPinned: false,
    publishedAt: new Date().toISOString(),
    active: true,
  },
];

const LOCAL_POPUPS_KEY = 'j3a_store_popups';
const LOCAL_ANNOUNCEMENTS_KEY = 'j3a_store_announcements';

// ---------------- Popups ----------------

export async function getPopups(): Promise<SitePopup[]> {
  try {
    const { data, error } = await supabase
      .from('site_popups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        type: d.type,
        imageUrl: d.image_url || d.imageUrl,
        ctaText: d.cta_text || d.ctaText,
        ctaLink: d.cta_link || d.ctaLink,
        discountCode: d.discount_code || d.discountCode,
        startDate: d.start_date || d.startDate,
        endDate: d.end_date || d.endDate,
        frequency: d.frequency,
        audience: d.audience,
        priority: d.priority,
        isActive: d.is_active ?? d.isActive ?? true,
        createdAt: d.created_at || new Date().toISOString(),
        updatedAt: d.updated_at || new Date().toISOString(),
      }));
    }
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_POPUPS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  return DEFAULT_POPUPS;
}

export async function savePopup(popup: SitePopup): Promise<SitePopup> {
  const current = await getPopups();
  const exists = current.findIndex((p) => p.id === popup.id);
  let updatedList: SitePopup[];

  if (exists >= 0) {
    updatedList = [...current];
    updatedList[exists] = { ...popup, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [popup, ...current];
  }

  // 1. Try Supabase
  try {
    await supabase.from('site_popups').upsert([
      {
        id: popup.id,
        title: popup.title,
        description: popup.description,
        type: popup.type,
        image_url: popup.imageUrl,
        cta_text: popup.ctaText,
        cta_link: popup.ctaLink,
        discount_code: popup.discountCode,
        frequency: popup.frequency,
        audience: popup.audience,
        priority: popup.priority,
        is_active: popup.isActive,
        updated_at: new Date().toISOString(),
      },
    ]);
  } catch {}

  // 2. Local storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_POPUPS_KEY, JSON.stringify(updatedList));
    } catch {}
  }

  return popup;
}

export async function deletePopup(id: string): Promise<void> {
  try {
    await supabase.from('site_popups').delete().eq('id', id);
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const current = await getPopups();
      const updated = current.filter((p) => p.id !== id);
      localStorage.setItem(LOCAL_POPUPS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

// ---------------- Announcements ----------------

export async function getAnnouncements(): Promise<SiteAnnouncement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        category: d.category,
        isPinned: d.is_pinned ?? false,
        publishedAt: d.published_at || d.created_at || new Date().toISOString(),
        active: d.active ?? true,
      }));
    }
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  return DEFAULT_ANNOUNCEMENTS;
}

export async function saveAnnouncement(ann: SiteAnnouncement): Promise<SiteAnnouncement> {
  const current = await getAnnouncements();
  const exists = current.findIndex((a) => a.id === ann.id);
  let updatedList: SiteAnnouncement[];

  if (exists >= 0) {
    updatedList = [...current];
    updatedList[exists] = ann;
  } else {
    updatedList = [ann, ...current];
  }

  try {
    await supabase.from('announcements').upsert([
      {
        id: ann.id,
        title: ann.title,
        content: ann.content,
        category: ann.category,
        is_pinned: ann.isPinned,
        active: ann.active,
      },
    ]);
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(updatedList));
    } catch {}
  }

  return ann;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    await supabase.from('announcements').delete().eq('id', id);
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const current = await getAnnouncements();
      const updated = current.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
    } catch {}
  }
}
