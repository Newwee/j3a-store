import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import {
  notifyDiscordSlipSubmitted,
  notifyDiscordSlipApproved,
  notifyDiscordSlipRejected,
  notifyDiscordNewMember,
  notifyDiscordOrderPlaced,
  notifyDiscordTopupApproved,
  notifyDiscordAngpaoSuccess,
  notifyDiscordCodeRedeemed,
  sendDiscordWebhook,
  getDiscordWebhooks,
} from '@/lib/services/discord';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data parameter' }, { status: 400 });
    }

    // Protect sensitive admin events from unauthenticated triggers
    if (event === 'test_channel' || event === 'slip_approved' || event === 'slip_rejected') {
      const adminAuth = await verifyAdminRequest(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required for this notification event' }, { status: 403 });
      }
    }

    switch (event) {
      case 'slip_submitted': {
        const { topupNumber, userName, userEmail, amount, slipUrl } = data;
        if (!topupNumber || !amount) {
          return NextResponse.json({ error: 'Missing topupNumber or amount' }, { status: 400 });
        }
        const success = await notifyDiscordSlipSubmitted({
          topupNumber,
          userName,
          userEmail,
          amount: Number(amount),
          slipUrl,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'slip_approved': {
        const { topupNumber, userName, userEmail, amount, slipUrl, adminNote } = data;
        const success = await notifyDiscordSlipApproved({
          topupNumber,
          userName,
          userEmail,
          amount: Number(amount) || 0,
          slipUrl,
          adminNote,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'slip_rejected': {
        const { topupNumber, userName, userEmail, amount, slipUrl, adminNote } = data;
        const success = await notifyDiscordSlipRejected({
          topupNumber,
          userName,
          userEmail,
          amount: Number(amount) || 0,
          slipUrl,
          adminNote,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'member_registered': {
        const { userName, userEmail } = data;
        if (!userName) {
          return NextResponse.json({ error: 'Missing userName' }, { status: 400 });
        }
        const success = await notifyDiscordNewMember({
          userName,
          userEmail,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'order_placed': {
        const { orderNumber, userName, userEmail, totalAmount, subtotal, discount, discountCode, paymentMethod } = data;
        let itemsSummary = typeof data.itemsSummary === 'string' ? data.itemsSummary.trim() : '';

        // If itemsSummary is empty or has 'undefined', synthesize from data.items array
        if ((!itemsSummary || itemsSummary.includes('undefined')) && Array.isArray(data.items) && data.items.length > 0) {
          itemsSummary = data.items
            .map((i: any) => {
              const name = i.name || i.productName || i.title || i.slug || 'สินค้า';
              const qty = i.quantity || i.qty || 1;
              return `• **${name}** x${qty}`;
            })
            .join('\n');
        }

        if (!itemsSummary || itemsSummary === 'undefined') {
          itemsSummary = '• สินค้าดิจิทัล x1';
        }

        if (!orderNumber || totalAmount === undefined) {
          return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
        }
        const success = await notifyDiscordOrderPlaced({
          orderNumber,
          userName,
          userEmail,
          itemsSummary,
          totalAmount: Number(totalAmount),
          subtotal: subtotal ? Number(subtotal) : undefined,
          discount: discount ? Number(discount) : undefined,
          discountCode,
          paymentMethod,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'code_redeemed': {
        const { code, codeType, rewardAmount, userName, userEmail, userId, newCredits, usedCount, maxUses } = data;
        if (!code || !userId) {
          return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
        }
        const success = await notifyDiscordCodeRedeemed({
          code,
          codeType: codeType || 'credit',
          rewardAmount: Number(rewardAmount) || 0,
          userName: userName || 'ลูกค้า',
          userEmail,
          userId,
          newCredits: newCredits !== undefined ? Number(newCredits) : undefined,
          usedCount: Number(usedCount) || 1,
          maxUses: maxUses ? Number(maxUses) : undefined,
        });
        return NextResponse.json({ ok: true, sent: success });
      }

      case 'test_channel': {
        const { channelType } = data; // 'slip' | 'credits' | 'order' | 'welcome'
        const webhooks = await getDiscordWebhooks();
        const targetUrl =
          channelType === 'slip'
            ? webhooks.slip
            : channelType === 'credits'
            ? webhooks.credits
            : channelType === 'order'
            ? webhooks.order
            : webhooks.welcome;

        const success = await sendDiscordWebhook(targetUrl, {
          username: 'J3A STORE - ทดสอบการเชื่อมต่อ',
          embeds: [
            {
              title: `🔔 ทดสอบการแจ้งเตือน Discord Webhook (${channelType?.toUpperCase()})`,
              description: `ระบบแจ้งเตือนของห้องนี้เชื่อมต่อกับเว็บไซต์ **J3A STORE** สำเร็จและพร้อมทำงาน 100%!`,
              color: 0x06b6d4, // Cyan
              fields: [
                { name: 'สถานะ', value: '🟢 **เชื่อมต่อสำเร็จ (Online)**', inline: true },
                { name: 'เวลาทดสอบ', value: new Date().toLocaleString('th-TH'), inline: true },
              ],
              footer: { text: 'J3A STORE • Discord Notification System' },
              timestamp: new Date().toISOString(),
            },
          ],
        });

        return NextResponse.json({ ok: true, sent: success });
      }

      default:
        return NextResponse.json({ error: `Unknown event type: ${event}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Error in /api/notifications/discord:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
