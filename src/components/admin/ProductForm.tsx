'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { SafeImage } from '@/components/ui/SafeImage';
import { useRouter } from 'next/navigation';
import {
  Upload,
  X,
  Sparkles,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Save,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Download,
  Key,
} from 'lucide-react';
import { Product, ProductFormData, ProductStatus } from '@/types/product';
import { uploadProductImage, deleteProductImage } from '@/lib/storage/upload';
import { createProduct, updateProduct } from '@/lib/firestore/products';
import { slugify } from '@/lib/utils/formatters';
import { compressImageToDataUrl } from '@/lib/utils/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

const CATEGORIES = [
  'ซอฟต์แวร์ Discord',
  'ระบบเซิร์ฟเวอร์ & บอท',
  'แพ็กเกจบันเดิล (Bundles)',
  'สิทธิ์การใช้งาน (Licenses)',
  'บริการดิจิทัล',
  'ทั่วไป',
];

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const { success, error, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState<number | string>(initialData?.price ?? '');
  const [comparePrice, setComparePrice] = useState<number | string>(
    initialData?.comparePrice ?? ''
  );
  const [category, setCategory] = useState(initialData?.category || 'ซอฟต์แวร์ Discord');
  const [stock, setStock] = useState<number | string>(initialData?.stock ?? 10);
  const [status, setStatus] = useState<ProductStatus>(initialData?.status || 'active');
  const [featured, setFeatured] = useState<boolean>(initialData?.featured || false);
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [showcaseUrl, setShowcaseUrl] = useState(initialData?.showcaseUrl || '');
  const [downloadUrl, setDownloadUrl] = useState(initialData?.downloadUrl || '');
  const [deliveryNote, setDeliveryNote] = useState(initialData?.deliveryNote || '');
  const [deliveryType, setDeliveryType] = useState<'link' | 'key' | 'both'>(
    initialData?.deliveryType || 'link'
  );

  // Image states
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-generate slug when name changes (only in create mode or when user clicks regenerate)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isEdit || !slug) {
      setSlug(slugify(newName));
    }
  };

  const regenerateSlug = () => {
    setSlug(slugify(name));
  };

  // Image selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      try {
        if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          const compressed = await compressImageToDataUrl(file, 800, 800, 0.75);
          setImagePreview(compressed);
        }
      } catch (err) {
        console.warn('Could not compress image preview:', err);
        setImagePreview(URL.createObjectURL(file));
      }
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'กรุณาระบุชื่อสินค้า';
    if (!slug.trim()) errs.slug = 'กรุณาระบุ Slug URL';
    if (price === '' || Number(price) < 0) errs.price = 'กรุณาระบุราคาที่ถูกต้อง';
    if (stock === '' || Number(stock) < 0) errs.stock = 'กรุณาระบุจำนวนสินค้าในคลัง';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    showLoading(isEdit ? 'กำลังอัปเดตข้อมูลสินค้าและอัปโหลดรูปภาพ...' : 'กำลังบันทึกและสร้างสินค้าใหม่...');
    let finalImageUrl = imagePreview || '/logo.png';

    try {
      // 1. Upload new image if file is selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          const { downloadUrl } = await uploadProductImage(
            selectedFile,
            'products',
            (progress) => setUploadProgress(progress),
            4000
          );
          finalImageUrl = downloadUrl;

          // If editing and previous image was on Firebase Storage, clean it up
          if (isEdit && initialData?.image && initialData.image.includes('firebasestorage')) {
            await deleteProductImage(initialData.image);
          }
        } catch (uploadErr: any) {
          console.warn('Firebase Storage upload blocked (CORS) or timed out, using compressed data URL:', uploadErr);
          // If storage isn't configured or CORS blocked, use compressed data URL so product creation succeeds immediately!
          if (!imagePreview || imagePreview.startsWith('blob:')) {
            finalImageUrl = await compressImageToDataUrl(selectedFile, 800, 800, 0.75);
          } else {
            finalImageUrl = imagePreview;
          }
          toast('บันทึกรูปภาพลงฐานข้อมูลเรียบร้อย (ระบบใช้ Compressed Fallback อัตโนมัติ)', 'info');
        } finally {
          setIsUploading(false);
        }
      }

      // Safeguard: Ensure finalImageUrl is never a temporary blob: URL
      if (finalImageUrl.startsWith('blob:') && selectedFile) {
        finalImageUrl = await compressImageToDataUrl(selectedFile, 800, 800, 0.75);
      } else if (finalImageUrl.startsWith('blob:')) {
        finalImageUrl = '/logo.png';
      }

      // Check Firestore 1MB string size limit
      if (finalImageUrl.length > 950000) {
        error(
          `ขนาดข้อมูลรูปภาพใหญ่เกินขีดจำกัด 1 MB ของฐานข้อมูล (${(finalImageUrl.length / 1024 / 1024).toFixed(2)} MB) กรุณาใช้ไฟล์ไม่เกิน 700 KB หรือใส่ Image URL โดยตรง (เช่น /products/duck.gif)`
        );
        setIsSaving(false);
        hideLoading();
        return;
      }

      // 2. Prepare payload
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: ProductFormData = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        price: Number(price),
        ...(comparePrice !== '' && !isNaN(Number(comparePrice)) ? { comparePrice: Number(comparePrice) } : {}),
        category,
        stock: Number(stock),
        status,
        featured,
        image: finalImageUrl,
        images: initialData?.images || [],
        tags,
        ...(showcaseUrl.trim() ? { showcaseUrl: showcaseUrl.trim() } : {}),
        ...(downloadUrl.trim() ? { downloadUrl: downloadUrl.trim() } : {}),
        ...(deliveryNote.trim() ? { deliveryNote: deliveryNote.trim() } : {}),
        deliveryType,
      };

      // 3. Save to Firestore
      if (isEdit && initialData?.id) {
        await updateProduct(initialData.id, payload);
        success(`อัปเดตสินค้า "${name}" สำเร็จแล้ว`);
      } else {
        await createProduct(payload);
        success(`สร้างสินค้า "${name}" เรียบร้อยแล้ว`);
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      error(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product Information Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white mb-2">
              ข้อมูลทั่วไป (General Information)
            </h3>

            {/* Product Name */}
            <Input
              label="ชื่อสินค้า (Product Name) *"
              value={name}
              onChange={handleNameChange}
              placeholder="เช่น Steam Wallet Card 1,000 THB หรือ Valorant Points"
              error={validationErrors.name}
              required
            />

            {/* Slug URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Slug URL (ใช้สำหรับลิงก์สินค้า) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="steam-wallet-1000-thb"
                  className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
                <button
                  type="button"
                  onClick={regenerateSlug}
                  title="สร้าง Slug จากชื่อสินค้าอัตโนมัติ"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {validationErrors.slug && (
                <p className="text-xs text-rose-400">{validationErrors.slug}</p>
              )}
              <p className="text-[11px] text-slate-500">
                URL: /products/{slug || 'product-slug'}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                คำอธิบายสินค้า (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="ระบุรายละเอียดสินค้า วิธีการใช้งาน เงื่อนไขการรับประกัน หรือรายละเอียดไอดี..."
                className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl p-3.5 border border-slate-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none resize-y"
              />
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  หมวดหมู่ (Category) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/80 text-sm text-slate-100 rounded-xl p-2.5 border border-slate-700/80 focus:border-cyan-500 outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="แท็กค้นหา (Tags คั่นด้วยจุลภาค)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="เช่น steam, wallet, gaming, code"
              />
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white mb-2">
              ราคาและสต็อก (Pricing & Inventory)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Regular Price */}
              <Input
                label="ราคาขายจริง (THB) *"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="990"
                error={validationErrors.price}
                required
              />

              {/* Compare Price */}
              <Input
                label="ราคาเปรียบเทียบ (ขีดฆ่า)"
                type="number"
                min="0"
                step="any"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="1,200"
                helperText="จะแสดงเป็นราคาเดิมที่ลดราคา"
              />

              {/* Stock */}
              <Input
                label="จำนวนสินค้าในสต็อก *"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
                error={validationErrors.stock}
                required
              />
            </div>
          </div>

          {/* Showcase Video / Demo Link */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-cyan-400" />
              <span>ลิงก์ Showcase / วิดีโอตัวอย่างสินค้า (Showcase Link)</span>
            </h3>
            <Input
              label="URL คลิป Showcase หรือเว็บตัวอย่างสินค้า"
              type="url"
              value={showcaseUrl}
              onChange={(e) => setShowcaseUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... หรือลิงก์สาธิตสินค้า"
              helperText="เมื่อใส่ลิงก์นี้ จะมีปุ่ม 'รับชม Showcase ตัวอย่าง' แสดงในหน้ารายละเอียดสินค้าให้ลูกค้าคลิกดูได้ทันที"
            />
          </div>

          {/* Product Delivery & Download Configuration (Exact User Specification) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <span>การส่งมอบสินค้าหลังสั่งซื้อ (Delivery & Download Settings)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  กำหนดสิ่งที่ลูกค้าจะได้รับหลังจากสั่งซื้อและชำระเงินสำเร็จ (เช่น ลิงก์ Google Drive, ลิงก์เข้าใช้งาน, License Key)
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                📦 ส่งมอบให้ลูกค้าหลังซื้อ
              </span>
            </div>

            {/* Delivery Type Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                รูปแบบการส่งมอบสินค้า (Delivery Format)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setDeliveryType('link')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryType === 'link'
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'link'}
                      onChange={() => setDeliveryType('link')}
                      className="accent-cyan-400 cursor-pointer"
                    />
                    <span>🔗 ลิงก์ดาวน์โหลดสินค้า</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-5">
                    ส่งมอบปุ่มดาวน์โหลด Google Drive หรือลิงก์ใช้งานโดยตรง
                  </p>
                </div>

                <div
                  onClick={() => setDeliveryType('both')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryType === 'both'
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'both'}
                      onChange={() => setDeliveryType('both')}
                      className="accent-cyan-400 cursor-pointer"
                    />
                    <span>⚡ ลิงก์ + License Key</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-5">
                    ส่งมอบทั้ง License Key และปุ่มดาวน์โหลดไฟล์ติดตั้ง
                  </p>
                </div>

                <div
                  onClick={() => setDeliveryType('key')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    deliveryType === 'key'
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'key'}
                      onChange={() => setDeliveryType('key')}
                      className="accent-cyan-400 cursor-pointer"
                    />
                    <span>🔑 License Key เท่านั้น</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 pl-5">
                    ส่งมอบเฉพาะรหัสคีย์เพื่อนำไปเปิดใช้งานหรือเติมสิทธิ์
                  </p>
                </div>
              </div>
            </div>

            {/* Download Link Input with Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  ลิงก์สินค้า / ลิงก์ดาวน์โหลดหลังซื้อสำเร็จ (Download URL / Delivery Link)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadUrl('https://drive.google.com/file/d/1meSdpyuMvpWAUqiWcMybYZNRd-_T43zM/view?usp=sharing');
                      setDeliveryNote('💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม');
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30 transition-all cursor-pointer font-medium"
                  >
                    + ใส่ลิงก์ Discord Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadUrl('https://drive.google.com/file/d/1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385/view?usp=sharing');
                      setDeliveryNote('💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม');
                    }}
                    className="text-[10px] text-[#7c5cff] hover:text-[#9980ff] bg-[#7c5cff]/10 hover:bg-[#7c5cff]/20 px-2 py-0.5 rounded border border-[#7c5cff]/30 transition-all cursor-pointer font-medium"
                  >
                    + ใส่ลิงก์ Discord Profile
                  </button>
                </div>
              </div>

              <Input
                type="url"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... หรือ ลิงก์ดาวน์โหลดที่ต้องการให้ลูกค้า"
                helperText="ลูกค้ารายการนี้จะได้รับปุ่ม '⬇️ ดาวน์โหลดโปรแกรม / เปิดลิงก์สินค้า' นำไปยังลิงก์นี้ในหน้าสั่งซื้อสำเร็จทันที"
              />
            </div>

            {/* Delivery Note / Instructions for Buyer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ข้อความแนะนำสำหรับลูกค้าหลังซื้อเสร็จ (Delivery Note / Guide)
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                rows={2}
                placeholder="เช่น 💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม"
                className="w-full bg-slate-950/80 text-xs text-slate-200 rounded-xl p-3 border border-slate-700/80 focus:border-cyan-500 outline-none resize-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Image Upload & Status Toggles */}
        <div className="lg:col-span-4 space-y-6">
          {/* Image Upload Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white mb-2">
              รูปภาพสินค้า (Product Image)
            </h3>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
              className="hidden"
            />

            {/* Preview Box */}
            <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/60 overflow-hidden flex flex-col items-center justify-center p-4 transition-colors">
              {imagePreview ? (
                <>
                  <SafeImage
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain p-2"
                  />
                  {(imagePreview.includes('.gif') || imagePreview.startsWith('data:image/gif')) && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                        🎬 ANIMATED GIF
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-400 shadow-md cursor-pointer"
                      title="เปลี่ยนรูปภาพ"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-rose-900/90 text-rose-200 hover:text-white border border-rose-700 shadow-md cursor-pointer"
                      title="ลบรูปภาพ"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-center cursor-pointer p-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition-colors mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    คลิกเพื่ออัปโหลดรูปภาพ
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    รองรับ JPG, JPEG, PNG, GIF, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>กำลังอัปโหลดขึ้น Firebase Storage...</span>
                  <span className="font-bold text-cyan-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Direct Image URL input option */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-400">
                  หรือใส่ Image URL โดยตรง:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('/products/duck.gif');
                    setSelectedFile(null);
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 transition-all font-medium"
                >
                  🦆 ใช้เป็ดเต้น (/products/duck.gif)
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:') ? '' : imagePreview}
                  onChange={(e) => {
                    setImagePreview(e.target.value);
                    setSelectedFile(null);
                  }}
                  placeholder={imagePreview.startsWith('data:') ? '(รูปภาพที่อัปโหลดถูกบีบอัดพร้อมใช้งานแล้ว)' : 'https://... หรือ /products/duck.gif'}
                  className="w-full bg-slate-950/80 text-xs text-slate-200 rounded-lg px-2.5 py-2 border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status & Featured Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <h3 className="text-base font-bold text-white mb-2">
              สถานะสินค้า (Status & Visibility)
            </h3>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                สถานะการขาย (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full bg-slate-950/80 text-sm text-slate-100 rounded-xl p-2.5 border border-slate-700/80 focus:border-cyan-500 outline-none cursor-pointer"
              >
                <option value="active">🟢 พร้อมจำหน่าย (Active)</option>
                <option value="draft">🟡 ฉบับร่าง ซ่อนจากหน้าร้าน (Draft)</option>
                <option value="out_of_stock">🔴 สินค้าหมด (Out of Stock)</option>
              </select>
            </div>

            {/* Featured Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">สินค้าแนะนำ (Featured)</p>
                  <p className="text-[10px] text-slate-400">แสดงในหน้าแรกและส่วนสินค้ายอดนิยม</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              leftIcon={<Save className="w-5 h-5" />}
              className="w-full shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              {isEdit ? 'บันทึกการแก้ไขสินค้า' : 'สร้างสินค้าทันที'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => router.push('/admin/products')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              ยกเลิกและย้อนกลับ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
