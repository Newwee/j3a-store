'use client';

import React, { useState } from 'react';
import { Play, ExternalLink, Maximize2, X, CheckCircle2, Video } from 'lucide-react';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/utils/youtube';

interface ShowcaseVideoCardProps {
  youtubeUrl?: string;
  title?: string;
  subtitle?: string;
}

export function ShowcaseVideoCard({
  youtubeUrl,
  title = 'วิธีใช้งานร้านค้า J3A STORE',
  subtitle = 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ',
}: ShowcaseVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Default video if none configured
  const defaultVideoId = 'dQw4w9WgXcQ';
  const videoId = extractYouTubeVideoId(youtubeUrl) || defaultVideoId;
  const embedUrl = getYouTubeEmbedUrl(videoId, { autoplay: isPlaying });
  const modalEmbedUrl = getYouTubeEmbedUrl(videoId, { autoplay: true });
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <>
      <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 border border-rose-500/40 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.25)] relative overflow-hidden select-none">
        {/* Subtle top neon glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]" />

        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Title & Badge */}
        <div className="space-y-1.5 z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-extrabold text-[10px] tracking-wider uppercase shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>YOUTUBE SHOWCASE</span>
            </span>

            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              คู่มือร้านค้า
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1 drop-shadow-sm">
            {title || 'วิธีใช้งานร้านค้า J3A STORE'}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {subtitle || 'ชมวิดีโอแนะนำขั้นตอนการสั่งซื้อ เติมเงิน และรับสินค้าแบบอัตโนมัติ'}
          </p>
        </div>

        {/* Video Screen / Player Area */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-rose-500/30 bg-black/95 my-2 shadow-[0_0_25px_rgba(244,63,94,0.2)] group z-10">
          {isPlaying ? (
            <iframe
              src={embedUrl || ''}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              onClick={() => setIsPlaying(true)}
              className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
            >
              {/* Thumbnail background */}
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                />
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Pulsing Glowing Play Button */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.8)] group-hover:scale-110 group-hover:bg-rose-500 transition-transform">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  คลิกเพื่อเล่นวิดีโอ (Play)
                </span>
                <span className="bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md">
                  HD Video
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Quick 3-Step Guide & Action Buttons */}
        <div className="space-y-2 z-10">
          {/* 3 Steps Mini Timeline */}
          <div className="grid grid-cols-3 gap-1.5 text-[9px] sm:text-[10px] text-center">
            <div className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="font-bold text-cyan-400">1.</span> เลือกสินค้า
            </div>
            <div className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="font-bold text-amber-400">2.</span> ชำระเงิน
            </div>
            <div className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <span className="font-bold text-emerald-400">3.</span> รับของออโต้
            </div>
          </div>

          {/* Action links */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700/60 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>ขยายเต็มจอ</span>
            </button>

            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:underline px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-500/30 transition-colors"
            >
              <span>ดูบน YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-rose-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(244,63,94,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base sm:text-lg font-black text-white">{title}</h4>
                <p className="text-xs text-slate-400">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                src={modalEmbedUrl || ''}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
