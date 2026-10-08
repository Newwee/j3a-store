/**
 * Utility functions for TrueMoney Gift Voucher (ซองอั่งเปา) Redemption
 * Based on tw-angpao official endpoint & specification
 */

/**
 * Extracts the voucher hash code from a full TrueMoney gift URL, parameter, or raw code.
 * Example inputs:
 * - https://gift.truemoney.com/campaign/?v=37013acbde0846068e
 * - https://gift.truemoney.com/campaign/?v=37013acbde0846068e&utm_source=share
 * - 37013acbde0846068e
 */
export function extractVoucherHash(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Parameter pattern ?v=... or &v=...
  const paramMatch = trimmed.match(/[?&]v=([a-zA-Z0-9]+)/);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1];
  }

  // 2. Split by ?v=
  if (trimmed.includes('?v=')) {
    const parts = trimmed.split('?v=');
    if (parts[1]) {
      const code = parts[1].split('&')[0].trim();
      const match = code.match(/^[a-zA-Z0-9]+/);
      if (match) return match[0];
    }
  }

  // 3. Raw voucher hash (typically 18-36 alphanumeric chars)
  const rawMatch = trimmed.match(/^[a-zA-Z0-9]{10,}$/);
  if (rawMatch) {
    return rawMatch[0];
  }

  return null;
}

/**
 * Validates and standardizes a Thai mobile phone number (10 digits)
 */
export function cleanThaiPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[^0-9]/g, '');

  // Handle +66...
  if (cleaned.startsWith('66') && cleaned.length === 11) {
    return '0' + cleaned.substring(2);
  }

  return cleaned;
}

export function isValidThaiPhoneNumber(phone: string): boolean {
  const cleaned = cleanThaiPhoneNumber(phone);
  return /^0[689]\d{8}$/.test(cleaned);
}

export interface AngpaoRedeemResult {
  success: boolean;
  amount?: number;
  ownerName?: string;
  voucherId?: string;
  error?: string;
  code?: string;
}

export const ANGPAO_PROVIDERS = [
  'https://truemoney-voucher-nestjs.vercel.app',
  'https://truemoney-voucher-fastapi.vercel.app',
  'https://truemoney-voucher-go.vercel.app',
];

export function mapTrueMoneyError(code: string, rawMessage?: string): string {
  switch (code) {
    case 'VOUCHER_OUT_OF_STOCK':
      return 'ซองของขวัญนี้ถูกรับไปแล้ว หรือยอดเงินในซองหมดแล้ว';
    case 'CANNOT_GET_OWN_VOUCHER':
      return 'ไม่สามารถรับซองของขวัญที่สร้างจากบัญชีเดียวกันกับเบอร์ร้านค้าได้ กรุณาใช้บัญชี TrueMoney อื่นในการสร้างซอง';
    case 'TARGET_USER_NOT_FOUND':
      return 'ไม่พบบัญชี TrueMoney ของเบอร์ปลายทางที่ร้านค้าตั้งค่าไว้ กรุณาติดต่อแอดมิน';
    case 'TARGET_USER_REDEEMED':
      return 'เบอร์ร้านค้านี้ได้รับเงินจากซองของขวัญนี้ไปเรียบร้อยแล้ว';
    case 'VOUCHER_EXPIRED':
      return 'ซองของขวัญนี้หมดอายุแล้ว (ซอง TrueMoney มีอายุใช้งาน 72 ชั่วโมง)';
    case 'VOUCHER_NOT_FOUND':
    case 'INVALID_VOUCHER':
    case 'INVALID_VOUCHER_CODE':
      return 'ลิงก์ซองของขวัญไม่ถูกต้อง หรือไม่พบข้อมูลซองในระบบ TrueMoney';
    case 'INTERNAL_ERROR':
      return 'ระบบ TrueMoney ขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
    default:
      return rawMessage || 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบลิงก์อีกครั้ง';
  }
}

/**
 * Pre-warms the serverless providers in the background to ensure instantaneous response
 */
export async function warmAngpaoProviders(): Promise<void> {
  try {
    await Promise.allSettled(
      ANGPAO_PROVIDERS.map((p) =>
        fetch(`${p}/status`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        })
      )
    );
  } catch {
    // Ignore warmup network errors
  }
}

import { createClient, TruemoneyApiError, TruemoneyTimeoutError } from '@byteindev/truemoney-voucher';

export async function redeemTrueMoneyVoucher(
  voucherHash: string,
  receiverMobile: string
): Promise<AngpaoRedeemResult> {
  const cleanedPhone = cleanThaiPhoneNumber(receiverMobile);
  if (!isValidThaiPhoneNumber(cleanedPhone)) {
    return {
      success: false,
      code: 'INVALID_RECEIVER_PHONE',
      error: 'เบอร์โทรศัพท์ TrueMoney สำหรับรับเงินของร้านค้าไม่ถูกต้อง กรุณาติดต่อแอดมิน',
    };
  }

  const cleanHash = extractVoucherHash(voucherHash);
  if (!cleanHash) {
    return {
      success: false,
      code: 'INVALID_VOUCHER_CODE',
      error: 'ลิงก์ซองของขวัญ TrueMoney ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง',
    };
  }

  let lastErrorCode = 'UNKNOWN_ERROR';
  let lastErrorMessage = 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบลิงก์อีกครั้ง';

  // 1. Direct Multi-Provider Attempt with ample timeout (immune to cold-start probe drops)
  for (const provider of ANGPAO_PROVIDERS) {
    try {
      const url = `${provider}/truemoney/${encodeURIComponent(cleanHash)}/${encodeURIComponent(cleanedPhone)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(10000), // 10s generous timeout handles cold starts reliably
      });

      if (!response.ok && response.status !== 400) {
        continue;
      }

      const resJson = await response.json();
      if (!resJson || typeof resJson !== 'object') continue;

      if (resJson.status?.code === 'SUCCESS') {
        const dataObj = resJson.data as any;
        const voucherData = dataObj?.voucher;
        const redeemedAmount = Number(
          voucherData?.redeemed_amount_baht ||
            voucherData?.amount_baht ||
            dataObj?.redeemed_amount_baht ||
            0
        );

        if (!isNaN(redeemedAmount) && redeemedAmount > 0) {
          return {
            success: true,
            amount: redeemedAmount,
            ownerName: dataObj?.owner_profile?.full_name || 'ลูกค้า',
            voucherId: voucherData?.voucher_id || cleanHash,
          };
        }
      }

      if (resJson.status?.code) {
        const statusCode = resJson.status.code;
        lastErrorCode = statusCode;
        lastErrorMessage = mapTrueMoneyError(statusCode, resJson.status.message);

        // If it's a definitive business response from TrueMoney, return immediately
        if (
          statusCode === 'VOUCHER_OUT_OF_STOCK' ||
          statusCode === 'CANNOT_GET_OWN_VOUCHER' ||
          statusCode === 'TARGET_USER_REDEEMED' ||
          statusCode === 'VOUCHER_EXPIRED'
        ) {
          return {
            success: false,
            code: statusCode,
            error: lastErrorMessage,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Angpao Redeem] Provider ${provider} attempt skipped:`, err?.message);
    }
  }

  // 2. Secondary Fallback via official client
  try {
    const client = createClient({ timeoutMs: 15000 });
    const redeemResponse = await client.redeem(cleanHash, cleanedPhone);

    if (redeemResponse.status?.code === 'SUCCESS') {
      const dataObj = redeemResponse.data as any;
      const voucherData = dataObj?.voucher;
      const redeemedAmount = Number(
        voucherData?.redeemed_amount_baht ||
          voucherData?.amount_baht ||
          dataObj?.redeemed_amount_baht ||
          0
      );

      if (!isNaN(redeemedAmount) && redeemedAmount > 0) {
        return {
          success: true,
          amount: redeemedAmount,
          ownerName: dataObj?.owner_profile?.full_name || 'ลูกค้า',
          voucherId: voucherData?.voucher_id || cleanHash,
        };
      }
    }

    if (redeemResponse.status?.code) {
      const code = redeemResponse.status.code;
      return {
        success: false,
        code,
        error: mapTrueMoneyError(code, redeemResponse.status.message),
      };
    }
  } catch (err: any) {
    console.warn('[Angpao Redeem] Client fallback error:', err?.message);

    if (err instanceof TruemoneyTimeoutError) {
      lastErrorCode = 'TIMEOUT';
      lastErrorMessage = 'การเชื่อมต่อไปยังระบบ TrueMoney หมดเวลา กรุณาลองใหม่อีกครั้ง';
    } else if (err instanceof TruemoneyApiError) {
      lastErrorCode = String(err.code || 'API_ERROR');
      lastErrorMessage = err.envelope?.message || err.message || 'ข้อมูลซองของขวัญไม่ถูกต้อง';
    }
  }

  return {
    success: false,
    code: lastErrorCode,
    error: lastErrorMessage,
  };
}
