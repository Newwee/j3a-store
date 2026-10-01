'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setIsSent(true);
      success('ส่งอีเมลสำหรับตั้งรหัสผ่านใหม่เรียบร้อยแล้ว');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="relative w-14 h-14 mx-auto rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Image src="/logo.png" alt="J3A STORE" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ลืมรหัสผ่าน (Forgot Password)
            </h1>
            <p className="text-xs text-slate-400">
              กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
            </p>
          </div>

          {isSent ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">ตรวจสอบกล่องจดหมายของคุณ</p>
              <p className="text-xs text-slate-300">
                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง <strong className="text-emerald-300">{email}</strong> แล้ว
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="secondary" size="sm" className="w-full">
                  กลับสู่หน้าเข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="อีเมลของคุณ"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                rightIcon={<Send className="w-4 h-4" />}
                className="w-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
