import { supabaseAdmin } from '@/lib/supabase/admin';

// Default Fallback Webhook URLs
const DEFAULT_WEBHOOK_SLIP =
  'https://discord.com/api/webhooks/1563838807369977917/zubkvc8V0t7i_-CLIbwMhN9yXsx65-yDw_tslKgiM0l9nHbD9xS_Ki4IFAzt1uOB-2Jp';
const DEFAULT_WEBHOOK_CREDITS =
  'https://discord.com/api/webhooks/1563838697554710578/CPBlIplPAYSy9EV9FdIBxw_uoafvAiX-xR-y9DPUgHkRGdcSbaBzaTWxondvdVH46EuG';
const DEFAULT_WEBHOOK_WELCOME =
  'https://discord.com/api/webhooks/1563838727778730106/zmFHamxQ8WO5EGcO9uhSPOJES0ZLReSGmFa0DX0cqaMF9F7ECuKTGvPuqDJK4ZAMhZsx';

const STORE_AVATAR = 'https://cnrjaonjabzvfkvqdtkm.supabase.co/storage/v1/object/public/store-images/popups/welcome-banner.png';
const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://j3a-store.vercel.app';

/**
 * Retrieves configured webhook URLs from Supabase store settings or environment variables
 */
export async function getDiscordWebhooks(): Promise<{
  slip: string;
  credits: string;
  welcome: string;
}> {
  let slip = process.env.DISCORD_WEBHOOK_SLIP || DEFAULT_WEBHOOK_SLIP;
  let credits = process.env.DISCORD_WEBHOOK_CREDITS || DEFAULT_WEBHOOK_CREDITS;
  let welcome = process.env.DISCORD_WEBHOOK_WELCOME || DEFAULT_WEBHOOK_WELCOME;

  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('discord_webhook_slip, discord_webhook_credits, discord_webhook_welcome')
      .eq('id', 'store')
      .limit(1)
      .maybeSingle();

    if (data) {
      if (data.discord_webhook_slip?.trim()) slip = data.discord_webhook_slip.trim();
      if (data.discord_webhook_credits?.trim()) credits = data.discord_webhook_credits.trim();
      if (data.discord_webhook_welcome?.trim()) welcome = data.discord_webhook_welcome.trim();
    }
  } catch (e) {
    console.warn('Could not read discord webhooks from settings table, using defaults:', e);
  }

  return { slip, credits, welcome };
}

/**
 * Helper to dispatch Discord Webhook payload with timeout and error protection
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: {
    username?: string;
    avatar_url?: string;
    content?: string;
    embeds?: any[];
  }
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.warn('[Discord Webhook] Invalid or missing webhook URL');
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload.username || 'J3A STORE Log',
        avatar_url: payload.avatar_url || STORE_AVATAR,
        content: payload.content,
        embeds: payload.embeds || [],
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Discord Webhook] Request failed with status ${res.status}: ${errText}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Discord Webhook] Exception while sending message:', err?.message);
    return false;
  }
}

/**
 * 1. Notify Admin: New Slip Uploaded (Requires Manual Approval)
 * Sent to private Admin Channel (e.g. ୨-💳-୧-⁺-˖-สลิปรออนุมัติ)
 */
export async function notifyDiscordSlipSubmitted(data: {
  topupNumber: string;
  userName: string;
  userEmail?: string;
  amount: number;
  slipUrl?: string;
}): Promise<boolean> {
  const { slip } = await getDiscordWebhooks();

  const embed: any = {
    title: '💳 แจ้งเตือน: มีรายการโอนเงินใหม่ (รอตรวจสอบสลิป)',
    description: `ลูกค้าได้ส่งคำขอเติมเงินผ่านสลิปโอนเงิน กรุณาตรวจสอบหลักฐานและดำเนินการอนุมัติในระบบ`,
    color: 0xf59e0b, // Amber / Orange
    fields: [
      { name: 'รหัสรายการ', value: `\`${data.topupNumber}\``, inline: true },
      { name: 'ยอดเงินที่แจ้งโอน', value: `**฿${data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}**`, inline: true },
      { name: 'สถานะ', value: '⏳ **รอการอนุมัติ (Pending)**', inline: true },
      { name: 'ชื่อลูกค้า', value: data.userName || 'ลูกค้า', inline: true },
      { name: 'อีเมล', value: data.userEmail || '-', inline: true },
      {
        name: '🔗 ลิงก์สำหรับแอดมิน',
        value: `[คลิกที่นี่เพื่อไปหน้าจัดการสลิปและอนุมัติ](${STORE_URL}/admin/topups)`,
        inline: false,
      },
    ],
    footer: { text: 'J3A STORE • แจ้งเตือนรายการสลิปรออนุมัติ' },
    timestamp: new Date().toISOString(),
  };

  // Attach full image preview if slip URL is a valid web link
  if (data.slipUrl && data.slipUrl.startsWith('http')) {
    embed.image = { url: data.slipUrl };
  }

  return sendDiscordWebhook(slip, {
    username: 'J3A STORE - สลิปรออนุมัติ',
    content: '🔔 **@everyone มีสลิปใหม่รอการตรวจสอบและอนุมัติ!**',
    embeds: [embed],
  });
}

/**
 * 2. Notify Public / Credits: Slip Topup Approved by Admin
 * Sent to Credits Channel (e.g. ୨-💾-୧-⁺-˖-credits)
 */
export async function notifyDiscordTopupApproved(data: {
  topupNumber: string;
  userName: string;
  amount: number;
}): Promise<boolean> {
  const { credits } = await getDiscordWebhooks();

  const embed: any = {
    title: '✅ อนุมัติการเติมเงินสำเร็จ (Top-up Completed)',
    description: `ยอดเงินได้รับการตรวจสอบและเพิ่มเครดิตเข้าบัญชีลูกค้าเรียบร้อยแล้ว`,
    color: 0x10b981, // Emerald Green
    fields: [
      { name: 'รหัสรายการ', value: `\`${data.topupNumber}\``, inline: true },
      { name: 'ช่องทางชำระเงิน', value: 'โอนผ่านบัญชี / พร้อมเพย์', inline: true },
      { name: 'ยอดเครดิตที่ได้รับ', value: `**+฿${data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}**`, inline: true },
      { name: 'ลูกค้า', value: data.userName || 'ลูกค้า', inline: true },
      { name: 'สถานะ', value: '🟢 **อนุมัติแล้ว (Approved)**', inline: true },
    ],
    footer: { text: 'J3A STORE • ระบบเติมเงินอัตโนมัติ' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(credits, {
    username: 'J3A STORE - เครดิต & การชำระเงิน',
    embeds: [embed],
  });
}

/**
 * 3. Notify Public / Credits: Auto Angpao Voucher Redeemed
 * Sent to Credits Channel (e.g. ୨-💾-୧-⁺-˖-credits)
 */
export async function notifyDiscordAngpaoSuccess(data: {
  topupNumber: string;
  userName: string;
  amount: number;
  senderName?: string;
  isTest?: boolean;
}): Promise<boolean> {
  if (data.isTest) return true; // Don't spam test vouchers

  const { credits } = await getDiscordWebhooks();

  const embed: any = {
    title: '🧧 เติมเงินอัตโนมัติสำเร็จ (TrueMoney Angpao)',
    description: `ลูกค้าทำรายการเติมเงินผ่านซองของขวัญ TrueMoney รับเครดิตเข้าบัญชีทันที 24 ชม.`,
    color: 0xef4444, // TrueMoney Red
    fields: [
      { name: 'รหัสรายการ', value: `\`${data.topupNumber}\``, inline: true },
      { name: 'ช่องทาง', value: 'ซองอั่งเปา TrueMoney (Auto)', inline: true },
      { name: 'ยอดเงินที่ได้รับ', value: `**+฿${data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}**`, inline: true },
      { name: 'ลูกค้า', value: data.userName || 'ลูกค้า', inline: true },
      { name: 'ผู้สร้างซอง', value: data.senderName || '-', inline: true },
    ],
    footer: { text: 'J3A STORE • ระบบเติมเงินอัตโนมัติ 24 ชม.' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(credits, {
    username: 'J3A STORE - เครดิต & การชำระเงิน',
    embeds: [embed],
  });
}

/**
 * 4. Notify Welcome: New Member Registration
 * Sent to Welcome Channel (e.g. ►-ยินดีต้อนรับ)
 */
export async function notifyDiscordNewMember(data: {
  userName: string;
  userEmail?: string;
}): Promise<boolean> {
  const { welcome } = await getDiscordWebhooks();

  // Mask partial email for privacy (e.g. j***@gmail.com)
  let maskedEmail = '-';
  if (data.userEmail && data.userEmail.includes('@')) {
    const [name, domain] = data.userEmail.split('@');
    maskedEmail = `${name[0]}***@${domain}`;
  }

  const embed: any = {
    title: '🎉 สมาชิกใหม่ลงทะเบียน (Welcome to J3A STORE)',
    description: `ยินดีต้อนรับคุณ **${data.userName}** สู่ครอบครัว J3A STORE! ขอให้สนุกกับการช้อปปิ้งและใช้งานบริการซอฟต์แวร์ดิจิทัล`,
    color: 0x38bdf8, // Sky Blue
    fields: [
      { name: 'ชื่อผู้ใช้', value: data.userName || 'สมาชิกใหม่', inline: true },
      { name: 'อีเมล', value: maskedEmail, inline: true },
      {
        name: '🛒 เยี่ยมชมร้านค้า',
        value: `[เข้าสู่เว็บไซต์ J3A STORE](${STORE_URL})`,
        inline: false,
      },
    ],
    footer: { text: 'J3A STORE • Next-Gen Digital Commerce' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(welcome, {
    username: 'J3A STORE - สมาชิกใหม่',
    embeds: [embed],
  });
}

/**
 * 5. Notify Order: Customer Purchased Product / Bundle
 * Sent to Credits / Orders Channel (e.g. ୨-💾-୧-⁺-˖-credits)
 */
export async function notifyDiscordOrderPlaced(data: {
  orderNumber: string;
  userName: string;
  itemsSummary: string;
  totalAmount: number;
}): Promise<boolean> {
  const { credits } = await getDiscordWebhooks();

  const embed: any = {
    title: '🛍️ มีรายการสั่งซื้อใหม่สำเร็จ (New Order)',
    description: `ลูกค้าทำรายการสั่งซื้อสินค้าดิจิทัลและจัดส่งผ่านระบบอัตโนมัติเรียบร้อยแล้ว`,
    color: 0x8b5cf6, // Violet / Purple
    fields: [
      { name: 'รหัสคำสั่งซื้อ', value: `\`${data.orderNumber}\``, inline: true },
      { name: 'ยอดชำระ', value: `**฿${data.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}**`, inline: true },
      { name: 'ลูกค้า', value: data.userName || 'ลูกค้า', inline: true },
      { name: 'รายการสินค้า', value: data.itemsSummary || 'สินค้าดิจิทัล', inline: false },
    ],
    footer: { text: 'J3A STORE • ระบบจำหน่ายสินค้าดิจิทัลอัตโนมัติ' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook(credits, {
    username: 'J3A STORE - คำสั่งซื้อ & รายการขาย',
    embeds: [embed],
  });
}
