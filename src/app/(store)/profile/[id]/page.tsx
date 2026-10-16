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
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
          <Link
            href="/shop"
            className="text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800"
          >
            ไปที่ร้านค้า (Shop)
          </Link>
        </div>

        {/* Profile Card Container */}
        <div className="relative bg-slate-900/70 border border-slate-800/90 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-2xl">
          {/* Top Cyber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] z-10" />

          {/* Cover Banner */}
          <div className="h-44 sm:h-56 bg-gradient-to-r from-cyan-900/40 via-indigo-900/40 to-purple-900/40 relative flex items-start justify-between p-6 border-b border-slate-800/80 overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <span className="relative z-10 text-xs font-bold text-cyan-300 uppercase tracking-wider bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/40 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>โปรไฟล์ลูกค้า (Customer Profile)</span>
            </span>

            <button
              onClick={handleCopyLink}
              className="relative z-10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-cyan-400/50 backdrop-blur-md shadow-lg active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>แชร์โปรไฟล์นี้</span>
                </>
              )}
            </button>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 space-y-8 relative">
            {/* Avatar & Main Identity Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                {/* Avatar with Neon Gradient Frame */}
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 p-1 shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-transform duration-300 group-hover:scale-105">
                    <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center overflow-hidden relative">
                      {profile?.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-indigo-300">
                          {initial}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Verified Online Green Ring */}
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-3 border-slate-950 shadow-[0_0_10px_#34d399]"
                    title="สมาชิกพร้อมใช้งาน"
                  />
                </div>

                <div className="pb-1 space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span>{displayName}</span>
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ผู้ซื้อที่ยืนยันแล้ว
                    </span>
                    {profile && <TierBadge tier={profile.tier || 'Bronze'} />}
                    {profile?.role === 'admin' && <RoleBadge role="admin" />}
                  </div>

                  {/* Customer Bio */}
                  {profile?.bio && (
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 max-w-xl italic">
                      "{profile.bio}"
                    </div>
                  )}

                  {/* Customer Social Links */}
                  {profile?.socialLinks && Object.values(profile.socialLinks).some((v) => v && v.trim()) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#99a2fe] border border-[#5865F2]/40 transition-all hover:scale-105 shadow-sm"
                          title={`Discord: ${profile.socialLinks.discord}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse" />
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-[#60a5fa] border border-[#1877F2]/40 transition-all hover:scale-105 shadow-sm"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 shadow-sm"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#E4405F]/15 hover:bg-[#E4405F]/25 text-[#fb7185] border border-[#E4405F]/40 transition-all hover:scale-105 shadow-sm"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#FF0000]/15 hover:bg-[#FF0000]/25 text-rose-300 border border-[#FF0000]/40 transition-all hover:scale-105 shadow-sm"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 transition-all hover:scale-105 shadow-sm"
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
                {/* 3 High-Tech HUD Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Reviews */}
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-indigo-500/30 text-center space-y-1.5 shadow-[0_0_20px_rgba(99,102,241,0.15)] group hover:border-indigo-400/60 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-black text-white font-mono tracking-tight">
                      {profile?.reviewCount ?? 1}
                    </div>
                    <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                      รีวิวทั้งหมด
                    </div>
                  </div>

                  {/* Card 2: Rating */}
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-amber-500/30 text-center space-y-1.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/60 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">
                      {profile?.averageRating ? profile.averageRating.toFixed(1) : '5.0'}
                      <span className="text-sm font-semibold text-slate-400"> / 5.0</span>
                    </div>
                    <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                      คะแนนเฉลี่ยที่ให้
                    </div>
                  </div>

                  {/* Card 3: Member Since */}
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-cyan-500/30 text-center space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] group hover:border-cyan-400/60 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-black text-slate-100 truncate pt-1">
                      {(() => {
                        if (!profile?.createdAt) return 'ลูกค้าจริง';
                        try {
                          const d = new Date(profile.createdAt);
                          return isNaN(d.getTime())
                            ? 'ลูกค้าจริง'
                            : d.toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              });
                        } catch {
                          return 'ลูกค้าจริง';
                        }
                      })()}
                    </div>
                    <div className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
                      เป็นสมาชิกตั้งแต่
                    </div>
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
