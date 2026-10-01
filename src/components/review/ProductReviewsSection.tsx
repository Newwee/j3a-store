'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  X,
  Loader2,
} from 'lucide-react';
import { Review, ReviewEligibility } from '@/types/review';
import {
  getProductReviews,
  checkReviewEligibility,
  submitProductReview,
} from '@/lib/firestore/reviews';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug?: string;
  autoOpenReview?: boolean;
}

export function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  autoOpenReview = false,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    canReview: false,
    reason: 'not_logged_in',
    message: 'กรุณาเข้าสู่ระบบเพื่อตรวจสอบสิทธิ์การให้คะแนน',
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [revs, elig] = await Promise.all([
        getProductReviews(productId),
        checkReviewEligibility(productId, user?.uid, user?.email),
      ]);
      setReviews(revs);
      setEligibility(elig);

      if (autoOpenReview && elig.canReview) {
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.canReview || !eligibility.orderId || !user) {
      toastError('คุณไม่ได้รับสิทธิ์ให้คะแนนสินค้านี้');
      return;
    }
    if (!comment.trim()) {
      toastError('กรุณาเขียนข้อความรีวิวสินค้า');
      return;
    }

    setSubmitting(true);
    try {
      await submitProductReview({
        productId,
        productSlug,
        productName,
        orderId: eligibility.orderId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'ผู้ซื้อที่ผ่านการยืนยัน',
        userPhoto: user.photoURL || undefined,
        rating: selectedRating,
        comment: comment.trim(),
      });

      success('บันทึกคะแนนและรีวิวสินค้าของคุณสำเร็จแล้ว ขอบคุณมากครับ!');
      setIsModalOpen(false);
      setComment('');
      // Reload reviews and eligibility
      loadData();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      toastError(err.message || 'เกิดข้อผิดพลาดในการบันทึกรีวิว');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Average
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

  return (
    <section className="py-8 border-t border-slate-800">
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                คะแนนและรีวิวสินค้า (Ratings & Reviews)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {totalReviews} รีวิว
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              รีวิวจากลูกค้าผู้ใช้งานจริงที่ผ่านการยืนยันคำสั่งซื้อโดยผู้ดูแลระบบ
            </p>
          </div>

          {/* Action / Eligibility Button */}
          <div>
            {eligibility.canReview ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Star className="w-4 h-4 fill-amber-300 text-amber-300" />}
                className="shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black"
              >
                ⭐ ให้คะแนนสินค้านี้ (Rate Product)
              </Button>
            ) : !user ? (
              <Link href={`/login?redirect=/products/${productSlug || productId}`}>
                <Button variant="secondary" size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />}>
                  เข้าสู่ระบบเพื่อตรวจสอบสิทธิ์รีวิว
                </Button>
              </Link>
            ) : eligibility.reason === 'already_reviewed' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>คุณได้ให้คะแนนสินค้านี้แล้ว</span>
              </div>
            ) : eligibility.reason === 'order_pending_admin' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Clock className="w-4 h-4" />
                <span>รอแอดมินอนุมัติคำสั่งซื้อจึงจะให้คะแนนได้</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>ปลดล็อกเมื่อซื้อสินค้าและแอดมินยืนยัน</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
          {/* Average Rating Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
            <span className="text-5xl font-black text-white tracking-tight">
              {totalReviews > 0 ? averageRating.toFixed(1) : '5.0'}
            </span>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {totalReviews > 0
                ? `จาก ${totalReviews} คะแนนประเมิน`
                : 'คะแนนเริ่มต้นการันตีความพึงพอใจ'}
            </p>
          </div>

          {/* Trust Banner / Explanation */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>ระบบความโปร่งใสของรีวิว (Verified Buyer Reviews)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              J3A STORE อนุญาตให้เฉพาะผู้ซื้อที่สั่งซื้อสินค้านี้จริง และได้รับการอนุมัติการซื้อขายจากผู้ดูแลระบบ (Admin Approved) เท่านั้นในการให้คะแนน เพื่อป้องกันคะแนนปลอมและรักษาความน่าเชื่อถือสูงสุด
            </p>
            {eligibility.canReview && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>คำสั่งซื้อของคุณได้รับการยืนยันแล้ว สามารถกดปุ่ม <strong>"ให้คะแนนสินค้านี้"</strong> ได้เลย!</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>กำลังโหลดรีวิวจากผู้ซื้อจริง...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">ยังไม่มีรีวิวสำหรับสินค้านี้</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                เมื่อคุณสั่งซื้อสินค้านี้และแอดมินยืนยันคำสั่งซื้อแล้ว คุณจะเป็นคนแรกที่ได้ให้คะแนนและแสดงความเห็น!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{rev.userName}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            ผู้ซื้อที่ยืนยันแล้ว
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-10">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating & Review Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                ยืนยันการซื้อขายเรียบร้อยแล้ว
              </span>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                ให้คะแนนและรีวิว: {productName}
              </h3>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="space-y-2 text-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">
                  เลือกระดับความพึงพอใจ:
                </span>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 text-slate-600 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          star <= (hoverRating || selectedRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-400 block">
                  {hoverRating || selectedRating} / 5 ดาว (
                  {(hoverRating || selectedRating) === 5
                    ? 'ยอดเยี่ยม ประทับใจมาก'
                    : (hoverRating || selectedRating) === 4
                    ? 'ดีมาก พึงพอใจ'
                    : (hoverRating || selectedRating) === 3
                    ? 'ปานกลาง พอใช้'
                    : (hoverRating || selectedRating) === 2
                    ? 'ควรปรับปรุง'
                    : 'ไม่พึงพอใจ'}
                  )
                </span>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  ข้อความรีวิวสินค้า *
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="แบ่งปันประสบการณ์การใช้งาน เช่น ความรวดเร็วในการจัดส่ง คุณภาพของสินค้า บริการจากทางร้าน..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={submitting}
                  className="font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                >
                  บันทึกรีวิว (Submit Review)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
