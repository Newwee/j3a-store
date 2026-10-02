'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Flame,
  Tag,
  DollarSign,
  Boxes,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getProducts } from '@/lib/firestore/products';
import { getBundleById, updateBundle } from '@/lib/firestore/bundles';
import { Product } from '@/types/product';
import { BundleFormData, BundleItem, BundlePackage } from '@/types/bundle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { uploadProductImage } from '@/lib/storage/upload';
import { compressImageToDataUrl } from '@/lib/utils/image';
import { slugify } from '@/lib/utils/formatters';

export default function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bundleId = resolvedParams.id;
  const router = useRouter();
  const { success, error, toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Selected products for bundle
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Bundle details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [featured, setFeatured] = useState(false);

  // Image upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submission
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [bundleData, prods] = await Promise.all([
          getBundleById(bundleId),
          getProducts({ status: 'all' }),
        ]);

        if (!bundleData) {
          error('ไม่พบข้อมูลแพ็กเกจบันเดิลที่ระบุ');
          router.push('/admin/bundles');
          return;
        }

        setAllProducts(prods);
        setName(bundleData.name);
        setSlug(bundleData.slug);
        setDescription(bundleData.description || '');
        setBundlePrice(String(bundleData.price));
        setStock(String(bundleData.stock));
        setStatus(bundleData.status === 'out_of_stock' ? 'draft' : bundleData.status);
        setFeatured(Boolean(bundleData.featured));
        setImagePreview(bundleData.image);
        setSelectedProductIds(bundleData.items?.map((i) => i.productId) || []);
      } catch (err: any) {
        error(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [bundleId]);

  const handleToggleProduct = (product: Product) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      return [...prev, product.id];
    });
  };

  const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));
  const originalTotalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const numericBundlePrice = Number(bundlePrice) || 0;
  const savings = Math.max(0, originalTotalPrice - numericBundlePrice);
  const discountPercent =
    originalTotalPrice > 0 && numericBundlePrice < originalTotalPrice
      ? Math.round(((originalTotalPrice - numericBundlePrice) / originalTotalPrice) * 100)
      : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('ขนาดรูปภาพต้องไม่เกิน 5 MB');
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length < 2) {
      error('กรุณาเลือกสินค้าอย่างน้อย 2 รายการเพื่อจัดทำเป็น Bundle');
      return;
    }

    if (!name.trim()) {
      error('กรุณาระบุชื่อแพ็กเกจ Bundle');
      return;
    }

    if (numericBundlePrice <= 0) {
      error('ราคาบันเดิลต้องมากกว่า 0 บาท');
      return;
    }

    setIsSaving(true);
    let finalImageUrl = imagePreview || selectedProducts[0]?.image || '/logo.png';

    try {
      if (selectedFile) {
        setIsUploading(true);
        try {
          const { downloadUrl } = await uploadProductImage(
            selectedFile,
            'bundles',
            (progress) => setUploadProgress(progress),
            4000
          );
          finalImageUrl = downloadUrl;
        } catch (uploadErr: any) {
          console.warn('Storage upload fallback:', uploadErr);
          if (!imagePreview || imagePreview.startsWith('blob:')) {
            finalImageUrl = await compressImageToDataUrl(selectedFile, 800, 800, 0.75);
          } else {
            finalImageUrl = imagePreview;
          }
        } finally {
          setIsUploading(false);
        }
      }

      if (finalImageUrl.startsWith('blob:') && selectedFile) {
        finalImageUrl = await compressImageToDataUrl(selectedFile, 800, 800, 0.75);
      } else if (finalImageUrl.startsWith('blob:')) {
        finalImageUrl = selectedProducts[0]?.image || '/logo.png';
      }

      const bundleItems: BundleItem[] = selectedProducts.map((p) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        stock: p.stock,
      }));

      const payload: Partial<BundleFormData> = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        image: finalImageUrl,
        images: [finalImageUrl],
        items: bundleItems,
        originalPrice: originalTotalPrice,
        price: numericBundlePrice,
        savings,
        discountPercent,
        stock: Number(stock) || 0,
        status,
        featured,
      };

      await updateBundle(bundleId, payload);
      success(`อัปเดตแพ็กเกจ "${name}" สำเร็จเรียบร้อย`);
      router.push('/admin/bundles');
      router.refresh();
    } catch (err: any) {
      error(`ไม่สามารถบันทึก: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase().trim())
  );

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        กำลังโหลดข้อมูลแพ็กเกจ...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/bundles"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-cyan-400" />
            <span>แก้ไขแพ็กเกจบันเดิล (Edit Bundle Package)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            ปรับเปลี่ยนสินค้าในชุด หรือแก้ไขราคาและรูปภาพของบันเดิล
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Product Selection */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-cyan-400" />
                    <span>สินค้าในชุด Bundle ({selectedProductIds.length} ชิ้น)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    คลิกเพื่อเพิ่มหรือลบสินค้าออกจากชุด
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ค้นหาสินค้าเพื่อเพิ่ม/ลด..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleProduct(prod)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                        <SafeImage src={prod.image} alt={prod.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                        <span className="text-[10px] text-slate-400 block">{prod.category}</span>
                        <span className="text-xs font-black text-cyan-300 font-mono">
                          ฿{prod.price.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'border border-slate-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <span>ข้อมูลแพ็กเกจ</span>
              </h3>

              <Input
                label="ชื่อแพ็กเกจ Bundle *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Slug URL *"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  คำอธิบายแพ็กเกจ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Cover */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>กำหนดราคา & ส่วนลด</span>
              </h3>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">ราคารวมสินค้าปกติ:</span>
                  <span className="text-base font-black text-slate-300 line-through">
                    ฿{originalTotalPrice.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {selectedProducts.length} รายการ
                </span>
              </div>

              <Input
                label="ราคาขายของ Bundle (บาท) *"
                type="number"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                required
                min="1"
              />

              {numericBundlePrice > 0 && originalTotalPrice > 0 && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    numericBundlePrice < originalTotalPrice
                      ? 'bg-gradient-to-br from-cyan-950/40 to-slate-950 border-cyan-500/30'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-400 fill-current" />
                      ส่วนลด:
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                      ลด {discountPercent}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    ประหยัด ฿{savings.toLocaleString()} บาท
                  </div>
                </div>
              )}

              <Input
                label="จำนวนคงเหลือ (Stock) *"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                min="0"
              />
            </div>

            {/* Cover Image */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>รูปภาพหน้าปก Bundle</span>
              </h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-video w-full rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/80 overflow-hidden flex flex-col items-center justify-center p-4 cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <>
                    <SafeImage src={imagePreview} alt="Bundle Preview" fill className="object-contain p-2" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
                        คลิกเพื่อเปลี่ยนรูป
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2 text-slate-400">
                    <Upload className="w-6 h-6 mx-auto text-slate-500" />
                    <p className="text-xs font-bold text-white">คลิกเพื่ออัปโหลดรูปภาพ Bundle</p>
                  </div>
                )}
              </div>
            </div>

            {/* Publish Settings */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">สถานะการวางจำหน่าย</h3>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:border-cyan-400 outline-none"
              >
                <option value="active">วางจำหน่ายทันที (Active)</option>
                <option value="draft">บันทึกเป็นแบบร่าง (Draft)</option>
              </select>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredEditToggle"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="featuredEditToggle" className="text-xs text-slate-300 cursor-pointer">
                  ติดป้าย "แพ็กเกจแนะนำพิเศษ (Featured)"
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <Link href="/admin/bundles" className="flex-1">
                  <Button variant="secondary" size="md" className="w-full" type="button">
                    ยกเลิก
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  disabled={selectedProductIds.length < 2 || isSaving}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  บันทึกการแก้ไข
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
