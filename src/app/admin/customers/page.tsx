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
} from 'lucide-react';
import { UserProfile, UserRole, UserTier } from '@/types/user';
import { getAllUsers, updateUserRole, updateUserCredits, updateUserProfile } from '@/lib/firestore/users';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RoleBadge, TierBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminCustomersPage() {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Manage Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('customer');
  const [editTier, setEditTier] = useState<UserTier>('Bronze');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [isSavingModal, setIsSavingModal] = useState(false);

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

  useEffect(() => {
    fetchUsers();
  }, []);

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

  return (
    <div className="space-y-6">
      <AdminHeader
        title="สมาชิกลูกค้า & จัดการเครดิต (Customers & Wallet Management)"
        description="รายชื่อสมาชิกในระบบ J3A STORE สามารถแก้ไขชื่อ ปรับเพิ่ม/ลดยอดเงินเครดิต และจัดการสิทธิ์ผู้ใช้ได้ทันที"
        actionText=""
        actionHref=""
      />

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
                            <span className="font-bold text-white block">
                              {displayName}
                            </span>
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
                        <div className="flex items-center gap-2">
                          <span className="font-black text-cyan-400 text-sm">
                            {formatCurrency(customer.credits || 0)}
                          </span>
                          <button
                            onClick={() => handleOpenManage(customer)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="ปรับเงินเครดิต"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Role selector */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={customer.role}
                          onChange={(e) =>
                            handleRoleChangeDirect(customer.uid, e.target.value as UserRole)
                          }
                          className="bg-slate-950 text-xs rounded-xl px-2.5 py-1.5 border border-slate-700 outline-none cursor-pointer"
                        >
                          <option value="customer">CUSTOMER</option>
                          <option value="admin">ADMIN (ผู้ดูแล)</option>
                        </select>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                        {formatDate(customer.createdAt)}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManage(customer)}
                          leftIcon={<Edit className="w-3.5 h-3.5 text-cyan-400" />}
                          className="text-xs font-semibold hover:border-cyan-400"
                        >
                          จัดการ / เติมเงิน
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer & Credits Management Modal */}
      {editingCustomer && (
        <Modal
          isOpen={Boolean(editingCustomer)}
          onClose={() => setEditingCustomer(null)}
          title={`จัดการข้อมูลและกระเป๋าเงินลูกค้า`}
          description={`UID: ${editingCustomer.uid}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveCustomerChanges} className="space-y-5">
            {/* User details */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">อีเมลผู้ใช้:</span>
                <span className="font-mono text-white">{editingCustomer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">วันที่สมัคร:</span>
                <span className="text-slate-300">{formatDate(editingCustomer.createdAt)}</span>
              </div>
            </div>

            {/* Display Name Edit */}
            <Input
              label="ชื่อที่แสดง (Display Name) *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="กรอกชื่อลูกค้า"
              required
            />

            {/* Tier & Role Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  ระดับสมาชิก (Tier)
                </label>
                <select
                  value={editTier}
                  onChange={(e) => setEditTier(e.target.value as UserTier)}
                  className="w-full bg-slate-950 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none cursor-pointer"
                >
                  <option value="Bronze">Bronze (ทองแดง)</option>
                  <option value="Silver">Silver (เงิน)</option>
                  <option value="Gold">Gold (ทอง)</option>
                  <option value="VIP">VIP (พิเศษ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  สิทธิ์การใช้งาน (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 text-xs sm:text-sm text-slate-200 rounded-xl px-3 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none cursor-pointer"
                >
                  <option value="customer">CUSTOMER (ลูกค้า)</option>
                  <option value="admin">ADMIN (ผู้ดูแลระบบ)</option>
                </select>
              </div>
            </div>

            {/* Wallet Credits Adjustment */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">จัดการยอดเงินเครดิต (Wallet Balance)</span>
                </div>
                <span className="text-xs text-slate-400">
                  เดิม: <strong className="text-cyan-400">{formatCurrency(editingCustomer.credits || 0)}</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 block">
                  กำหนดยอดเครดิตใหม่ (บาท):
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  value={editCredits}
                  onChange={(e) => setEditCredits(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 text-lg font-black text-cyan-400 rounded-xl px-3.5 py-2 border border-slate-800 focus:border-cyan-400 outline-none"
                />
              </div>

              {/* Quick preset adjust buttons */}
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

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
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
          </form>
        </Modal>
      )}
    </div>
  );
}
