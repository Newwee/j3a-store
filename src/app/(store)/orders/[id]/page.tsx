'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Upload,
  Package,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Order } from '@/types/order';
import { Review } from '@/types/review';
import { getOrderById, updatePaymentProof } from '@/lib/firestore/orders';
import { uploadProductImage } from '@/lib/storage/upload';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import PeekRating from '@/components/ui/PeekRating';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LicenseKeyDelivery, getDownloadUrlForProduct } from '@/components/license/LicenseKeyDelivery';
import { submitProductReview, updateProductReview, deleteReview, getUserReviews } from '@/lib/firestore/reviews';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { user } = useAuth();
  const { success, error } = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<File | null>(null);

  // Review Modal State
  const [reviewItem, setReviewItem] = useState<{
    productId?: string;
    slug?: string;
    name: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviewsMap, setUserReviewsMap] = useState<Record<string, Review>>({});


  useEffect(() => {
    let isMounted = true;
    async function fetchOrder() {
      try {
        const data = await getOrderById(orderId);
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const [liveProducts, setLiveProducts] = useState<Record<string, { downloadUrl?: string; deliveryNote?: string }>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadLiveProducts() {
      try {
        const { getProducts } = await import('@/lib/firestore/products');
        const prods = await getProducts();
        if (isMounted && prods && prods.length > 0) {
          const map: Record<string, { downloadUrl?: string; deliveryNote?: string }> = {};
          for (const p of prods) {
            if (p.id) map[p.id.toLowerCase()] = { downloadUrl: p.downloadUrl, deliveryNote: p.deliveryNote };
            if (p.slug) map[p.slug.toLowerCase()] = { downloadUrl: p.downloadUrl, deliveryNote: p.deliveryNote };
            if (p.name) map[p.name.toLowerCase()] = { downloadUrl: p.downloadUrl, deliveryNote: p.deliveryNote };
          }
          setLiveProducts(map);
        }
      } catch {}
    }
    loadLiveProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const syncedItems = useMemo(() => {
    if (!order?.items) return [];
    return order.items.map((it) => {
      const pid = (it.productId || '').toLowerCase();
      const pslug = (it.slug || '').toLowerCase();
      const pname = (it.name || '').toLowerCase();
      const live = liveProducts[pid] || liveProducts[pslug] || liveProducts[pname];
      let url = live?.downloadUrl || it.downloadUrl;
      let note = live?.deliveryNote || it.deliveryNote;
      if (url && url.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
        url = 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing';
      }
      return {
        ...it,
        downloadUrl: url,
        deliveryNote: note,
      };
    });
  }, [order?.items, liveProducts]);

  const handleUploadSlip = async () => {
    if (!selectedSlip || !order) return;
    setUploadingSlip(true);
    showLoading('กำลังอัปโหลดสลิปหลักฐานการชำระเงิน...');
    try {
      const { downloadUrl } = await uploadProductImage(selectedSlip, 'slips');
      await updatePaymentProof(order.id, downloadUrl);
      setOrder((prev) => (prev ? { ...prev, paymentProofUrl: downloadUrl, status: 'paid' } : null));
      success('อัปโหลดหลักฐานการชำระเงินเรียบร้อยแล้ว');
      setSelectedSlip(null);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการอัปโหลด: ${err.message || 'กรุณาลองใหม่'}`);
    } finally {
      setUploadingSlip(false);
      hideLoading();
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadUserReviews() {
      if (!user?.uid) return;
      try {
        const revs = await getUserReviews(user.uid);
        if (isMounted && revs) {
          const map: Record<string, Review> = {};
          for (const r of revs) {
            if (r.productId) map[r.productId.toLowerCase()] = r;
            if (r.productSlug) map[r.productSlug.toLowerCase()] = r;
            if (r.productName) map[r.productName.toLowerCase()] = r;
          }
          setUserReviewsMap(map);
        }
      } catch (err) {
        console.warn('Could not load user reviews:', err);
      }
    }
    loadUserReviews();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem || !order || !user) {
      error('กรุณาเข้าสู่ระบบก่อนให้คะแนน');
      return;
    }
    if (!reviewComment.trim()) {
      error('กรุณากรอกข้อความรีวิวสินค้า');
      return;
    }

    setSubmittingReview(true);
    const pid = (reviewItem.productId || reviewItem.slug || 'product').toLowerCase();
    const pslug = (reviewItem.slug || '').toLowerCase();
    const pname = (reviewItem.name || '').toLowerCase();

    try {
      if (editingReviewId) {
        // Edit existing review
        const updated = await updateProductReview({
          reviewId: editingReviewId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        success(`แก้ไขคะแนนและรีวิวสินค้า "${reviewItem.name}" เรียบร้อยแล้ว ขอบคุณมากครับ!`);
        setUserReviewsMap((prev) => ({
          ...prev,
          [pid]: updated,
          ...(pslug ? { [pslug]: updated } : {}),
          ...(pname ? { [pname]: updated } : {}),
        }));
        setReviewItem(null);
        setEditingReviewId(null);
        setReviewComment('');
      } else {
        // Submit new review
        const created = await submitProductReview({
          productId: reviewItem.productId || reviewItem.slug || 'product',
          productSlug: reviewItem.slug,
          productName: reviewItem.name,
          orderId: order.id,
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'ผู้ซื้อที่ผ่านการยืนยัน',
          userPhoto: user.photoURL || undefined,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        success(`บันทึกคะแนนและรีวิวสินค้า "${reviewItem.name}" เรียบร้อยแล้ว ขอบคุณมากครับ!`);
        setUserReviewsMap((prev) => ({
          ...prev,
          [pid]: created,
          ...(pslug ? { [pslug]: created } : {}),
          ...(pname ? { [pname]: created } : {}),
        }));
        setReviewItem(null);
        setEditingReviewId(null);
        setReviewComment('');
      }
    } catch (err: any) {
      console.error('Error submitting/updating review:', err);
      const errMsg = err.message || 'เกิดข้อผิดพลาดในการบันทึกรีวิว';
      error(errMsg);

      // If user already reviewed, close create modal and refresh review list so they see the review!
      if (errMsg.includes('คุณได้ให้คะแนนสินค้านี้เรียบร้อยแล้ว')) {
        setReviewItem(null);
        setEditingReviewId(null);
        if (user?.uid) {
          getUserReviews(user.uid).then((revs) => {
            const map: Record<string, Review> = {};
            for (const r of revs) {
              if (r.productId) map[r.productId.toLowerCase()] = r;
              if (r.productSlug) map[r.productSlug.toLowerCase()] = r;
              if (r.productName) map[r.productName.toLowerCase()] = r;
            }
            setUserReviewsMap(map);
          });
        }
      } else if (errMsg.includes('ระงับสิทธิ์') || errMsg.includes('ไม่สุภาพ')) {
        // Profanity or Ban: close modal so they can't spam
        setReviewItem(null);
        setEditingReviewId(null);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string, item: any) => {
    if (!reviewId || !user) return;
    const confirmed = window.confirm(`คุณต้องการลบรีวิวสำหรับสินค้า "${item.name}" ใช่หรือไม่? เมื่อลบแล้วคุณจะสามารถเขียนรีวิวใหม่ได้`);
    if (!confirmed) return;

    const pid = (item.productId || item.slug || '').toLowerCase();
    const pslug = (item.slug || '').toLowerCase();
    const pname = (item.name || '').toLowerCase();

    setDeletingReviewId(reviewId);
    showLoading('กำลังลบรีวิวของคุณ...');
    try {
      await deleteReview(reviewId, item.productId);
      success(`ลบรีวิวสินค้า "${item.name}" เรียบร้อยแล้ว คุณสามารถเขียนรีวิวใหม่ได้ทันที`);
      setUserReviewsMap((prev) => {
        const next = { ...prev };
        delete next[pid];
        if (pslug) delete next[pslug];
        if (pname) delete next[pname];
        return next;
      });
    } catch (delErr: any) {
      console.error('Error deleting review:', delErr);
      error(delErr.message || 'เกิดข้อผิดพลาดในการลบรีวิว');
    } finally {
      setDeletingReviewId(null);
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-slate-900 rounded" />
          <div className="h-64 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="ไม่พบคำสั่งซื้อนี้"
          description={`ไม่พบคำสั่งซื้อรหัส "${orderId}" ในระบบ`}
          actionText="ดูรายการคำสั่งซื้อทั้งหมด"
          actionHref="/orders"
        />
      </div>
    );
  }

  const isLicenseOrder = Boolean(
    order?.items.some((item) => {
      const name = (item.name || '').toLowerCase();
      const slug = (item.slug || '').toLowerCase();
      return (
        name.includes('discord') ||
        name.includes('license') ||
        name.includes('manager') ||
        name.includes('profile') ||
        name.includes('bot') ||
        name.includes('bundle') ||
        slug.includes('discord') ||
        slug.includes('license') ||
        slug.includes('manager') ||
        slug.includes('profile')
      );
    }) || order?.transactionRef
  );

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปยังประวัติการทำรายการ</span>
        </Link>

        {/* Automated Key Delivery Component for J3A Discord Profile / Discord Manager */}
        {isLicenseOrder && (order.status === 'completed' || order.status === 'paid') && (
          <div className="pt-2">
            <LicenseKeyDelivery
              initialKey={order.transactionRef}
              orderId={order.id}
              customerEmail={order.customer?.email}
              autoClaim={!order.transactionRef}
              items={syncedItems}
              discordUrl="https://discord.gg/UtWykPvTYF"
            />
          </div>
        )}

        {isLicenseOrder && order.status === 'pending' && (
          <div className="rounded-2xl p-5 bg-[#7c5cff]/10 border border-[#7c5cff]/30 text-slate-200 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#7c5cff]">
              <Package className="w-5 h-5" />
              <span>คำสั่งซื้อนี้มีซอฟต์แวร์ Discord / License Key</span>
            </div>
            <p className="text-slate-300">
              เมื่อการชำระเงินได้รับการยืนยัน ระบบจะส่งมอบ License Key อัตโนมัติและแสดงปุ่มดาวน์โหลดไฟล์ติดตั้ง (.zip) ผ่าน Google Drive บนหน้านี้ทันที
            </p>
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                คำสั่งซื้อของคุณ
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                #{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>วันที่สั่งซื้อ: {formatDate(order.createdAt)}</span>
              </p>
            </div>
            <div>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              รายการสินค้า ({syncedItems.length} รายการ)
            </h3>
            <div className="divide-y divide-slate-800/80 bg-slate-950/60 rounded-2xl border border-slate-800 p-4">
              {syncedItems.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                      <Image
                        src={item.image || '/logo.png'}
                        alt={item.name}
                        fill
                        unoptimized={Boolean(item.image?.startsWith('data:'))}
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    <span className="text-sm font-bold text-cyan-400">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    {(order.status === 'completed' || order.status === 'paid') && (() => {
                      let downloadLink = item.downloadUrl || getDownloadUrlForProduct(`${item.name} ${item.slug}`);
                      if (downloadLink && downloadLink.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
                        downloadLink = 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing';
                      }
                      if (!downloadLink) return null;
                      return (
                        <a
                          href={downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(34,197,94,0.15)] select-none no-underline cursor-pointer"
                        >
                          <span>⬇️ ดาวน์โหลด / เปิดลิงก์สินค้า</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      );
                    })()}
                    {order.status === 'completed' && (() => {
                      const pid = (item.productId || '').toLowerCase();
                      const pslug = (item.slug || '').toLowerCase();
                      const pname = (item.name || '').toLowerCase();
                      const existingReview = userReviewsMap[pid] || userReviewsMap[pslug] || userReviewsMap[pname];

                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {existingReview ? (
                            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-emerald-500/30 rounded-xl p-1 px-2.5 shadow-sm">
                              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                <span>⭐</span>
                                <span>รีวิวแล้ว ({existingReview.rating} ดาว)</span>
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReviewItem({
                                    productId: item.productId,
                                    slug: item.slug,
                                    name: item.name,
                                  });
                                  setEditingReviewId(existingReview.id);
                                  setReviewRating(existingReview.rating);
                                  setReviewComment(existingReview.comment);
                                }}
                                className="h-6 px-2 text-[11px] text-cyan-300 hover:text-white hover:bg-cyan-500/20 rounded-lg font-medium"
                                title="แก้ไขรีวิวนี้"
                              >
                                ✏️ แก้ไข
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingReviewId === existingReview.id}
                                onClick={() => handleDeleteReview(existingReview.id, item)}
                                className="h-6 px-2 text-[11px] text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg font-medium"
                                title="ลบรีวิวนี้"
                              >
                                {deletingReviewId === existingReview.id ? '...' : '🗑️ ลบ'}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setReviewItem({
                                  productId: item.productId,
                                  slug: item.slug,
                                  name: item.name,
                                });
                                setEditingReviewId(null);
                                setReviewRating(5);
                                setReviewComment('');
                              }}
                              className="text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                            >
                              ⭐ ให้คะแนน
                            </Button>
                          )}
                          <Link
                            href={`/products/${item.slug || item.productId}?openReview=true`}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="ดูหน้ารายละเอียดและรีวิวสินค้า"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider">
                ข้อมูลผู้รับ & การจัดส่ง
              </h4>
              <p className="text-slate-200">
                <strong className="text-slate-400">ชื่อ:</strong> {order.customer.name}
              </p>
              <p className="text-slate-200">
                <strong className="text-slate-400">อีเมล:</strong> {order.customer.email}
              </p>
              <p className="text-slate-200">
                <strong className="text-slate-400">โทรศัพท์:</strong> {order.customer.phone || '-'}
              </p>
              <p className="text-slate-200">
                <strong className="text-slate-400">ข้อมูลจัดส่ง/UID:</strong> {order.customer.address}
              </p>
              {order.customer.notes && (
                <p className="text-slate-200">
                  <strong className="text-slate-400">หมายเหตุ:</strong> {order.customer.notes}
                </p>
              )}
            </div>

            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider">
                สรุปยอดชำระ & วิธีชำระเงิน
              </h4>
              <div className="flex justify-between text-slate-400">
                <span>ยอดรวมสินค้า</span>
                <span className="text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ค่าจัดส่ง / ค่าบริการ</span>
                <span className="text-white">
                  {order.shipping === 0 ? 'ฟรี' : formatCurrency(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>วิธีชำระเงิน</span>
                <span className="text-cyan-400 font-semibold uppercase">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>ยอดสุทธิ</span>
                <span className="text-base text-cyan-400">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Wallet Paid Success Banner */}
          {order.paymentMethod === 'wallet' && (
            <div className="pt-4 border-t border-slate-800 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>ชำระเงินสำเร็จแล้วผ่านยอดเงินคงเหลือในเว็บไซต์ (Wallet)</span>
              </div>
              <p className="text-xs text-slate-300">
                ระบบได้ตัดยอดเงินในบัญชีของคุณเรียบร้อยแล้ว รายการสั่งซื้อนี้ได้รับการยืนยันและจัดส่งอัตโนมัติทันที ไม่จำเป็นต้องอัปโหลดสลิป
              </p>
            </div>
          )}

          {/* Payment Proof Upload if Pending and NOT Wallet */}
          {order.status === 'pending' && order.paymentMethod !== 'wallet' && (
            <div className="pt-4 border-t border-slate-800 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <QrCode className="w-5 h-5" />
                <span>คำสั่งซื้อนี้รอการชำระเงิน</span>
              </div>
              <p className="text-xs text-slate-300">
                หากคุณได้ทำการโอนเงินผ่าน PromptPay หรือบัญชีธนาคารแล้ว สามารถอัปโหลดรูปภาพสลิปที่นี่เพื่อยืนยันคำสั่งซื้อ
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedSlip(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-700 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {selectedSlip && (
                  <Button
                    variant="neon"
                    size="sm"
                    onClick={handleUploadSlip}
                    isLoading={uploadingSlip}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    อัปโหลดสลิปยืนยัน
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Display Slip if already uploaded */}
          {order.paymentProofUrl && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                หลักฐานการชำระเงิน (Payment Slip)
              </h4>
              <div className="relative w-40 h-56 rounded-xl overflow-hidden border border-slate-700">
                <Image
                  src={order.paymentProofUrl}
                  alt="Payment Slip"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick In-Place Review Modal */}
      <Modal
        isOpen={Boolean(reviewItem)}
        onClose={() => {
          setReviewItem(null);
          setEditingReviewId(null);
        }}
        title={editingReviewId ? "✏️ แก้ไขคะแนนและรีวิวสินค้า" : "⭐ ให้คะแนนและเขียนรีวิวสินค้า"}
        description={reviewItem?.name}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                ระดับคะแนนความพึงพอใจ:
              </label>
              <span className="text-xs font-bold text-amber-400">
                {reviewRating} / 5 ดาว
              </span>
            </div>
            <div className="flex items-center justify-center p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <PeekRating
                value={reviewRating}
                count={5}
                onChange={(val) => setReviewRating(val)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              ข้อความรีวิวสินค้า:
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="บอกเล่าความรู้สึก คุณภาพสินค้า หรือประสบการณ์การใช้งาน..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {reviewItem?.slug && (
              <Link
                href={`/products/${reviewItem.slug}?openReview=true`}
                className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                onClick={() => {
                  setReviewItem(null);
                  setEditingReviewId(null);
                }}
              >
                <span>ดูหน้ารายละเอียดแบบเต็ม</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReviewItem(null);
                  setEditingReviewId(null);
                }}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                variant="neon"
                size="sm"
                disabled={submittingReview || !reviewComment.trim()}
              >
                {submittingReview
                  ? 'กำลังบันทึก...'
                  : editingReviewId
                  ? `บันทึกการแก้ไข (${reviewRating} ดาว)`
                  : `ส่งรีวิว (${reviewRating} ดาว)`}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
