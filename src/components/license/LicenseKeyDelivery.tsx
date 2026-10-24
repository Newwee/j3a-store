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
  Layers,
  ShieldCheck,
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
    downloadUrl: 'https://drive.google.com/file/d/1meSdpyuMvpWAUqiWcMybYZNRd-_T43zM/view?usp=sharing',
    zipFileName: 'J3ADiscordManager.zip',
    exeFileName: 'J3ADiscordManager.exe',
    guideStep3: '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
  },
  DISCORD_PROFILE: {
    id: 'discord-profile',
    name: 'J3A Discord Profile',
    shortName: 'J3A Discord Profile',
    downloadUrl: 'https://drive.google.com/file/d/1LN_z1lwA-QZOBgYoWpfWQJRii0CPO4ZT/view?usp=sharing',
    zipFileName: 'J3ADiscordProfile.zip',
    exeFileName: 'J3ADiscordProfile.exe',
    guideStep3: '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
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
  quantity?: number;
  downloadUrl?: string;
  deliveryNote?: string;
  deliveryType?: 'link' | 'key' | 'both';
  licenseKeys?: string[];
  licenseKey?: string;
}

export interface DisplayKeyUnit {
  key: string;
  productId?: string;
  productName: string;
  productType: 'discord_manager' | 'discord_profile';
  unitLabel: string;
  downloadUrl: string;
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
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!initialKey && autoClaim);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasCopiedAll, setHasCopiedAll] = useState<boolean>(false);

  // Detect which software(s) were purchased based on items / product name / downloadUrl
  const [liveProducts, setLiveProducts] = useState<Record<string, { downloadUrl?: string; deliveryNote?: string }>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveProducts() {
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
    fetchLiveProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const purchasedSoftware = useMemo<SoftwareDownloadItem[]>(() => {
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
          downloadUrl: downloadUrl.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')
            ? SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl
            : downloadUrl,
          zipFileName: 'program.zip',
          exeFileName: 'program.exe',
          guideStep3: '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
        },
      ];
    }

    const matches: SoftwareDownloadItem[] = [];

    if (items && items.length > 0) {
      for (const it of items) {
        const pid = (it.productId || it.slug || '').toLowerCase();
        const pname = (it.name || '').toLowerCase();
        const pslug = (it.slug || '').toLowerCase();
        const live = liveProducts[pid] || liveProducts[pslug] || liveProducts[pname];

        let effectiveUrl = live?.downloadUrl || it.downloadUrl || getDownloadUrlForProduct(`${it.name} ${it.slug}`);
        let effectiveNote = live?.deliveryNote || it.deliveryNote;

        if (effectiveUrl && effectiveUrl.includes('/downloads/J3ADiscordProfile.zip')) {
          effectiveUrl = SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;
        }

        const itemId = it.productId || it.slug || `item-${matches.length}`;
        if (!matches.some((m) => m.id === itemId)) {
          matches.push({
            id: itemId,
            name: it.name || 'ซอฟต์แวร์ J3A',
            shortName: it.name || 'ซอฟต์แวร์ J3A',
            downloadUrl: effectiveUrl || SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl,
            zipFileName: `${(it.name || 'software').replace(/\s+/g, '')}.zip`,
            exeFileName: `${(it.name || 'software').replace(/\s+/g, '')}.exe`,
            guideStep3: effectiveNote || '💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม',
          });
        }
      }
    }

    if (matches.length === 0) {
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
    }

    if (matches.length === 0) {
      matches.push(SOFTWARE_DOWNLOADS.DISCORD_PROFILE);
    }

    return matches.map((item) => {
      let resolvedUrl = item.downloadUrl;
      let resolvedNote = item.guideStep3;

      if (resolvedUrl && resolvedUrl.includes('1ozs5fS2Y_cUcKGkuugp-5yuta5VGs385')) {
        resolvedUrl = SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;
      }

      const keyById = (item.id || '').toLowerCase();
      const keyByName = (item.name || '').toLowerCase();
      const live = liveProducts[keyById] || liveProducts[keyByName];

      if (live?.downloadUrl) {
        resolvedUrl = live.downloadUrl;
      }
      if (live?.deliveryNote) {
        resolvedNote = live.deliveryNote;
      }

      return {
        ...item,
        downloadUrl: resolvedUrl,
        guideStep3: resolvedNote,
      };
    });
  }, [items, productName, downloadUrl, liveProducts]);

  const claimKeyFromApi = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/license/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerEmail,
          items: items?.map((it) => ({
            productId: it.productId,
            name: it.name,
            slug: it.slug,
            quantity: it.quantity,
            deliveryType: it.deliveryType,
          })),
        }),
      });

      const data = await res.json();
      if (data.ok && Array.isArray(data.keys) && data.keys.length > 0) {
        setApiKeys(data.keys);
        setLicenseKey(data.keys.map((k: any) => k.key).join(', '));
      } else if (data.ok && data.key) {
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

  // Combine and structure keys for 1:1 display per purchased product & copy
  const displayKeyUnits = useMemo<DisplayKeyUnit[]>(() => {
    // 1. From API claimed keys
    if (apiKeys && apiKeys.length > 0) {
      return apiKeys.map((k, idx) => {
        const isManager = k.productType === 'discord_manager' || (k.key && k.key.includes('ADM'));
        const pType = isManager ? 'discord_manager' : 'discord_profile';
        const pName = isManager ? 'J3A Discord Manager' : 'J3A Discord Profile';
        const download = isManager
          ? SOFTWARE_DOWNLOADS.DISCORD_MANAGER.downloadUrl
          : SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;

        return {
          key: k.key,
          productId: k.productId,
          productName: k.productName || pName,
          productType: pType,
          unitLabel: `เครื่องที่ ${k.unitIndex || idx + 1}`,
          downloadUrl: download,
        };
      });
    }

    // 2. From items attached with licenseKeys
    const fromItems: DisplayKeyUnit[] = [];
    if (items && items.length > 0) {
      for (const it of items) {
        const itKeys = it.licenseKeys || (it.licenseKey ? [it.licenseKey] : []);
        const isManager =
          (it.slug || it.name || '').toLowerCase().includes('manager') ||
          (itKeys[0] && itKeys[0].includes('ADM'));

        const pType = isManager ? 'discord_manager' : 'discord_profile';
        const pName = it.name || (isManager ? 'J3A Discord Manager' : 'J3A Discord Profile');
        const download = isManager
          ? SOFTWARE_DOWNLOADS.DISCORD_MANAGER.downloadUrl
          : SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;

        itKeys.forEach((k, idx) => {
          fromItems.push({
            key: k.trim(),
            productId: it.productId,
            productName: pName,
            productType: pType,
            unitLabel: itKeys.length > 1 ? `เครื่องที่ ${idx + 1}` : '1 เครื่อง / 1 HWID',
            downloadUrl: download,
          });
        });
      }
    }

    if (fromItems.length > 0) return fromItems;

    // 3. Fallback: Parse comma or newline separated initialKey
    const rawKeys = (licenseKey || initialKey || '')
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    return rawKeys.map((k, idx) => {
      const isManager =
        k.toUpperCase().includes('ADM') ||
        (purchasedSoftware[idx]?.id === 'discord-manager');

      const pType = isManager ? 'discord_manager' : 'discord_profile';
      const pName = isManager ? 'J3A Discord Manager' : 'J3A Discord Profile';
      const download = isManager
        ? SOFTWARE_DOWNLOADS.DISCORD_MANAGER.downloadUrl
        : SOFTWARE_DOWNLOADS.DISCORD_PROFILE.downloadUrl;

      return {
        key: k,
        productName: pName,
        productType: pType,
        unitLabel: rawKeys.length > 1 ? `สิทธิ์ที่ ${idx + 1}` : '1 เครื่อง / 1 HWID',
        downloadUrl: download,
      };
    });
  }, [apiKeys, items, licenseKey, initialKey, purchasedSoftware]);

  const isMultipleKeys = displayKeyUnits.length > 1;

  const handleCopySingleKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    toast('✓ คัดลอก License Key สำเร็จแล้ว!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAllKeys = () => {
    const all = displayKeyUnits.map((u) => `${u.productName} (${u.unitLabel}): ${u.key}`).join('\n');
    navigator.clipboard.writeText(all);
    setHasCopiedAll(true);
    toast(`✓ คัดลอก License Keys ทั้งหมด (${displayKeyUnits.length} คีย์) สำเร็จ!`, 'success');
    setTimeout(() => setHasCopiedAll(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-[#0c0d14] border-2 border-[#7c5cff]/40 shadow-[0_0_50px_rgba(124,92,255,0.2)] p-6 sm:p-8 backdrop-blur-2xl space-y-6 text-slate-100">
      {/* 1. Header with Celebration */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-800/80">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c5cff]/15 border border-[#7c5cff]/40 text-[#7c5cff] text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(124,92,255,0.3)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automated 1:1 License Key Delivery</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>🎉 ส่งมอบ License Key แยกโปรแกรมเรียบร้อยแล้ว!</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {isMultipleKeys
            ? `คุณได้รับทั้งหมด ${displayKeyUnits.length} คีย์ แยกตามโปรแกรมและจำนวนที่สั่งซื้อ 1:1`
            : 'ระบบได้ดำเนินการจัดส่งสิทธิ์การใช้งาน (License Key) เฉพาะโปรแกรมของคุณเรียบร้อยแล้ว'}
        </p>
      </div>

      {/* 2. License Key Display Box(es) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-1.5 text-[#22c55e]">
            <Key className="w-4 h-4 text-[#22c55e]" />
            <span>🔑 License Key ของคุณ ({displayKeyUnits.length} รายการ):</span>
          </span>
          {isMultipleKeys && (
            <button
              type="button"
              onClick={handleCopyAllKeys}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {hasCopiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกหมดแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกทั้งหมด</span>
                </>
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border-2 border-dashed border-[#7c5cff]/40 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 border-3 border-[#7c5cff] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(124,92,255,0.5)]" />
            <p className="text-sm font-bold text-[#7c5cff] animate-pulse">
              กำลังเชื่อมต่อและดึง License Key อัตโนมัติจากระบบ...
            </p>
            <p className="text-[11px] text-slate-500">กรุณารอสักครู่ ระบบกำลังจัดเตรียมรหัสเฉพาะ 1:1 สำหรับคุณ</p>
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
        ) : displayKeyUnits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
            ไม่พบคีย์ในคำสั่งซื้อนี้ หากชำระเงินแล้วกรุณาติดต่อแอดมิน
          </div>
        ) : (
          <div className="space-y-3">
            {displayKeyUnits.map((item, idx) => {
              const isCopied = copiedKey === item.key;
              const isManager = item.productType === 'discord_manager';

              return (
                <div
                  key={`${item.key}-${idx}`}
                  className="rounded-2xl bg-slate-950 border-2 border-[#7c5cff]/50 p-4 sm:p-5 space-y-3 shadow-[0_0_25px_rgba(124,92,255,0.2)] hover:border-[#7c5cff] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
                      <span className="text-xs font-black uppercase text-white tracking-wide">
                        {isMultipleKeys ? `รายการที่ ${idx + 1}: ` : ''}
                        {item.productName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7c5cff]/20 text-[#a78bfa] border border-[#7c5cff]/30">
                        {item.unitLabel}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>สิทธิ์เฉพาะโปรแกรมนี้ 1:1</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <div className="w-9 h-9 rounded-xl bg-[#7c5cff]/20 text-[#7c5cff] flex items-center justify-center shrink-0 border border-[#7c5cff]/30">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-base sm:text-xl font-black text-white tracking-widest select-all break-all drop-shadow-[0_0_10px_rgba(124,92,255,0.6)]">
                        {item.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleCopySingleKey(item.key)}
                        leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                        className={`text-xs font-black cursor-pointer transition-all ${
                          isCopied
                            ? 'bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                            : 'bg-[#7c5cff] hover:bg-[#6c4be8] text-white shadow-[0_0_15px_rgba(124,92,255,0.3)]'
                        }`}
                      >
                        {isCopied ? 'คัดลอกแล้ว!' : 'คัดลอก Key'}
                      </Button>

                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="ดาวน์โหลดตัวติดตั้งโปรแกรมนี้"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>โหลดไฟล์</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                {purchasedSoftware.length > 1
                  ? `ดาวน์โหลดไฟล์ติดตั้ง ${software.name} (.zip) ผ่าน Google Drive`
                  : `ดาวน์โหลดไฟล์ติดตั้ง (.zip) ผ่าน Google Drive`}
              </span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            {purchasedSoftware.length === 1 && (
              <span className="block text-[11px] font-semibold text-emerald-950/80 mt-0.5">
                สำหรับโปรแกรม: {software.name}
              </span>
            )}
          </a>
        ))}

        <p className="text-[11px] sm:text-xs text-slate-400 text-center flex items-center justify-center gap-1.5 pt-0.5 px-2">
          <span>💡 หมายเหตุ: ไฟล์ zip มีขนาดประมาณ 20-35 MB หากดาวน์โหลดเสร็จแล้วให้แตกไฟล์ (Extract Here) ก่อนเปิดโปรแกรม</span>
        </p>
      </div>

      {/* 4. Quick Start Guide */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 space-y-3">
        <h4 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
          <span>💡 วิธีใช้งาน:</span>
        </h4>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            1. กดปุ่ม <strong>&quot;ดาวน์โหลดไฟล์ติดตั้ง (.zip)&quot;</strong> ด้านบน และทำการแตกไฟล์ (Extract Files)
          </p>
          <p>
            2. เปิดโปรแกรมขึ้นมา และคัดลอก License Key ประจำโปรแกรมนั้นๆ ไปวางในช่องกรอกคีย์
          </p>
          <p>
            3. โปรแกรมจะผูกสิทธิ์เข้ากับเครื่องคอมพิวเตอร์ของคุณอัตโนมัติ (1 License / 1 เครื่อง 1:1)
          </p>
        </div>
      </div>

      {/* 5. Support Discord Button */}
      {discordUrl && (
        <div className="text-center pt-2">
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7c5cff] hover:text-[#9375ff] hover:underline"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>มีปัญหาในการติดตั้งหรือเปิดใช้งาน? ติดต่อทีมงานซัพพอร์ตใน Discord</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default LicenseKeyDelivery;
