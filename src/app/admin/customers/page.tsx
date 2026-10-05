'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Coins,
  Edit,
  Wallet,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Clock,
  UserX,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, UserRole, UserTier, DeletionRequest } from '@/types/user';
import {
  getAllUsers,
  updateUserRole,
  updateUserCredits,
  updateUserProfile,
  deleteUserDoc,
} from '@/lib/firestore/users';
import {
  getAllDeletionRequests,
  approveAccountDeletion,
  rejectAccountDeletion,
  clearOrArchiveDeletionRequest,
} from '@/lib/firestore/deletionRequests';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RoleBadge, TierBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminCustomersPage() {
  const { success, error } = useToast();
  const { showLoading, hideLoading } = useLoading();

  // Tab State: 'customers' or 'deletions'
  const [activeTab, setActiveTab] = useState<'customers' | 'deletions'>('customers');

  // Customers State
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Deletion Requests State
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loadingDeletions, setLoadingDeletions] = useState(false);

  // Manage Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('customer');
  const [editTier, setEditTier] = useState<UserTier>('Bronze');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Approve Deletion Modal State
  const [approvingRequest, setApprovingRequest] = useState<DeletionRequest | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Reject Deletion Modal State
  const [rejectingRequest, setRejectingRequest] = useState<DeletionRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Direct Delete Customer State
  const [deletingCustomer, setDeletingCustomer] = useState<UserProfile | null>(null);
  const [isDeletingDirectly, setIsDeletingDirectly] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers(100);
      setCustomers(data);
    } catch (err: any) {
      error('ไม่สามารถโหลดข้อมูลลูกค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionRequests = async () => {
    setLoadingDeletions(true);
    try {
      const data = await getAllDeletionRequests();
      setDeletionRequests(data);
    } catch (err: any) {
      console.warn('Could not load deletion requests:', err);
    } finally {
      setLoadingDeletions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDeletionRequests();
  }, []);

  const pendingRequests = useMemo(() => {
    return deletionRequests.filter((r) => r.status === 'pending');
  }, [deletionRequests]);

  const pendingUserIds = useMemo(() => {
    return new Set(pendingRequests.map((r) => r.userId));
  }, [pendingRequests]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      return (
        (c.displayName && c.displayName.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        c.uid.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const handleOpenManage = (customer: UserProfile) => {
    setEditingCustomer(customer);
    setEditName(customer.displayName || (customer.email ? customer.email.split('@')[0] : 'Customer'));
    setEditRole(customer.role);
    setEditTier(customer.tier);
    setEditCredits(customer.credits || 0);
  };

  const handleSaveCustomerChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSavingModal(true);
    try {
      const cleanName = editName.trim() || 'Customer';
      const cleanCredits = Math.max(0, Number(editCredits) || 0);

      // 1. Update Credits in Firestore
      await updateUserCredits(editingCustomer.uid, cleanCredits);

      // 2. Update Profile Name and Tier in Firestore
      await updateUserProfile(editingCustomer.uid, {
        displayName: cleanName,
        tier: editTier,
      });

      // 3. Update Role in Firestore
      if (editRole !== editingCustomer.role) {
        await updateUserRole(editingCustomer.uid, editRole);
      }

      // Update Local State
      setCustomers((prev) =>
        prev.map((c) =>
          c.uid === editingCustomer.uid
            ? {
                ...c,
                displayName: cleanName,
                credits: cleanCredits,
                tier: editTier,
                role: editRole,
              }
            : c
        )
      );

      success(`อัปเดตข้อมูลและเครดิตของ "${cleanName}" สำเร็จแล้ว! ยอดเครดิตคงเหลือ: ${formatCurrency(cleanCredits)}`);
      setEditingCustomer(null);
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการบันทึก: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleRoleChangeDirect = async (uid: string, newRole: UserRole) => {
    try {
      await updateUserRole(uid, newRole);
      setCustomers((prev) =>
        prev.map((c) => (c.uid === uid ? { ...c, role: newRole } : c))
      );
      success(`อัปเดตสิทธิ์ผู้ใช้เป็น ${newRole.toUpperCase()} สำเร็จแล้ว`);
    } catch (err: any) {
      error('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์');
    }
  };

  // Approve Account Deletion Handler
  const handleConfirmApproval = async () => {
    if (!approvingRequest) return;
    setIsProcessingApproval(true);
    showLoading('กำลังอนุมัติและลบข้อมูลบัญชีลูกค้าออกจากระบบ...');
    try {
      await approveAccountDeletion(approvingRequest.id, approvingRequest.userId);
      success(
        `อนุมัติและลบข้อมูลบัญชีของ "${approvingRequest.displayName || approvingRequest.email || approvingRequest.userId}" ออกจากระบบเรียบร้อยแล้ว`
      );

      // Update local states
      setCustomers((prev) => prev.filter((c) => c.uid !== approvingRequest.userId));
      setDeletionRequests((prev) =>
        prev.map((r) =>
          r.id === approvingRequest.id
            ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
            : r
        )
      );
      setApprovingRequest(null);
    } catch (err: any) {
      error(`ไม่สามารถอนุมัติการลบได้: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsProcessingApproval(false);
      hideLoading();
    }
  };

  // Reject Account Deletion Handler
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setIsProcessingReject(true);
    showLoading('กำลังดำเนินการปฏิเสธคำขอลบบัญชี...');
    try {
      await rejectAccountDeletion(rejectingRequest.id, rejectNote);
      success('ปฏิเสธคำขอลบบัญชีเรียบร้อยแล้ว');

      setDeletionRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingRequest.id
            ? {
                ...r,
                status: 'rejected',
                adminNote: rejectNote.trim() || 'คำขอลบบัญชีถูกปฏิเสธโดยแอดมิน',
                rejectedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setRejectingRequest(null);
      setRejectNote('');
    } catch (err: any) {
      error(`เกิดข้อผิดพลาดในการปฏิเสธคำขอ: ${err.message || 'กรุณาลองใหม่'}`);
    } finally {
      setIsProcessingReject(false);
      hideLoading();
    }
  };

  // Direct Delete Customer Handler
  const handleConfirmDirectDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeletingDirectly(true);
    showLoading(`กำลังลบข้อมูลลูกค้า "${deletingCustomer.displayName || deletingCustomer.email}" ออกจากระบบ...`);
    try {
      await deleteUserDoc(deletingCustomer.uid);
      await clearOrArchiveDeletionRequest(deletingCustomer.uid);

      setCustomers((prev) => prev.filter((c) => c.uid !== deletingCustomer.uid));
      setDeletionRequests((prev) =>
        prev.map((r) =>
          r.userId === deletingCustomer.uid
            ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
            : r
        )
      );
      success(`ลบข้อมูลลูกค้า "${deletingCustomer.displayName || deletingCustomer.email}" ออกจากระบบเรียบร้อยแล้ว`);
      setDeletingCustomer(null);
      if (editingCustomer?.uid === deletingCustomer.uid) {
        setEditingCustomer(null);
      }
    } catch (err: any) {
      error(`ไม่สามารถลบข้อมูลลูกค้าได้: ${err.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsDeletingDirectly(false);
      hideLoading();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminHeader
        title="สมาชิกลูกค้า & คำขอลบบัญชี (Customers & Account Deletions)"
        description="รายชื่อสมาชิกในระบบ J3A STORE สามารถปรับเพิ่ม/ลดยอดเงินเครดิต จัดการสิทธิ์ และอนุมัติคำขอลบบัญชีจากลูกค้าได้ทันที"
        actionText=""
        actionHref=""
      />

      {/* Tabs Selector: Customers vs Deletion Requests */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>รายชื่อลูกค้าทั้งหมด ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deletions')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer relative ${
            activeTab === 'deletions'
              ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>คำขอลบบัญชี</span>
          {pendingRequests.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white animate-pulse">
              {pendingRequests.length}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-normal">
              ({deletionRequests.length})
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Admin Notice */}
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 shrink-0 text-cyan-400" />
              <span>
                <strong>การจัดการเงินลูกค้า:</strong> คุณสามารถกดปุ่ม <strong>"จัดการ / เติมเงิน"</strong> ที่ลูกค้าแต่ละคน เพื่อพิมพ์ปรับยอดเครดิต เพิ่มเงิน หรือลดเงินเข้าบัญชีของลูกค้ารายนั้นได้โดยตรงทันที
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาลูกค้าด้วยชื่อ, อีเมล หรือ UID..."
                className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Customers Table */}
          {loading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="ไม่พบรายชื่อลูกค้า"
              description="ยังไม่มีผู้ใช้ตรงกับคำค้นหาของคุณ"
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-4 sm:px-6">ผู้ใช้งาน</th>
                      <th className="py-4 px-4">อีเมล</th>
                      <th className="py-4 px-4">UID</th>
                      <th className="py-4 px-4">ระดับสมาชิก (Tier)</th>
                      <th className="py-4 px-4">เครดิตสะสม</th>
                      <th className="py-4 px-4">สิทธิ์ (Role)</th>
                      <th className="py-4 px-4">วันที่สมัคร</th>
                      <th className="py-4 px-4 sm:px-6 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filtered.map((customer) => {
                      const displayName = customer.displayName || (customer.email ? customer.email.split('@')[0] : 'Customer');
                      const initials = displayName.charAt(0).toUpperCase();
                      const hasPendingDeletion = pendingUserIds.has(customer.uid);

                      return (
                        <tr key={customer.uid} className="hover:bg-slate-850/50 transition-colors">
                          {/* User */}
                          <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 overflow-hidden shrink-0">
                                {customer.photoURL ? (
                                  <Image
                                    src={customer.photoURL}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white block">
                                    {displayName}
                                  </span>
                                  {hasPendingDeletion && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                                      ⚠️ รอลบบัญชี
                                    </span>
                                  )}
                                </div>
                                {customer.phone && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    📞 {customer.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                            {customer.email || '-'}
                          </td>

                          {/* UID */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]" title={customer.uid}>
                            {customer.uid.slice(0, 10)}...
                          </td>

                          {/* Tier */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <TierBadge tier={customer.tier || 'Bronze'} />
                          </td>

                          {/* Credits */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-cyan-300 text-sm">
                              {formatCurrency(customer.credits || 0)}
                            </span>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={customer.role} />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRoleChangeDirect(
                                    customer.uid,
                                    customer.role === 'admin' ? 'customer' : 'admin'
                                  )
                                }
                                title={`คลิกเพื่อสลับเป็น ${customer.role === 'admin' ? 'Customer' : 'Admin'}`}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors text-[10px]"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Date */}
                          <td suppressHydrationWarning className="py-3 px-4 whitespace-nowrap text-slate-400 text-xs">
                            {formatDate(customer.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenManage(customer)}
                                leftIcon={<Edit className="w-3.5 h-3.5" />}
                                className="text-xs font-bold text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400"
                              >
                                จัดการ / เติมเงิน
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeletingCustomer(customer)}
                                title="ลบผู้ใช้นี้ออกจากระบบถาวร"
                                className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACCOUNT DELETION REQUESTS */}
      {activeTab === 'deletions' && (
        <div className="space-y-6">
          {/* Deletion Warning Banner */}
          <div className="p-5 rounded-3xl bg-amber-950/20 border-2 border-amber-500/40 text-amber-200 text-xs sm:text-sm space-y-2 shadow-lg">
            <div className="flex items-center gap-2.5 font-bold text-amber-300 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>การอนุมัติลบบัญชีและข้อมูลผู้ใช้งาน (Admin Approval Policy)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              เมื่อลูกค้าส่งคำขอลบบัญชี ระบบจะแจ้งให้ลูกค้า <strong>ติดต่อแอดมินทาง Discord Server (เปิด Ticket) หรือทัก LINE: @153nhgvs</strong> เพื่อยืนยันสิทธิ์ เมื่อแอดมินตรวจสอบยอดเงินคงเหลือและยืนยันตัวตนเรียบร้อยแล้ว จึงกดปุ่ม <strong>"อนุมัติลบข้อมูล"</strong> เพื่อลบข้อมูลของผู้ใช้นั้นออกจากระบบ Firestore ถาวร
            </p>
          </div>

          {loadingDeletions ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
              ))}
            </div>
          ) : deletionRequests.length === 0 ? (
            <EmptyState
              title="ไม่มีคำขอลบบัญชี"
              description="ยังไม่มีลูกค้าส่งคำขอลบบัญชีเข้ามาในระบบ"
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-4 sm:px-6">ผู้ใช้งานที่ขอลบ</th>
                      <th className="py-4 px-4">อีเมล</th>
                      <th className="py-4 px-4">UID</th>
                      <th className="py-4 px-4">เครดิตค้างอยู่</th>
                      <th className="py-4 px-4">วันที่ส่งคำขอ</th>
                      <th className="py-4 px-4">เหตุผลที่ระบุ</th>
                      <th className="py-4 px-4">สถานะ</th>
                      <th className="py-4 px-4 sm:px-6 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {deletionRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr key={req.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 sm:px-6 whitespace-nowrap font-bold text-white">
                            <div className="flex items-center gap-2">
                              <UserX className="w-4 h-4 text-rose-400" />
                              <span>{req.displayName || 'Customer'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-300">
                            {req.email || '-'}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500" title={req.userId}>
                            {req.userId.slice(0, 10)}...
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {(req.credits ?? 0) > 0 ? (
                              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                                ฿{(req.credits ?? 0).toLocaleString()} บาท
                              </span>
                            ) : (
                              <span className="font-mono text-slate-500">฿0</span>
                            )}
                          </td>

                          <td suppressHydrationWarning className="py-3 px-4 whitespace-nowrap text-slate-400 text-xs">
                            {formatDate(req.createdAt)}
                          </td>

                          <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate" title={req.userReason || '-'}>
                            {req.userReason || '-'}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>รอแอดมินอนุมัติ</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <Check className="w-3 h-3" />
                                <span>อนุมัติลบแล้ว</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                <X className="w-3 h-3" />
                                <span>ปฏิเสธคำขอ</span>
                              </span>
                            )}
                            {req.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700">
                                <span>ลูกค้ายกเลิก</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 sm:px-6 whitespace-nowrap text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setApprovingRequest(req)}
                                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                                  className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                                >
                                  อนุมัติลบข้อมูล
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRejectingRequest(req)}
                                  className="text-xs text-slate-400 hover:text-white"
                                >
                                  ปฏิเสธ
                                </Button>
                              </div>
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
        </div>
      )}

      {/* MODAL 1: Manage Customer & Wallet Modal */}
      {editingCustomer && (
        <Modal
          isOpen={Boolean(editingCustomer)}
          onClose={() => setEditingCustomer(null)}
          title={`จัดการลูกค้า: ${editingCustomer.displayName || editingCustomer.email || 'Customer'}`}
        >
          <form onSubmit={handleSaveCustomerChanges} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">UID:</span>
                <span className="font-mono text-slate-200">{editingCustomer.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">อีเมล:</span>
                <span className="font-mono text-slate-200">{editingCustomer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">วันที่สมัคร:</span>
                <span className="text-slate-200">{formatDate(editingCustomer.createdAt)}</span>
              </div>
            </div>

            <Input
              label="ชื่อที่แสดง (Display Name)"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="ระบุชื่อที่ต้องการแก้ไข"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  สิทธิ์ผู้ใช้งาน (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-400 outline-none"
                >
                  <option value="customer">Customer (ลูกค้าทั่วไป)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ระดับสมาชิก (Tier)
                </label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value as UserTier)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-400 outline-none"
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-cyan-400" />
                  <span>ยอดเงินเครดิตคงเหลือ (Wallet Credits)</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ปัจจุบัน: {formatCurrency(editingCustomer.credits || 0)}
                </span>
              </div>

              <Input
                type="number"
                min="0"
                step="1"
                value={editCredits}
                onChange={(e) => setEditCredits(Math.max(0, Number(e.target.value)))}
                placeholder="ระบุยอดเครดิตที่ต้องการตั้งค่าใหม่"
                required
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 block">ปุ่มลัดเพิ่ม / ลดเงิน:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[50, 100, 300, 500, 1000].map((amt) => (
                    <button
                      key={`add-${amt}`}
                      type="button"
                      onClick={() => setEditCredits((prev) => prev + amt)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-colors"
                    >
                      +{amt}฿
                    </button>
                  ))}
                  {[50, 100, 500].map((amt) => (
                    <button
                      key={`sub-${amt}`}
                      type="button"
                      onClick={() => setEditCredits((prev) => Math.max(0, prev - amt))}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs transition-colors"
                    >
                      -{amt}฿
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditCredits(0)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    ล้างเป็น 0฿
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  const target = editingCustomer;
                  setDeletingCustomer(target);
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-xs bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold"
              >
                ลบผู้ใช้นี้ออกจากระบบ
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setEditingCustomer(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSavingModal}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                >
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Approve Account Deletion Modal */}
      {approvingRequest && (
        <Modal
          isOpen={Boolean(approvingRequest)}
          onClose={() => setApprovingRequest(null)}
          title="⚠️ ยืนยันการอนุมัติลบบัญชีและข้อมูลผู้ใช้"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 text-rose-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>คำเตือน: การลบข้อมูลจะไม่สามารถกู้คืนได้</span>
              </div>
              <p className="leading-relaxed">
                การอนุมัตินี้จะดำเนินการ <strong>ลบข้อมูลโปรไฟล์ของผู้ใช้นี้ออกจากคอลเลกชัน users ใน Cloud Firestore อย่างถาวร</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">ชื่อผู้ใช้:</span>
                <span className="font-bold text-white">{approvingRequest.displayName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">อีเมล:</span>
                <span className="font-mono text-slate-200">{approvingRequest.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UID:</span>
                <span className="font-mono text-slate-400">{approvingRequest.userId}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">เครดิตค้างอยู่ในระบบ:</span>
                <span className="font-bold font-mono text-amber-400">
                  ฿{(approvingRequest.credits ?? 0).toLocaleString()} บาท
                </span>
              </div>
              {approvingRequest.userReason && (
                <div className="pt-1 border-t border-slate-800">
                  <span className="text-slate-400 block mb-0.5">เหตุผลที่ลูกค้าระบุ:</span>
                  <span className="text-slate-300 italic">{approvingRequest.userReason}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setApprovingRequest(null)}
                disabled={isProcessingApproval}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleConfirmApproval}
                isLoading={isProcessingApproval}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                อนุมัติและลบข้อมูลถาวร
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Reject Account Deletion Modal */}
      {rejectingRequest && (
        <Modal
          isOpen={Boolean(rejectingRequest)}
          onClose={() => setRejectingRequest(null)}
          title="ปฏิเสธคำขอลบบัญชี"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              คุณต้องการปฏิเสธคำขอลบบัญชีของ <strong>{rejectingRequest.displayName || rejectingRequest.email}</strong> หรือไม่?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                หมายเหตุจากแอดมิน (ไม่บังคับ)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ข้อมูลไม่ถูกต้อง หรือมีคำสั่งซื้อค้างอยู่..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setRejectingRequest(null)}
                disabled={isProcessingReject}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmReject}
                isLoading={isProcessingReject}
                className="font-bold"
              >
                ยืนยันการปฏิเสธ
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: Confirm Delete Customer Directly Modal */}
      {deletingCustomer && (
        <Modal
          isOpen={Boolean(deletingCustomer)}
          onClose={() => !isDeletingDirectly && setDeletingCustomer(null)}
          title="⚠️ ยืนยันการลบข้อมูลผู้ใช้งานออกจากระบบ"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-rose-200">
                <span className="font-bold text-rose-100 block">คำเตือน: การลบข้อมูลผู้ใช้จะไม่สามารถกู้คืนได้</span>
                การดำเนินการนี้จะ <strong>ลบข้อมูลโปรไฟล์ของผู้ใช้นี้ออกจากระบบ Cloud Firestore ทันที</strong> รวมทั้งสิทธิ์ และยอดเงินคงเหลือ
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ชื่อลูกค้า:</span>
                <span className="font-bold text-white">
                  {deletingCustomer.displayName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">อีเมล:</span>
                <span className="font-mono text-cyan-300">{deletingCustomer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UID:</span>
                <span className="font-mono text-slate-400">{deletingCustomer.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ยอดเงินเครดิตคงเหลือ:</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatCurrency(deletingCustomer.credits || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeletingCustomer(null)}
                disabled={isDeletingDirectly}
              >
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDirectDelete}
                isLoading={isDeletingDirectly}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                ยืนยันการลบข้อมูลผู้ใช้ถาวร
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
