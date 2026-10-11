export type PopupType = 'welcome' | 'promo' | 'news' | 'maintenance';

export type PopupAudience = 'all' | 'new_visitors' | 'members_only';

export type PopupFrequency = 'once' | 'daily' | 'always';

export type PopupPriority = 'normal' | 'high' | 'urgent';

export interface SitePopup {
  id: string;
  title: string;
  description: string;
  type: PopupType;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  discountCode?: string;
  startDate?: string;
  endDate?: string;
  frequency: PopupFrequency;
  audience: PopupAudience;
  priority: PopupPriority;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'news' | 'maintenance' | 'payment';
  isPinned: boolean;
  publishedAt: string;
  active: boolean;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  code?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
}
