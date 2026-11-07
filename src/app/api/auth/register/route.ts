import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import dns from 'dns/promises';

// Blocklist of disposable, temporary, and fake mail domains
const DISPOSABLE_DOMAINS = new Set([
  'kaiei.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'trashmail.com',
  'fakemailgenerator.com',
  'getairmail.com',
  'mohmal.com',
  'crazymailing.com',
  'dropmail.me',
  'inboxkitten.com',
  'temp-mail.org',
  'generator.email',
  'trashmail.net',
  'nada.ltd',
  'emailfake.com',
]);

function isGibberish(username: string): boolean {
  const clean = username.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length >= 6) {
    // 6 or more consecutive consonants with no vowels (e.g. shjdkfkf, bcdfghjk)
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return true;
  }
  // Repeated characters e.g. aaaaaa, 111111
  if (/(.)\1{4,}/.test(username)) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อของคุณ (Display Name)' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // 0. Strict Real Email & Domain Verification
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }
    const [localPart, domain] = parts;

    if (!localPart || !domain || localPart.length < 3) {
      return NextResponse.json({ error: 'ชื่ออีเมลสั้นเกินไป กรุณาระบุอีเมลจริง' }, { status: 400 });
    }

    // Check disposable domains
    if (
      DISPOSABLE_DOMAINS.has(domain) ||
      domain.includes('tempmail') ||
      domain.includes('dispostable') ||
      domain.includes('throwaway') ||
      domain.includes('fake')
    ) {
      return NextResponse.json(
        { error: 'ระบบไม่อนุญาตให้ใช้อีเมลชั่วคราว (Disposable Email) กรุณาใช้อีเมลจริงที่สามารถติดต่อได้' },
        { status: 400 }
      );
    }

    // Check spam / keyboard smash
    if (isGibberish(localPart)) {
      return NextResponse.json(
        { error: 'ชื่ออีเมลดูเป็นตัวอักษรสุ่มหรือสแปม กรุณาใช้อีเมลจริงในการสมัครสมาชิก' },
        { status: 400 }
      );
    }

    // Gmail-specific checks
    if (domain === 'gmail.com') {
      if (localPart.length < 6 || localPart.length > 30) {
        return NextResponse.json(
          { error: 'ที่อยู่อีเมล Gmail ต้องมีความยาวระหว่าง 6 ถึง 30 ตัวอักษร' },
          { status: 400 }
        );
      }
      if (!/^[a-z0-9.]+$/i.test(localPart) || localPart.includes('..')) {
        return NextResponse.json(
          { error: 'รูปแบบชื่อ Gmail ไม่ถูกต้อง (อนุญาตเฉพาะตัวอักษร ตัวเลข และจุด)' },
          { status: 400 }
        );
      }
    }

    // Real-time DNS MX Record Check (Domain must have active mail servers)
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json(
          { error: `โดเมน "${domain}" ไม่มี Mail Server สำหรับรับอีเมลจริง กรุณาใช้อีเมลจริง` },
          { status: 400 }
        );
      }
    } catch (dnsErr: any) {
      return NextResponse.json(
        { error: `ไม่พบเซิร์ฟเวอร์รับอีเมลของโดเมน "${domain}" หรือโดเมนนี้ไม่มีอยู่จริง กรุณาใช้อีเมลจริง` },
        { status: 400 }
      );
    }

    // 1. Create user via supabaseAdmin with email_confirm: true (Auto-confirmed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        name: trimmedName,
      },
    });

    if (createError) {
      const msg = (createError.message || '').toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        createError.code === 'email_exists'
      ) {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: createError.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี' },
        { status: 400 }
      );
    }

    const user = userData.user;
    if (!user) {
      return NextResponse.json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้' }, { status: 500 });
    }

    // 2. Check if master admin
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'mynameisyee0@gmail.com')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const isMasterAdmin = adminEmails.includes(trimmedEmail);

    // 3. Upsert user profile in 'profiles' table using supabaseAdmin (Bypassing RLS)
    const newProfile = {
      id: user.id,
      email: trimmedEmail,
      display_name: trimmedName,
      avatar_url: null,
      role: isMasterAdmin ? 'admin' : 'customer',
      credits: 0.0,
      tier: isMasterAdmin ? 'VIP' : 'Bronze',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([newProfile]);
    if (profileError) {
      console.warn('Upsert profile error on register:', profileError.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: trimmedName,
      },
    });
  } catch (err: any) {
    console.error('Register API Error:', err);
    return NextResponse.json(
      { error: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
