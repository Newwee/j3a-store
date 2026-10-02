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
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createOrder } from '@/lib/firestore/orders';
import { PaymentMethod } from '@/types/order';
import { PaymentService } from '@/lib/services/payment';
import { formatCurrency } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadProductImage } from '@/lib/storage/upload';
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/firestore/settings';
import { StoreSettings } from '@/types/settings';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { success, error, toast } = useToast();

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');

  // Payment Slip Upload state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const userCredits = profile?.credits || 0;
  const canPayWithWallet = userCredits >= total;

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
    if (!phone.trim()) errs.phone = 'กรุณาระบุเบอร์โทรศัพท์สำหรับรับ SMS/ติดต่อ';
    if (!address.trim()) errs.address = 'กรุณาระบุข้อมูลการจัดส่ง';

    if (paymentMethod === 'wallet' && !canPayWithWallet) {
      errs.payment = 'ยอดเครดิตในบัญชีของคุณไม่เพียงพอ กรุณาเลือกวิธีอื่นหรือเติมเงิน';
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Upload payment slip if provided
      let slipUrl: string | undefined = undefined;
      if (slipFile) {
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

      // 2. Prepare Order Payload
      const orderData: any = {
        userId: user ? user.uid : 'guest',
        customer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
        subtotal,
        shipping,
        discount: 0,
        total,
        paymentMethod,
        ...(slipUrl ? { paymentProofUrl: slipUrl } : {}),
      };

      // 3. Save order to Firestore
      const created = await createOrder(orderData);

      // 4. Trigger celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // 5. Clear cart
      clearCart();

      success(`สร้างคำสั่งซื้อ #${created.orderNumber} สำเร็จแล้ว!`);
      router.push(`/orders/${created.id}`);
    } catch (err: any) {
      console.error('Error placing order:', err);
      error(`เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const promptpayNumber = storeSettings.promptpay || process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '081-234-5678';

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
                    label="เบอร์โทรศัพท์ *"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812345678"
                    error={formErrors.phone}
                    required
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
                  {/* Option 1: PromptPay QR */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'promptpay'
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="promptpay"
                      checked={paymentMethod === 'promptpay'}
                      onChange={() => setPaymentMethod('promptpay')}
                      className="mt-1 accent-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold text-white">
                          พร้อมเพย์ (PromptPay QR) — สแกนจ่ายอัตโนมัติ
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        รองรับทุกแอปธนาคารไทย (KBank, SCB, KTB, BBL ฯลฯ) ไม่มีค่าธรรมเนียม
                      </p>

                      {/* Expanded promptpay details */}
                      {paymentMethod === 'promptpay' && (
                        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">เบอร์พร้อมเพย์:</span>
                            <span className="font-mono font-bold text-cyan-400 text-sm">
                              {promptpayNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">ชื่อบัญชี:</span>
                            <span className="font-bold text-white">{storeSettings.storeName || 'J3A STORE Co., Ltd.'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">ยอดชำระ:</span>
                            <span className="font-bold text-emerald-400 text-base">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Option 2: Bank Transfer */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="mt-1 accent-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold text-white">
                          โอนผ่านเลขบัญชีธนาคาร (Bank Transfer)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        กสิกรไทย (KBANK) 123-4-56789-0 ชื่อบัญชี บจก. เจทรีเอ สโตร์
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Store Wallet Balance */}
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'wallet'
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="mt-1 accent-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white">
                            ยอดเครดิตในบัญชี (Store Credits)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-cyan-400">
                          คงเหลือ {formatCurrency(userCredits)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        หักเงินจากยอดเครดิตคงเหลือของคุณทันที
                      </p>
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
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>ยอดชำระสุทธิ</span>
                    <span className="text-2xl font-black text-cyan-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isProcessing}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)]"
                >
                  ยืนยันคำสั่งซื้อ ({formatCurrency(total)})
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
