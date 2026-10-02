'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Trash2,
  Search,
  MessageSquare,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Store,
  Package,
} from 'lucide-react';
import { Review } from '@/types/review';
import { getAllReviews, deleteReview } from '@/lib/firestore/reviews';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils/formatters';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminReviewsPage() {
  const { success, error } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'store' | 'product'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews(100);
      setReviews(data);
    } catch (err: any) {
      error('ไม่สามารถโหลดข้อมูลรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review: Review) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวของ "${review.userName}"?`)) {
      return;
    }

    setDeletingId(review.id);
    try {
      await deleteReview(review.id, review.productId);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      success('ลบรีวิวเรียบร้อยแล้ว และอัปเดตคะแนนเฉลี่ยให้อัตโนมัติ');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการลบรีวิว: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Type filter
      if (typeFilter === 'store' && r.productId !== 'store_overall') return false;
      if (typeFilter === 'product' && r.productId === 'store_overall') return false;

      // Rating filter (convert raw rating to 5-star equivalent)
      const normRating = r.rating > 5 ? Math.round(r.rating / 2) : r.rating;
      if (ratingFilter !== 'all' && normRating !== ratingFilter) return false;

      // Search term
      const term = search.toLowerCase().trim();
      if (!term) return true;
      return (
        r.userName.toLowerCase().includes(term) ||
        r.comment.toLowerCase().includes(term) ||
        (r.productName && r.productName.toLowerCase().includes(term))
      );
    });
  }, [reviews, typeFilter, ratingFilter, search]);

  // Overall Stats
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? Number(
          (
            reviews.reduce((acc, r) => acc + (r.rating > 5 ? r.rating / 2 : r.rating), 0) /
            totalCount
          ).toFixed(1)
        )
      : 5.0;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="จัดการรีวิวลูกค้า (Reviews Moderation)"
        description="ตรวจสอบความคิดเห็น คะแนนความพึงพอใจ และลบรีวิวที่ไม่เหมาะสมออกจากระบบ"
        actionText=""
        actionHref=""
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              รีวิวทั้งหมด
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500">ความคิดเห็นจากผู้ซื้อจริง</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              คะแนนเฉลี่ยรวม
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
            </div>
            <span className="text-[11px] text-amber-400/80">คำนวณจากรีวิวทั้งหมด</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              ความพึงพอใจ 4★ ขึ้นไป
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">
              {totalCount > 0
                ? `${Math.round(
                    (reviews.filter((r) => (r.rating > 5 ? r.rating / 2 : r.rating) >= 4).length /
                      totalCount) *
                      100
                  )}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-slate-500">ลูกค้าพึงพอใจในระดับสูง</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, สินค้า หรือข้อความรีวิว..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Type and Rating filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">ประเภท:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setTypeFilter('product')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                typeFilter === 'product'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>สินค้ารายชิ้น</span>
            </button>
            <button
              onClick={() => setTypeFilter('store')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                typeFilter === 'store'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>ร้านค้าโดยรวม</span>
            </button>
          </div>
        </div>

        {/* Rating Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold mr-1">ดาว:</span>
          <button
            onClick={() => setRatingFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              ratingFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            ทุกระดับ
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setRatingFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                ratingFilter === s
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            กำลังโหลดรายการรีวิว...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="ไม่พบรายการรีวิว"
              description="ไม่มีรีวิวที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก"
              actionText="ล้างตัวกรอง"
              onAction={() => {
                setSearch('');
                setTypeFilter('all');
                setRatingFilter('all');
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredReviews.map((rev) => {
              const normRating = rev.rating > 5 ? Number((rev.rating / 2).toFixed(1)) : rev.rating;
              const isStore = rev.productId === 'store_overall';

              return (
                <div
                  key={rev.id}
                  className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-bold text-white">{rev.userName}</span>

                      {/* Product Target Badge */}
                      {isStore ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>รีวิวร้านค้าโดยรวม</span>
                        </span>
                      ) : (
                        <Link
                          href={`/products/${rev.productSlug || rev.productId}`}
                          target="_blank"
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 hover:border-cyan-400 transition-colors"
                        >
                          <Package className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{rev.productName}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}

                      <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto md:ml-0">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(rev.createdAt)}</span>
                      </span>
                    </div>

                    {/* Star Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Math.round(normRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        {normRating.toFixed(1)} / 5.0
                      </span>
                      {rev.rating > 5 && (
                        <span className="text-[10px] text-slate-500">
                          (ผู้ใช้เลือก {rev.rating}/10 คะแนน)
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line">
                      {rev.comment}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Order ID: <code className="text-slate-400">{rev.orderId || '-'}</code></span>
                      <span>User UID: <code className="text-slate-400">{rev.userId}</code></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center md:flex-col gap-2 pt-2 md:pt-0">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(rev)}
                      isLoading={deletingId === rev.id}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      ลบรีวิว
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
