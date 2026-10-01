'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  Receipt,
  ChevronDown,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { getOrders, updateOrderStatus } from '@/lib/firestore/orders';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

export default function AdminOrdersPage() {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Slip modal state
  const [viewingSlipOrder, setViewingSlipOrder] = useState<Order | null>(null);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setOrders(data);
    } catch (err: any) {
      error('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      return (
        o.orderNumber.toLowerCase().includes(term) ||
        o.customer.name.toLowerCase().includes(term) ||
        o.customer.email.toLowerCase().includes(term) ||
        o.customer.phone.includes(term)
      );
    });
  }, [orders, search]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      success(`อัปเดตสถานะคำสั่งซื้อเป็น "${newStatus}" แล้ว`);
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะคำสั่งซื้อได้');
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="จัดการคำสั่งซื้อ (Orders Management)"
        description="ตรวจสอบรายการสั่งซื้อ ปรับเปลี่ยนสถานะ และตรวจหลักฐานการโอนเงิน (Slip)"
        actionText=""
        actionHref=""
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยเลขที่คำสั่งซื้อ, ชื่อลูกค้า, อีเมล หรือเบอร์โทร..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-950/80 text-xs sm:text-sm text-slate-200 rounded-xl px-3.5 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none cursor-pointer"
        >
          <option value="all">ทุกสถานะคำสั่งซื้อ</option>
          <option value="pending">รอชำระเงิน (Pending)</option>
          <option value="paid">ชำระแล้ว (Paid)</option>
          <option value="processing">กำลังดำเนินการ (Processing)</option>
          <option value="completed">สำเร็จเรียบร้อย (Completed)</option>
          <option value="cancelled">ยกเลิก (Cancelled)</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-950 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="ไม่พบคำสั่งซื้อ"
          description="ยังไม่มีคำสั่งซื้อที่ตรงกับตัวกรองที่คุณเลือก"
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">เลขคำสั่งซื้อ</th>
                  <th className="py-4 px-4">ลูกค้า (Customer)</th>
                  <th className="py-4 px-4">รายการสินค้า</th>
                  <th className="py-4 px-4">ยอดรวม</th>
                  <th className="py-4 px-4">วิธีชำระ</th>
                  <th className="py-4 px-4">สถานะคำสั่งซื้อ</th>
                  <th className="py-4 px-4">สลิปโอนเงิน</th>
                  <th className="py-4 px-4 sm:px-6 text-right">วันที่สั่งซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850/50 transition-colors">
                    {/* Order Number */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="font-bold text-white hover:text-cyan-400 flex items-center gap-1"
                      >
                        <span>#{order.orderNumber}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-semibold text-white">{order.customer.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{order.customer.email}</p>
                      <p className="text-[11px] text-slate-500">{order.customer.phone}</p>
                    </td>

                    {/* Items */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-300 line-clamp-1">
                            • {item.name} <span className="text-slate-500">×{item.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-cyan-400">
                        {formatCurrency(order.total)}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-xs uppercase font-medium px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {order.paymentMethod}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="bg-slate-950 text-xs rounded-xl px-2.5 py-1.5 border border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="pending">รอชำระ (Pending)</option>
                        <option value="paid">ชำระแล้ว (Paid)</option>
                        <option value="processing">กำลังทำรายการ (Processing)</option>
                        <option value="completed">สำเร็จ (Completed)</option>
                        <option value="cancelled">ยกเลิก (Cancelled)</option>
                      </select>
                    </td>

                    {/* Slip */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {order.paymentProofUrl ? (
                        <button
                          onClick={() => setViewingSlipOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>ดูสลิป</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {viewingSlipOrder && (
        <Modal
          isOpen={Boolean(viewingSlipOrder)}
          onClose={() => setViewingSlipOrder(null)}
          title={`สลิปหลักฐานการโอนเงิน #${viewingSlipOrder.orderNumber}`}
          description={`ยอดชำระ ${formatCurrency(viewingSlipOrder.total)} โดย ${viewingSlipOrder.customer.name}`}
          maxWidth="md"
        >
          <div className="flex flex-col items-center justify-center p-2 space-y-4">
            {viewingSlipOrder.paymentProofUrl && (
              <div className="relative w-full aspect-[3/4] max-w-sm rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                <Image
                  src={viewingSlipOrder.paymentProofUrl}
                  alt="Payment Slip Proof"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => {
                  handleStatusChange(viewingSlipOrder.id, 'completed');
                  setViewingSlipOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                ยืนยันว่าได้รับเงินแล้ว (อนุมัติทันที)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
