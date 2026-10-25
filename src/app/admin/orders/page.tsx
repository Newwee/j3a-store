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
  Star,
  Tag,
  Key,
  Download,
  Copy,
  Check,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { getOrders, updateOrderStatus } from '@/lib/firestore/orders';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

export default function AdminOrdersPage() {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Modals state
  const [viewingSlipOrder, setViewingSlipOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (keyString: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(keyString);
    success('คัดลอก License Key เรียบร้อยแล้ว');
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
        (o.customer?.phone || '').includes(term) ||
        (o.discountCode || '').toLowerCase().includes(term)
      );
    });
  }, [orders, search]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (newStatus === 'completed') {
        success(`อนุมัติคำสั่งซื้อเรียบร้อย! ลูกค้าในออเดอร์นี้ได้รับการปลดล็อกสิทธิ์ให้คะแนนสินค้า (Rating & Review) แล้ว`);
      } else {
        success(`อัปเดตสถานะคำสั่งซื้อเป็น "${newStatus}" แล้ว`);
      }
    } catch (err: any) {
      error('ไม่สามารถเปลี่ยนสถานะคำสั่งซื้อได้');
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="จัดการคำสั่งซื้อ (Orders Management)"
        description="ตรวจสอบรายการสั่งซื้อ รายละเอียดส่วนลด/คูปอง รูปแบบการจัดส่ง และตรวจหลักฐานการโอนเงิน (Slip)"
        actionText=""
        actionHref=""
      />

      {/* Admin Tip: Review eligibility */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
        <Star className="w-4 h-4 shrink-0 fill-amber-400 text-amber-400" />
        <span>
          <strong>ระบบรีวิวความโปร่งใส:</strong> เมื่อแอดมินเปลี่ยนสถานะคำสั่งซื้อเป็น <strong>"สำเร็จ (Completed)"</strong> ลูกค้าในออเดอร์นั้นจะได้รับสิทธิ์ในการเข้าไปกด <strong>"⭐ ให้คะแนนสินค้า"</strong> ในหน้ารายละเอียดสินค้าทันที
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative z-30 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยเลขที่คำสั่งซื้อ, ชื่อลูกค้า, อีเมล, เบอร์โทร หรือโค้ดส่วนลด..."
            className="w-full bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <CustomDropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          options={[
            { value: 'all', label: 'ทุกสถานะคำสั่งซื้อ' },
            { value: 'pending', label: '🟡 รอชำระเงิน (Pending)' },
            { value: 'paid', label: '🔵 ชำระแล้ว (Paid)' },
            { value: 'processing', label: '🟣 กำลังดำเนินการ (Processing)' },
            { value: 'completed', label: '🟢 สำเร็จเรียบร้อย (Completed)' },
            { value: 'cancelled', label: '🔴 ยกเลิก (Cancelled)' },
          ]}
          placeholder="สถานะคำสั่งซื้อ"
          menuWidth="w-60"
          align="right"
        />
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
        <div className="relative z-10 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 sm:px-6">เลขคำสั่งซื้อ</th>
                  <th className="py-4 px-4">ลูกค้า (Customer)</th>
                  <th className="py-4 px-4">รายการสินค้า & วิธีรับ</th>
                  <th className="py-4 px-4">ยอดรวม & ส่วนลด</th>
                  <th className="py-4 px-4">วิธีชำระ</th>
                  <th className="py-4 px-4">สถานะคำสั่งซื้อ</th>
                  <th className="py-4 px-4 text-center">การจัดการ</th>
                  <th className="py-4 px-4 sm:px-6 text-right">วันที่สั่งซื้อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => {
                  const hasDiscount = Boolean(order.discount && order.discount > 0);
                  return (
                    <tr key={order.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Order Number */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-bold text-white hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer text-left"
                        >
                          <span>#{order.orderNumber}</span>
                          <Eye className="w-3.5 h-3.5 text-cyan-400/70" />
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-semibold text-white">{order.customer.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{order.customer.email}</p>
                        <p className="text-[11px] text-slate-500">{order.customer.phone || '-'}</p>
                      </td>

                      {/* Items & Delivery Type */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="space-y-1.5">
                          {order.items.map((item, idx) => {
                            const isKey = item.deliveryType === 'key' || item.deliveryType === 'both' || Boolean(item.licenseKey) || (item.licenseKeys && item.licenseKeys.length > 0);
                            const isLink = item.deliveryType === 'link' || item.deliveryType === 'both' || Boolean(item.downloadUrl);
                            const primaryKey = item.licenseKey || (item.licenseKeys && item.licenseKeys[0]);

                            return (
                              <div key={idx} className="space-y-1">
                                <p className="text-xs text-slate-200 font-medium">
                                  • {item.name} <span className="text-slate-400 font-bold">×{item.quantity}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                  {item.deliveryType === 'both' ? (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1">
                                      <Key className="w-3 h-3 text-amber-300" />
                                      <Download className="w-3 h-3 text-sky-300" />
                                      <span>คีย์ + ดาวน์โหลด</span>
                                    </span>
                                  ) : isKey ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
                                      <Key className="w-3 h-3" />
                                      <span>คีย์ไลเซนส์ (Key)</span>
                                    </span>
                                  ) : isLink ? (
                                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-medium flex items-center gap-1">
                                      <Download className="w-3 h-3" />
                                      <span>ลิงก์ดาวน์โหลด</span>
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                      📦 สินค้าดิจิทัล
                                    </span>
                                  )}

                                  {/* Quick key preview if granted */}
                                  {primaryKey && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyKey(primaryKey)}
                                      title="คลิกเพื่อคัดลอก License Key"
                                      className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <span>{primaryKey.slice(0, 16)}...</span>
                                      {copiedKey === primaryKey ? (
                                        <Check className="w-3 h-3 text-emerald-300" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Total & Discount Breakdown */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-cyan-400 text-sm">
                              {formatCurrency(order.total)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-slate-500 line-through">
                                {formatCurrency(order.subtotal || order.total + order.discount)}
                              </span>
                            )}
                          </div>

                          {/* Discount Badge */}
                          {hasDiscount ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                              <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>โค้ด: <strong>{order.discountCode || 'DISCOUNT'}</strong></span>
                              <span className="font-bold text-emerald-200">(-{formatCurrency(order.discount)})</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">
                              (ราคาเต็ม ไม่ได้ใช้โค้ด)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs uppercase font-medium px-2 py-1 rounded-lg border ${
                            order.paymentMethod === 'wallet'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : order.paymentMethod === 'promptpay'
                              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {order.paymentMethod === 'wallet' ? '💳 Wallet' : order.paymentMethod}
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

                      {/* Actions (Details & Slip) */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-400/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                            title="ดูรายละเอียดคำสั่งซื้อแบบเต็ม"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูข้อมูล</span>
                          </button>

                          {order.paymentProofUrl && (
                            <button
                              onClick={() => setViewingSlipOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="ดูสลิปโอนเงิน"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>สลิป</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal (Full Inspection) */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`รายละเอียดคำสั่งซื้อ #${selectedOrder.orderNumber}`}
          description={`สั่งซื้อเมื่อ ${formatDate(selectedOrder.createdAt)} • สถานะ: ${selectedOrder.status.toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 p-1 text-slate-200">
            {/* 1. Pricing & Discount Breakdown Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>สรุปยอดเงิน & ส่วนลดที่ใช้</span>
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                    selectedOrder.paymentMethod === 'wallet'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  ชำระผ่าน: {selectedOrder.paymentMethod === 'wallet' ? '💳 ยอดเงินในเว็บ (Wallet)' : selectedOrder.paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <p className="text-[11px] text-slate-400">ยอดรวมสินค้า (Subtotal)</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(selectedOrder.subtotal || selectedOrder.total + (selectedOrder.discount || 0))}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <p className="text-[11px] text-slate-400">ส่วนลด (Discount)</p>
                  <p className={`text-sm font-bold ${selectedOrder.discount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedOrder.discount > 0 ? `-${formatCurrency(selectedOrder.discount)}` : '฿0.00'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-0.5">
                  <p className="text-[11px] text-slate-400">ค่าจัดส่ง (Shipping)</p>
                  <p className="text-sm font-bold text-slate-300">
                    {selectedOrder.shipping > 0 ? formatCurrency(selectedOrder.shipping) : 'ฟรี (฿0.00)'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-0.5">
                  <p className="text-[11px] text-cyan-300">ยอดชำระสุทธิ (Net Total)</p>
                  <p className="text-sm font-black text-cyan-400">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>

              {/* Discount Code Details Banner */}
              {selectedOrder.discount > 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      ลูกค้าใช้โค้ดส่วนลด: <strong className="font-mono text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/80">{selectedOrder.discountCode || 'DISCOUNT'}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-emerald-300">
                    ประหยัดเงินได้ {formatCurrency(selectedOrder.discount)}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>คำสั่งซื้อนี้เป็นราคาปกติ <strong>(ลูกค้าไม่ได้ใส่โค้ดส่วนลด)</strong></span>
                </div>
              )}
            </div>

            {/* 2. Customer Information Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>ข้อมูลลูกค้า & การจัดส่ง</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>ชื่อลูกค้า: <strong className="text-white">{selectedOrder.customer.name}</strong></span>
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>อีเมล: <strong className="text-white">{selectedOrder.customer.email}</strong></span>
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>เบอร์โทร: <strong className="text-white">{selectedOrder.customer.phone || '-'}</strong></span>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>ที่อยู่ / บันทึกจัดส่ง:</span>
                  </p>
                  <p className="text-xs text-slate-300 pl-5 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    {selectedOrder.customer.address || selectedOrder.customer.notes || 'จัดส่งดิจิทัลทันทีผ่านระบบ / Email'}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    User ID: <code className="font-mono text-slate-400">{selectedOrder.userId}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Items & Delivery Keys Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>รายการสินค้า & รูปแบบการส่งมอบ (License Keys & Downloads)</span>
              </h3>

              <div className="space-y-3">
                {selectedOrder.items.map((item, idx) => {
                  const allKeys: string[] = item.licenseKeys || (item.licenseKey ? [item.licenseKey] : []);
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-xs px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-normal">
                              ×{item.quantity}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400">
                            ราคาต่อชิ้น: {formatCurrency(item.price)} • รวม: <span className="text-cyan-300 font-bold">{formatCurrency(item.price * item.quantity)}</span>
                          </p>
                        </div>

                        {/* Delivery Type Badge */}
                        <div>
                          {item.deliveryType === 'both' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-amber-300" />
                              <Download className="w-3.5 h-3.5 text-sky-300" />
                              <span>ได้รับทั้งคีย์ & ลิงก์ดาวน์โหลด</span>
                            </span>
                          ) : item.deliveryType === 'key' || allKeys.length > 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5" />
                              <span>จัดส่งเป็น License Key</span>
                            </span>
                          ) : item.deliveryType === 'link' || item.downloadUrl ? (
                            <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5">
                              <Download className="w-3.5 h-3.5" />
                              <span>จัดส่งเป็นลิงก์ดาวน์โหลด</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs">
                              สินค้าดิจิทัลทั่วไป
                            </span>
                          )}
                        </div>
                      </div>

                      {/* License Keys List */}
                      {allKeys.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>License Key ที่ส่งมอบให้ลูกค้า ({allKeys.length} คีย์):</span>
                          </label>
                          <div className="space-y-1">
                            {allKeys.map((k, kIdx) => (
                              <div
                                key={kIdx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-amber-500/30 text-xs"
                              >
                                <code className="font-mono text-emerald-400 font-bold select-all tracking-wider">
                                  {k}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(k)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === k ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">คัดลอกแล้ว</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>คัดลอก</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Download Link */}
                      {item.downloadUrl && (
                        <div className="pt-1 flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-sky-500/30 text-xs">
                          <span className="text-slate-300 truncate max-w-sm">
                            📥 ลิงก์ดาวน์โหลด: <code className="font-mono text-sky-400">{item.downloadUrl}</code>
                          </span>
                          <a
                            href={item.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>เปิดลิงก์</span>
                          </a>
                        </div>
                      )}

                      {/* Delivery Instructions */}
                      {item.deliveryNote && (
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                          <p className="font-bold text-slate-300 mb-1">📝 คำแนะนำการใช้งานที่ส่งให้ลูกค้า:</p>
                          {item.deliveryNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Order Status Changer */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">ปรับเปลี่ยนสถานะคำสั่งซื้อนี้:</p>
                <p className="text-[11px] text-slate-400">
                  ปัจจุบัน: <strong className="text-cyan-300 uppercase">{selectedOrder.status}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  className="bg-slate-900 text-xs font-semibold rounded-xl px-3 py-2 border border-slate-700 outline-none cursor-pointer"
                >
                  <option value="pending">🟡 รอชำระ (Pending)</option>
                  <option value="paid">🔵 ชำระแล้ว (Paid)</option>
                  <option value="processing">🟣 กำลังทำรายการ (Processing)</option>
                  <option value="completed">🟢 สำเร็จเรียบร้อย (Completed)</option>
                  <option value="cancelled">🔴 ยกเลิก (Cancelled)</option>
                </select>
                <Link
                  href={`/orders/${selectedOrder.id}`}
                  target="_blank"
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดหน้ารายการ (ลูกค้า)</span>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
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
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
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
