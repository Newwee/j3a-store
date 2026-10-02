'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Copy,
  Check,
  Download,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

export interface SoftwareDownloadItem {
  id: string;
  name: string;
  shortName: string;
  downloadUrl: string;
  zipFileName: string;
  exeFileName: string;
  guideStep3: string;
}

export const SOFTWARE_DOWNLOADS: Record<'DISCORD_MANAGER' | 'DISCORD_PROFILE', SoftwareDownloadItem> = {
  DISCORD_MANAGER: {
    id: 'discord-manager',
    name: 'J3A Discord Manager',
    shortName: 'J3A Discord Manager',
    downloadUrl: 'https://drive.google.com/file/d/1QTKdEcYbMJFHoG_LslEwJPWKIVtO8uH9/view?usp=sharing',
    zipFileName: 'J3ADiscordManager.zip',
    exeFileName: 'J3ADiscordManager.exe',
    guideStep3: 'เชื่อมต่อ Bot Token หรือตั้งค่า Discord Server Architecture แล้วเริ่มใช้งานได้ทันที!',
  },
  DISCORD_PROFILE: {
    id: 'discord-profile',
    name: 'J3A Discord Profile',
    shortName: 'J3A Discord Profile',
    downloadUrl: 'https://drive.google.com/file/d/18Mt5mytIu-jB7Jt7efyr_nTxWGkDTuV0/view?usp=drive_link',
    zipFileName: 'J3ADiscordProfile.zip',
    exeFileName: 'J3ADiscordProfile.exe',
    guideStep3: 'ใส่ Application ID จาก Discord Developer Portal แล้วกดเริ่มใช้งานได้ทันที!',
  },
};

/**
 * Helper function to match a product name/slug to its Google Drive download link
 */
export function getDownloadUrlForProduct(nameOrSlugOrId: string = ''): string | null {
  const s = nameOrSlugOrId.toLowerCase();
  if (
    s.includes('discord manager') ||
    s.includes('discordmanager') ||
    s.includes('bot manager') ||
    s.includes('discordbot') ||
    s.includes('j3a-discord-manager')
  ) {
    return SOFTWARE_DOWNLOADS.DISCORD_MANAGER.downloadUrl;
  }
  if (
    s.includes('discord profile') ||
    s.includes('discordprofile') ||
    s.includes('rich presence') ||
    s.includes('rpc') ||
    s.includes('j3a-discord-profile')
  ) {
    return SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;
  }
  return null;
}

export interface LicenseOrderItem {
  productId?: string;
  name?: string;
  slug?: string;
  category?: string;
}

export interface LicenseKeyDeliveryProps {
  initialKey?: string;
  orderId?: string;
  customerEmail?: string;
  autoClaim?: boolean;
  downloadUrl?: string;
  discordUrl?: string;
  items?: LicenseOrderItem[];
  productName?: string;
}

export function LicenseKeyDelivery({
  initialKey,
  orderId,
  customerEmail,
  autoClaim = true,
  downloadUrl,
  discordUrl = 'https://discord.gg/UtWykPvTYF',
  items,
  productName,
}: LicenseKeyDeliveryProps) {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState<string>(initialKey || '');
  const [isLoading, setIsLoading] = useState<boolean>(!initialKey && autoClaim);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Detect which software(s) were purchased based on items / product name / downloadUrl
  const purchasedSoftware = useMemo<SoftwareDownloadItem[]>(() => {
    // If a custom downloadUrl was provided and is not the old dummy zip
    if (downloadUrl && !downloadUrl.includes('/downloads/J3ADiscordProfile.zip')) {
      if (downloadUrl === SOFTWARE_DOWNLOADS.DISCORD_MANAGER.downloadUrl) {
        return [SOFTWARE_DOWNLOADS.DISCORD_MANAGER];
      }
      if (downloadUrl === SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl) {
        return [SOFTWARE_DOWNLOADS.DISCORD_PROFILE];
      }
      return [
        {
          id: 'custom-download',
          name: productName || 'ซอฟต์แวร์ J3A',
          shortName: productName || 'ซอฟต์แวร์ J3A',
          downloadUrl,
          zipFileName: 'program.zip',
          exeFileName: 'program.exe',
          guideStep3: 'เปิดใช้งานโปรแกรมและเริ่มใช้งานได้ทันที!',
        },
      ];
    }

    const matches: SoftwareDownloadItem[] = [];

    const checkMatches = (text: string) => {
      const s = text.toLowerCase();
      const isManager =
        s.includes('discord manager') ||
        s.includes('discordmanager') ||
        s.includes('bot manager') ||
        s.includes('discordbot') ||
        s.includes('j3a-discord-manager');

      const isProfile =
        s.includes('discord profile') ||
        s.includes('discordprofile') ||
        s.includes('rich presence') ||
        s.includes('rpc') ||
        s.includes('j3a-discord-profile');

      const isBundle =
        s.includes('bundle') ||
        s.includes('ultimate') ||
        s.includes('2-in-1') ||
        s.includes('แพ็กเกจ');

      if (isBundle) {
        if (!matches.some((m) => m.id === SOFTWARE_DOWNLOADS.DISCORD_MANAGER.id)) {
          matches.push(SOFTWARE_DOWNLOADS.DISCORD_MANAGER);
        }
        if (!matches.some((m) => m.id === SOFTWARE_DOWNLOADS.DISCORD_PROFILE.id)) {
          matches.push(SOFTWARE_DOWNLOADS.DISCORD_PROFILE);
        }
      } else {
        if (isManager && !matches.some((m) => m.id === SOFTWARE_DOWNLOADS.DISCORD_MANAGER.id)) {
          matches.push(SOFTWARE_DOWNLOADS.DISCORD_MANAGER);
        }
        if (isProfile && !matches.some((m) => m.id === SOFTWARE_DOWNLOADS.DISCORD_PROFILE.id)) {
          matches.push(SOFTWARE_DOWNLOADS.DISCORD_PROFILE);
        }
      }
    };

    if (items && items.length > 0) {
      for (const it of items) {
        checkMatches(`${it.name || ''} ${it.slug || ''} ${it.productId || ''} ${it.category || ''}`);
      }
    }

    if (productName) {
      checkMatches(productName);
    }

    // Default fallback if no specific match was identified
    if (matches.length === 0) {
      matches.push(SOFTWARE_DOWNLOADS.DISCORD_PROFILE);
    }

    return matches;
  }, [items, productName, downloadUrl]);

  const isMultiple = purchasedSoftware.length > 1;
  const isManagerOnly = purchasedSoftware.length === 1 && purchasedSoftware[0].id === 'discord-manager';

  const celebrationTitle = isMultiple
    ? '🎉 ขอบคุณสำหรับการสั่งซื้อซอฟต์แวร์ Discord (J3A STORE)!'
    : isManagerOnly
    ? '🎉 ขอบคุณสำหรับการสั่งซื้อ J3A Discord Manager!'
    : '🎉 ขอบคุณสำหรับการสั่งซื้อ J3A Discord Profile!';

  const claimKeyFromApi = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/license/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, customerEmail }),
      });

      const data = await res.json();
      if (data.ok && data.key) {
        setLicenseKey(data.key);
      } else {
        setErrorMsg(
          data.message || 'สินค้าหมดชั่วคราว กรุณาติดต่อแอดมินเพื่อขอรับ Key'
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'ไม่สามารถเชื่อมต่อระบบส่งมอบคีย์อัตโนมัติได้ กรุณาติดต่อแอดมิน'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialKey && autoClaim) {
      claimKeyFromApi();
    }
  }, [initialKey, autoClaim, orderId]);

  const handleCopyKey = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setHasCopied(true);
    toast('✓ คัดลอก License Key สำเร็จแล้ว!', 'success');
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-[#0c0d14] border-2 border-[#7c5cff]/40 shadow-[0_0_50px_rgba(124,92,255,0.2)] p-6 sm:p-8 backdrop-blur-2xl space-y-6 text-slate-100">
      {/* 1. Header with Celebration */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-800/80">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c5cff]/15 border border-[#7c5cff]/40 text-[#7c5cff] text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(124,92,255,0.3)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated Key Delivery System</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>{celebrationTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          ระบบได้ดำเนินการจัดส่งสิทธิ์การใช้งาน (License Key) ให้คุณโดยอัตโนมัติเรียบร้อยแล้ว
        </p>
      </div>

      {/* 2. License Key Display Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-1.5 text-[#22c55e]">
            <Key className="w-4 h-4 text-[#22c55e]" />
            <span>🔑 License Key ของคุณ:</span>
          </span>
          {licenseKey && (
            <span className="text-[11px] text-slate-500 font-mono">
              1 เครื่อง / 1 HWID
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border-2 border-dashed border-[#7c5cff]/40 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 border-3 border-[#7c5cff] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(124,92,255,0.5)]" />
            <p className="text-sm font-bold text-[#7c5cff] animate-pulse">
              กำลังเชื่อมต่อและดึง License Key อัตโนมัติจากระบบ...
            </p>
            <p className="text-[11px] text-slate-500">กรุณารอสักครู่ ระบบกำลังจัดเตรียมรหัสเฉพาะสำหรับคุณ</p>
          </div>
        ) : errorMsg ? (
          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-300">{errorMsg}</p>
              <p className="text-xs text-rose-200/70 mt-1">
                คุณสามารถติดต่อแอดมินผ่าน Discord เพื่อขอรับ Key ด้วยรหัสคำสั่งซื้อได้ทันที
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={claimKeyFromApi}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              ลองใหม่อีกครั้ง
            </Button>
          </div>
        ) : (
          <div className="relative group rounded-2xl bg-slate-950 border-2 border-[#7c5cff]/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(124,92,255,0.25)]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-[#7c5cff]/20 text-[#7c5cff] flex items-center justify-center shrink-0 border border-[#7c5cff]/30">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="font-mono text-lg sm:text-2xl font-black text-white tracking-widest select-all break-all text-center sm:text-left drop-shadow-[0_0_12px_rgba(124,92,255,0.6)]">
                {licenseKey}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCopyKey}
              leftIcon={hasCopied ? <Check className="w-4 h-4 text-emerald-950 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              className={`w-full sm:w-auto font-black shadow-lg cursor-pointer transition-all ${
                hasCopied
                  ? 'bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                  : 'bg-[#7c5cff] hover:bg-[#6c4be8] text-white shadow-[0_0_20px_rgba(124,92,255,0.4)]'
              }`}
            >
              {hasCopied ? 'คัดลอกแล้ว!' : '📋 คัดลอก Key'}
            </Button>
          </div>
        )}
      </div>

      {/* 3. Primary Download Program Button(s) directly linking to Google Drive */}
      <div className="space-y-3 pt-2">
        {purchasedSoftware.map((software) => (
          <a
            key={software.id}
            href={software.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-[#22c55e] via-emerald-400 to-[#22c55e] hover:from-[#16a34a] hover:to-[#16a34a] transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:scale-[1.01] text-center cursor-pointer select-none no-underline border border-emerald-300/40"
          >
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-lg">⬇️</span>
              <span>
                {isMultiple
                  ? `ดาวน์โหลดไฟล์ติดตั้ง ${software.name} (.zip) ผ่าน Google Drive`
                  : `ดาวน์โหลดไฟล์ติดตั้ง (.zip) ผ่าน Google Drive`}
              </span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            {!isMultiple && (
              <span className="block text-[11px] font-semibold text-emerald-950/80 mt-0.5">
                สำหรับโปรแกรม: {software.name}
              </span>
            )}
          </a>
        ))}

        {/* Small guidance note under the button - Exact user specification */}
        <p className="text-[11px] sm:text-xs text-slate-400 text-center flex items-center justify-center gap-1.5 pt-0.5 px-2">
          <span>💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม</span>
        </p>
      </div>

      {/* 4. Quick Start Guide */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-3">
        <h4 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
          <span>💡 วิธีใช้งาน:</span>
        </h4>
        <ol className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed list-none pl-0">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#7c5cff]/20 text-[#7c5cff] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              ดาวน์โหลดและแตกไฟล์{' '}
              <strong>
                {isMultiple
                  ? 'ไฟล์ .zip ของโปรแกรมที่ต้องการ'
                  : purchasedSoftware[0].zipFileName}
              </strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#7c5cff]/20 text-[#7c5cff] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>
              เปิดโปรแกรม{' '}
              <strong>
                {isMultiple
                  ? 'ไฟล์ .exe ของโปรแกรม'
                  : purchasedSoftware[0].exeFileName}
              </strong>{' '}
              นำ Key ด้านบนไปกรอกในหน้าต่างเปิดใช้งานครั้งแรก
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#7c5cff]/20 text-[#7c5cff] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              {isMultiple
                ? 'ทำตามขั้นตอนการตั้งค่าในโปรแกรม และเริ่มใช้งานฟีเจอร์ระดับพรีเมียมได้ทันที!'
                : purchasedSoftware[0].guideStep3}
            </span>
          </li>
        </ol>
      </div>

      {/* 5. Help & Support Buttons at Bottom */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>พบปัญหาในการเปิดใช้งาน?</span>
        </span>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] hover:text-white border border-[#5865F2]/40 transition-all font-bold text-xs shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>เข้าห้อง Discord ร้านค้า J3ASTORE</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href="/contact"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all font-semibold text-xs cursor-pointer"
          >
            <span>ติดต่อแอดมิน</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default LicenseKeyDelivery;
