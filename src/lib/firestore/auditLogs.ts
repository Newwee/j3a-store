import { supabase } from '@/lib/supabase/client';
import { AuditLogItem, AuditLogFilter, AuditCategory } from '@/types/auditLog';

const DEFAULT_SAMPLE_LOGS: AuditLogItem[] = [
  {
    id: 'evt_8f21a9c4',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    actor: {
      id: 'usr_admin_01',
      name: 'New JA (Admin)',
      email: 'pongpataradanai@gmail.com',
      role: 'admin',
    },
    action: 'product.update',
    category: 'product',
    target: {
      id: 'PROD-102',
      type: 'product',
      name: 'Premium Key — J3A Discord Profile',
    },
    changes: [
      {
        field: 'price',
        before: 199,
        after: 99,
        label: 'ราคาจำหน่าย (Price)',
      },
      {
        field: 'comparePrice',
        before: 250,
        after: 199,
        label: 'ราคาเปรียบเทียบ (Compare Price)',
      },
    ],
    result: 'success',
    severity: 'medium',
    requestId: 'req_8f21a9c4-prod-adj',
    ipSession: '182.52.***.*** (Bangkok, TH) / sess_9a8f2',
    reason: 'ปรับราคาสำหรับโปรโมชันเปิดร้านใหม่พิเศษ',
  },
  {
    id: 'evt_7b192e10',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    actor: {
      id: 'usr_admin_01',
      name: 'New JA (Admin)',
      email: 'pongpataradanai@gmail.com',
      role: 'admin',
    },
    action: 'wallet.adjust',
    category: 'financial',
    target: {
      id: 'usr_cust_394',
      type: 'user',
      name: 'Somsak Dev (Customer)',
    },
    changes: [
      {
        field: 'credits',
        before: 50,
        after: 150,
        label: 'ยอดเงิน Wallet (Credits)',
      },
    ],
    result: 'success',
    severity: 'high',
    requestId: 'req_fin_991823-topup-approve',
    ipSession: '182.52.***.*** / sess_9a8f2',
    reason: 'อนุมัติการเติมเงินผ่าน PromptPay สลิปตรวจสอบเรียบร้อย',
  },
  {
    id: 'evt_5d401a88',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      id: 'system_auth',
      name: 'Authentication Guard (System)',
      role: 'system',
    },
    action: 'security.login_failed',
    category: 'security',
    target: {
      id: 'auth_portal',
      type: 'security',
      name: 'Admin Gateway /admin',
    },
    changes: [],
    result: 'denied',
    severity: 'high',
    requestId: 'req_sec_401_invalid_cred',
    ipSession: '49.228.***.*** (Suspicious IP) / sess_anon_01',
    reason: 'ตรวจพบการพยายามเข้าถึงหน้า Admin ด้วยสิทธิ์ User ทั่วไป',
  },
  {
    id: 'evt_3c990b72',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actor: {
      id: 'usr_admin_01',
      name: 'New JA (Admin)',
      email: 'pongpataradanai@gmail.com',
      role: 'admin',
    },
    action: 'product.create',
    category: 'product',
    target: {
      id: 'PROD-201',
      type: 'product',
      name: 'J3A Discord Manager Bot Source',
    },
    changes: [
      {
        field: 'status',
        before: null,
        after: 'active',
        label: 'สถานะสินค้า (Status)',
      },
      {
        field: 'price',
        before: null,
        after: 50,
        label: 'ราคา (Price)',
      },
    ],
    result: 'success',
    severity: 'low',
    requestId: 'req_prod_new_66192',
    ipSession: '182.52.***.*** / sess_9a8f2',
    reason: 'เพิ่มสินค้าประเภทบอทจัดการชุมชนใหม่',
  },
  {
    id: 'evt_2a188f40',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    actor: {
      id: 'system_auto_delivery',
      name: 'J3A Delivery Engine (System)',
      role: 'system',
    },
    action: 'system.auto_delivery',
    category: 'system',
    target: {
      id: 'J3A-20261008-2977',
      type: 'order',
      name: 'Order #J3A-20261008-2977',
    },
    changes: [
      {
        field: 'licenseKey',
        before: null,
        after: 'J3A-PRO-****-****-9821',
        label: 'การส่งมอบคีย์อัตโนมัติ',
      },
    ],
    result: 'success',
    severity: 'low',
    requestId: 'req_sys_dlv_8911',
    ipSession: 'Internal System Worker',
    reason: 'ส่งมอบ License Key อัตโนมัติหลังลูกค้าชำระผ่าน Wallet สำเร็จ',
  },
  {
    id: 'evt_1f994c33',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    actor: {
      id: 'usr_admin_01',
      name: 'New JA (Admin)',
      email: 'pongpataradanai@gmail.com',
      role: 'admin',
    },
    action: 'permission.role_change',
    category: 'permission',
    target: {
      id: 'usr_mod_88',
      type: 'user',
      name: 'Pray Worawut (Staff)',
    },
    changes: [
      {
        field: 'role',
        before: 'customer',
        after: 'staff',
        label: 'ระดับสิทธิ์ (Role)',
      },
    ],
    result: 'success',
    severity: 'high',
    requestId: 'req_perm_change_2201',
    ipSession: '182.52.***.*** / sess_9a8f2',
    reason: 'แต่งตั้งผู้ช่วยดูแลระบบสำหรับจัดการคำสั่งซื้อและรีวิว',
  },
];

const LOCAL_STORAGE_KEY = 'j3a_store_audit_logs';

/**
 * Fetch all audit logs with optional filtering
 */
export async function getAuditLogs(filter?: AuditLogFilter): Promise<AuditLogItem[]> {
  let logs: AuditLogItem[] = [];

  // 1. Try fetching from Supabase audit_logs table
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filter?.limit || 150);

    if (!error && Array.isArray(data) && data.length > 0) {
      logs = data.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at,
        actor: typeof row.actor === 'string' ? JSON.parse(row.actor) : row.actor,
        action: row.action,
        category: row.category as AuditCategory,
        target: typeof row.target === 'string' ? JSON.parse(row.target) : row.target,
        changes: typeof row.changes === 'string' ? JSON.parse(row.changes || '[]') : row.changes,
        result: row.result,
        severity: row.severity,
        requestId: row.request_id || row.requestId,
        ipSession: row.ip_session || row.ipSession,
        reason: row.reason,
        details: typeof row.details === 'string' ? JSON.parse(row.details || '{}') : row.details,
      }));
    }
  } catch (e) {
    // Supabase table might not exist yet, fall through to localStorage
  }

  // 2. LocalStorage cache check
  if (logs.length === 0 && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        logs = JSON.parse(stored);
      }
    } catch {}
  }

  // 3. Fallback to sample logs if empty
  if (logs.length === 0) {
    logs = [...DEFAULT_SAMPLE_LOGS];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
      } catch {}
    }
  }

  // 4. Apply Filters
  if (filter) {
    if (filter.category && filter.category !== 'all') {
      logs = logs.filter((l) => l.category === filter.category);
    }
    if (filter.severity && filter.severity !== 'all') {
      logs = logs.filter((l) => l.severity === filter.severity);
    }
    if (filter.result && filter.result !== 'all') {
      logs = logs.filter((l) => l.result === filter.result);
    }
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.id.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.actor.name.toLowerCase().includes(q) ||
          (l.actor.email && l.actor.email.toLowerCase().includes(q)) ||
          (l.target.name && l.target.name.toLowerCase().includes(q)) ||
          l.target.id.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q))
      );
    }
  }

  // Sort descending by timestamp
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Record a new audit log entry
 */
export async function recordAuditLog(
  entry: Omit<AuditLogItem, 'id' | 'timestamp'>
): Promise<AuditLogItem> {
  const id = `evt_${Math.random().toString(16).substring(2, 10)}`;
  const timestamp = new Date().toISOString();

  const fullLog: AuditLogItem = {
    ...entry,
    id,
    timestamp,
  };

  // 1. Try Supabase
  try {
    await supabase.from('audit_logs').insert([
      {
        id: fullLog.id,
        timestamp: fullLog.timestamp,
        actor: JSON.stringify(fullLog.actor),
        action: fullLog.action,
        category: fullLog.category,
        target: JSON.stringify(fullLog.target),
        changes: JSON.stringify(fullLog.changes || []),
        result: fullLog.result,
        severity: fullLog.severity,
        request_id: fullLog.requestId,
        ip_session: fullLog.ipSession,
        reason: fullLog.reason,
        details: JSON.stringify(fullLog.details || {}),
      },
    ]);
  } catch (e) {
    console.warn('Could not write audit log to Supabase, using localStorage:', e);
  }

  // 2. Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      const current = await getAuditLogs();
      const updated = [fullLog, ...current];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.slice(0, 300)));
    } catch {}
  }

  return fullLog;
}

/**
 * Reset / Clear audit logs (Admin only)
 */
export async function clearAuditLogs(): Promise<void> {
  try {
    await supabase.from('audit_logs').delete().neq('id', '');
  } catch {}

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}
