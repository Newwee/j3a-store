import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';

// Protected server-side endpoint - Not exposed to client bundle
const GOOGLE_APPS_SCRIPT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbwq22hsYcYWJYuOaUkDy1Ysmut80NwQ5kdmQ-0ItJ8JhGjV2w2PRxEua9mi_3yGagh1/exec';

export interface ClaimKeyItemInput {
  productId?: string;
  name?: string;
  slug?: string;
  quantity?: number;
  deliveryType?: 'link' | 'key' | 'both';
  tier?: string;
}

export interface ClaimedKeyItem {
  productId: string;
  productName: string;
  productSlug: string;
  productType: 'discord_manager' | 'discord_profile' | 'discord_autoquest' | 'desk_cord' | string;
  key: string;
  unitIndex: number;
}

/**
 * Normalizes product name/slug to the corresponding Google Apps Script product identifier
 */
export function mapProductToLicenseType(
  nameOrSlug: string = ''
): 'discord_manager' | 'discord_profile' | 'discord_autoquest' | 'desk_cord' | string {
  const s = nameOrSlug.toLowerCase();
  if (s.includes('deskcord') || s.includes('desk_cord') || s.includes('desk cord')) {
    return 'desk_cord';
  }
  if (
    s.includes('quest') ||
    s.includes('autoquest') ||
    s.includes('auto-quest') ||
    s.includes('discord_autoquest')
  ) {
    return 'discord_autoquest';
  }
  if (
    s.includes('manager') ||
    s.includes('bot manager') ||
    s.includes('discordmanager') ||
    s.includes('j3a-discord-manager')
  ) {
    return 'discord_manager';
  }
  if (
    s.includes('profile') ||
    s.includes('discord profile') ||
    s.includes('j3a-discord-profile')
  ) {
    return 'discord_profile';
  }
  return s.replace(/[^a-z0-9_]/g, '_');
}

export function detectTier(str: string = ''): 'lifetime' | '3d' | '1w' | '4w' | '6m' {
  const s = str.toLowerCase();
  // Lifetime / Permanent Check
  if (
    s.includes('lifetime') ||
    s.includes('ถาวร') ||
    s.includes('ตลอดชีพ') ||
    s.includes('permanent') ||
    s.includes('deskcord') ||
    s.includes('desk_cord')
  ) {
    return 'lifetime';
  }
  // 3 Days Check (including Thai variants)
  if (
    s.includes('3d') ||
    s.includes('3-day') ||
    s.includes('3 day') ||
    s.includes('3day') ||
    s.includes('3วัน') ||
    s.includes('3 วัน') ||
    s.includes('trial') ||
    s.includes('ทดลอง')
  ) {
    return '3d';
  }

  // 6 Months Check (including Thai variants)
  if (
    s.includes('6m') ||
    s.includes('6-month') ||
    s.includes('6 month') ||
    s.includes('6เดือน') ||
    s.includes('6 เดือน') ||
    s.includes('ครึ่งปี')
  ) {
    return '6m';
  }

  // 4 Weeks / 1 Month Check (including Thai variants)
  if (
    s.includes('4w') ||
    s.includes('4-week') ||
    s.includes('4 week') ||
    s.includes('4สัปดาห์') ||
    s.includes('4 สัปดาห์') ||
    s.includes('1m') ||
    s.includes('1 month') ||
    s.includes('1เดือน') ||
    s.includes('1 เดือน') ||
    s.includes('28 วัน') ||
    s.includes('28วัน') ||
    s.includes('30 วัน') ||
    s.includes('30วัน') ||
    s.includes('เดือน')
  ) {
    return '4w';
  }

  // 1 Week Check
  if (
    s.includes('1w') ||
    s.includes('1-week') ||
    s.includes('1 week') ||
    s.includes('7d') ||
    s.includes('7-day') ||
    s.includes('7 day') ||
    s.includes('7วัน') ||
    s.includes('7 วัน') ||
    s.includes('1สัปดาห์') ||
    s.includes('1 สัปดาห์') ||
    s.includes('1อาทิตย์') ||
    s.includes('1 อาทิตย์')
  ) {
    return '1w';
  }

  return '1w';
}

/**
 * Claim a single key from Google Apps Script with timeout
 */
async function claimSingleKeyFromGAS(
  productType: string,
  tier: string = '1w',
  email?: string
): Promise<{ success: boolean; key?: string; message?: string }> {
  const url = new URL(GOOGLE_APPS_SCRIPT_BASE_URL);
  url.searchParams.set('action', 'claim_key');
  if (productType) url.searchParams.set('product', productType);
  if (tier) url.searchParams.set('tier', tier);
  if (email) url.searchParams.set('email', email);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return { success: false, message: `Google Apps Script returned status ${res.status}` };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unified key claimer: checks local Supabase licenses first for ANY software product
 * (desk_cord, discord_autoquest, discord_manager, discord_profile, or custom),
 * falls back to GAS if not available.
 * Strict Tier Enforcement: NEVER falls back to a different tier!
 */
async function claimKey(
  productType: string,
  tier: string = '1w',
  customerEmail?: string,
  orderId?: string
): Promise<{ success: boolean; key?: string; message?: string }> {
  try {
    // 1. Build list of potential product slug aliases in Supabase
    const slugCandidates = [
      productType,
      productType.replace(/_/g, '-'),
      productType.replace(/-/g, '_'),
      productType.replace(/[^a-z0-9]/g, ''),
      `j3a-${productType.replace(/_/g, '-')}`,
      `j3a${productType.replace(/_/g, '')}`,
    ];

    if (productType === 'desk_cord' || productType.includes('deskcord')) {
      slugCandidates.push('desk_cord', 'j3a-deskcord', 'j3adeskcord');
    } else if (productType === 'discord_autoquest' || productType.includes('quest')) {
      slugCandidates.push('j3adiscordautoquest', 'j3akeydiscordquestauto', 'key-j3a-discord-quest-auto', 'discord_autoquest');
    } else if (productType === 'discord_manager' || productType.includes('manager')) {
      slugCandidates.push('discord_manager', 'j3a-discord-manager', 'j3adiscordmanager');
    } else if (productType === 'discord_profile' || productType.includes('profile')) {
      slugCandidates.push('discord_profile', 'j3a-discord-profile', 'j3adiscordprofile');
    }

    const uniqueSlugs = Array.from(new Set(slugCandidates));

    // Try finding matching available key in Supabase
    let query = supabaseAdmin
      .from('licenses')
      .select('*')
      .in('product_slug', uniqueSlugs)
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1);

    if (tier && tier !== 'any') {
      query = query.eq('tier', tier);
    }

    let { data: licenseToClaim } = await query.maybeSingle();

    // If exact tier not found, check if product has lifetime keys (like DeskCord)
    if (!licenseToClaim && (productType === 'desk_cord' || tier === 'lifetime')) {
      const { data: anyLifetime } = await supabaseAdmin
        .from('licenses')
        .select('*')
        .in('product_slug', uniqueSlugs)
        .eq('status', 'available')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (anyLifetime && (productType === 'desk_cord' || anyLifetime.tier === 'lifetime')) {
        licenseToClaim = anyLifetime;
      }
    }

    if (licenseToClaim) {
      const updatePayload: Record<string, any> = {
        status: 'claimed',
        updated_at: new Date().toISOString(),
      };
      if (orderId) updatePayload.order_id = orderId;
      if (customerEmail) updatePayload.notes = `Claimed for ${customerEmail}`;

      await supabaseAdmin
        .from('licenses')
        .update(updatePayload)
        .eq('id', licenseToClaim.id);

      if (orderId) {
        await supabaseAdmin
          .from('orders')
          .update({
            transaction_ref: licenseToClaim.key,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }

      return { success: true, key: licenseToClaim.key };
    }
  } catch (dbErr) {
    console.warn('Database error claiming key from Supabase:', dbErr);
  }

  // Fallback to Google Apps Script for other products (passing tier)
  return claimSingleKeyFromGAS(productType, tier, customerEmail);
}

/**
 * Server-side API handler to claim software license keys (1:1 per product and quantity)
 */
export async function POST(req: NextRequest) {
  try {
    let orderId: string | undefined;
    let customerEmail: string | undefined;
    let itemsInput: ClaimKeyItemInput[] | undefined;
    let fallbackProduct: string | undefined;
    let fallbackQuantity: number = 1;

    try {
      const body = await req.json();
      orderId = body.orderId;
      customerEmail = body.customerEmail;
      itemsInput = body.items;
      fallbackProduct = body.product || body.productSlug || body.productName;
      if (typeof body.quantity === 'number' && body.quantity > 0) {
        fallbackQuantity = Math.floor(body.quantity);
      }
    } catch {
      // Body is optional
    }

    // Security Gate: Ensure either a verified paid order exists or caller is admin
    if (orderId) {
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('id, status, items, transaction_ref, customer_email, user_id')
        .eq('id', orderId)
        .maybeSingle();

      if (!ord) {
        return NextResponse.json({ ok: false, error: 'ไม่พบคำสั่งซื้อนี้ในระบบ' }, { status: 404 });
      }

      if (ord.status !== 'completed' && ord.status !== 'paid') {
        return NextResponse.json(
          { ok: false, error: 'คำสั่งซื้อนี้ยังไม่ได้รับการชำระเงินหรือยังไม่สำเร็จ จึงไม่สามารถรับ License Key ได้' },
          { status: 403 }
        );
      }

      // Idempotency: Return existing key if order already has key delivered
      if (ord.transaction_ref && typeof ord.transaction_ref === 'string' && ord.transaction_ref.trim()) {
        const existingKey = ord.transaction_ref.trim();
        return NextResponse.json({
          ok: true,
          success: true,
          keys: [
            {
              productId: 'existing-key',
              productName: 'J3A Software License',
              productSlug: 'license-key',
              productType: 'discord_autoquest',
              key: existingKey,
              unitIndex: 1,
            },
          ],
          key: existingKey,
          totalClaimed: 1,
          message: 'ส่งมอบ License Key ที่ออกให้แล้วสำหรับคำสั่งซื้อนี้เรียบร้อย',
        });
      }
    } else {
      // If no orderId is provided, ONLY admins can trigger key allocation
      const adminAuth = await verifyAdminRequest(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json(
          { ok: false, error: 'ไม่อนุญาตให้ดึงคีย์โดยไม่มีหมายเลขคำสั่งซื้อที่ชำระเงินแล้ว (Requires Admin Authorization)' },
          { status: 403 }
        );
      }
    }

    const claimedKeys: ClaimedKeyItem[] = [];
    const errors: string[] = [];

    // Mode A: Claim keys for multiple items or multiple quantities
    if (itemsInput && Array.isArray(itemsInput) && itemsInput.length > 0) {
      for (const item of itemsInput) {
        const pSlug = item.slug || '';
        const pName = item.name || '';
        const pId = item.productId || pSlug || 'software';
        const dType = item.deliveryType;

        const isLicenseProduct =
          dType === 'key' ||
          dType === 'both' ||
          pSlug.includes('manager') ||
          pSlug.includes('profile') ||
          pSlug.includes('quest') ||
          pSlug.includes('autoquest') ||
          pSlug.includes('deskcord') ||
          pSlug.includes('desk_cord') ||
          pName.toLowerCase().includes('deskcord') ||
          pName.toLowerCase().includes('discord');

        if (!isLicenseProduct) continue;

        const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
        const productType = mapProductToLicenseType(`${pSlug} ${pName}`);
        const tier = item.tier ? detectTier(item.tier) : detectTier(`${pSlug} ${pName}`);

        for (let q = 1; q <= qty; q++) {
          const res = await claimKey(productType, tier, customerEmail, orderId);
          if (res.success && res.key) {
            const resolvedName =
              pName ||
              (productType === 'desk_cord'
                ? 'J3A DeskCord'
                : productType === 'discord_manager'
                ? 'J3A Discord Manager'
                : productType === 'discord_autoquest'
                ? 'J3A Discord AutoQuest'
                : 'J3A Discord Profile');

            const resolvedSlug =
              pSlug ||
              (productType === 'desk_cord'
                ? 'j3a-deskcord'
                : productType === 'discord_manager'
                ? 'j3a-discord-manager'
                : productType === 'discord_autoquest'
                ? 'j3a-discord-autoquest'
                : 'j3a-discord-profile');

            claimedKeys.push({
              productId: pId,
              productName: resolvedName,
              productSlug: resolvedSlug,
              productType,
              key: res.key,
              unitIndex: q,
            });
          } else {
            errors.push(res.message || `คีย์สำหรับ ${pName || productType} หมดชั่วคราว`);
          }
        }
      }
    } else {
      // Mode B: Single product or fallback legacy mode
      const productType = mapProductToLicenseType(fallbackProduct || '');
      const tier = detectTier(fallbackProduct || '');
      const qty = Math.max(1, Math.min(20, fallbackQuantity));

      const defaultName =
        productType === 'desk_cord'
          ? 'J3A DeskCord'
          : productType === 'discord_manager'
          ? 'J3A Discord Manager'
          : productType === 'discord_autoquest'
          ? 'J3A Discord AutoQuest'
          : 'J3A Discord Profile';

      const defaultSlug =
        productType === 'desk_cord'
          ? 'j3a-deskcord'
          : productType === 'discord_manager'
          ? 'j3a-discord-manager'
          : productType === 'discord_autoquest'
          ? 'j3a-discord-autoquest'
          : 'j3a-discord-profile';

      for (let q = 1; q <= qty; q++) {
        const res = await claimKey(productType, tier, customerEmail, orderId);
        if (res.success && res.key) {
          claimedKeys.push({
            productId: fallbackProduct || productType,
            productName: defaultName,
            productSlug: defaultSlug,
            productType,
            key: res.key,
            unitIndex: q,
          });
        } else {
          errors.push(res.message || 'คีย์หมดชั่วคราว');
        }
      }
    }

    if (claimedKeys.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message: errors[0] || 'สินค้าหมดชั่วคราว (ไม่มีคีย์ว่างในระบบ) กรุณาติดต่อแอดมินเพื่อขอรับ Key',
          errors,
        },
        { status: 400 }
      );
    }

    // Attach claimed keys to Order in Supabase if orderId is provided
    if (orderId) {
      try {
        const { data: currentOrder } = await supabaseAdmin
          .from('orders')
          .select('id, items, transaction_ref')
          .eq('id', orderId)
          .maybeSingle();

        if (currentOrder) {
          const existingItems = Array.isArray(currentOrder.items) ? currentOrder.items : [];
          const updatedItems = existingItems.map((it: any) => {
            const itId = it.productId || it.slug || '';
            const matchingKeys = claimedKeys
              .filter((k) => k.productId === itId || k.productSlug === it.slug || (it.name && it.name.includes(k.productName)))
              .map((k) => k.key);

            if (matchingKeys.length > 0) {
              return {
                ...it,
                licenseKeys: matchingKeys,
                licenseKey: matchingKeys[0],
              };
            }
            return it;
          });

          const allKeyStrings = claimedKeys.map((k) => k.key).join(', ');

          await supabaseAdmin
            .from('orders')
            .update({
              items: updatedItems,
              transaction_ref: allKeyStrings,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          // Update order_id in licenses table for any claimed keys
          const keyValues = claimedKeys.map((k) => k.key);
          await supabaseAdmin
            .from('licenses')
            .update({ order_id: orderId, updated_at: new Date().toISOString() })
            .in('key', keyValues);
        }
      } catch (dbErr) {
        console.warn('Could not attach license keys to order record:', dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      success: true,
      keys: claimedKeys,
      key: claimedKeys[0]?.key,
      totalClaimed: claimedKeys.length,
      message: `ดึง License Key สำเร็จ (${claimedKeys.length} คีย์)`,
    });
  } catch (err: any) {
    console.error('Error claiming license keys:', err);
    return NextResponse.json(
      {
        ok: false,
        message: `เกิดข้อผิดพลาดในการดึงคีย์: ${err.message || 'กรุณาติดต่อแอดมิน'}`,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST with orderId.' }, { status: 405 });
}
