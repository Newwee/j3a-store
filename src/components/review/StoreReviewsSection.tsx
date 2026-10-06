'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, CheckCircle2, Lock, X, Loader2, MessageSquareText, Eye, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import PeekRating from '@/components/ui/PeekRating';
import { PublicProfileModal } from '@/components/profile/PublicProfileModal';
import { Review, ReviewEligibility } from '@/types/review';
import {
  getStoreReviews,
  checkStoreReviewEligibility,
  submitStoreReview,
  getStoreReviewStats,
} from '@/lib/firestore/reviews';

export function StoreReviewsSection() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 4.9, totalReviews: 0, satisfactionRate: '100%' });
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    canReview: false,
    reason: 'not_logged_in',
    message: 'ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า',
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<{
    userId: string;
    name?: string;
    photo?: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [revs, st, elig] = await Promise.all([
        getStoreReviews(),
        getStoreReviewStats(),
        checkStoreReviewEligibility(user?.uid),
      ]);
      setReviews(revs);
      setStats(st);
      setEligibility(elig);
    } catch (err) {
      console.error('Error loading store reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.canReview || !eligibility.orderId || !user) {
      toastError('ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า');
      return;
    }
    if (!comment.trim()) {
      toastError('กรุณากรอกข้อความรีวิวร้านค้า');
      return;
    }

    setSubmitting(true);
    try {
      await submitStoreReview({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'ลูกค้าผู้ใช้งานจริง',
        userPhoto: user.photoURL || undefined,
        orderId: eligibility.orderId,
        rating: selectedRating,
        comment: comment.trim(),
      });

      success('บันทึกรีวิวร้านค้าของคุณสำเร็จแล้ว ขอบคุณมากครับ!');
      setIsModalOpen(false);
      setComment('');
      loadData();
    } catch (err: any) {
      console.error('Error submitting store review:', err);
      toastError(err.message || 'เกิดข้อผิดพลาดในการบันทึกรีวิว');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-14 border-t border-slate-800/80 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
              <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
              <span>เสียงตอบรับจากลูกค้าจริง (Customer Reviews)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              รีวิวและความพึงพอใจต่อ J3A STORE
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              ความประทับใจและคะแนนการบริการจากลูกค้าที่ผ่านการซื้อสินค้าและใช้บริการจริง
            </p>
          </div>

          {/* Button to open review modal */}
          <div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Star className="w-4 h-4 fill-amber-300 text-amber-300" />}
              className="shadow-[0_0_25px_rgba(124,58,237,0.35)] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black cursor-target"
            >
              ✍️ ให้คะแนนและรีวิวร้านค้า
            </Button>
          </div>
        </div>

        {/* Highlight Score Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xl">
              ★
            </div>
            <div>
              <p className="text-2xl font-black text-white">4.9 / 5.0</p>
              <p className="text-xs text-slate-400">คะแนนความพึงพอใจโดยรวม</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xl">
              ✓
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{stats.satisfactionRate}</p>
              <p className="text-xs text-slate-400">อัตราความพึงพอใจของลูกค้า</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">100% Verified</p>
              <p className="text-xs text-slate-400">ระบบคัดกรองเฉพาะผู้ซื้อจริง</p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>กำลังโหลดรีวิวร้านค้า...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <MessageSquareText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">ร่วมเป็นคนแรกที่รีวิวร้านค้า J3A STORE</p>
            <p className="text-xs text-slate-500">
              เมื่อทำการสั่งซื้อสินค้าเรียบร้อยแล้ว คุณสามารถกดปุ่มรีวิวด้านบนเพื่อแชร์ความประทับใจได้ทันที
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={rev.userId ? `/profile/${rev.userId}` : '#'}
                    className="flex items-center gap-2.5 text-left group cursor-pointer p-1 -m-1 rounded-xl hover:bg-slate-800/40 transition-colors"
                    title={rev.userId ? `คลิกเพื่อส่องโปรไฟล์ของ ${rev.userName}` : undefined}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden ring-2 ring-indigo-500/30 group-hover:ring-indigo-400 group-hover:scale-105 transition-all shrink-0">
                      {rev.userPhoto ? (
                        <img src={rev.userPhoto} alt={rev.userName} className="w-full h-full object-cover" />
                      ) : (
                        rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                          <span>{rev.userName}</span>
                        </span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">
                          {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {rev.userId && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 group-hover:text-indigo-300 font-semibold underline decoration-indigo-500/40 underline-offset-2">
                            <Eye className="w-2.5 h-2.5" />
                            <span>ส่องโปรไฟล์</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const starVal = rev.rating > 5 ? Math.round(rev.rating / 2) : rev.rating;
                        return (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= starVal
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-amber-400 ml-1">
                      {rev.rating > 5 ? (rev.rating / 2).toFixed(1) : rev.rating} / 5
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-target"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                {eligibility.canReview ? 'ลูกค้ายืนยันคำสั่งซื้อแล้ว' : 'ตรวจสอบสิทธิ์การรีวิว'}
              </span>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                ให้คะแนนและรีวิวร้านค้า J3A STORE
              </h3>
            </div>

            {/* Gating Check */}
            {!eligibility.canReview ? (
              <div className="space-y-4 py-2">
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-rose-300">
                      ไม่สามารถรีวิวได้เนื่องจากยังไม่ซื้อสินค้า
                    </h4>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                      {eligibility.message ||
                        'ระบบเปิดให้เฉพาะผู้ที่สั่งซื้อสินค้าในร้านและได้รับการอนุมัติคำสั่งซื้อเรียบร้อยแล้วเท่านั้น จึงจะสามารถให้คะแนนและเขียนรีวิวร้านค้าได้'}
                    </p>
                  </div>
                  {!user ? (
                    <Link href="/login?redirect=/">
                      <Button variant="primary" size="sm" className="mt-2 cursor-target">
                        เข้าสู่ระบบบัญชีของคุณ
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/shop">
                      <Button variant="secondary" size="sm" className="mt-2 cursor-target">
                        เลือกซื้อสินค้าในร้านเพื่อปลดล็อกสิทธิ์
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Disabled PeekRating Preview */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2 opacity-50 pointer-events-none">
                  <span className="text-xs font-semibold text-slate-400 block">
                    ตัวอย่างระบบให้คะแนน (1 - 5 ดาว):
                  </span>
                  <PeekRating
                    count={5}
                    activeColor="#779bff"
                    tipTextColor="#7C3AED"
                    size={38}
                    riseDuration={310}
                    magnify={1.17}
                    showLabels={false}
                    disabled={true}
                    value={5}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-target"
                  >
                    ปิดหน้าต่าง
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* PeekRating Selector with 5 stars */}
                <div className="space-y-2 text-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    ระดับความประทับใจโดยรวม (1 - 5 คะแนน):
                  </span>
                  <div className="flex justify-center py-2 overflow-x-auto">
                    <PeekRating
                      count={5}
                      activeColor="#779bff"
                      tipTextColor="#7C3AED"
                      size={42}
                      riseDuration={310}
                      magnify={1.17}
                      showLabels={false}
                      value={selectedRating}
                      onChange={(val) => setSelectedRating(val)}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-400 block mt-1">
                    คะแนนที่เลือก: {selectedRating} / 5 คะแนน
                  </span>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    ความเห็นและความประทับใจต่อร้านค้า *
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="บอกเล่าประสบการณ์การใช้บริการ J3A STORE เช่น ความเร็วในการจัดส่ง การให้บริการของแอดมิน ความน่าเชื่อถือ..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all resize-none"
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
                    className="cursor-target"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={submitting}
                    className="font-bold shadow-[0_0_20px_rgba(99,102,241,0.35)] bg-indigo-600 hover:bg-indigo-500 cursor-target"
                  >
                    บันทึกรีวิว (Submit Review)
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <PublicProfileModal
        userId={selectedProfileUser?.userId || null}
        initialName={selectedProfileUser?.name}
        initialPhoto={selectedProfileUser?.photo}
        isOpen={!!selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
      />
    </section>
  );
}
