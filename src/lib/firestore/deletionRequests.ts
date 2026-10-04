import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DeletionRequest, DeletionRequestStatus } from '@/types/user';
import { deleteUserDoc } from '@/lib/firestore/users';

function mapRowToDeletionRequest(row: any): DeletionRequest {
  return {
    id: row.id,
    userId: row.user_id || row.id,
    email: row.email || null,
    displayName: row.display_name || null,
    credits: Number(row.credits) || 0,
    status: (row.status as DeletionRequestStatus) || 'pending',
    userReason: row.user_reason || undefined,
    adminNote: row.admin_note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    approvedAt: row.approved_at || undefined,
    rejectedAt: row.rejected_at || undefined,
  };
}

/**
 * Submit or update an account deletion request by customer
 */
export async function requestAccountDeletion(params: {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  credits?: number;
  userReason?: string;
}): Promise<DeletionRequest> {
  if (!params.userId) throw new Error('User ID is required.');

  const row = {
    id: params.userId,
    user_id: params.userId,
    email: params.email || null,
    display_name: params.displayName || null,
    credits: Number(params.credits) || 0,
    status: 'pending' as DeletionRequestStatus,
    user_reason: params.userReason?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('deletion_requests').upsert([row]);
  if (error) {
    throw new Error(`Failed to request account deletion in Supabase: ${error.message}`);
  }

  return mapRowToDeletionRequest(row);
}

/**
 * Get active deletion request for a specific user
 */
export async function getUserDeletionRequest(userId: string): Promise<DeletionRequest | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .select('*')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToDeletionRequest(data);
  } catch (error) {
    console.error('Error fetching deletion request for user:', error);
    return null;
  }
}

/**
 * Get all deletion requests for Admin Customers page
 */
export async function getAllDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('deletion_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all deletion requests from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapRowToDeletionRequest);
  } catch (error) {
    console.error('Error fetching all deletion requests:', error);
    return [];
  }
}

/**
 * Admin action: Approve account deletion, permanently deleting the user's data
 */
export async function approveAccountDeletion(requestId: string, userId: string, adminNote?: string): Promise<void> {
  // 1. Delete user profile
  await deleteUserDoc(userId);

  // 2. Mark deletion request as approved
  const { error } = await supabaseAdmin
    .from('deletion_requests')
    .update({
      status: 'approved',
      admin_note: adminNote?.trim() || 'อนุมัติการลบบัญชีและข้อมูลผู้ใช้เรียบร้อยแล้ว',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .or(`id.eq.${requestId},user_id.eq.${userId}`);

  if (error) throw new Error(error.message);
}

/**
 * Admin action: Reject account deletion request
 */
export async function rejectAccountDeletion(requestId: string, adminNote?: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('deletion_requests')
    .update({
      status: 'rejected',
      admin_note: adminNote?.trim() || 'คำขอลบบัญชีถูกปฏิเสธโดยผู้ดูแลระบบ',
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
}

/**
 * User action: Cancel own pending deletion request
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('deletion_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .or(`id.eq.${userId},user_id.eq.${userId}`);

  if (error) throw new Error(error.message);
}

/**
 * Clear or cancel a deletion request to unblock re-registration
 */
export async function clearOrArchiveDeletionRequest(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await supabaseAdmin
      .from('deletion_requests')
      .delete()
      .or(`id.eq.${userId},user_id.eq.${userId}`);
  } catch (err) {
    console.warn('Could not clear deletion request:', err);
  }
}

/**
 * Real-time subscription to user's deletion request
 */
export function subscribeUserDeletionRequest(
  userId: string,
  callback: (request: DeletionRequest | null) => void
): () => void {
  getUserDeletionRequest(userId).then(callback);

  const channel = supabase
    .channel(`deletion_req_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'deletion_requests', filter: `user_id=eq.${userId}` },
      async () => {
        const req = await getUserDeletionRequest(userId);
        callback(req);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
