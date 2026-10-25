import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
