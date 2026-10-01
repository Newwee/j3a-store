'use client';

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'ยืนยันการลบสินค้า?',
  itemName,
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>

        {itemName && (
          <p className="text-sm font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/50 rounded-lg px-3 py-1.5 mb-2 w-full truncate">
            &quot;{itemName}&quot;
          </p>
        )}

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          การดำเนินการนี้จะไม่สามารถย้อนกลับได้ ระบบจะลบข้อมูลสินค้าและรูปภาพที่เกี่ยวข้องออกจากระบบทันที
        </p>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full"
          >
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="w-full"
          >
            ลบข้อมูล
          </Button>
        </div>
      </div>
    </Modal>
  );
}
