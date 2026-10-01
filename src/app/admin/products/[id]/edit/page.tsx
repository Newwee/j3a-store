'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProductForm } from '@/components/admin/ProductForm';
import { getProductById } from '@/lib/firestore/products';
import { Product } from '@/types/product';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2 } from 'lucide-react';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const item = await getProductById(productId);
        if (isMounted) {
          setProduct(item);
        }
      } catch (err) {
        console.error('Error fetching product for edit:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs">กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="ไม่พบสินค้านี้ในระบบ"
        description="รหัสสินค้าอาจไม่ถูกต้อง หรือสินค้าอาจถูกลบไปแล้ว"
        actionText="กลับไปยังหน้ารายการสินค้า"
        actionHref="/admin/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`แก้ไขสินค้า: ${product.name}`}
        description="แก้ไขรายละเอียด ราคา รูปภาพ หรือสถานะของสินค้า"
        actionText=""
        actionHref=""
      />

      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
