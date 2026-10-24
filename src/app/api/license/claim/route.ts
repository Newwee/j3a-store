import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Protected server-side endpoint - Not exposed to client bundle
const GOOGLE_APPS_SCRIPT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbwq22hsYcYWJYuOaUkDy1Ysmut80NwQ5kdmQ-0ItJ8JhGjV2w2PRxEua9mi_3yGagh1/exec';

export interface ClaimKeyItemInput {
  productId?: string;
  name?: string;
  slug?: string;
  quantity?: number;
  deliveryType?: 'link' | 'key' | 'both';
}

export interface ClaimedKeyItem {
  productId: string;
  productName: string;
  productSlug: string;
  productType: 'discord_manager' | 'discord_profile';
  key: string;
  unitIndex: number;
}

/**
 * Normalizes product name/slug to the corresponding Google Apps Script product identifier
 */
export function mapProductToLicenseType(nameOrSlug: string = ''): 'discord_manager' | 'discord_profile' {
  const s = nameOrSlug.toLowerCase();
  if (
    s.includes('manager') ||
    s.includes('bot manager') ||
    s.includes('discordmanager') ||
    s.includes('j3a-discord-manager')
  ) {
    return 'discord_manager';
  }
  return 'discord_profile';
}

/**
 * Claim a single key from Google Apps Script with timeout
 */
async function claimSingleKeyFromGAS(
  productType: string,
  email?: string
): Promise<{ success: boolean; key?: string; message?: string }> {
  const url = new URL(GOOGLE_APPS_SCRIPT_BASE_URL);
  url.searchParams.set('action', 'claim_key');
  if (productType) url.searchParams.set('product', productType);
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
          pName.toLowerCase().includes('discord');

        if (!isLicenseProduct) continue;

        const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity) || 1)));
        const productType = mapProductToLicenseType(`${pSlug} ${pName}`);

        for (let q = 1; q <= qty; q++) {
          const res = await claimSingleKeyFromGAS(productType, customerEmail);
          if (res.success && res.key) {
            claimedKeys.push({
              productId: pId,
              productName: pName || (productType === 'discord_manager' ? 'J3A Discord Manager' : 'J3A Discord Profile'),
              productSlug: pSlug || (productType === 'discord_manager' ? 'j3a-discord-manager' : 'j3a-discord-profile'),
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
      const qty = Math.max(1, Math.min(20, fallbackQuantity));

      for (let q = 1; q <= qty; q++) {
        const res = await claimSingleKeyFromGAS(productType, customerEmail);
        if (res.success && res.key) {
          claimedKeys.push({
            productId: fallbackProduct || productType,
            productName: productType === 'discord_manager' ? 'J3A Discord Manager' : 'J3A Discord Profile',
            productSlug: productType === 'discord_manager' ? 'j3a-discord-manager' : 'j3a-discord-profile',
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

export async function GET(req: NextRequest) {
  return POST(req);
}
