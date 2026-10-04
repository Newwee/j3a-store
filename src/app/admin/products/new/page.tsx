'use client';

import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="เพิ่มสินค้าใหม่ (Create Product)"
        description="กรอกข้อมูลสินค้า อัปโหลดรูปภาพ และบันทึกลงระบบทันที"
        actionText=""
        actionHref=""
      />

      <ProductForm isEdit={false} />
    </div>
  );
}
