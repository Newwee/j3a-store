'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isFirebaseReady } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      success('เข้าสู่ระบบด้วย Google สำเร็จ ยินดีต้อนรับสู่ J3A STORE!');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        const msg = err.message || 'ไม่สามารถสมัครหรือเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง';
        setErrorMessage(msg);
        error(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล หรือชื่อที่ต้องการแสดง');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await register(email.trim(), password, name.trim());
      success('สมัครสมาชิกสำเร็จแล้ว! ยินดีต้อนรับสู่ J3A STORE');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น';
      } else if (err.code === 'auth/weak-password') {
        msg = 'รหัสผ่านคาดเดาง่ายเกินไป กรุณาใช้รหัสผ่านที่รัดกุมยิ่งขึ้น';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <Image src="/logo.png" alt="J3A STORE" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              สมัครสมาชิกใหม่ (Register)
            </h1>
            <p className="text-xs text-slate-400">
              สร้างบัญชี J3A STORE เพื่อสะสมคะแนน รับส่วนลดพิเศษ และบริการอัตโนมัติ
            </p>
          </div>

          {!isFirebaseReady && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ยังไม่ได้เชื่อมต่อ Firebase API Keys ใน <code>.env.local</code> สามารถกรอกข้อมูลเพื่อเชื่อมต่อ Firebase Authentication ได้ทันที
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="ชื่อของคุณ (Display Name) *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น NeW JA หรือ สมชาย"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="อีเมล (Email) *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="รหัสผ่าน (Password) *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="ยืนยันรหัสผ่าน (Confirm Password) *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] mt-2"
            >
              สมัครสมาชิกทันที
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#0c0a13] px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              หรือสมัครด้วย
            </span>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>สมัครสมาชิกด้วย Google</span>
          </button>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            มีบัญชีสมาชิกอยู่แล้ว?{' '}
            <Link href="/login" className="font-bold text-cyan-400 hover:underline">
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
