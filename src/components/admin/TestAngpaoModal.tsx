'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Gift,
  Copy,
  Check,
  Zap,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { triggerMoneyCelebration } from '@/lib/utils/moneyConfetti';
import { TestAngpaoVoucher } from '@/app/api/admin/angpao/test-gen/route';

interface TestAngpaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopupSuccess?: () => void;
}

const PRESET_AMOUNTS = [10, 20, 50, 100, 300, 500, 1000];

export function TestAngpaoModal({ isOpen, onClose, onTopupSuccess }: TestAngpaoModalProps) {
  const { success, error, info } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<TestAngpaoVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState<boolean>(false);
  const [latestGenerated, setLatestGenerated] = useState<TestAngpaoVoucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getAdminToken = async (): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.access_token || null;
  };

  const fetchVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const token = await getAdminToken();
      if (!token) return;

      const res = await fetch('/api/admin/angpao/test-gen', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.vouchers)) {
        setVouchers(json.vouchers);
      }
    } catch (err: any) {
      console.error('Failed to fetch test vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVouchers();
    }
  }, [isOpen]);

  const effectiveAmount = customAmount ? Number(customAmount) || 0 : selectedAmount;

  const handleGenerate = async () => {
    if (effectiveAmount <= 0) {
      error('กรุณาระบุจำนวนเงินที่ต้องการทดสอบมากกว่า 0 บาท');
      return;
    }

    setIsGenerating(true);
    try {
      const token = await getAdminToken();
      if (!token) {
        error('ไม่พบเซสชันแอดมิน กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const res = await fetch('/api/admin/angpao/test-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: effectiveAmount }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'สร้างซองทดสอบล้มเหลว');
      }

      setLatestGenerated(json.voucher);
      success(json.message || `สร้างลิงก์ซองทดสอบ ฿${effectiveAmount} สำเร็จ!`);
      await fetchVouchers();
    } catch (err: any) {
      error(err.message || 'เกิดข้อผิดพลาดในการสร้างซองทดสอบ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (textToCopy: string, code: string) => {
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCode(code);
      success('คัดลอกลิงก์ซองทดสอบลงคลิปบอร์ดแล้ว!');
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (err) {
      info(`คัดลอกด้วยตนเอง: ${textToCopy}`);
    }
  };

  const handle1ClickRedeem = async (voucher: TestAngpaoVoucher) => {
    setIsRedeeming(voucher.code);
    try {
      const token = await getAdminToken();
      if (!token) {
        error('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const res = await fetch('/api/topup/angpao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voucherCode: voucher.code }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'ทดสอบแลกซองล้มเหลว');
      }

      triggerMoneyCelebration(voucher.amount);
      success(`🎉 ทดสอบสำเร็จ! ได้รับเครดิตทดสอบ ฿${voucher.amount} เข้าบัญชีแล้ว (สถานะ TEST - ไม่นับลง Dashboard)`);

      // Update state
      if (latestGenerated?.id === voucher.id) {
        setLatestGenerated({ ...latestGenerated, isUsed: true, usedCount: 1 });
      }
      await fetchVouchers();
      if (onTopupSuccess) {
        onTopupSuccess();
      }
    } catch (err: any) {
      error(err.message || 'เกิดข้อผิดพลาดในการทดสอบแลกซอง');
    } finally {
      setIsRedeeming(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const token = await getAdminToken();
      if (!token) return;

      const res = await fetch(`/api/admin/angpao/test-gen?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);

      if (latestGenerated?.id === id) {
        setLatestGenerated(null);
      }
      setVouchers((prev) => prev.filter((v) => v.id !== id));
      success('ลบซองทดสอบเรียบร้อยแล้ว');
    } catch (err: any) {
      error(err.message || 'ลบไม่สำเร็จ');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearBulk = async (action: 'used' | 'all') => {
    const confirmMsg =
      action === 'all'
        ? 'ต้องการลบซองทดสอบทั้งหมดหรือไม่?'
        : 'ต้องการลบซองทดสอบที่ถูกแลกรับแล้วทั้งหมดหรือไม่?';
    if (!confirm(confirmMsg)) return;

    try {
      const token = await getAdminToken();
      if (!token) return;

      const res = await fetch(`/api/admin/angpao/test-gen?action=${action}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);

      success(json.message);
      await fetchVouchers();
      if (action === 'all') setLatestGenerated(null);
    } catch (err: any) {
      error(err.message || 'ล้มเหลว');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧪 ระบบจำลองสร้างซองอั่งเปาทดสอบ (Test Angpao Generator)"
      maxWidth="xl"
    >
      <div className="space-y-6 text-slate-200">
        {/* Banner Alert */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm flex items-start gap-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <FlaskConical className="w-5 h-5 shrink-0 text-purple-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">โหมดทดสอบจำลอง (Simulation Mode - ไม่กระทบยอดเงินจริง)</p>
            <p className="text-purple-300/90 leading-relaxed text-xs">
              ระบบนี้มีไว้สำหรับแอดมินทดสอบระบบเติมเงินและสั่งซื้อสินค้าโดยไม่ต้องใช้เงินจริง
              ซองที่ถูกแลกจะได้รับเครดิตเข้า User ทันที และจะถูกบันทึกสถานะเป็น{' '}
              <strong className="text-purple-300 font-mono underline decoration-purple-400">TEST</strong>{' '}
              โดย<strong>ไม่ถูกนับยอดขาย รายได้ หรือสถิติใดๆ ลงใน Dashboard</strong>
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-rose-400" />
              <span>เลือกจำนวนเงินจำลอง (บาท)</span>
            </span>
            <span className="text-[11px] font-bold text-cyan-400">
              ยอดทดสอบ: {formatCurrency(effectiveAmount)}
            </span>
          </div>

          {/* Amount Presets */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedAmount === amt && !customAmount;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  ฿{amt}
                </button>
              );
            })}
          </div>

          {/* Custom Amount input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                placeholder="หรือระบุจำนวนเงินเอง (เช่น 250)..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-900 text-xs text-white placeholder:text-slate-500 rounded-xl px-3 py-2 border border-slate-800 focus:border-purple-400 outline-none"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={isGenerating || effectiveAmount <= 0}
              leftIcon={<Zap className="w-3.5 h-3.5 text-slate-950" />}
              className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-black border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.35)] shrink-0"
            >
              สร้างซองทดสอบ
            </Button>
          </div>
        </div>

        {/* Latest Generated Voucher Result Box */}
        {latestGenerated && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 border-2 border-purple-500/50 space-y-3 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                  🎉 ซองทดสอบที่เพิ่งสร้างล่าสุด
                </span>
              </div>
              <span className="text-sm font-black text-emerald-400">
                +{formatCurrency(latestGenerated.amount)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5 overflow-hidden">
                <p className="text-[11px] text-slate-400 font-medium">ลิงก์ซองของขวัญจำลอง (TrueMoney Mock Link):</p>
                <p className="text-xs text-purple-300 font-mono font-bold truncate select-all" title={latestGenerated.link}>
                  {latestGenerated.link}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(latestGenerated.link, latestGenerated.code)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === latestGenerated.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>

                {!latestGenerated.isUsed && (
                  <button
                    type="button"
                    onClick={() => handle1ClickRedeem(latestGenerated)}
                    disabled={isRedeeming === latestGenerated.code}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRedeeming === latestGenerated.code ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>ทดสอบเติมทันที (1-Click)</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              💡 <strong>วิธีทดสอบ:</strong> สามารถกดปุ่ม <strong>"ทดสอบเติมทันที (1-Click)"</strong> เพื่อให้ระบบเติมเครดิตเข้าบัญชีของคุณทันที หรือจะก๊อปปี้ลิงก์ไปวางในหน้า <strong>"โปรไฟล์ &gt; เติมเงิน &gt; ซองของขวัญ"</strong> เพื่อทดสอบมุมมองลูกค้าก็ได้เช่นกัน
            </p>
          </div>
        )}

        {/* Existing Vouchers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">ประวัติซองทดสอบทั้งหมด ({vouchers.length})</span>
              <button
                type="button"
                onClick={fetchVouchers}
                disabled={loadingVouchers}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="รีเฟรชรายการ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingVouchers ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>

            {vouchers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClearBulk('used')}
                  className="text-[11px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  ล้างซองที่แลกแล้ว
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => handleClearBulk('all')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            )}
          </div>

          {loadingVouchers && vouchers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>กำลังโหลดรายการซองทดสอบ...</span>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              ยังไม่มีซองทดสอบที่ถูกสร้าง กดปุ่ม &quot;สร้างซองทดสอบ&quot; ด้านบนเพื่อเริ่มทดสอบ
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {vouchers.map((v) => {
                const isCurrentlyRedeeming = isRedeeming === v.code;
                const isCurrentlyDeleting = isDeleting === v.id;

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs ${
                      v.isUsed
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-900/60 border-purple-500/20 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white tracking-wider">{v.code}</span>
                        <span className="font-black text-cyan-400">฿{v.amount}</span>
                        {v.isUsed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            แลกรับแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            พร้อมใช้งาน
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{v.link}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(v.link, v.code)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="คัดลอกลิงก์ซอง"
                      >
                        {copiedCode === v.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {!v.isUsed && (
                        <button
                          type="button"
                          onClick={() => handle1ClickRedeem(v)}
                          disabled={isCurrentlyRedeeming}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isCurrentlyRedeeming ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 fill-current" />
                          )}
                          <span>แลกทันที</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(v.id)}
                        disabled={isCurrentlyDeleting}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                        title="ลบซองนี้"
                      >
                        {isCurrentlyDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
