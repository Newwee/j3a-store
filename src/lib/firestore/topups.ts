import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TopupRequest, CreateTopupInput, TopupStatus } from '@/types/topup';
import { getUserProfile, updateUserCredits } from './users';

function mapRowToTopup(row: any): TopupRequest {
  return {
    id: row.id,
    topupNumber: row.topup_number || `TOP-${row.id.slice(-6).toUpperCase()}`,
    userId: row.user_id || '',
    userEmail: row.user_email || '',
    userName: row.user_name || 'ลูกค้า',
    amount: Number(row.amount) || 0,
    paymentSlipUrl: row.payment_slip_url || '',
    status: (row.status as TopupStatus) || 'pending',
    adminNote: row.admin_note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Customer submits a top-up request with payment slip
 */
export async function createTopupRequest(input: CreateTopupInput): Promise<TopupRequest> {
  if (input.amount <= 0) throw new Error('ยอดเงินต้องมากกว่า 0 บาท');
  if (!input.paymentSlipUrl) throw new Error('กรุณาแนบรูปภาพสลิปการโอนเงิน');

  const id = `topup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const topupNumber = `TOP-${Date.now().toString().slice(-6)}`;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.userId || '');
  const userId = isUuid ? input.userId : null;

  const row = {
    id,
    topup_number: topupNumber,
    user_id: userId,
    user_email: input.userEmail,
    user_name: input.userName,
    amount: Math.round(input.amount),
    payment_slip_url: input.paymentSlipUrl,
    status: 'pending' as TopupStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('topups').insert([row]);
  if (error) {
    throw new Error(`Failed to create topup request in Supabase: ${error.message}`);
  }

  return mapRowToTopup(row);
}

/**
 * Fetch top-up requests for a specific user
 */
export async function getUserTopups(userId: string): Promise<TopupRequest[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('topups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user top-ups from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapRowToTopup);
  } catch (error) {
    console.error('Error fetching user top-ups:', error);
    return [];
  }
}

/**
 * Admin: Fetch all top-up requests
 */
export async function getAllTopups(filterStatus?: TopupStatus | 'all'): Promise<TopupRequest[]> {
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const url = filterStatus && filterStatus !== 'all'
        ? `/api/admin/topups/list?status=${encodeURIComponent(filterStatus)}`
        : '/api/admin/topups/list';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          return json.data.map(mapRowToTopup);
        }
      }
    }
  } catch (apiErr) {
    console.warn('API list fallback to direct supabase client:', apiErr);
  }

  // 2. Fallback to direct supabase client (authenticated with admin JWT)
  try {
    let query = supabase.from('topups').select('*');

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching all top-ups from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapRowToTopup);
  } catch (error) {
    console.error('Error fetching all top-ups:', error);
    return [];
  }
}

/**
 * Admin Action: Approve top-up request and credit amount to User's Wallet balance
 */
export async function approveTopup(topupId: string): Promise<{ success: boolean; newCredits: number }> {
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/topups/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topupId, action: 'approve' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to approve topup via admin API');
      }
      return { success: true, newCredits: json.newCredits };
    }
  } catch (apiErr: any) {
    console.warn('API approve fallback to direct supabase client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const { data: topupRow, error: topupErr } = await supabase
    .from('topups')
    .select('*')
    .eq('id', topupId)
    .limit(1)
    .maybeSingle();

  if (topupErr || !topupRow) {
    throw new Error('ไม่พบคำขอเติมเงินนี้ในระบบ');
  }

  if (topupRow.status === 'approved') {
    throw new Error('คำขอนี้ได้รับการอนุมัติเงินเข้าบัญชีไปแล้ว');
  }

  const userId = topupRow.user_id as string;
  const amount = Number(topupRow.amount) || 0;

  // 1. Fetch user profile
  const userProfile = await getUserProfile(userId);
  const currentCredits = userProfile?.credits || 0;
  const newCredits = currentCredits + amount;

  // 2. Credit the money to User's Wallet in Supabase
  await updateUserCredits(userId, newCredits);

  // 3. Mark top-up as approved
  const { error: updateErr } = await supabase
    .from('topups')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', topupId);

  if (updateErr) throw new Error(updateErr.message);

  return { success: true, newCredits };
}

/**
 * Admin Action: Reject top-up request with optional reason
 */
export async function rejectTopup(topupId: string, reason?: string): Promise<void> {
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/topups/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topupId, action: 'reject', adminNote: reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to reject topup via admin API');
      }
      return;
    }
  } catch (apiErr: any) {
    console.warn('API reject fallback to direct supabase client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const { error } = await supabase
    .from('topups')
    .update({
      status: 'rejected',
      admin_note: reason || 'สลิปไม่ถูกต้อง หรือไม่พบยอดเงินเข้าบัญชี',
      updated_at: new Date().toISOString(),
    })
    .eq('id', topupId);

  if (error) throw new Error(error.message);
}

/**
 * Real-time subscription to user's top-up requests
 */
export function subscribeUserTopups(
  userId: string,
  callback: (topups: TopupRequest[]) => void
): () => void {
  getUserTopups(userId).then(callback).catch(console.error);

  const channelName = `topups_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'topups', filter: `user_id=eq.${userId}` },
      async () => {
        try {
          const topups = await getUserTopups(userId);
          callback(topups);
        } catch (err) {
          console.error(err);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
