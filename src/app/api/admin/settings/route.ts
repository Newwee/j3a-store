import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

const STORE_DOC_ID = 'store';

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {
      id: STORE_DOC_ID,
      updated_at: new Date().toISOString(),
    };

    if (body.storeName !== undefined) updates.store_name = body.storeName;
    if (body.promptpay !== undefined) updates.promptpay = body.promptpay;
    if (body.truemoneyPhone !== undefined) updates.truemoney_phone = body.truemoneyPhone;
    if (body.lineContact !== undefined) updates.line_contact = body.lineContact;
    if (body.discordContact !== undefined) updates.discord_contact = body.discordContact;
    if (body.announcement !== undefined) updates.announcement = body.announcement;
    if (body.shippingFee !== undefined) updates.shipping_fee = Number(body.shippingFee);
    if (body.freeShippingThreshold !== undefined) updates.free_shipping_threshold = Number(body.freeShippingThreshold);
    if (body.showcaseYoutubeUrl !== undefined) updates.showcase_youtube_url = body.showcaseYoutubeUrl;
    if (body.showcaseTitle !== undefined) updates.showcase_title = body.showcaseTitle;
    if (body.showcaseSubtitle !== undefined) updates.showcase_subtitle = body.showcaseSubtitle;
    if (body.heroTagline !== undefined) updates.hero_tagline = body.heroTagline;
    if (body.heroDescription !== undefined) updates.hero_description = body.heroDescription;
    if (body.privacyPolicy !== undefined) updates.privacy_policy = body.privacyPolicy;
    if (body.footerDescription !== undefined) updates.footer_description = body.footerDescription;
    if (body.discordWebhookSlip !== undefined) updates.discord_webhook_slip = body.discordWebhookSlip;
    if (body.discordWebhookCredits !== undefined) updates.discord_webhook_credits = body.discordWebhookCredits;
    if (body.discordWebhookOrder !== undefined) updates.discord_webhook_order = body.discordWebhookOrder;
    if (body.discordWebhookWelcome !== undefined) updates.discord_webhook_welcome = body.discordWebhookWelcome;
    if (body.discordRoleOwner !== undefined) updates.discord_role_owner = body.discordRoleOwner;
    if (body.discordRoleAdmin !== undefined) updates.discord_role_admin = body.discordRoleAdmin;
    if (body.metaTitle !== undefined) updates.meta_title = body.metaTitle;
    if (body.metaDescription !== undefined) updates.meta_description = body.metaDescription;
    if (body.metaImage !== undefined) updates.meta_image = body.metaImage;
    if (body.themeColor !== undefined) updates.theme_color = body.themeColor;
    if (body.rankSettings !== undefined) updates.rank_settings = body.rankSettings;

    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert([updates])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update store settings via admin API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      settings: data,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/settings:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
