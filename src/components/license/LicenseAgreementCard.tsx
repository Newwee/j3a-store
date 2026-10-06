'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LicenseAgreementCardProps {
  isAgreed: boolean;
  onAgreementChange: (agreed: boolean) => void;
  onProceedToPayment?: () => void;
  showPaymentButton?: boolean;
  isProcessing?: boolean;
  className?: string;
}

export function LicenseAgreementCard({
  isAgreed,
  onAgreementChange,
  onProceedToPayment,
  showPaymentButton = false,
  isProcessing = false,
  className = '',
}: LicenseAgreementCardProps) {
  return (
    <div
      className={`license-agreement-card rounded-2xl p-5 sm:p-6 bg-gradient-to-b from-amber-950/30 via-slate-950/80 to-slate-950/90 border-2 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] space-y-4 backdrop-blur-md ${className}`}
    >
      {/* Alert Header Box */}
      <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-amber-300 tracking-tight">
            ⚠️ โปรดอ่านก่อนสั่งซื้อ (ข้อตกลงการใช้งาน)
          </h3>
          <p className="text-[11px] text-amber-200/70">
            ข้อกำหนดสิทธิ์การใช้งานสำหรับซอฟต์แวร์ J3A Discord Profile
          </p>
        </div>
      </div>

      {/* Bullet Points Content (100% exact text matching specification) */}
      <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed pl-1">
        <div className="flex items-start gap-2.5">
          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
          <span>
            <strong>1 License Key ใช้ได้กับคอมพิวเตอร์ 1 เครื่อง เท่านั้น</strong> (ผูกสิทธิ์ผ่านรหัสอุปกรณ์ HWID อัตโนมัติ)
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
          <span>
            ไม่มีการเก็บหรือเข้าถึงข้อมูลส่วนตัวใด ๆ ในคอมพิวเตอร์ของผู้ใช้ทั้งสิ้น
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
          <span>
            หากมีการเปลี่ยนเครื่องหรือลง Windows ใหม่ สามารถติดต่อแอดมินเพื่อรีเซ็ตสิทธิ์ได้ตลอดเวลา
          </span>
        </div>
      </div>

      {/* Checkbox Agreement (100% exact text matching specification) */}
      <div className="pt-2">
        <label
          htmlFor="licenseAgreementCheckbox"
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
            isAgreed
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
              : 'bg-slate-950/70 border-slate-700/80 hover:border-amber-500/50'
          }`}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              id="licenseAgreementCheckbox"
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => onAgreementChange(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                isAgreed
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                  : 'bg-slate-900 border-slate-600 peer-hover:border-amber-400'
              }`}
            >
              {isAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
          <span
            className={`text-xs sm:text-sm font-semibold transition-colors ${
              isAgreed ? 'text-emerald-300' : 'text-slate-300'
            }`}
          >
            ฉันได้อ่านและยอมรับเงื่อนไข 1 คีย์ต่อ 1 เครื่อง และนโยบายความเป็นส่วนตัว
          </span>
        </label>
      </div>

      {/* Optional Payment Button inside Card */}
      {showPaymentButton && (
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onProceedToPayment}
            disabled={!isAgreed || isProcessing}
            isLoading={isProcessing}
            className={`w-full font-bold transition-all ${
              isAgreed
                ? 'bg-[#7c5cff] hover:bg-[#6c4be8] text-white shadow-[0_0_25px_rgba(124,92,255,0.4)]'
                : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400'
            }`}
          >
            ดำเนินการชำระเงิน
          </Button>
        </div>
      )}
    </div>
  );
}

export default LicenseAgreementCard;
