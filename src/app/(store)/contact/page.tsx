import React from 'react';
import { MessageCircle, Headphones, Mail, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ติดต่อฝ่ายบริการลูกค้า (Contact Support)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            ทีมงานแอดมิน J3A STORE พร้อมให้ความช่วยเหลือและตอบทุกคำถามตลอด 24 ชั่วโมง
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">LINE Official</h3>
            <p className="text-xs text-slate-400">สอบถามรวดเร็วผ่านไลน์</p>
            <p className="text-sm font-bold text-emerald-400">@j3astore</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Discord Community</h3>
            <p className="text-xs text-slate-400">ห้องซัพพอร์ตและพูดคุย</p>
            <p className="text-sm font-bold text-indigo-400">discord.gg/j3astore</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">เวลาทำการ</h3>
            <p className="text-xs text-slate-400">ระบบสั่งซื้ออัตโนมัติ</p>
            <p className="text-sm font-bold text-cyan-400">ทุกวัน 24 ชั่วโมง</p>
          </div>
        </div>
      </div>
    </div>
  );
}
