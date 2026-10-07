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
  Star,
  Trash2,
  Plus,
  Image as ImageIcon,
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

interface ProductImageItem {
  id: string;
  url: string;
  file?: File | null;
}

const CATEGORIES = [
  'ซอฟต์แวร์ Discord',
  'ระบบเซิร์ฟเวอร์ & บอท',
  'แพ็กเกจบันเดิล (Bundles)',
  'สิทธิ์การใช้งาน (Licenses)',
  'บริการดิจิทัล',
  'ทั่วไป',
];

const getInitialImages = (data?: Product): ProductImageItem[] => {
  if (!data) return [];
  const list: string[] = [];
  if (data.image && data.image !== '/logo.png') {
    list.push(data.image);
  }
  if (Array.isArray(data.images)) {
    data.images.forEach((img) => {
      if (img && typeof img === 'string' && img !== '/logo.png' && !list.includes(img)) {
        list.push(img);
      }
    });
  }
  if (list.length === 0 && data.image) {
    list.push(data.image);
  }
  return list.slice(0, 5).map((url, idx) => ({
    id: `init-${idx}-${url.slice(-8)}`,
    url,
  }));
};

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

  // Image states (up to 5 images)
  const [imagesList, setImagesList] = useState<ProductImageItem[]>(() => getInitialImages(initialData));
  const [urlInput, setUrlInput] = useState<string>('');
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

  // Image selection (support multiple files up to remaining slots)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - imagesList.length;
    if (remainingSlots <= 0) {
      error('เพิ่มรูปภาพได้สูงสุด 5 รูปแล้ว');
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast(`เลือกรูปภาพเกินโควตา ระบบเพิ่มให้เพียง ${remainingSlots} รูป (สูงสุด 5 รูป)`, 'info');
    }

    const newItems: ProductImageItem[] = [];
    for (const file of filesToAdd) {
      let preview = '';
      try {
        if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
          preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve((ev.target?.result as string) || '');
            reader.readAsDataURL(file);
          });
        } else {
          preview = await compressImageToDataUrl(file, 800, 800, 0.75);
        }
      } catch (err) {
        console.warn('Could not compress image preview:', err);
        preview = URL.createObjectURL(file);
      }

      newItems.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: preview,
        file,
      });
    }

    setImagesList((prev) => [...prev, ...newItems]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (customUrl?: string) => {
    const targetUrl = (customUrl !== undefined ? customUrl : urlInput).trim();
    if (!targetUrl) return;
    if (imagesList.length >= 5) {
      error('เพิ่มรูปภาพได้สูงสุด 5 รูปแล้ว');
      return;
    }
    setImagesList((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: targetUrl,
      },
    ]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setImagesList((prev) => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      return [selected, ...next];
    });
    toast('ตั้งเป็นรูปภาพหลักเรียบร้อยแล้ว', 'info');
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

    try {
      const uploadedUrls: string[] = [];

      // 1. Process and upload each image (up to 5)
      for (let i = 0; i < imagesList.length; i++) {
        const item = imagesList[i];
        let finalUrl = item.url;

        if (item.file) {
          // Fast path for duck.gif (local asset)
          if (item.file.name.toLowerCase() === 'duck.gif') {
            finalUrl = '/products/duck.gif';
          } else {
            setIsUploading(true);
            try {
              const { downloadUrl } = await uploadProductImage(
                item.file,
                'products',
                (progress) => setUploadProgress(progress),
                4000
              );
              finalUrl = downloadUrl;
            } catch (uploadErr: any) {
              console.warn('Firebase Storage upload blocked (CORS) or timed out, using compressed data URL:', uploadErr);
              if (!item.url || item.url.startsWith('blob:')) {
                finalUrl = await compressImageToDataUrl(item.file, 800, 800, 0.75);
              } else {
                finalUrl = item.url;
              }
            } finally {
              setIsUploading(false);
            }
          }
        }

        // Safeguard: Ensure finalUrl is never a temporary blob: URL
        if (finalUrl.startsWith('blob:') && item.file) {
          finalUrl = await compressImageToDataUrl(item.file, 800, 800, 0.75);
        } else if (finalUrl.startsWith('blob:')) {
          finalUrl = '/logo.png';
        }

        // Check Firestore 1MB string size limit
        if (finalUrl.length > 850000) {
          error(
            `รูปภาพที่ ${i + 1} ขนาดข้อมูลใหญ่เกินขีดจำกัดฐานข้อมูล (${(finalUrl.length / 1024 / 1024).toFixed(2)} MB) กรุณาใช้ไฟล์ไม่เกิน 500 KB หรือใส่ Image URL โดยตรง`
          );
          setIsSaving(false);
          hideLoading();
          return;
        }

        uploadedUrls.push(finalUrl);
      }

      const finalImages = uploadedUrls.length > 0 ? uploadedUrls : ['/logo.png'];
      const primaryImage = finalImages[0] || '/logo.png';

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
        image: primaryImage,
        images: finalImages,
        tags,
        ...(showcaseUrl.trim() ? { showcaseUrl: showcaseUrl.trim() } : {}),
        ...(downloadUrl.trim() ? { downloadUrl: downloadUrl.trim() } : {}),
        ...(deliveryNote.trim() ? { deliveryNote: deliveryNote.trim() } : {}),
        ...(downloadUrl.trim() || deliveryNote.trim() || deliveryType !== 'link' ? { deliveryType } : {}),
      };

      // 3. Save to Supabase
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
      let errMsg = err?.message || 'กรุณาลองใหม่อีกครั้ง';
      if (errMsg.includes('Missing or insufficient permissions')) {
        errMsg = 'สิทธิ์ไม่เพียงพอ (โปรดตรวจสอบว่าได้อัปเดต Rules ล่าสุดใน Firebase Console แล้ว หรือขนาดรูปภาพไม่เกินที่กำหนด)';
      }
      error(`เกิดข้อผิดพลาดในการบันทึก: ${errMsg}`);
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
                      setDownloadUrl('https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing');
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
          {/* Image Upload Box (Up to 5 images) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  รูปภาพสินค้า (Product Images)
                </h3>
                <p className="text-[11px] text-slate-400">
                  ใส่ได้สูงสุด 5 รูป (รูปแรกจะเป็นรูปหน้าปกหลัก)
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                  imagesList.length >= 5
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}
              >
                {imagesList.length} / 5 รูป
              </span>
            </div>

            {/* Hidden multi-file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
              multiple
              className="hidden"
            />

            {/* Empty state if 0 images */}
            {imagesList.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 overflow-hidden flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition-colors mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  คลิกเพื่ออัปโหลดรูปภาพ
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  เลือกรูปภาพได้สูงสุด 5 รูปพร้อมกัน
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  รองรับ JPG, PNG, GIF, WEBP
                </p>
              </div>
            )}

            {/* Gallery Display if >= 1 image */}
            {imagesList.length > 0 && (
              <div className="space-y-3">
                {/* Primary Image Preview (Item 0) */}
                <div className="relative w-full aspect-square rounded-2xl border-2 border-cyan-500/50 bg-slate-950/80 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center group">
                  <SafeImage
                    src={imagesList[0].url}
                    alt="Primary Image Preview"
                    fill
                    className="object-contain p-3"
                  />

                  {/* Primary Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-current" /> รูปหลัก (หน้าปก)
                    </span>
                  </div>

                  {/* Animated GIF badge */}
                  {(imagesList[0].url.includes('.gif') || imagesList[0].url.startsWith('data:image/gif')) && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                        🎬 ANIMATED GIF
                      </span>
                    </div>
                  )}

                  {/* Delete primary image button */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(0)}
                      className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/80 shadow-md cursor-pointer transition-colors"
                      title="ลบรูปภาพหลักนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid of all 5 slots / thumbnails */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    รายการรูปภาพสินค้า ({imagesList.length}/5 รูป)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {imagesList.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`relative aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 transition-all group ${
                          idx === 0
                            ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-md'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <SafeImage
                          src={item.url}
                          alt={`Image ${idx + 1}`}
                          fill
                          className="object-cover"
                        />

                        {/* Number indicator */}
                        <div className="absolute top-1 left-1 z-10">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                              idx === 0 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900/90 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </div>

                        {/* Hover overlay with action buttons */}
                        <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1 z-20">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              title="ตั้งเป็นรูปหลัก"
                              className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 transition-colors cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="ลบรูปนี้"
                            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Empty slot placeholders up to 5 */}
                    {Array.from({ length: Math.max(0, 5 - imagesList.length) }).map((_, placeholderIdx) => (
                      <button
                        key={`empty-${placeholderIdx}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center text-slate-600 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="คลิกเพื่อเพิ่มรูปภาพ"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[9px] mt-0.5">#{imagesList.length + placeholderIdx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Upload more button if < 5 */}
            {imagesList.length < 5 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>+ เพิ่มรูปภาพจากเครื่อง (เพิ่มได้อีก {5 - imagesList.length} รูป)</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>ครบ 5 รูปแล้ว (เต็มจำนวนสูงสุด)</span>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>กำลังอัปโหลดรูปภาพ...</span>
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
            {imagesList.length < 5 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-slate-400">
                    หรือเพิ่มรูปภาพจาก URL / ลิงก์ตรง:
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddUrl('/products/duck.gif')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 transition-all font-medium"
                  >
                    🦆 + เพิ่มเป็ดเต้น (/products/duck.gif)
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    placeholder="https://... หรือ /products/duck.gif"
                    className="w-full bg-slate-950/80 text-xs text-slate-200 rounded-xl px-3 py-2 border border-slate-800 focus:border-cyan-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddUrl()}
                    disabled={!urlInput.trim()}
                    className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    + เพิ่ม
                  </button>
                </div>
              </div>
            )}
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
