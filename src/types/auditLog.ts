export type AuditCategory =
  | 'product'
  | 'financial'
  | 'user'
  | 'security'
  | 'permission'
  | 'system';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditResult = 'success' | 'failed' | 'denied';

export interface AuditActor {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'staff' | 'system' | 'customer';
}

export interface AuditDiff {
  field?: string;
  before?: any;
  after?: any;
  label?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string; // ISO string in UTC
  actor: AuditActor;
  action: string; // e.g. "product.update", "order.refund"
  category: AuditCategory;
  target: {
    id: string;
    type: string; // e.g. "product", "order", "user", "setting"
    name?: string;
  };
  changes?: AuditDiff[];
  result: AuditResult;
  severity: AuditSeverity;
  requestId: string;
  ipSession?: string;
  reason?: string;
  details?: Record<string, any>;
}

export interface AuditLogFilter {
  category?: AuditCategory | 'all';
  severity?: AuditSeverity | 'all';
  result?: AuditResult | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
