import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserProfile, UserRole, UserTier } from '@/types/user';
import { clearOrArchiveDeletionRequest } from './deletionRequests';

function getAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'mynameisyee0@gmail.com';
  return envEmails
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

function mapRowToUserProfile(row: any): UserProfile {
  const email = row.email || null;
  const rawDisplayName = row.display_name || null;
  const displayName = rawDisplayName && rawDisplayName.trim() && rawDisplayName !== 'Customer'
    ? rawDisplayName.trim()
    : (email ? email.split('@')[0] : 'Customer');

  const adminEmails = getAdminEmails();
  const isMasterAdmin = Boolean(email && adminEmails.includes(email.toLowerCase()));

  return {
    uid: row.id,
    email,
    displayName,
    photoURL: row.avatar_url || null,
    role: isMasterAdmin ? 'admin' : ((row.role as UserRole) || 'customer'),
    credits: Number(row.credits) || 0,
    tier: (row.tier as UserTier) || (isMasterAdmin ? 'VIP' : 'Bronze'),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch a user profile from Supabase by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToUserProfile(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create or sync user profile on initial registration or social sign-in
 */
export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  if (!uid) throw new Error('UID is required.');

  try {
    await clearOrArchiveDeletionRequest(uid);
  } catch (err: any) {
    console.warn('Could not clear previous deletion request upon re-registration:', err);
  }

  const existing = await getUserProfile(uid);

  const adminEmails = getAdminEmails();
  const isMasterAdmin = Boolean(
    data.email && adminEmails.includes(data.email.toLowerCase())
  );

  const resolvedName = (data.displayName && data.displayName.trim() && data.displayName !== 'Customer')
    ? data.displayName.trim()
    : (data.email ? data.email.split('@')[0] : 'Customer');

  if (existing) {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if ((!existing.displayName || existing.displayName === 'Customer') && resolvedName !== 'Customer') {
      updates.display_name = resolvedName;
    }
    if (!existing.photoURL && data.photoURL) {
      updates.avatar_url = data.photoURL;
    }
    if (isMasterAdmin && existing.role !== 'admin') {
      updates.role = 'admin';
    }

    if (Object.keys(updates).length > 1) {
      await supabase.from('profiles').update(updates).eq('id', uid);
    }
    return { ...existing, displayName: updates.display_name || existing.displayName };
  }

  const initialRole: UserRole = isMasterAdmin ? 'admin' : 'customer';

  const newRow = {
    id: uid,
    email: data.email || null,
    display_name: resolvedName,
    avatar_url: data.photoURL || null,
    role: initialRole,
    credits: 0.0,
    tier: (isMasterAdmin ? 'VIP' : 'Bronze') as UserTier,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert([newRow]);
  if (error) {
    console.warn('Could not upsert profile directly, attempting admin client:', error.message);
    await supabaseAdmin.from('profiles').upsert([newRow]);
  }

  return mapRowToUserProfile(newRow);
}

/**
 * Update user profile details
 */
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; photoURL?: string; phone?: string; tier?: UserTier }
): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.displayName !== undefined) updates.display_name = data.displayName;
  if (data.photoURL !== undefined) updates.avatar_url = data.photoURL;
  if (data.tier !== undefined) updates.tier = data.tier;

  const { error } = await supabase.from('profiles').update(updates).eq('id', uid);
  if (error) throw new Error(error.message);
}

/**
 * Get all users for Admin Customers page
 */
export async function getAllUsers(limitCount: number = 50): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error fetching all users from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapRowToUserProfile);
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}

/**
 * Admin action: Update role of a user
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) throw new Error(error.message);
}

/**
 * Update user wallet credits
 */
export async function updateUserCredits(uid: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ credits: Math.max(0, amount), updated_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) throw new Error(error.message);
}

/**
 * Deduct user credits atomically for store purchases
 */
export async function deductUserCredits(uid: string, amountToDeduct: number): Promise<void> {
  const current = await getUserProfile(uid);
  const currentCredits = current?.credits || 0;
  const newCredits = Math.max(0, currentCredits - amountToDeduct);

  const { error } = await supabase
    .from('profiles')
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) throw new Error(error.message);
}

/**
 * Permanently delete user profile (Admin action)
 */
export async function deleteUserDoc(uid: string): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', uid);
  if (error) throw new Error(error.message);
}

/**
 * Real-time subscription to user profile updates
 */
export function subscribeUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError?: (error: any) => void
): () => void {
  getUserProfile(uid).then(onProfile).catch(onError);

  const channelName = `profile_${uid}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
      async () => {
        try {
          const p = await getUserProfile(uid);
          onProfile(p);
        } catch (err) {
          onError?.(err);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
