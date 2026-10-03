'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Package,
  Boxes,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { getProducts } from '@/lib/firestore/products';
import { createBundle } from '@/lib/firestore/bundles';
import { Product } from '@/types/product';
import { BundleFormData, BundleItem } from '@/types/bundle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { uploadProductImage } from '@/lib/storage/upload';
import { compressImageToDataUrl } from '@/lib/utils/image';
import { slugify } from '@/lib/utils/formatters';

export default function CreateBundlePage() {
  const router = useRouter();
  const { success, error, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Products from store
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
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
    async function loadStoreProducts() {
      setIsLoadingProducts(true);
      try {
        const prods = await getProducts({ status: 'all' });
        setAllProducts(prods);
      } catch (err: any) {
        error(`เกิดข้อผิดพลาดในการโหลดสินค้า: ${err.message}`);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadStoreProducts();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(slugify(val));
  };

  const handleToggleProduct = (product: Product) => {
    setSelectedProductIds((prev) => {
      let next: string[];
      if (prev.includes(product.id)) {
        next = prev.filter((id) => id !== product.id);
      } else {
        next = [...prev, product.id];
      }

      // Auto update suggested stock (minimum stock among selected)
      const selected = allProducts.filter((p) => next.includes(p.id));
      if (selected.length > 0) {
        const minStock = Math.min(...selected.map((p) => p.stock));
        setStock(String(Math.max(1, minStock)));
      }

      return next;
    });
  };

  // Selected items details
  const selectedProducts = allProducts.filter((p) => selectedProductIds.includes(p.id));
  const originalTotalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  // Discount calculation
  const numericBundlePrice = Number(bundlePrice) || 0;
  const savings = Math.max(0, originalTotalPrice - numericBundlePrice);
  const discountPercent =
    originalTotalPrice > 0 && numericBundlePrice < originalTotalPrice
      ? Math.round(((originalTotalPrice - numericBundlePrice) / originalTotalPrice) * 100)
      : 0;

  // Image file select
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

  const handleUseFirstProductImage = () => {
    if (selectedProducts.length > 0 && selectedProducts[0].image) {
      setSelectedFile(null);
      setImagePreview(selectedProducts[0].image);
      toast('ใช้รูปภาพของสินค้าชิ้นแรกเป็นปกเรียบร้อย', 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (allProducts.length < 2) {
      error('ต้องมีสินค้าในระบบอย่างน้อย 2 รายการก่อน จึงจะสามารถสร้าง Bundle ได้');
      return;
    }

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
    showLoading('กำลังสร้างและบันทึกแพ็กเกจ Bundle...');
    let finalImageUrl = imagePreview || selectedProducts[0]?.image || '/logo.png';

    try {
      // Upload image if a new file was chosen
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

      // Safeguard against raw blob:
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

      const payload: BundleFormData = {
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
        tags: ['bundle', 'promotion', ...selectedProducts.map((p) => p.category)],
      };

      await createBundle(payload);
      success(`สร้างแพ็กเกจ Bundle "${name}" สำเร็จเรียบร้อยแล้ว!`);
      router.push('/admin/bundles');
      router.refresh();
    } catch (err: any) {
      error(`ไม่สามารถบันทึก Bundle: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase().trim())
  );

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
            <span>สร้างแพ็กเกจบันเดิลใหม่ (New Bundle Package)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            เลือกสินค้าอย่างน้อย 2 ชิ้น และกำหนดราคาโปรโมชันพิเศษ
          </p>
        </div>
      </div>

      {/* Rule Check: If less than 2 products exist in system */}
      {isLoadingProducts ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          กำลังตรวจสอบสินค้าในระบบ...
        </div>
      ) : allProducts.length < 2 ? (
        <div className="p-8 sm:p-12 text-center bg-rose-950/20 border-2 border-dashed border-rose-500/40 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-white">
              ไม่สามารถสร้าง Bundle ได้ในขณะนี้
            </h3>
            <p className="text-xs sm:text-sm text-rose-200/80 leading-relaxed">
              หน้าสร้าง Bundle จะต้องมีสินค้าในระบบก่อนอย่างน้อย <strong>2 สินค้า</strong> ปัจจุบันในระบบของคุณมีเพียง{' '}
              <strong className="text-white underline">{allProducts.length} รายการ</strong>
            </p>
          </div>
          <div className="pt-2">
            <Link href="/admin/products/new">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                เพิ่มสินค้าให้ครบ 2 ชิ้นก่อน
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Product Selection */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Multi-Selector Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-cyan-400" />
                      <span>1. เลือกสินค้าที่จะรวมใน Bundle *</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ต้องเลือกสินค้าอย่างน้อย 2 รายการ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        selectedProductIds.length >= 2
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      เลือกแล้ว {selectedProductIds.length} / {allProducts.length} ชิ้น
                    </span>
                  </div>
                </div>

                {/* Search products */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ค้นหาสินค้าเพื่อเพิ่มลง Bundle..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>

                {/* Products Selector Grid */}
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

                {/* Selected Summary Pill list */}
                {selectedProducts.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 font-semibold">
                      สินค้าที่เลือกไว้ ({selectedProducts.length} ชิ้น):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProducts.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-cyan-300 border border-slate-700"
                        >
                          <span>{p.name}</span>
                          <span className="font-mono font-bold text-slate-400">฿{p.price}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProduct(p);
                            }}
                            className="text-slate-400 hover:text-rose-400 ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Bundle Info */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-cyan-400" />
                  <span>2. ข้อมูลแพ็กเกจ (Bundle Information)</span>
                </h3>

                <Input
                  label="ชื่อแพ็กเกจ Bundle *"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="เช่น Duo Pack Valorant + Steam หรือ Starter Set สุดคุ้ม"
                  required
                />

                <Input
                  label="Slug URL *"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="เช่น gaming-duo-pack"
                  required
                  helperText="สำหรับใช้เป็นลิงก์เข้าชมแพ็กเกจ"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    คำอธิบายแพ็กเกจ
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="อธิบายจุดเด่นของแพ็กเกจนี้ ความคุ้มค่า หรือสิ่งที่ผู้ซื้อจะได้รับ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Pricing, Image & Publish */}
            <div className="lg:col-span-5 space-y-6">
              {/* Pricing & Discount Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>3. กำหนดราคา & ส่วนลด (Pricing)</span>
                </h3>

                {/* Original Sum Display */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">ราคารวมสินค้าปกติ:</span>
                    <span className="text-base font-black text-slate-300 line-through">
                      ฿{originalTotalPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    คำนวณจาก {selectedProducts.length} สินค้า
                  </span>
                </div>

                {/* Bundle Price Input */}
                <Input
                  label="ราคาขายของ Bundle (บาท) *"
                  type="number"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  placeholder="เช่น 799"
                  required
                  min="1"
                  helperText="ตั้งราคาที่ลดลงจากราคารวมปกติเพื่อความคุ้มค่า"
                />

                {/* Live Discount Calculator Box */}
                {numericBundlePrice > 0 && originalTotalPrice > 0 && (
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      numericBundlePrice < originalTotalPrice
                        ? 'bg-gradient-to-br from-cyan-950/40 to-slate-950 border-cyan-500/30'
                        : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {numericBundlePrice < originalTotalPrice ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-rose-400 fill-current" />
                            ส่วนลดสำหรับลูกค้า:
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                            ลด {discountPercent}%
                          </span>
                        </div>
                        <div className="text-lg font-black text-emerald-400">
                          ประหยัดเงินได้ ฿{savings.toLocaleString()} บาท
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>ราคา Bundle เท่ากับหรือมากกว่าราคาปกติ แนะนำให้ตั้งราคาต่ำกว่าเพื่อดึงดูดลูกค้า</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stock input */}
                <Input
                  label="จำนวนคงเหลือ (Stock) *"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  required
                  min="0"
                  helperText="ระบบแนะนำค่าเริ่มต้นจากสต็อกขั้นต่ำของสินค้าที่เลือก"
                />
              </div>

              {/* Bundle Cover Image Upload Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span>4. รูปภาพหน้าปก Bundle</span>
                  </h3>
                  {selectedProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUseFirstProductImage}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      ใช้รูปสินค้าชิ้นแรก
                    </button>
                  )}
                </div>

                {/* Upload or Drop Area */}
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
                    <div className="text-center space-y-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500 group-hover:text-cyan-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white">คลิกเพื่ออัปโหลดรูปภาพ Bundle</p>
                      <p className="text-[11px] text-slate-500">รองรับ JPG, PNG, WEBP, GIF (สูงสุด 5MB)</p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>กำลังอัปโหลดรูปภาพ...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Publish Settings */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white">5. เผยแพร่ (Publish)</h3>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    สถานะการวางจำหน่าย
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:border-cyan-400 outline-none"
                  >
                    <option value="active">วางจำหน่ายทันที (Active)</option>
                    <option value="draft">บันทึกเป็นแบบร่าง (Draft)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="featuredToggle"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                  />
                  <label htmlFor="featuredToggle" className="text-xs text-slate-300 cursor-pointer">
                    ติดป้าย "แพ็กเกจแนะนำพิเศษ (Featured)" บนหน้าแรก
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
                    สร้าง Bundle
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
