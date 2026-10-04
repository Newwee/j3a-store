import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { StoreSettings } from '@/types/settings';

const STORE_DOC_ID = 'store';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'J3A STORE',
  promptpay: '0812345678',
  lineContact: '@153nhgvs',
  discordContact: 'https://discord.gg/UtWykPvTYF',
  announcement: 'ยินดีต้อนรับสู่ J3A STORE ซอฟต์แวร์ Discord และบริการดิจิทัลอัตโนมัติ 24 ชม.',
  shippingFee: 0,
  freeShippingThreshold: 0,
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
      lineContact: data.line_contact || DEFAULT_STORE_SETTINGS.lineContact,
      discordContact: data.discord_contact || DEFAULT_STORE_SETTINGS.discordContact,
      announcement: data.announcement || DEFAULT_STORE_SETTINGS.announcement,
      shippingFee: typeof data.shipping_fee === 'number' ? Number(data.shipping_fee) : DEFAULT_STORE_SETTINGS.shippingFee,
      freeShippingThreshold: typeof data.free_shipping_threshold === 'number' ? Number(data.free_shipping_threshold) : DEFAULT_STORE_SETTINGS.freeShippingThreshold,
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
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (settings.storeName !== undefined) updates.store_name = settings.storeName;
  if (settings.promptpay !== undefined) updates.promptpay = settings.promptpay;
  if (settings.lineContact !== undefined) updates.line_contact = settings.lineContact;
  if (settings.discordContact !== undefined) updates.discord_contact = settings.discordContact;
  if (settings.announcement !== undefined) updates.announcement = settings.announcement;
  if (settings.shippingFee !== undefined) updates.shipping_fee = Number(settings.shippingFee);
  if (settings.freeShippingThreshold !== undefined) updates.free_shipping_threshold = Number(settings.freeShippingThreshold);

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert([{ id: STORE_DOC_ID, ...updates }]);

  if (error) throw new Error(error.message);
}
