'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Star,
  MessageSquare,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { getPublicUserProfile } from '@/lib/firestore/users';
import { TierBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function CustomerPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    getPublicUserProfile(userId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayName = profile?.displayName || 'ลูกค้าผู้ใช้งานจริง';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.assign('/shop');
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
          <Link
            href="/shop"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ไปที่ร้านค้า
          </Link>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="h-40 sm:h-52 bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 relative flex items-start justify-between p-6 border-b border-slate-800/80">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 flex items-center gap-2 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              โปรไฟล์ลูกค้า (Customer Profile)
            </span>

            <button
              onClick={handleCopyLink}
              className="text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-md shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>แชร์โปรไฟล์นี้</span>
                </>
              )}
            </button>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="flex items-end gap-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-2xl shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-cyan-400">
                        {initial}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {displayName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ผู้ซื้อที่ยืนยันแล้ว
                    </span>
                    {profile && <TierBadge tier={profile.tier || 'Bronze'} />}
                    {profile?.role === 'admin' && <RoleBadge role="admin" />}
                  </div>

                  {/* Customer Bio */}
                  {profile?.bio && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2 max-w-xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Customer Social Links */}
                  {profile?.socialLinks && Object.values(profile.socialLinks).some((v) => v && v.trim()) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
                      {profile.socialLinks.discord && (
                        <a
                          href={
                            profile.socialLinks.discord.startsWith('http')
                              ? profile.socialLinks.discord
                              : profile.socialLinks.discord.includes('discord.gg')
                              ? `https://${profile.socialLinks.discord}`
                              : `https://discord.com/users/${profile.socialLinks.discord}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#7983F5] border border-[#5865F2]/30 transition-all hover:scale-105 shadow-sm"
                          title={`Discord: ${profile.socialLinks.discord}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
                          <span>Discord</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {profile.socialLinks.facebook && (
                        <a
                          href={
                            profile.socialLinks.facebook.startsWith('http')
                              ? profile.socialLinks.facebook
                              : `https://facebook.com/${profile.socialLinks.facebook}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#3B82F6] border border-[#1877F2]/30 transition-all hover:scale-105 shadow-sm"
                          title="Facebook Profile"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#1877F2]" />
                          <span>Facebook</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a
                          href={
                            profile.socialLinks.twitter.startsWith('http')
                              ? profile.socialLinks.twitter
                              : `https://x.com/${profile.socialLinks.twitter.replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 shadow-sm"
                          title="X / Twitter"
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>X / Twitter</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a
                          href={
                            profile.socialLinks.instagram.startsWith('http')
                              ? profile.socialLinks.instagram
                              : `https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#E4405F]/10 hover:bg-[#E4405F]/20 text-[#F43F5E] border border-[#E4405F]/30 transition-all hover:scale-105 shadow-sm"
                          title="Instagram Profile"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#E4405F]" />
                          <span>Instagram</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {profile.socialLinks.youtube && (
                        <a
                          href={
                            profile.socialLinks.youtube.startsWith('http')
                              ? profile.socialLinks.youtube
                              : `https://youtube.com/@${profile.socialLinks.youtube.replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-rose-400 border border-[#FF0000]/30 transition-all hover:scale-105 shadow-sm"
                          title="YouTube Channel"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {profile.socialLinks.website && (
                        <a
                          href={
                            profile.socialLinks.website.startsWith('http')
                              ? profile.socialLinks.website
                              : `https://${profile.socialLinks.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 shadow-sm"
                          title="Website"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                <p className="text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                    <div className="flex items-center justify-center text-indigo-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {profile?.reviewCount ?? 1}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">รีวิวทั้งหมด</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                    <div className="flex items-center justify-center text-amber-400">
                      <Star className="w-5 h-5 fill-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-300">
                      {profile?.averageRating ? profile.averageRating.toFixed(1) : '5.0'} / 5.0
                    </div>
                    <div className="text-xs text-slate-400 font-medium">คะแนนเฉลี่ยที่ให้</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                    <div className="flex items-center justify-center text-cyan-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-bold text-slate-200 truncate">
                      {(() => {
                        if (!profile?.createdAt) return 'ลูกค้าจริง';
                        try {
                          const d = new Date(profile.createdAt);
                          return isNaN(d.getTime())
                            ? 'ลูกค้าจริง'
                            : d.toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              });
                        } catch {
                          return 'ลูกค้าจริง';
                        }
                      })()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">เป็นสมาชิกตั้งแต่</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>ประวัติความคิดเห็นและรีวิวสินค้า ({profile?.reviews?.length || 0})</span>
                    </h2>
                  </div>

                  {profile?.reviews && profile.reviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {profile.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              {rev.productSlug ? (
                                <Link
                                  href={`/products/${rev.productSlug}`}
                                  className="text-sm font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                                >
                                  <span>{rev.productName || 'สินค้าในร้าน'}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                </Link>
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {rev.productName || 'สินค้าในร้าน'}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 block mt-0.5">
                                {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 self-start sm:self-auto">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= Math.round(rev.rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-amber-400 ml-1">
                                {rev.rating} / 5
                              </span>
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-slate-800/60 p-6 space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">ยังไม่มีประวัติการรีวิวอื่นๆ</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        ลูกค้ารายนี้ยังไม่มีการเขียนรีวิวเพิ่มเติมในระบบ
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
