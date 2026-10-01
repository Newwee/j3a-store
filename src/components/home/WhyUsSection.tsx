import React from 'react';
import { Zap, ShieldCheck, Award, Clock, Sparkles, HeartHandshake } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'จัดส่งอัตโนมัติรวดเร็ว (Fast Delivery)',
    description: 'ระบบทำรายการและจัดส่งคีย์ สินค้า หรือบริการแบบ Real-time ทันทีที่การชำระเงินสำเร็จ ไม่ต้องรอนาน',
    badge: 'ทันทีใน 1 นาที',
    color: 'cyan',
  },
  {
    icon: ShieldCheck,
    title: 'ความปลอดภัยสูงสุด (Secure & Safe)',
    description: 'ระบบความปลอดภัยมาตรฐานระดับสากล บัญชีและข้อมูลส่วนตัวของคุณได้รับการเข้ารหัสอย่างแน่นหนา',
    badge: '100% ปลอดภัย',
    color: 'emerald',
  },
  {
    icon: Award,
    title: 'สินค้าคุณภาพแท้ (Quality Guaranteed)',
    description: 'คัดสรรสินค้าดิจิทัลและไอเทมเกมจากพาร์ทเนอร์ทางการ รับประกันการใช้งานได้จริงทุกลำดับ',
    badge: 'รับประกันทุกชิ้น',
    color: 'purple',
  },
  {
    icon: HeartHandshake,
    title: 'บริการช่วยเหลือ 24 ชั่วโมง (24/7 Support)',
    description: 'ทีมงานฝ่ายซัพพอร์ตคอยดูแลและให้คำปรึกษาตลอดทุกวัน ผ่านช่องทาง LINE และ Discord อย่างใกล้ชิด',
    badge: 'พร้อมช่วยเหลือ',
    color: 'amber',
  },
];

export function WhyUsSection() {
  return (
    <section className="py-16 bg-slate-950/60 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>จุดเด่นที่คุณจะได้รับ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ทำไมต้องเลือกซื้อที่ <span className="text-cyan-400">J3A STORE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            เรามุ่งมั่นพัฒนาแพลตฟอร์มเพื่อส่งมอบประสบการณ์ที่ดีที่สุดในการซื้อสินค้าและบริการดิจิทัลให้กับคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
