'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  Check,
  Filter,
} from 'lucide-react';
import { Product, ProductStatus } from '@/types/product';
import {
  getProducts,
  deleteProduct,
  toggleProductStatus,
  toggleProductFeatured,
} from '@/lib/firestore/products';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { ProductStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminProductsPage() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProducts();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // Categories list for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Status toggle handler
  const handleStatusChange = async (productId: string, newStatus: ProductStatus) => {
    try {
      await toggleProductStatus(productId, newStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
      success('อัปเดตสถานะสินค้าสำเร็จ');
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  // Featured toggle handler
  const handleFeaturedChange = async (productId: string, current: boolean) => {
    try {
      await toggleProductFeatured(productId, !current);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, featured: !current } : p))
      );
      success(!current ? 'ตั้งเป็นสินค้าแนะนำแล้ว' : 'ยกเลิกสถานะสินค้าแนะนำ');
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะ Featured ได้');
    }
  };

  // Delete product handler
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      success(`ลบสินค้า "${productToDelete.name}" เรียบร้อยแล้ว`);
      setProductToDelete(null);
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="จัดการสินค้า (Products Management)"
        description="รายการสินค้าทั้งหมดในระบบ สร้าง แก้ไข สต็อก และเปลี่ยนสถานะสินค้า"
        actionText="สร้างสินค้าใหม่"
        actionHref="/admin/products/new"
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อสินค้า หมวดหมู่ หรือ Slug..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <CustomDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'ทุกหมวดหมู่' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
            placeholder="หมวดหมู่"
            menuWidth="w-52"
          />

          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'ทุกสถานะ' },
              { value: 'active', label: '🟢 พร้อมจำหน่าย (Active)' },
              { value: 'draft', label: '🟡 ฉบับร่าง (Draft)' },
              { value: 'out_of_stock', label: '🔴 สินค้าหมด (Out of Stock)' },
            ]}
            placeholder="สถานะ"
            menuWidth="w-56"
          />
        </div>
      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="ไม่พบสินค้าในระบบ"
          description="ยังไม่มีสินค้าตรงกับตัวกรองที่เลือก หรือยังไม่มีสินค้าถูกสร้างขึ้น"
          actionText="เพิ่มสินค้าชิ้นแรกเลย"
          actionHref="/admin/products/new"
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">รูปภาพ</th>
                  <th className="py-4 px-4">ชื่อสินค้า / Slug</th>
                  <th className="py-4 px-4">หมวดหมู่</th>
                  <th className="py-4 px-4">ราคา</th>
                  <th className="py-4 px-4">คงเหลือ</th>
                  <th className="py-4 px-4">สถานะ</th>
                  <th className="py-4 px-4 text-center">แนะนำ (Featured)</th>
                  <th className="py-4 px-4 sm:px-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-850/50 transition-colors group"
                  >
                    {/* Image */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                        <SafeImage
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </td>

                    {/* Name & Slug */}
                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="font-bold text-white hover:text-cyan-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                      >
                        <span>{product.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        /{product.slug}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-cyan-400">
                        {formatCurrency(product.price)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="block text-[10px] text-slate-500 line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {product.stock <= 0 ? (
                        <span className="text-rose-400 font-bold">หมด (0)</span>
                      ) : (
                        <span className="text-slate-200 font-semibold">{product.stock}</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={product.status}
                        onChange={(e) =>
                          handleStatusChange(product.id, e.target.value as ProductStatus)
                        }
                        className="bg-slate-950 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="active">พร้อมขาย</option>
                        <option value="draft">ฉบับร่าง</option>
                        <option value="out_of_stock">สินค้าหมด</option>
                      </select>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleFeaturedChange(product.id, product.featured)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          product.featured
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            : 'bg-slate-950 text-slate-600 border-slate-800 hover:text-slate-400'
                        }`}
                        title={product.featured ? 'สินค้าแนะนำ' : 'ตั้งเป็นสินค้าแนะนำ'}
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="แก้ไขข้อมูลสินค้า"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                          title="ลบสินค้า"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}
