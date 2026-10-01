import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Zap, Award, Sparkles, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <Image src="/logo.png" alt="J3A STORE" fill className="object-contain" priority />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            เกี่ยวกับ <span className="text-cyan-400">J3A STORE</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            จุดเริ่มต้นของแพลตฟอร์มศูนย์รวมบริการดิจิทัลและไอเทมเกมยุคใหม่ เพื่อมอบความสะดวกรวดเร็ว ความปลอดภัย และความคุ้มค่าสูงสุดแก่เกมเมอร์และผู้ใช้ทุกคน
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">วิสัยทัศน์ของเรา (Vision)</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              เรามุ่งมั่นที่จะเป็น Store บริการดิจิทัลและไอเทมเกมอันดับหนึ่งในใจของผู้ใช้ ด้วยระบบทำรายการอัตโนมัติเต็มรูปแบบที่เสร็จสิ้นภายในไม่กี่วินาที
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">ความน่าเชื่อถือ (Trust & Security)</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ความปลอดภัยของข้อมูลและเงินของคุณคือสิ่งสำคัญที่สุด ทุกการทำรายการผ่านระบบได้รับการป้องกันด้วยสถาปัตยกรรมระดับมาตรฐานสากล
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link href="/shop">
            <Button variant="primary" size="lg">
              สำรวจสินค้าและบริการในร้าน
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
