'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ChevronRight, Clock, Search, PackageCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/order';
import { getOrders, getOrderById } from '@/lib/firestore/orders';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const list = await getOrders({ userId: user.uid });
        if (isMounted) {
          setOrders(list);
        }
      } catch (err) {
        console.error('Error loading orders:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      loadOrders();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const order = await getOrderById(searchId.trim());
      if (order) {
        setOrders([order]);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-cyan-400" />
            <span>ประวัติการทำรายการ (Order History)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            ตรวจสอบสถานะคำสั่งซื้อ รหัสสินค้า หรือประวัติการชำระเงินของคุณ
          </p>
        </div>

        {/* Search Order Bar */}
        <form onSubmit={handleSearchOrder} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ (Order ID เช่น J3A-...)..."
                className="w-full bg-slate-900/80 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-cyan-400 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <Button variant="secondary" size="md" type="submit">
              ค้นหา
            </Button>
          </div>
        </form>

        {!user && !searchId ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-base font-bold text-white">เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อของคุณ</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              เข้าสู่ระบบด้วยบัญชี J3A STORE เพื่อดูประวัติคำสั่งซื้อทั้งหมด หรือค้นหาด้วยเลขที่คำสั่งซื้อด้านบน
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/login">
                <Button variant="primary" size="md">
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="md">
                  สมัครสมาชิก
                </Button>
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="ไม่พบประวัติคำสั่งซื้อ"
            description="คุณยังไม่มีประวัติการทำรายการในระบบ หรือไม่พบคำสั่งซื้อที่ค้นหา"
            actionText="ไปยังหน้าร้านค้า"
            actionHref="/shop"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-200 group shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                        #{order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {order.status === 'completed' && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          ⭐ ปลดล็อกสิทธิ์ให้คะแนนแล้ว
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(order.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">ยอดรวม</span>
                      <span className="text-base font-black text-cyan-400">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-3 flex items-center gap-3 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0"
                    >
                      <span className="font-semibold text-white truncate max-w-[120px]">
                        {item.name}
                      </span>
                      <span className="text-slate-500">×{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-xs text-slate-400">+{order.items.length - 4} รายการ</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
