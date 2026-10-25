'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowRight,
  Upload,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Tag,
  Gift,
  Check,
  Percent,
  X,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { createOrder } from '@/lib/firestore/orders';
import { deductUserCredits } from '@/lib/firestore/users';
import { validateDiscountCode, redeemCodeForUser, recordDiscountUsage, CodeType } from '@/lib/firestore/redeem';
import { PaymentMethod } from '@/types/order';
import { PaymentService } from '@/lib/services/payment';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadProductImage } from '@/lib/storage/upload';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';
import { StoreSettings } from '@/types/settings';
import { LicenseAgreementCard } from '@/components/license/LicenseAgreementCard';
import SlideCommit from '@/components/ui/SlideCommit';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const { success, error, info, toast } = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await getStoreSettings();
        setStoreSettings(s);
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    }
    loadSettings();
  }, []);

  // Form Fields
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState('จัดส่งดิจิทัลทันทีผ่านระบบ / Email');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');

  // Coupon / Discount Code state
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    codeType: CodeType;
    amount: number;
    percent?: number;
    minSpend?: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [creditOffer, setCreditOffer] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [isRedeemingCredit, setIsRedeemingCredit] = useState(false);

  // Sync profile when auth state updates
  useEffect(() => {
    if (profile) {
      if (!name && (profile.displayName || user?.displayName)) {
        setName(profile.displayName || user?.displayName || '');
      }
      if (!email && (profile.email || user?.email)) {
        setEmail(profile.email || user?.email || '');
      }
      if (!phone && profile.phone) {
        setPhone(profile.phone || '');
      }
    }
  }, [profile, user]);

  // Payment Slip Upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check if any cart item requires software license agreement
  const hasLicenseItem = items.some((item) => {
    const dType = item.product.deliveryType;
    if (dType === 'key' || dType === 'both') return true;
    const name = (item.product.name || '').toLowerCase();
    const slug = (item.product.slug || '').toLowerCase();
    const cat = (item.product.category || '').toLowerCase();
    const tags = Array.isArray(item.product.tags) ? item.product.tags.map((t) => t.toLowerCase()) : [];
    return (
      name.includes('discord') ||
      name.includes('license') ||
      slug.includes('discord') ||
      slug.includes('license') ||
      slug.includes('quest') ||
      slug.includes('manager') ||
      slug.includes('profile') ||
      cat.includes('ซอฟต์แวร์') ||
      cat.includes('software') ||
      tags.includes('license') ||
      tags.includes('software') ||
      tags.includes('discord-profile')
    );
  });
  const [isLicenseAgreed, setIsLicenseAgreed] = useState(false);

  const userCredits = profile?.credits || 0;

  // Calculate discount and final payable total
  const discountAmount = appliedDiscount
    ? (appliedDiscount.codeType === 'discount_percent' && appliedDiscount.percent
        ? Math.round((subtotal * appliedDiscount.percent) / 100)
        : Math.min(subtotal, appliedDiscount.amount))
    : 0;

  const finalTotal = Math.max(0, subtotal + shipping - discountAmount);
  const canPayWithWallet = userCredits >= finalTotal;

  // Coupon Handlers
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      setCouponMessage({ type: 'error', text: 'กรุณากรอกรหัสโค้ด' });
      return;
    }

    setIsApplyingCoupon(true);
    setCouponMessage(null);
    setCreditOffer(null);

    try {
      const res = await validateDiscountCode(clean, subtotal, user?.uid);
      if (res.valid && res.discountAmount !== undefined) {
        setAppliedDiscount({
          code: res.code || clean,
          codeType: res.codeType || 'discount_fixed',
          amount: res.discountAmount,
          percent: res.discountPercent,
          minSpend: res.minSpend,
        });
        setCouponMessage({
          type: 'success',
          text: res.message || `ใช้โค้ดส่วนลด "${clean}" สำเร็จ!`,
        });
        success(`ใช้โค้ดส่วนลดสำเร็จ! คุณได้รับส่วนลด ฿${res.discountAmount}`);
      } else if (res.isCreditCode && res.creditAmount) {
        setCreditOffer({
          code: res.code || clean,
          amount: res.creditAmount,
        });
        setCouponMessage({
          type: 'info',
          text: `โค้ดนี้คือ "โค้ดของขวัญแจกเครดิต" (มูลค่า ฿${res.creditAmount}) สามารถกดปุ่มด้านล่างเพื่อแลกรับเข้ากระเป๋าเงินทันที!`,
        });
      } else {
        setCouponMessage({
          type: 'error',
          text: res.message || 'โค้ดส่วนลดไม่ถูกต้องหรือไม่สามารถใช้งานได้',
        });
      }
    } catch (err: any) {
      setCouponMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการตรวจสอบโค้ด',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponInput('');
    setCouponMessage(null);
    setCreditOffer(null);
    info('ลบโค้ดส่วนลดออกจากคำสั่งซื้อนี้แล้ว');
  };

  const handleDirectRedeemCredit = async () => {
    if (!user) {
      error('กรุณาเข้าสู่ระบบก่อนแลกโค้ดของขวัญ');
      return;
    }
    if (!creditOffer) return;

    setIsRedeemingCredit(true);
    try {
      const res = await redeemCodeForUser(creditOffer.code, user.uid);
      if (res.success) {
        success(res.message || `แลกเครดิตสำเร็จ ฿${res.amount || creditOffer.amount} เข้ากระเป๋าแล้ว!`);
        if (refreshProfile) {
          await refreshProfile();
        }
        setCreditOffer(null);
        setCouponInput('');
        setCouponMessage({
          type: 'success',
          text: `แลกรับเครดิต ฿${res.amount || creditOffer.amount} เข้ากระเป๋าสำเร็จแล้ว! นำยอดเงินนี้มาจ่ายบิลนี้ได้ทันที`,
        });
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}
      } else {
        error(res.message || 'แลกโค้ดไม่สำเร็จ');
        setCouponMessage({
          type: 'error',
          text: res.message || 'แลกโค้ดไม่สำเร็จ',
        });
      }
    } catch (err: any) {
      error(err.message || 'เกิดข้อผิดพลาดในการแลกโค้ด');
    } finally {
      setIsRedeemingCredit(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">กำลังเตรียมข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">ไม่มีสินค้าที่ต้องชำระเงิน</h2>
        <p className="text-xs text-slate-400">กรุณาเลือกสินค้าลงตะกร้าก่อนดำเนินการชำระเงิน</p>
        <Link href="/shop">
          <Button variant="neon" size="md">
            ไปยังหน้าร้านค้า
          </Button>
        </Link>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'กรุณาระบุชื่อ-นามสกุล';
    if (!email.trim() || !email.includes('@')) errs.email = 'กรุณาระบุอีเมลที่ถูกต้อง';
    if (!address.trim()) errs.address = 'กรุณาระบุข้อมูลการจัดส่ง';

    if (paymentMethod === 'wallet' && !canPayWithWallet) {
      errs.payment = 'ยอดเครดิตในบัญชีของคุณไม่เพียงพอ กรุณาเลือกวิธีอื่นหรือเติมเงิน';
    }

    if (hasLicenseItem && !isLicenseAgreed) {
      errs.license = 'กรุณายอมรับเงื่อนไข 1 คีย์ต่อ 1 เครื่อง และนโยบายความเป็นส่วนตัว ก่อนดำเนินการชำระเงิน';
    }

    const bundleOutOfStock = items.find(
      (item) =>
        item.product.tags?.includes('bundle_item_out_of_stock') ||
        (item.product.id.startsWith('bundle_') && item.product.stock <= 0)
    );
    if (bundleOutOfStock) {
      errs.bundle = `ไม่สามารถทำรายการได้ เนื่องจากแพ็กเกจ "${bundleOutOfStock.product.name}" มีสินค้าใน Bundle หมด`;
    }

    const singleOutOfStock = items.find(
      (item) =>
        !item.product.id.startsWith('bundle_') &&
        (item.product.stock <= 0 || item.product.status === 'out_of_stock')
    );
    if (singleOutOfStock) {
      errs.stock = `ไม่สามารถทำรายการได้ เนื่องจากสินค้า "${singleOutOfStock.product.name}" หมดสต็อกชั่วคราว`;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const executeOrderPayment = async () => {
    if (!validate()) {
      const firstError = Object.values(formErrors)[0];
      const errMsg = firstError || 'กรุณากรอกข้อมูลที่จำเป็นและยอมรับเงื่อนไขให้ครบถ้วน';
      error(errMsg);
      throw new Error(errMsg);
    }

    setIsProcessing(true);
    showLoading(paymentMethod === 'wallet' ? 'กำลังตัดยอดเครดิตและสร้างคำสั่งซื้อ...' : 'กำลังประมวลผลคำสั่งซื้อและส่งข้อมูล...');

    try {
      // 1. Process Wallet Payment Deduction
      if (paymentMethod === 'wallet') {
        if (!user) {
          const errMsg = 'กรุณาเข้าสู่ระบบก่อนทำการชำระเงินด้วยยอดเงินในเว็บไซต์';
          error(errMsg);
          throw new Error(errMsg);
        }
        if (userCredits < finalTotal) {
          const errMsg = `ยอดเงินคงเหลือในเว็บไซต์ไม่เพียงพอ (คงเหลือ ฿${userCredits}) กรุณาเติมเงินก่อนทำรายการ`;
          error(errMsg);
          throw new Error(errMsg);
        }

        // Deduct user credits in Firestore
        if (finalTotal > 0) {
          await deductUserCredits(user.uid, finalTotal);
        }
        if (refreshProfile) {
          await refreshProfile();
        }
      }

      // 2. Upload payment slip if provided (only for bank transfer / QR)
      let slipUrl: string | undefined = undefined;
      if (paymentMethod !== 'wallet' && slipFile) {
        try {
          const uploadRes = await uploadProductImage(slipFile, 'slips');
          slipUrl = uploadRes.downloadUrl;
        } catch (slipErr) {
          console.warn('Could not upload slip to Firebase Storage, using compressed fallback:', slipErr);
          try {
            const { compressImageToDataUrl } = await import('@/lib/utils/image');
            slipUrl = await compressImageToDataUrl(slipFile);
          } catch {
            slipUrl = undefined;
          }
        }
      }

      // 3. Auto-claim License Keys (1:1 per product and quantity) if paying via wallet
      let claimedKeys: any[] = [];
      let allClaimedKeysString: string | undefined = undefined;

      if (hasLicenseItem && (paymentMethod === 'wallet' || finalTotal === 0)) {
        try {
          const licenseItemsPayload = items
            .filter(
              (it) =>
                it.product.deliveryType === 'key' ||
                it.product.deliveryType === 'both' ||
                it.product.slug.includes('manager') ||
                it.product.slug.includes('profile') ||
                it.product.slug.includes('quest') ||
                it.product.slug.includes('autoquest')
            )
            .map((it) => ({
              productId: it.product.id,
              name: it.product.name,
              slug: it.product.slug,
              quantity: it.quantity,
              deliveryType: it.product.deliveryType,
            }));

          const claimRes = await fetch('/api/license/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerEmail: email.trim(),
              items: licenseItemsPayload,
            }),
          });
          const claimData = await claimRes.json();
          if (claimData.ok && Array.isArray(claimData.keys) && claimData.keys.length > 0) {
            claimedKeys = claimData.keys;
            allClaimedKeysString = claimData.keys.map((k: any) => k.key).join(', ');
          } else if (claimData.ok && claimData.key) {
            allClaimedKeysString = claimData.key;
          }
        } catch (claimErr) {
          console.warn('Could not pre-claim license keys during checkout:', claimErr);
        }
      }

      // 4. Prepare Order Payload
      const resolvedItems = await Promise.all(
        items.map(async (item) => {
          let latestUrl = item.product.downloadUrl;
          let latestNote = item.product.deliveryNote;
          let latestType = item.product.deliveryType;
          try {
            const { getProductById, getProductBySlug } = await import('@/lib/firestore/products');
            const live = (await getProductById(item.product.id)) || (await getProductBySlug(item.product.slug));
            if (live?.downloadUrl) latestUrl = live.downloadUrl;
            if (live?.deliveryNote) latestNote = live.deliveryNote;
            if (live?.deliveryType) latestType = live.deliveryType;
          } catch {}
          if (latestUrl && latestUrl.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
            latestUrl = 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing';
          }

          // Match keys claimed for this specific product item
          const itemMatchingKeys = claimedKeys
            .filter((k) => k.productId === item.product.id || k.productSlug === item.product.slug)
            .map((k) => k.key);

          return {
            productId: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
            ...(latestUrl ? { downloadUrl: latestUrl } : {}),
            ...(latestNote ? { deliveryNote: latestNote } : {}),
            ...(latestType ? { deliveryType: latestType } : {}),
            ...(itemMatchingKeys.length > 0
              ? { licenseKeys: itemMatchingKeys, licenseKey: itemMatchingKeys[0] }
              : {}),
          };
        })
      );

      const orderData: any = {
        userId: user ? user.uid : 'guest',
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        items: resolvedItems,
        subtotal,
        shipping,
        discount: discountAmount,
        ...(appliedDiscount ? { discountCode: appliedDiscount.code } : {}),
        total: finalTotal,
        paymentMethod,
        status: (paymentMethod === 'wallet' || finalTotal === 0) ? 'completed' : 'pending',
        ...(allClaimedKeysString ? { transactionRef: allClaimedKeysString } : {}),
        ...(slipUrl ? { paymentProofUrl: slipUrl } : {}),
      };

      // 5. Save order to Supabase
      const created = await createOrder(orderData);

      // 5.1 Deduct stock in Supabase (automatically turns to out_of_stock if stock hits 0)
      try {
        await fetch('/api/orders/deduct-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: created.id,
            items: resolvedItems,
          }),
        });
      } catch (stockErr) {
        console.warn('Failed to deduct stock:', stockErr);
      }

      // 5.2 Dispatch Discord Order Notification (୨-💾-୧-⁺-˖-credits)
      try {
        const itemsSummary = resolvedItems.map((i: any) => `${i.productName} x${i.quantity || 1}`).join(', ');
        await fetch('/api/notifications/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'order_placed',
            data: {
              orderNumber: created.orderNumber || created.id,
              userName: name.trim() || user?.displayName || 'ลูกค้า',
              userEmail: user?.email || email || '',
              itemsSummary,
              totalAmount: finalTotal,
              subtotal: subtotal,
              discount: discountAmount,
              discountCode: appliedDiscount?.code,
              paymentMethod: paymentMethod,
            },
          }),
          signal: AbortSignal.timeout(4000),
        });
      } catch (orderNotifyErr) {
        console.warn('Discord order notify error:', orderNotifyErr);
      }

      // 5.3 If order was paid via bank transfer slip, alert admin slip channel (୨-💳-୧-⁺-˖-สลิปรออนุมัติ)
      if (slipUrl) {
        try {
          await fetch('/api/notifications/discord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'slip_submitted',
              data: {
                topupNumber: `ORDER-${created.orderNumber || created.id}`,
                userName: name.trim() || user?.displayName || 'ลูกค้า',
                userEmail: user?.email || email || '',
                amount: finalTotal,
                slipUrl: slipUrl,
              },
            }),
            signal: AbortSignal.timeout(4000),
          });
        } catch (slipNotifyErr) {
          console.warn('Discord order slip notify error:', slipNotifyErr);
        }
      }

      // Record coupon usage if discount applied
      if (appliedDiscount?.code) {
        recordDiscountUsage(appliedDiscount.code, user?.uid).catch((err) =>
          console.warn('Failed to record discount code usage:', err)
        );
      }

      // 6. Trigger celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // 7. Clear cart
      clearCart();

      success(
        paymentMethod === 'wallet'
          ? `ชำระเงินสำเร็จผ่านยอดเงินในเว็บ! สร้างคำสั่งซื้อ #${created.orderNumber} สำเร็จแล้ว`
          : `สร้างคำสั่งซื้อ #${created.orderNumber} สำเร็จแล้ว!`
      );
      router.push(`/orders/${created.id}`);
      return created;
    } catch (err: any) {
      console.error('Error placing order:', err);
      error(`เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
      throw err;
    } finally {
      setIsProcessing(false);
      hideLoading();
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeOrderPayment();
    } catch {}
  };

  const promptpayNumber = storeSettings.promptpay || process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '081-234-5678';

  const bundleOutOfStockItem = items.find(
    (item) =>
      item.product.tags?.includes('bundle_item_out_of_stock') ||
      (item.product.id.startsWith('bundle_') && item.product.stock <= 0)
  );

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Lock className="w-6 h-6 text-cyan-400" />
            <span>เช็คเอาท์และชำระเงิน (Checkout)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            กรอกข้อมูลผู้รับและเลือกช่องทางการชำระเงินเพื่อเสร็จสิ้นคำสั่งซื้อ
          </p>
        </div>

        {bundleOutOfStockItem && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-xs shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-rose-300">ไม่สามารถทำรายการชำระเงินได้</p>
              <p className="text-slate-300 leading-relaxed">
                แพ็กเกจ <strong>"{bundleOutOfStockItem.product.name}"</strong> มีสินค้าใน Bundle หมด จึงไม่สามารถสั่งซื้อได้ กรุณาลบแพ็กเกจนี้ออกจากตะกร้าก่อนทำรายการ
              </p>
              <Link href="/cart" className="inline-block mt-1 font-bold text-cyan-400 hover:underline">
                ← กลับไปจัดการตะกร้าสินค้า
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer Form & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Customer Information Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>ข้อมูลผู้สั่งซื้อ (Customer Information)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="ชื่อ-นามสกุล *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="สมชาย ใจดี"
                    error={formErrors.name}
                    required
                  />
                  <Input
                    label="เบอร์โทรศัพท์ (ไม่บังคับ)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812345678 (เว้นว่างได้)"
                    error={formErrors.phone}
                  />
                </div>

                <Input
                  label="อีเมล (สำหรับรับรหัส/ใบเสร็จ) *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  error={formErrors.email}
                  required
                />

                <Input
                  label="ข้อมูลการจัดส่ง / UID ในเกม *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ระบุ UID ในเกม หรือช่องทางจัดส่งดิจิทัล"
                  error={formErrors.address}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    หมายเหตุเพิ่มเติม (ถ้ามี)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="ข้อความถึงผู้ขาย หรือรายละเอียดที่ต้องการเพิ่มเติม..."
                    className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl p-3 border border-slate-800 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              {/* 2. Payment Method Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>เลือกช่องทางชำระเงิน (Payment Method)</span>
                </h3>

                {formErrors.payment && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.payment}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Option 1: Scan QR (Coming soon) */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="paymentMethod"
                      disabled
                      className="mt-1 accent-cyan-400 cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-300">
                            1. สแกนจ่ายตรงนั้น (PromptPay QR)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Coming Soon (เร็วๆ นี้)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ระบบสแกนชำระเงินอัตโนมัติผ่าน QR พร้อมเพย์ (กำลังเปิดให้บริการ)
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Bank Transfer (Coming soon) */}
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="paymentMethod"
                      disabled
                      className="mt-1 accent-cyan-400 cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-300">
                            2. โอนเงินผ่านเลขบัญชี (Bank Transfer)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Coming Soon (เร็วๆ นี้)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        โอนผ่านบัญชีธนาคารและแนบสลิปเพื่อตรวจสอบ (กำลังเปิดให้บริการ)
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Store Wallet Balance (Active) */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'wallet'
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="mt-1 accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white">
                            3. ตัดจากเงินที่เติมเข้าไปในเว็บ (Store Wallet)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          คงเหลือ {formatCurrency(userCredits)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        หักเงินจากยอดเครดิตคงเหลือในบัญชีของคุณทันที รวดเร็ว ปลอดภัย 100%
                      </p>

                      {!user ? (
                        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                          <span>กรุณาเข้าสู่ระบบเพื่อใช้ยอดเงินในบัญชี</span>
                          <Link href="/login?redirect=/checkout">
                            <Button variant="secondary" size="sm" className="text-xs">
                              เข้าสู่ระบบ
                            </Button>
                          </Link>
                        </div>
                      ) : !canPayWithWallet ? (
                        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                          <span>ยอดเงินในบัญชีไม่พอ (ขาดอีก {formatCurrency(finalTotal - userCredits)})</span>
                          <Link href="/profile?tab=topup">
                            <Button variant="neon" size="sm" className="text-xs">
                              เติมเงินเข้าเว็บ
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ยอดเงินคงเหลือเพียงพอสำหรับคำสั่งซื้อนี้</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Slip upload (For promptpay and bank transfer) */}
                {(paymentMethod === 'promptpay' || paymentMethod === 'bank_transfer') && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      แนบสลิปหรือหลักฐานการโอน (ไม่บังคับ แต่ช่วยให้ตรวจสอบเร็วขึ้น):
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer flex items-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>เลือกรูปสลิป</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipChange}
                          className="hidden"
                        />
                      </label>
                      {slipFile && (
                        <span className="text-xs text-cyan-400 truncate max-w-xs">
                          {slipFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. License Agreement Card (Pre-Purchase Disclaimer & Agreement) */}
              {hasLicenseItem && (
                <div className="space-y-2">
                  <LicenseAgreementCard
                    isAgreed={isLicenseAgreed}
                    onAgreementChange={setIsLicenseAgreed}
                  />
                  {formErrors.license && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formErrors.license}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Order Summary & Place Order Button */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5 sticky top-28">
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>สรุปรายการสั่งซื้อ</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {items.length} รายการ
                  </span>
                </h3>

                {/* Items List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-3 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 shrink-0 overflow-hidden">
                        <Image
                          src={item.product.image || '/logo.png'}
                          alt={item.product.name}
                          fill
                          unoptimized={Boolean(item.product.image?.startsWith('data:'))}
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatCurrency(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-cyan-400" />
                      <span>โค้ดส่วนลด / โค้ดของขวัญ</span>
                    </label>
                    {appliedDiscount && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> ใช้งานอยู่
                      </span>
                    )}
                  </div>

                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponMessage) setCouponMessage(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="กรอกโค้ดส่วนลด"
                          className="w-full bg-slate-950 text-xs font-mono font-bold tracking-wider text-white uppercase placeholder:text-slate-500 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        isLoading={isApplyingCoupon}
                        onClick={() => handleApplyCoupon()}
                        className="px-4 text-xs font-bold border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white shrink-0"
                      >
                        ใช้โค้ด
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-slate-950 border border-emerald-500/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-emerald-300 tracking-wider">
                              {appliedDiscount.code}
                            </span>
                            {appliedDiscount.percent && (
                              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded font-bold">
                                -{appliedDiscount.percent}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300">
                            ลดทันที {formatCurrency(discountAmount)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-all"
                        title="ยกเลิกโค้ดนี้"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ยกเลิก</span>
                      </button>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {couponMessage && (
                    <div
                      className={`text-xs p-2.5 rounded-xl border flex items-start gap-2 ${
                        couponMessage.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : couponMessage.type === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      {couponMessage.type === 'success' ? (
                        <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : couponMessage.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      ) : (
                        <Gift className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p>{couponMessage.text}</p>

                        {/* Direct Credit Redeem Offer Button */}
                        {creditOffer && (
                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={handleDirectRedeemCredit}
                              disabled={isRedeemingCredit}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>
                                {isRedeemingCredit
                                  ? 'กำลังแลกเครดิต...'
                                  : `กดแลก ฿${creditOffer.amount} เข้ากระเป๋าตอนนี้`}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotals & Fees */}
                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า</span>
                    <span className="text-slate-200 font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่าจัดส่ง / ค่าบริการ</span>
                    <span className="text-slate-200 font-medium">
                      {shipping === 0 ? (
                        <span className="text-emerald-400">ฟรี</span>
                      ) : (
                        formatCurrency(shipping)
                      )}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>ส่วนลดจากโค้ด ({appliedDiscount?.code})</span>
                      </span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>ยอดชำระสุทธิ</span>
                    <span className="text-2xl font-black text-cyan-400">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA */}
                {hasLicenseItem && !isLicenseAgreed && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>โปรดกดยอมรับเงื่อนไข 1 คีย์ต่อ 1 เครื่อง ด้านซ้ายก่อนดำเนินการชำระเงิน</span>
                  </div>
                )}

                {/* Slide to Pay Interactive Action */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="w-full flex justify-center">
                    <SlideCommit
                      label={`เลื่อนเพื่อชำระเงิน (${formatCurrency(finalTotal)})`}
                      doneLabel="ชำระเงินสำเร็จแล้ว!"
                      errorLabel="ข้อมูลไม่ครบถ้วน หรือมีข้อผิดพลาด"
                      onConfirm={async () => {
                        return await executeOrderPayment();
                      }}
                      onDone={() => {}}
                      onError={(err) => {
                        console.error('Payment rejected:', err);
                      }}
                      trackColor="#090d16"
                      handleColor="#06b6d4"
                      successColor="#10b981"
                      dangerColor="#ef4444"
                      width="100%"
                      height={54}
                      radius={27}
                      disabled={isProcessing || (hasLicenseItem && !isLicenseAgreed)}
                    />
                  </div>
                  <div className="w-full flex items-center gap-3 my-3">
                    <div className="h-px bg-slate-800 flex-1" />
                    <span className="text-[11px] text-slate-500 font-medium">หรือกดยืนยันผ่านปุ่ม</span>
                    <div className="h-px bg-slate-800 flex-1" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isProcessing || (hasLicenseItem && !isLicenseAgreed)}
                  isLoading={isProcessing}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className={`w-full font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] ${
                    hasLicenseItem && !isLicenseAgreed
                      ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 shadow-none border-slate-700'
                      : ''
                  }`}
                >
                  ดำเนินการชำระเงิน ({formatCurrency(finalTotal)})
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ระบบบันทึกคำสั่งซื้อลง Cloud Firestore ทันที</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
