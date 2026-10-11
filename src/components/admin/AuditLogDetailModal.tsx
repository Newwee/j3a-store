'use client';

import React from 'react';
import {
  X,
  Shield,
  Clock,
  User,
  Activity,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Terminal,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { AuditLogItem } from '@/types/auditLog';
import { formatDate } from '@/lib/utils/formatters';

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  if (!log) return null;

  const getSeverityBadge = () => {
    switch (log.severity) {
      case 'critical':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Critical Risk
          </span>
        );
      case 'high':
        return (
          <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Medium Risk
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Low Risk
          </span>
        );
    }
  };

  const getResultBadge = () => {
    if (log.result === 'success') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Success (สำเร็จ)</span>
        </span>
      );
    }
    if (log.result === 'denied') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Denied (ถูกปฏิเสธ)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>Failed (ล้มเหลว)</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {log.category.toUpperCase()} LOG
              </span>
              {getSeverityBadge()}
              {getResultBadge()}
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{log.action}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Event ID: <strong className="text-cyan-400">{log.id}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Actor */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                ผู้กระทำ (Actor)
              </span>
              <p className="text-sm font-bold text-white">{log.actor.name}</p>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-bold text-cyan-300">
                  {log.actor.role}
                </span>
                {log.actor.email && <span className="truncate">{log.actor.email}</span>}
              </div>
            </div>

            {/* Target */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                สิ่งที่ถูกกระทำ (Target)
              </span>
              <p className="text-sm font-bold text-white truncate">{log.target.name || log.target.id}</p>
              <p className="text-xs font-mono text-slate-400 truncate">
                ID: {log.target.id} • Type: {log.target.type}
              </p>
            </div>

            {/* Timestamp */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                วันและเวลา (Timestamp)
              </span>
              <p className="text-sm font-semibold text-slate-100">{formatDate(log.timestamp)}</p>
              <p className="text-[11px] font-mono text-slate-500 truncate">{log.timestamp} (UTC)</p>
            </div>

            {/* Request & IP */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                Request ID & Session
              </span>
              <p className="text-xs font-mono text-cyan-300 truncate">{log.requestId}</p>
              <p className="text-[11px] text-slate-400 truncate">{log.ipSession || 'Protected Session'}</p>
            </div>
          </div>

          {/* Changes Diff (if any) */}
          {log.changes && log.changes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>การเปลี่ยนแปลงข้อมูล (Changes Diff)</span>
              </h3>
              <div className="space-y-2.5">
                {log.changes.map((change, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-300">
                        {change.label || change.field || 'Field Value'}
                      </span>
                      {change.field && (
                        <p className="text-[11px] font-mono text-slate-500">Key: {change.field}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Before */}
                      <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                        <span className="text-[10px] text-slate-400 block">ก่อนแก้ไข:</span>
                        <strong className="font-mono">
                          {change.before !== null && change.before !== undefined
                            ? String(change.before)
                            : '(ว่าง)'}
                        </strong>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                      {/* After */}
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                        <span className="text-[10px] text-slate-400 block">หลังแก้ไข:</span>
                        <strong className="font-mono">
                          {change.after !== null && change.after !== undefined
                            ? String(change.after)
                            : '(ว่าง)'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          {log.reason && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                เหตุผลที่แก้ไข (Reason)
              </span>
              <p className="text-xs sm:text-sm text-slate-200">{log.reason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
