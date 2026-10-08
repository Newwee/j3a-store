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

/**
 * Calls TrueMoney's official voucher redemption API
 * Endpoint: POST https://gift.truemoney.com/campaign/v4/coupons/{voucher_hash}/redeem
 */
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

  try {
    const url = `https://gift.truemoney.com/campaign/v4/coupons/${cleanHash}/redeem`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        mobile: cleanedPhone,
        voucher_hash: cleanHash,
      }),
    });

    const resJson = await response.json();

    if (resJson.status?.code === 'SUCCESS') {
      const voucherData = resJson.data?.voucher;
      const redeemedAmount = Number(
        voucherData?.redeemed_amount_baht || voucherData?.amount_baht || 0
      );

      if (isNaN(redeemedAmount) || redeemedAmount <= 0) {
        return {
          success: false,
          code: 'ZERO_AMOUNT',
          error: 'ยอดเงินในซองของขวัญไม่ถูกต้องหรือเท่ากับ 0 บาท',
        };
      }

      return {
        success: true,
        amount: redeemedAmount,
        ownerName: resJson.data?.owner_profile?.full_name || 'ลูกค้า',
        voucherId: voucherData?.voucher_id || cleanHash,
      };
    }

    // Map TrueMoney error codes to clear Thai descriptions
    const errCode = resJson.status?.code || 'UNKNOWN_ERROR';
    const rawMessage = resJson.status?.message || '';

    let friendlyMessage = 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบความถูกต้อง';

    switch (errCode) {
      case 'VOUCHER_OUT_OF_STOCK':
        friendlyMessage = 'ซองของขวัญนี้ถูกรับไปแล้ว หรือยอดเงินในซองหมดแล้ว';
        break;
      case 'CANNOT_GET_OWN_VOUCHER':
        friendlyMessage =
          'ไม่สามารถรับซองของขวัญที่สร้างจากบัญชีเดียวกันกับเบอร์ร้านค้าได้ กรุณาใช้บัญชี TrueMoney อื่นในการสร้างซอง';
        break;
      case 'TARGET_USER_NOT_FOUND':
        friendlyMessage =
          'ไม่พบบัญชี TrueMoney ของเบอร์ปลายทางที่ร้านค้าตั้งค่าไว้ กรุณาติดต่อแอดมิน';
        break;
      case 'VOUCHER_EXPIRED':
        friendlyMessage = 'ซองของขวัญนี้หมดอายุแล้ว (ซอง TrueMoney มีอายุใช้งาน 72 ชั่วโมง)';
        break;
      case 'INVALID_VOUCHER':
      case 'INVALID_VOUCHER_CODE':
        friendlyMessage = 'ลิงก์ซองของขวัญไม่ถูกต้อง หรือไม่พบข้อมูลซองในระบบ TrueMoney';
        break;
      case 'INTERNAL_ERROR':
        friendlyMessage = 'ระบบ TrueMoney ขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
        break;
      default:
        friendlyMessage = rawMessage || 'ไม่สามารถรับซองของขวัญได้ กรุณาตรวจสอบลิงก์อีกครั้ง';
        break;
    }

    return {
      success: false,
      code: errCode,
      error: friendlyMessage,
    };
  } catch (err: any) {
    console.error('Network error during TrueMoney voucher redeem:', err);
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง TrueMoney กรุณาลองใหม่อีกครั้ง',
    };
  }
}
