import { supabase } from '@/lib/supabase/client';
import { StoreSettings } from '@/types/settings';

const STORE_DOC_ID = 'store';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'J3A STORE',
  promptpay: '0812345678',
  truemoneyPhone: '0983892996',
  lineContact: '@153nhgvs',
  discordContact: 'https://discord.gg/UtWykPvTYF',
  announcement: 'ยินดีต้อนรับสู่ J3A STORE ซอฟต์แวร์ Discord และบริการดิจิทัลอัตโนมัติ 24 ชม.',
  shippingFee: 0,
  freeShippingThreshold: 0,
  showcaseYoutubeUrl: '',
  showcaseTitle: 'วิธีใช้งานร้านค้า J3A STORE',
  showcaseSubtitle: 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ 24 ชม.',
  heroTagline: 'ซอฟต์แวร์ Discord & บอทอัตโนมัติ ระดับพรีเมียม',
  heroDescription: 'ศูนย์รวมโปรแกรมและเครื่องมือ Discord อัจฉริยะ AutoQuest, จัดการโปรไฟล์, บอทคุมเซิร์ฟเวอร์ พร้อมระบบส่งมอบ License Key อัตโนมัติ 24 ชม.',
  privacyPolicy: '1. ข้อมูลที่เราเก็บรวบรวม\nJ3A STORE เก็บรวบรวมข้อมูลที่จำเป็นต่อการให้บริการ เช่น ชื่อ-นามสกุล, ที่อยู่อีเมล, เบอร์โทรศัพท์, และประวัติการทำรายการ เพื่อใช้ในการจัดส่งสินค้าดิจิทัลและยืนยันสถานะการชำระเงิน\n\n2. การรักษาความปลอดภัยของข้อมูล\nข้อมูลรหัสผ่านทั้งหมดได้รับการจัดการและเข้ารหัสผ่าน Supabase Authentication ซึ่งเป็นไปตามมาตรฐานความปลอดภัยชั้นนำระดับโลก เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก',
  footerDescription: 'แพลตฟอร์มจำหน่ายซอฟต์แวร์ Discord เครื่องมือและบอทอัตโนมัติระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100% พร้อมบริการและดูแลตลอด 24 ชั่วโมง',
  discordWebhookSlip: 'https://discord.com/api/webhooks/1563838807369977917/zubkvc8V0t7i_-CLIbwMhN9yXsx65-yDw_tslKgiM0l9nHbD9xS_Ki4IFAzt1uOB-2Jp',
  discordWebhookCredits: 'https://discord.com/api/webhooks/1563850107282128906/G7dp9H3KxujiMJWkl013sFiQs7gvZhrzGqvFWWGEtorrYEpecq9bi-MFZz8sctZycrRK',
  discordWebhookOrder: 'https://discord.com/api/webhooks/1563850109241008239/PBBRf4WQju8hFSEB32X9VIDQAUb7hRpIwCWAWjg3VL_6DJcCQKX7P-gfiBlHW3j1x00A',
  discordWebhookWelcome: 'https://discord.com/api/webhooks/1563850111170256917/wrWXMv3d0p4ajxvNPrfN4M-sZx_DuvbqgBpSm8euHWbfojuEHskzwGS_S3-z4rC4nyYO',
  discordRoleOwner: '1555520737975205919',
  discordRoleAdmin: '1555520740558897205',
  metaTitle: 'J3A STORE — ซอฟต์แวร์ Discord & บริการดิจิทัลอัตโนมัติ 24 ชม.',
  metaDescription: 'ศูนย์รวมโปรแกรม Discord AutoQuest, เครื่องมือจัดการโปรไฟล์ และบอท Discord ระดับพรีเมียม ส่งมอบ License Key ทันที ปลอดภัย 100%',
  metaImage: 'https://j3a-store.vercel.app/logo.png',
  themeColor: '#06b6d4',
  rankSettings: {
    enabled: true,
    ranks: [
      { id: 'bronze', name: 'Bronze', minSpent: 0, discountPercent: 0, badgeColor: '#cd7f32', description: 'สมาชิกทั่วไป' },
      { id: 'silver', name: 'Silver', minSpent: 200, discountPercent: 5, badgeColor: '#94a3b8', description: 'ส่วนลด 5% ทุกคำสั่งซื้อ (สะสมครบ ฿200)' },
      { id: 'gold', name: 'Gold', minSpent: 500, discountPercent: 10, badgeColor: '#eab308', description: 'ส่วนลด 10% ทุกคำสั่งซื้อ (สะสมครบ ฿500)' },
      { id: 'platinum', name: 'Platinum', minSpent: 1000, discountPercent: 15, badgeColor: '#06b6d4', description: 'ส่วนลด 15% ทุกคำสั่งซื้อ (สะสมครบ ฿1,000)' },
      { id: 'vip', name: 'VIP', minSpent: 5000, discountPercent: 25, badgeColor: '#a855f7', description: 'ส่วนลดพิเศษ 25% ทุกคำสั่งซื้อ (สะสมครบ ฿5,000)' },
    ],
  },
};

/**
 * Fetch current store settings from Supabase
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', STORE_DOC_ID)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_STORE_SETTINGS;
    }

    return {
      storeName: data.store_name || DEFAULT_STORE_SETTINGS.storeName,
      promptpay: data.promptpay || DEFAULT_STORE_SETTINGS.promptpay,
      truemoneyPhone: data.truemoney_phone || data.promptpay || DEFAULT_STORE_SETTINGS.truemoneyPhone,
      lineContact: data.line_contact || DEFAULT_STORE_SETTINGS.lineContact,
      discordContact: data.discord_contact || DEFAULT_STORE_SETTINGS.discordContact,
      announcement: data.announcement || DEFAULT_STORE_SETTINGS.announcement,
      shippingFee: typeof data.shipping_fee === 'number' ? Number(data.shipping_fee) : DEFAULT_STORE_SETTINGS.shippingFee,
      freeShippingThreshold: typeof data.free_shipping_threshold === 'number' ? Number(data.free_shipping_threshold) : DEFAULT_STORE_SETTINGS.freeShippingThreshold,
      showcaseYoutubeUrl: data.showcase_youtube_url ?? DEFAULT_STORE_SETTINGS.showcaseYoutubeUrl,
      showcaseTitle: data.showcase_title ?? DEFAULT_STORE_SETTINGS.showcaseTitle,
      showcaseSubtitle: data.showcase_subtitle ?? DEFAULT_STORE_SETTINGS.showcaseSubtitle,
      heroTagline: data.hero_tagline ?? DEFAULT_STORE_SETTINGS.heroTagline,
      heroDescription: data.hero_description ?? DEFAULT_STORE_SETTINGS.heroDescription,
      privacyPolicy: data.privacy_policy ?? DEFAULT_STORE_SETTINGS.privacyPolicy,
      footerDescription: data.footer_description ?? DEFAULT_STORE_SETTINGS.footerDescription,
      discordWebhookSlip: data.discord_webhook_slip ?? DEFAULT_STORE_SETTINGS.discordWebhookSlip,
      discordWebhookCredits: data.discord_webhook_credits ?? DEFAULT_STORE_SETTINGS.discordWebhookCredits,
      discordWebhookOrder: data.discord_webhook_order ?? DEFAULT_STORE_SETTINGS.discordWebhookOrder,
      discordWebhookWelcome: data.discord_webhook_welcome ?? DEFAULT_STORE_SETTINGS.discordWebhookWelcome,
      discordRoleOwner: data.discord_role_owner ?? DEFAULT_STORE_SETTINGS.discordRoleOwner,
      discordRoleAdmin: data.discord_role_admin ?? DEFAULT_STORE_SETTINGS.discordRoleAdmin,
      metaTitle: data.meta_title ?? DEFAULT_STORE_SETTINGS.metaTitle,
      metaDescription: data.meta_description ?? DEFAULT_STORE_SETTINGS.metaDescription,
      metaImage: data.meta_image ?? DEFAULT_STORE_SETTINGS.metaImage,
      themeColor: data.theme_color ?? DEFAULT_STORE_SETTINGS.themeColor,
      rankSettings: data.rank_settings ?? DEFAULT_STORE_SETTINGS.rankSettings,
      updatedAt: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Update store settings in Supabase (Admin only)
 */
export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to update settings via admin API');
      }
      return;
    }
  } catch (apiErr: any) {
    console.warn('API settings fallback to direct supabase client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (settings.storeName !== undefined) updates.store_name = settings.storeName;
  if (settings.promptpay !== undefined) updates.promptpay = settings.promptpay;
  if (settings.truemoneyPhone !== undefined) updates.truemoney_phone = settings.truemoneyPhone;
  if (settings.lineContact !== undefined) updates.line_contact = settings.lineContact;
  if (settings.discordContact !== undefined) updates.discord_contact = settings.discordContact;
  if (settings.announcement !== undefined) updates.announcement = settings.announcement;
  if (settings.shippingFee !== undefined) updates.shipping_fee = Number(settings.shippingFee);
  if (settings.freeShippingThreshold !== undefined) updates.free_shipping_threshold = Number(settings.freeShippingThreshold);
  if (settings.showcaseYoutubeUrl !== undefined) updates.showcase_youtube_url = settings.showcaseYoutubeUrl;
  if (settings.showcaseTitle !== undefined) updates.showcase_title = settings.showcaseTitle;
  if (settings.showcaseSubtitle !== undefined) updates.showcase_subtitle = settings.showcaseSubtitle;
  if (settings.heroTagline !== undefined) updates.hero_tagline = settings.heroTagline;
  if (settings.heroDescription !== undefined) updates.hero_description = settings.heroDescription;
  if (settings.privacyPolicy !== undefined) updates.privacy_policy = settings.privacyPolicy;
  if (settings.footerDescription !== undefined) updates.footer_description = settings.footerDescription;
  if (settings.discordWebhookSlip !== undefined) updates.discord_webhook_slip = settings.discordWebhookSlip;
  if (settings.discordWebhookCredits !== undefined) updates.discord_webhook_credits = settings.discordWebhookCredits;
  if (settings.discordWebhookOrder !== undefined) updates.discord_webhook_order = settings.discordWebhookOrder;
  if (settings.discordWebhookWelcome !== undefined) updates.discord_webhook_welcome = settings.discordWebhookWelcome;
  if (settings.discordRoleOwner !== undefined) updates.discord_role_owner = settings.discordRoleOwner;
  if (settings.discordRoleAdmin !== undefined) updates.discord_role_admin = settings.discordRoleAdmin;
  if (settings.metaTitle !== undefined) updates.meta_title = settings.metaTitle;
  if (settings.metaDescription !== undefined) updates.meta_description = settings.metaDescription;
  if (settings.metaImage !== undefined) updates.meta_image = settings.metaImage;
  if (settings.themeColor !== undefined) updates.theme_color = settings.themeColor;
  if (settings.rankSettings !== undefined) updates.rank_settings = settings.rankSettings;

  const { error } = await supabase
    .from('settings')
    .upsert([{ id: STORE_DOC_ID, ...updates }]);

  if (error) throw new Error(error.message);
}
