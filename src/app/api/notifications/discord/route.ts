import { NextResponse } from 'next/server';
import {
  notifyDiscordSlipSubmitted,
  notifyDiscordNewMember,
  notifyDiscordOrderPlaced,
  notifyDiscordTopupApproved,
  notifyDiscordAngpaoSuccess,
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
        const { orderNumber, userName, itemsSummary, totalAmount } = data;
        if (!orderNumber || totalAmount === undefined) {
          return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
        }
        const success = await notifyDiscordOrderPlaced({
          orderNumber,
          userName,
          itemsSummary,
          totalAmount: Number(totalAmount),
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
