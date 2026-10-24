'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Wallet,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  User,
  ShieldCheck,
  Gift,
  QrCode,
  FlaskConical,
  Zap,
} from 'lucide-react';
import { TopupRequest, TopupStatus } from '@/types/topup';
import { getAllTopups, approveTopup, rejectTopup } from '@/lib/firestore/topups';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { Button } from '@/components/ui/Button';
import { triggerMoneyCelebration } from '@/lib/utils/moneyConfetti';
import { TestAngpaoModal } from '@/components/admin/TestAngpaoModal';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AngpaoAdminDebugBanner } from '@/components/topup/AngpaoAdminDebugBanner';

export default function AdminTopupsPage() {
  const { success, error } = useToast();
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TopupStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewingSlip, setViewingSlip] = useState<TopupRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [topupToApprove, setTopupToApprove] = useState<TopupRequest | null>(null);
  const [topupToReject, setTopupToReject] = useState<TopupRequest | null>(null);

  const fetchTopups = async () => {
    setLoading(true);
    try {
      const data = await getAllTopups(statusFilter);
      setTopups(data);
    } catch (err: any) {
      error('ไม่สามารถโหลดรายการแจ้งเติมเงินได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopups();
  }, [statusFilter]);

  const filteredTopups = useMemo(() => {
    return topups.filter((t) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      return (
        t.topupNumber.toLowerCase().includes(term) ||
        t.userName.toLowerCase().includes(term) ||
        t.userEmail.toLowerCase().includes(term) ||
        t.userId.toLowerCase().includes(term)
      );
    });
  }, [topups, search]);

  const executeApprove = async () => {
    if (!topupToApprove) return;
    const topup = topupToApprove;

    setProcessingId(topup.id);
    try {
      const res = await approveTopup(topup.id);
      setTopups((prev) =>
        prev.map((t) => (t.id === topup.id ? { ...t, status: 'approved' } : t))
      );
      triggerMoneyCelebration(topup.amount);
      success(`อนุมัติเงิน ${formatCurrency(topup.amount)} เข้าบัญชี ${topup.userEmail} สำเร็จแล้ว! ยอดรวมใหม่: ${formatCurrency(res.newCredits)}`);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถอนุมัติได้'}`);
    } finally {
      setProcessingId(null);
      setTopupToApprove(null);
    }
  };

  const executeReject = async (reason?: string) => {
    if (!topupToReject) return;
    const topup = topupToReject;
    const finalReason = reason?.trim() || 'สลิปไม่ถูกต้อง หรือไม่พบยอดเงินเข้าบัญชี';

    setProcessingId(topup.id);
    try {
      await rejectTopup(topup.id, finalReason);
      setTopups((prev) =>
        prev.map((t) => (t.id === topup.id ? { ...t, status: 'rejected', adminNote: finalReason } : t))
      );
      success(`ปฏิเสธคำขอเติมเงิน #${topup.topupNumber} เรียบร้อยแล้ว`);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถปฏิเสธได้'}`);
    } finally {
      setProcessingId(null);
      setTopupToReject(null);
    }
  };

  const pendingCount = topups.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="อนุมัติการเติมเงิน (Top-up Approvals)"
        description="ตรวจสอบหลักฐานการโอนเงิน (QR Code Slip) และกดอนุมัติเพื่อเพิ่มเงินเข้าบัญชี User ID อัตโนมัติ"
        actionText=""
        actionHref=""
      >
        <button
          type="button"
          onClick={() => setIsTestModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer"
        >
          <FlaskConical className="w-4 h-4 text-purple-200" />
          <span>🧪 จำลองสร้างซองอั่งเปาทดสอบ</span>
        </button>
      </AdminHeader>

      {/* Admin Debug Mode Diagnostic Panel */}
      <AngpaoAdminDebugBanner isAdmin={true} onTopupSuccess={fetchTopups} />

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              มีรายการแจ้งเติมเงินรอการตรวจสอบและอนุมัติจากคุณ <strong>{pendingCount} รายการ</strong>
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors"
          >
            กรองเฉพาะรอตรวจสอบ
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-30">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยรหัสคำขอ, ชื่อผู้ใช้, อีเมล หรือ User UID..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <CustomDropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          options={[
            { value: 'all', label: 'ทุกสถานะการเติมเงิน' },
            { value: 'pending', label: '🟡 รอการตรวจสอบ (Pending)' },
            { value: 'approved', label: '🟢 อนุมัติแล้ว (Approved)' },
            { value: 'rejected', label: '🔴 ปฏิเสธ (Rejected)' },
            { value: 'test', label: '🧪 รายการทดสอบ (Test Only)' },
          ]}
          placeholder="สถานะการเติมเงิน"
          menuWidth="w-60"
          align="right"
        />
      </div>

      {/* Topups Table */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-center gap-3 py-6 text-cyan-400">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-wider text-slate-300">
              กำลังเชื่อมต่อและดึงรายการแจ้งเติมเงินล่าสุดจากระบบ...
            </span>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden h-16 rounded-2xl bg-slate-950/80 border border-slate-850 flex items-center px-4 sm:px-6 gap-4 sm:gap-6"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              <div className="w-24 h-4 rounded-md bg-slate-800 animate-pulse" />
              <div className="w-32 h-4 rounded-md bg-slate-800 animate-pulse hidden sm:block" />
              <div className="w-48 h-4 rounded-md bg-slate-850 animate-pulse" />
              <div className="w-20 h-4 rounded-md bg-slate-800 animate-pulse ml-auto" />
              <div className="w-28 h-8 rounded-xl bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredTopups.length === 0 ? (
        <EmptyState
          title="ไม่พบรายการแจ้งเติมเงิน"
          description="ยังไม่มีประวัติการแจ้งเติมเงินที่ตรงกับเงื่อนไขการค้นหา"
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">รหัสคำขอ</th>
                  <th className="py-4 px-4">ช่องทาง</th>
                  <th className="py-4 px-4">ลูกค้า (User ID & Email)</th>
                  <th className="py-4 px-4">ยอดเงินแจ้งโอน</th>
                  <th className="py-4 px-4">หลักฐาน</th>
                  <th className="py-4 px-4">สถานะ</th>
                  <th className="py-4 px-4">วันที่แจ้ง</th>
                  <th className="py-4 px-4 sm:px-6 text-right">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTopups.map((topup) => {
                  const isProcessing = processingId === topup.id;
                  const isAngpao =
                    topup.paymentMethod === 'truemoney_angpao' ||
                    Boolean(topup.voucherHash) ||
                    Boolean(topup.paymentSlipUrl?.includes('gift.truemoney.com'));

                  return (
                    <tr key={topup.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Topup Number */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className="font-bold text-white font-mono">
                          #{topup.topupNumber}
                        </span>
                      </td>

                      {/* Payment Method / Channel */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {topup.paymentMethod === 'truemoney_angpao_test' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                            <span>TrueMoney ซอง (TEST)</span>
                          </span>
                        ) : isAngpao ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full">
                            <Gift className="w-3.5 h-3.5 text-rose-400" />
                            <span>TrueMoney ซอง (ออโต้)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full">
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>สลิป QR Code</span>
                          </span>
                        )}
                      </td>

                      {/* User Info */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white truncate">{topup.userName}</p>
                          <p className="text-xs text-slate-400 truncate">{topup.userEmail}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate" title={topup.userId}>
                            UID: {topup.userId}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-base font-black text-cyan-400">
                          {formatCurrency(topup.amount)}
                        </span>
                      </td>

                      {/* Slip / Link preview button */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isAngpao ? (
                          topup.paymentSlipUrl?.startsWith('http') ? (
                            <a
                              href={topup.paymentSlipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>ซองของขวัญ</span>
                              <ExternalLink className="w-3 h-3 text-rose-400" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">ซองของขวัญ</span>
                          )
                        ) : topup.paymentSlipUrl ? (
                          <button
                            onClick={() => setViewingSlip(topup)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>ดูสลิปโอน</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">ไม่มีสลิป</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {topup.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว
                          </span>
                        ) : topup.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3" /> ปฏิเสธ
                          </span>
                        ) : topup.status === 'test' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.25)]">
                            <FlaskConical className="w-3 h-3 text-purple-400" /> 🧪 TEST (ทดสอบ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
                            <Clock className="w-3 h-3" /> รอตรวจสอบ
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td suppressHydrationWarning className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                        {formatDate(topup.createdAt)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        {topup.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setTopupToApprove(topup)}
                              disabled={isProcessing}
                              isLoading={isProcessing && processingId === topup.id}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                              className="font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                              อนุมัติเงินเข้าบัญชี
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setTopupToReject(topup)}
                              disabled={isProcessing}
                              leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              className="font-bold text-xs"
                            >
                              ปฏิเสธ
                            </Button>
                          </div>
                        ) : topup.status === 'test' ? (
                          <span className="text-xs font-mono font-bold text-purple-400 inline-flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" />
                            <span>รายการจำลอง (TEST)</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">ดำเนินการแล้ว</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slip Modal View */}
      {viewingSlip && (
        <Modal
          isOpen={Boolean(viewingSlip)}
          onClose={() => setViewingSlip(null)}
          title={`สลิปโอนเงิน #${viewingSlip.topupNumber} - ${formatCurrency(viewingSlip.amount)}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <p className="text-slate-400">ผู้โอน:</p>
                <p className="font-bold text-white">{viewingSlip.userName} ({viewingSlip.userEmail})</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">ยอดที่ต้องเข้า:</p>
                <p className="font-bold text-cyan-400 text-base">{formatCurrency(viewingSlip.amount)}</p>
              </div>
            </div>

            <div className="relative w-full aspect-[3/4] max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <Image
                src={viewingSlip.paymentSlipUrl}
                alt="Payment Slip Proof"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={viewingSlip.paymentSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
              >
                <span>เปิดรูปภาพเต็มในแท็บใหม่</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {viewingSlip.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const cur = viewingSlip;
                      setViewingSlip(null);
                      setTopupToApprove(cur);
                    }}
                    className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold"
                  >
                    อนุมัติเงินเข้าทันที
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modern Cyberpunk Confirmation Panel for Approval */}
      <AdminConfirmModal
        isOpen={Boolean(topupToApprove)}
        onClose={() => setTopupToApprove(null)}
        onConfirm={executeApprove}
        title="ยืนยันการอนุมัติเติมเงินเข้าบัญชี"
        description="กรุณาตรวจสอบยอดเงินและบัญชีลูกค้าให้เรียบร้อย เมื่อกดยืนยันแล้วระบบจะโอนเครดิตเข้ากระเป๋าของลูกค้าทันที"
        confirmText="ยืนยันอนุมัติเงิน"
        cancelText="ยกเลิก"
        variant="success"
        itemDetails={
          topupToApprove
            ? [
                { label: 'รหัสคำขอ:', value: `#${topupToApprove.topupNumber}` },
                {
                  label: 'ยอดเงินที่ต้องเข้า:',
                  value: (
                    <span className="text-emerald-400 font-extrabold text-sm">
                      {formatCurrency(topupToApprove.amount)}
                    </span>
                  ),
                },
                {
                  label: 'ลูกค้าผู้รับเงิน:',
                  value: `${topupToApprove.userName} (${topupToApprove.userEmail})`,
                },
                { label: 'User ID:', value: topupToApprove.userId },
                {
                  label: 'ช่องทางการโอน:',
                  value:
                    topupToApprove.paymentMethod === 'truemoney_angpao'
                      ? 'TrueMoney ซองของขวัญ'
                      : 'โอนผ่านบัญชีธนาคาร / พร้อมเพย์',
                },
              ]
            : []
        }
      />

      {/* Modern Cyberpunk Confirmation Panel for Rejection */}
      <AdminConfirmModal
        isOpen={Boolean(topupToReject)}
        onClose={() => setTopupToReject(null)}
        onConfirm={executeReject}
        title="ยืนยันการปฏิเสธคำขอเติมเงิน"
        description="คุณสามารถระบุเหตุผลการปฏิเสธเพื่อแจ้งให้ลูกค้าทราบ โดยข้อความนี้จะแสดงในหน้าประวัติการเติมเงินของลูกค้า"
        confirmText="ยืนยันปฏิเสธคำขอ"
        cancelText="ยกเลิก"
        variant="danger"
        requireInput={true}
        inputLabel="เหตุผลการปฏิเสธ (ลูกค้าจะมองเห็นข้อความนี้)"
        inputPlaceholder="เช่น สลิปไม่ตรงยอดเงิน หรือไม่พบยอดเงินเข้าบัญชี..."
        defaultValue="สลิปไม่ถูกต้อง หรือไม่พบยอดเงินเข้าบัญชี"
        itemDetails={
          topupToReject
            ? [
                { label: 'รหัสคำขอ:', value: `#${topupToReject.topupNumber}` },
                { label: 'ยอดเงิน:', value: formatCurrency(topupToReject.amount) },
                { label: 'ลูกค้า:', value: `${topupToReject.userName} (${topupToReject.userEmail})` },
              ]
            : []
        }
      />

      {/* Test Angpao Generator Simulation Modal */}
      <TestAngpaoModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onTopupSuccess={fetchTopups}
      />
    </div>
  );
}
