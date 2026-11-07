export type LicenseDurationType = 'lifetime' | 'timed';

export type LicenseStatus = 'UNUSED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'available' | 'claimed' | 'revoked' | 'expired';

export interface LicenseItem {
  id: string;
  key: string;
  product_slug: string;
  tier: string;
  duration_days: number;
  duration_type?: LicenseDurationType;
  status: LicenseStatus;
  order_id?: string | null;
  user_id?: string | null;
  hwid?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  last_verified_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresetProduct {
  id: string;
  name: string;
  prefix: string;
  badge?: string;
  description: string;
}

export const PRESET_PRODUCTS: PresetProduct[] = [
  {
    id: 'desk_cord',
    name: 'J3A DeskCord',
    prefix: 'J3ADC',
    badge: 'Desktop App',
    description: 'โปรแกรม Discord Utility & Automation Desktop Client',
  },
  {
    id: 'discord_autoquest',
    name: 'Discord AutoQuest',
    prefix: 'J3ADQ',
    badge: 'Quest Bot',
    description: 'ระบบทำ Discord Quest อัตโนมัติ ปลอดภัย 100%',
  },
  {
    id: 'discord_manager',
    name: 'Discord Manager',
    prefix: 'J3ADM',
    badge: 'Bot Manager',
    description: 'เครื่องมือจัดการบัญชีและบอท Discord ครบวงจร',
  },
  {
    id: 'discord_profile',
    name: 'Discord Profile',
    prefix: 'J3ADP',
    badge: 'Rich Presence',
    description: 'โปรแกรมตกแต่งและจำลองโปรไฟล์ Rich Presence ระดับโปร',
  },
];

export interface DurationPreset {
  id: string;
  days: number;
  label: string;
  badge?: string;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { id: '1d', days: 1, label: '1 วัน (ทดสอบ)', badge: 'Test' },
  { id: '3d', days: 3, label: '3 วัน (Trial)', badge: 'Trial' },
  { id: '7d', days: 7, label: '7 วัน (1 สัปดาห์)', badge: '1 Week' },
  { id: '30d', days: 30, label: '30 วัน (1 เดือน)', badge: '1 Month' },
  { id: '90d', days: 90, label: '90 วัน (3 เดือน)', badge: '3 Months' },
  { id: '180d', days: 180, label: '180 วัน (6 เดือน)', badge: '6 Months' },
  { id: '365d', days: 365, label: '365 วัน (1 ปี)', badge: '1 Year' },
];

export interface GenerateLicenseInput {
  productId: string;
  customProductId?: string;
  customProductName?: string;
  keyPrefix: string;
  durationType: LicenseDurationType;
  durationDays: number;
  tier?: string;
  batchCount: number;
  note?: string;
  syncGoogleSheets?: boolean;
}

export interface LicenseStats {
  total: number;
  active: number;
  unused: number;
  expired: number;
  revoked: number;
  lifetime: number;
}
