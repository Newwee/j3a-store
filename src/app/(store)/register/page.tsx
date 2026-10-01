'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isFirebaseReady } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
