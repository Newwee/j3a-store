import React from 'react';

export default function TermsPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms of Service)</h1>
        <p className="text-xs text-slate-400">อัปเดตล่าสุด: ตุลาคม 2026</p>

        <section className="space-y-3 pt-4">
          <h2 className="text-lg font-bold text-white">1. การยอมรับข้อตกลง</h2>
          <p>
            การเข้าใช้บริการเว็บไซต์ J3A STORE ถือว่าท่านได้อ่าน ทำความเข้าใจ และยินยอมที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขทั้งหมดที่ระบุไว้ในหน้านี้
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white">2. การสั่งซื้อและสินค้าดิจิทัล</h2>
          <p>
            สินค้าในระบบส่วนใหญ่เป็นสินค้าประเภทดิจิทัล (Digital Goods) และบริการเติมเงิน ซึ่งเมื่อระบบจัดส่งหรือดำเนินการสำเร็จแล้ว จะไม่สามารถขอคืนเงินหรือยกเลิกคำสั่งซื้อได้ ยกเว้นกรณีที่เกิดความผิดพลาดจากระบบของ J3A STORE เท่านั้น
          </p>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white">3. บัญชีผู้ใช้งานและความปลอดภัย</h2>
          <p>
            ผู้ใช้งานมีหน้าที่รักษาความปลอดภัยของรหัสผ่านและข้อมูลบัญชีของตนเอง ทางร้านจะไม่รับผิดชอบต่อความเสียหายที่เกิดจากการยินยอมให้ผู้อื่นเข้าใช้งานบัญชีของท่าน
          </p>
        </section>
      </div>
    </div>
  );
}
