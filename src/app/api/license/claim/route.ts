import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Protected server-side endpoint - Not exposed to client bundle
const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwq22hsYcYWJYuOaUkDy1Ysmut80NwQ5kdmQ-0ItJ8JhGjV2w2PRxEua9mi_3yGagh1/exec?action=claim_key';

interface ClaimKeyResponse {
  success: boolean;
  message?: string;
  key?: string;
}

/**
 * Server-side API handler to claim software license key from Google Sheets
 * Keeps Google Apps Script Web App URL hidden from client
 */
export async function POST(req: NextRequest) {
  try {
    let orderId: string | undefined;
    let customerEmail: string | undefined;

    try {
      const body = await req.json();
      orderId = body.orderId;
      customerEmail = body.customerEmail;
    } catch {
      // Body is optional
    }

    // Call Google Apps Script with follow redirect and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const gasResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!gasResponse.ok) {
      console.error(`Google Apps Script returned status ${gasResponse.status}`);
      return NextResponse.json(
        {
          ok: false,
          message: 'ระบบจัดส่งคีย์ปลายทางไม่ตอบสนอง กรุณาติดต่อแอดมินเพื่อขอรับ Key',
        },
        { status: 502 }
      );
    }

    const data: ClaimKeyResponse = await gasResponse.json();

    // Case 1: Successfully retrieved key
    if (data.success === true && data.key) {
      // If orderId is provided and db is ready, save the key to the order in Firestore
      if (orderId && db) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, {
            transactionRef: data.key,
            updatedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn('Could not attach license key to order document:', dbErr);
        }
      }

      return NextResponse.json({
        ok: true,
        key: data.key,
        message: data.message || 'ดึง License Key สำเร็จ',
      });
    }

    // Case 2: Out of stock or error from Google Apps Script
    return NextResponse.json(
      {
        ok: false,
        message:
          data.message ||
          'สินค้าหมดชั่วคราว กรุณาติดต่อแอดมินเพื่อขอรับ Key หรือตรวจสอบรายการสินค้า',
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error claiming license key:', err);
    const isTimeout = err.name === 'AbortError';

    return NextResponse.json(
      {
        ok: false,
        message: isTimeout
          ? 'การเชื่อมต่อระบบคีย์อัตโนมัติหมดเวลา (Timeout) กรุณาลองใหม่อีกครั้ง หรือติดต่อแอดมิน'
          : `เกิดข้อผิดพลาดในการดึงคีย์: ${err.message || 'กรุณาติดต่อแอดมิน'}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow GET as well for convenience
  return POST(req);
}
