'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Package,
  Wallet,
  Users,
  Lock,
  KeyRound,
  Cpu,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getAuditLogs, clearAuditLogs } from '@/lib/firestore/auditLogs';
import { AuditLogItem, AuditCategory, AuditSeverity, AuditResult } from '@/types/auditLog';
import { AuditLogDetailModal } from '@/components/admin/AuditLogDetailModal';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/Button';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<AuditResult | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await getAuditLogs({
        category: selectedCategory,
        severity: severityFilter,
        result: resultFilter,
        search,
      });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, severityFilter, resultFilter, search]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const handleClearLogs = async () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติ Audit Logs ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      await clearAuditLogs();
      fetchLogs();
    }
  };

  // Export audit logs as CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      'Event ID',
      'Timestamp (UTC)',
      'Category',
      'Action',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Target ID',
      'Target Name',
      'Result',
      'Severity',
      'Reason',
      'Request ID',
      'IP / Session',
    ];

    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.actor.name}"`,
      `"${l.actor.role}"`,
      `"${l.actor.email || ''}"`,
      `"${l.target.id}"`,
      `"${l.target.name || ''}"`,
      `"${l.result}"`,
      `"${l.severity}"`,
      `"${l.reason || ''}"`,
      `"${l.requestId}"`,
      `"${l.ipSession || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `J3A_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categoriesList: { id: AuditCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'ทั้งหมด (All)', icon: Filter },
    { id: 'product', label: 'ประวัติสินค้า (Product)', icon: Package },
    { id: 'financial', label: 'ประวัติการเงิน (Financial)', icon: Wallet },
    { id: 'user', label: 'ประวัติสมาชิก (User)', icon: Users },
    { id: 'security', label: 'ความปลอดภัย (Security)', icon: Lock },
    { id: 'permission', label: 'ประวัติสิทธิ์ (Permission)', icon: KeyRound },
    { id: 'system', label: 'ประวัติระบบ (System)', icon: Cpu },
  ];

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase border border-rose-500/30">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase border border-orange-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase border border-cyan-500/30">
            Low
          </span>
        );
    }
  };

  const getResultBadge = (res: AuditResult) => {
    switch (res) {
      case 'success':
        return (
          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> สำเร็จ
          </span>
        );
      case 'denied':
        return (
          <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> ปฏิเสธ
          </span>
        );
      default:
        return (
          <span className="text-rose-400 font-semibold text-xs flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> ล้มเหลว
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminHeader
        title="บันทึกประวัติระบบ (Audit Logs)"
        description="ตรวจสอบทุกกิจกรรมที่เกิดขึ้นบนเว็บไซต์ ใครทำอะไร กับข้อมูลใด สำเร็จหรือไม่ ครอบคลุม 6 หมวดหลัก"
      />

      {/* Top Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Categories Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            รีเฟรช
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
            className="text-xs"
          >
            ส่งออก CSV
          </Button>

          <button
            onClick={handleClearLogs}
            title="ล้างประวัติ Log"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative z-30 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา Event ID, ผู้กระทำ, Action, Target ID หรือเหตุผล..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Severity & Result Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <CustomDropdown
            value={severityFilter}
            onChange={(val) => setSeverityFilter(val as any)}
            options={[
              { value: 'all', label: 'ทุกระดับความเสี่ยง' },
              { value: 'low', label: '🟢 Low Risk (ทั่วไป)' },
              { value: 'medium', label: '🟡 Medium Risk (ปานกลาง)' },
              { value: 'high', label: '🟠 High Risk (สำคัญ)' },
              { value: 'critical', label: '🔴 Critical Risk (วิกฤติ)' },
            ]}
            placeholder="ระดับความเสี่ยง"
            menuWidth="w-56"
            align="right"
          />

          <CustomDropdown
            value={resultFilter}
            onChange={(val) => setResultFilter(val as any)}
            options={[
              { value: 'all', label: 'ทุกผลลัพธ์' },
              { value: 'success', label: '🟢 สำเร็จ (Success)' },
              { value: 'denied', label: '🟡 ถูกปฏิเสธ (Denied)' },
              { value: 'failed', label: '🔴 ล้มเหลว (Failed)' },
            ]}
            placeholder="ผลลัพธ์"
            menuWidth="w-52"
            align="right"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">ไม่พบรายการ Audit Log</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ไม่มีประวัติกิจกรรมที่ตรงกับตัวกรองที่คุณเลือก หรือยังไม่มีเหตุการณ์ใหม่เกิดขึ้น
          </p>
        </div>
      ) : (
        <div className="relative z-10 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">เวลา (Timestamp)</th>
                  <th className="py-4 px-4">Event ID / หมวด</th>
                  <th className="py-4 px-4">ผู้กระทำ (Actor)</th>
                  <th className="py-4 px-4">การกระทำ (Action)</th>
                  <th className="py-4 px-4">สิ่งที่ถูกกระทำ (Target)</th>
                  <th className="py-4 px-4">ความเสี่ยง</th>
                  <th className="py-4 px-4">ผลลัพธ์</th>
                  <th className="py-4 px-4 sm:px-6 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Timestamp */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-slate-200">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Event ID & Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-mono text-cyan-400 font-bold group-hover:underline">
                          {log.id}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {log.category}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{log.actor.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {log.actor.role} {log.actor.email ? `• ${log.actor.email}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 font-mono text-xs border border-slate-800 text-slate-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-4 px-4 max-w-xs truncate">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-200 truncate">
                          {log.target.name || log.target.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 truncate">
                          {log.target.type} • {log.target.id}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-4 px-4 whitespace-nowrap">{getSeverityBadge(log.severity)}</td>

                    {/* Result */}
                    <td className="py-4 px-4 whitespace-nowrap">{getResultBadge(log.result)}</td>

                    {/* View Button */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูประวัติ</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
