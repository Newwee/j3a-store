'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Star,
  MessageSquare,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { getPublicUserProfile } from '@/lib/firestore/users';
import { TierBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PublicProfileModalProps {
  userId: string | null;
  initialName?: string;
  initialPhoto?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicProfileModal({
  userId,
  initialName,
  initialPhoto,
  isOpen,
  onClose,
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

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
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  const displayName = profile?.displayName || initialName || 'ลูกค้าผู้ใช้งานจริง';
  const photo = profile?.photoURL || initialPhoto;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/profile/${userId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-28 bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 relative flex items-start justify-between p-4 border-b border-slate-800/80">
          <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            โปรไฟล์ลูกค้า (Customer Profile)
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-0 space-y-5 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 -mt-12">
            <div className="flex items-end gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/10">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-cyan-400">{initial}</span>
                  )}
                </div>
              </div>
              <div className="pb-1">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>{displayName}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    ผู้ซื้อที่ยืนยันแล้ว
                  </span>
                  {profile && <TierBadge tier={profile.tier || 'Bronze'} />}
                  {profile?.role === 'admin' && <RoleBadge role="admin" />}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 self-start sm:self-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">คัดลอกลิงก์แล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>แชร์โปรไฟล์</span>
                </>
              )}
            </button>
          </div>

          {/* Customer Bio & Social Links */}
          {(profile?.bio || (profile?.socialLinks && Object.values(profile.socialLinks).some((v) => v && v.trim()))) && (
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 space-y-2">
              {profile?.bio && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              {profile?.socialLinks && Object.values(profile.socialLinks).some((v) => v && v.trim()) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#7983F5] border border-[#5865F2]/30 transition-all hover:scale-105 shadow-sm"
                      title={`Discord: ${profile.socialLinks.discord}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                      <span>Discord</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#3B82F6] border border-[#1877F2]/30 transition-all hover:scale-105 shadow-sm"
                      title="Facebook"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" />
                      <span>Facebook</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 shadow-sm"
                      title="X / Twitter"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>X</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#E4405F]/10 hover:bg-[#E4405F]/20 text-[#F43F5E] border border-[#E4405F]/30 transition-all hover:scale-105 shadow-sm"
                      title="Instagram"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E4405F]" />
                      <span>Instagram</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-rose-400 border border-[#FF0000]/30 transition-all hover:scale-105 shadow-sm"
                      title="YouTube"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000]" />
                      <span>YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 shadow-sm"
                      title="Website"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Website</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs">กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <div className="flex items-center justify-center text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-base font-black text-white">
                    {profile?.reviewCount ?? 1}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">รีวิวทั้งหมด</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <div className="flex items-center justify-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div className="text-base font-black text-amber-300">
                    {profile?.averageRating ? profile.averageRating.toFixed(1) : '5.0'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">คะแนนเฉลี่ย</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                  <div className="flex items-center justify-center text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('th-TH', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'ลูกค้าจริง'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">เป็นสมาชิกตั้งแต่</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ประวัติการรีวิวสินค้า ({profile?.reviews?.length || 0})
                  </h4>
                  {profile && profile.reviews && profile.reviews.length > 0 && (
                    <span className="text-[10px] text-slate-500">เรียงจากล่าสุด</span>
                  )}
                </div>

                {profile?.reviews && profile.reviews.length > 0 ? (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {profile.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {rev.productSlug ? (
                              <Link
                                href={`/products/${rev.productSlug}`}
                                onClick={onClose}
                                className="text-xs font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1"
                              >
                                <span>{rev.productName || 'สินค้าในร้าน'}</span>
                                <ExternalLink className="w-3 h-3 text-slate-500" />
                              </Link>
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {rev.productName || 'สินค้าในร้าน'}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= Math.round(rev.rating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-amber-400">
                              {rev.rating} / 5
                            </span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                    ยังไม่มีข้อมูลประวัติการรีวิวอื่นๆ
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
          <Link
            href={`/profile/${userId}`}
            onClick={onClose}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>เปิดหน้าโปรไฟล์เต็ม</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}
