import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/auth/adminAuth';
import { recordAuditLog } from '@/lib/firestore/auditLogs';

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: authResult.error || 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const mode = body.mode || 'stats_only'; // 'stats_only' | 'test_orders' | 'all_orders'

    if (body.confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'Confirmation keyword RESET is required to proceed' },
        { status: 400 }
      );
    }

    let affectedOrdersCount = 0;

    if (mode === 'all_orders') {
      // Delete all orders and test topups
      const { data, error } = await supabaseAdmin.from('orders').delete().neq('id', '');
      if (error) {
        console.error('Failed to reset all orders:', error);
      }
      await supabaseAdmin.from('topups').delete().eq('status', 'test');
    } else if (mode === 'test_orders') {
      // Delete orders that are marked pending or cancelled
      const { data, error } = await supabaseAdmin
        .from('orders')
        .delete()
        .in('status', ['pending', 'cancelled']);
      if (error) {
        console.error('Failed to reset test orders:', error);
      }
      // Also clean up topups marked as 'test'
      await supabaseAdmin.from('topups').delete().eq('status', 'test');
    }

    // Refresh store_stats row
    try {
      const { count: orderCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: prodCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: memberCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      await supabaseAdmin.from('store_stats').upsert([
        {
          id: 'live',
          orders: orderCount || 0,
          products: prodCount || 0,
          members: memberCount || 1,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Could not update store_stats:', e);
    }

    // Record audit log
    try {
      await recordAuditLog({
        actor: {
          id: authResult.user.id,
          name: authResult.user.email || 'Admin',
          email: authResult.user.email,
          role: 'admin',
        },
        action: 'system.reset',
        category: 'system',
        target: {
          id: 'dashboard_store_data',
          type: 'system',
          name: `Dashboard Reset (${mode})`,
        },
        changes: [
          {
            field: 'mode',
            before: 'live',
            after: mode,
            label: 'โหมดการรีเซ็ตข้อมูล',
          },
        ],
        result: 'success',
        severity: 'critical',
        requestId: `req_reset_${Date.now()}`,
        reason: 'ผู้ดูแลระบบสั่งรีเซ็ตข้อมูลเริ่มต้นใหม่จากแผงควบคุม Dashboard',
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      message: 'รีเซ็ตข้อมูลระบบและสถิติสำเร็จเรียบร้อย',
    });
  } catch (err: any) {
    console.error('Error in /api/admin/dashboard/reset:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
