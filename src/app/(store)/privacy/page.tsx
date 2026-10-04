import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
        <p className="text-xs text-slate-400">อัปเดตล่าสุด: ตุลาคม 2026</p>

        <section className="space-y-3 pt-4">
          <h2 className="text-lg font-bold text-white">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p>
            J3A STORE เก็บรวบรวมข้อมูลที่จำเป็นต่อการให้บริการ เช่น ชื่อ-นามสกุล, ที่อยู่อีเมล, เบอร์โทรศัพท์, และประวัติการทำรายการ เพื่อใช้ในการจัดส่งสินค้าดิจิทัลและยืนยันสถานะการชำระเงิน
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white">2. การรักษาความปลอดภัยของข้อมูล</h2>
          <p>
            ข้อมูลรหัสผ่านทั้งหมดได้รับการจัดการและเข้ารหัสผ่าน Supabase Authentication ซึ่งเป็นไปตามมาตรฐานความปลอดภัยชั้นนำระดับโลก เราไม่มีนโยบายจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก
          </p>
        </section>
      </div>
    </div>
  );
}
