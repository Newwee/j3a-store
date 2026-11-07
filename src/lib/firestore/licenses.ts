import { supabase } from '@/lib/supabase/client';
import { GenerateLicenseInput, LicenseItem, LicenseStats } from '@/types/license';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  return {};
}

export interface FetchLicensesParams {
  search?: string;
  product?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function fetchAdminLicenses(params: FetchLicensesParams = {}): Promise<{
  licenses: LicenseItem[];
  totalCount: number;
  stats: LicenseStats;
}> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.product) query.set('product', params.product);
  if (params.status) query.set('status', params.status);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  const res = await fetch(`/api/admin/licenses?${query.toString()}`, {
    headers: {
      ...authHeaders,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to fetch licenses');
  }

  return {
    licenses: data.licenses || [],
    totalCount: data.totalCount || 0,
    stats: data.stats || { total: 0, active: 0, unused: 0, expired: 0, revoked: 0, lifetime: 0 },
  };
}

export async function generateAdminLicenses(input: GenerateLicenseInput): Promise<{
  keys: string[];
  count: number;
  message: string;
  sheetSync?: any;
}> {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/admin/licenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to generate licenses');
  }

  return {
    keys: data.keys || [],
    count: data.count || 0,
    message: data.message || 'สร้างคีย์สำเร็จ',
    sheetSync: data.sheetSync,
  };
}

export async function revokeAdminLicense(key: string, note?: string): Promise<void> {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/admin/licenses', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ key, action: 'revoke', note }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to revoke license');
  }
}

export async function reactivateAdminLicense(key: string): Promise<void> {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/admin/licenses', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ key, action: 'reactivate' }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to reactivate license');
  }
}

export async function resetAdminLicenseHWID(key: string, note?: string): Promise<void> {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/admin/licenses', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ key, action: 'reset_hwid', note }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to reset license HWID');
  }
}

export async function deleteAdminLicense(idOrKey: { id?: string; key?: string }): Promise<void> {
  const authHeaders = await getAuthHeader();
  const query = new URLSearchParams();
  if (idOrKey.id) query.set('id', idOrKey.id);
  if (idOrKey.key) query.set('key', idOrKey.key);

  const res = await fetch(`/api/admin/licenses?${query.toString()}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to delete license');
  }
}
