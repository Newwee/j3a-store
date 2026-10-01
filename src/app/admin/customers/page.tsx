'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Users, Search, Shield, ShieldCheck, Mail, Calendar, Coins } from 'lucide-react';
import { UserProfile, UserRole } from '@/types/user';
import { getAllUsers, updateUserRole, updateUserCredits } from '@/lib/firestore/users';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { RoleBadge, TierBadge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminCustomersPage() {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
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
        title="สมาชิกลูกค้า (Customers Management)"
        description="รายชื่อสมาชิกในระบบ J3A STORE ตรวจสอบระดับสมาชิกและจัดการสิทธิ์แอดมิน"
        actionText=""
        actionHref=""
      />

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
                  <th className="py-4 px-4 sm:px-6 text-right">วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-slate-850/50 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 overflow-hidden shrink-0">
                          {customer.photoURL ? (
                            <Image
                              src={customer.photoURL}
                              alt={customer.displayName || 'Avatar'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span>{(customer.displayName || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-bold text-white">
                          {customer.displayName || 'Unnamed Customer'}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                      {customer.email || '-'}
                    </td>

                    {/* UID */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {customer.uid.slice(0, 10)}...
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <TierBadge tier={customer.tier || 'Bronze'} />
                    </td>

                    {/* Credits */}
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-cyan-400">
                      {formatCurrency(customer.credits || 0)}
                    </td>

                    {/* Role selector */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={customer.role}
                        onChange={(e) =>
                          handleRoleChange(customer.uid, e.target.value as UserRole)
                        }
                        className="bg-slate-950 text-xs rounded-xl px-2.5 py-1.5 border border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="customer">CUSTOMER</option>
                        <option value="admin">ADMIN (ผู้ดูแล)</option>
                      </select>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap text-xs text-slate-400">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
