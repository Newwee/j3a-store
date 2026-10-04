import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface RedeemCode {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  usedByUsers: string[];
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  amount?: number;
  totalMembersCount?: number;
  usedCount?: number;
}

function mapRowToRedeemCode(row: any): RedeemCode {
  const usedBy = Array.isArray(row.used_by)
    ? row.used_by
    : typeof row.used_by === 'string'
    ? JSON.parse(row.used_by || '[]')
    : [];

  return {
    id: row.id,
    code: row.code,
    amount: Number(row.credits) || 0,
    maxUses: Number(row.max_uses) || 0,
    usedCount: Number(row.used_count) || 0,
    usedByUsers: usedBy,
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Redeem a code for the specified user
 */
export async function redeemCodeForUser(codeStr: string, userId: string): Promise<RedeemResult> {
  if (!userId) {
    return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนแลกโค้ด' };
  }

  const cleanCode = codeStr.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'กรุณากรอกโค้ดของขวัญ' };
  }

  try {
    // 1. Fetch code
    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .eq('code', cleanCode)
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return { success: false, message: 'ไม่พบโค้ดนี้ในระบบ หรือโค้ดไม่ถูกต้อง' };
    }

    if (!codeRow.is_active) {
      return { success: false, message: 'โค้ดนี้หมดอายุหรือปิดการใช้งานแล้ว' };
    }

    const usedBy: string[] = Array.isArray(codeRow.used_by)
      ? codeRow.used_by
      : typeof codeRow.used_by === 'string'
      ? JSON.parse(codeRow.used_by || '[]')
      : [];

    if (usedBy.includes(userId)) {
      return { success: false, message: 'คุณเคยใช้โค้ดนี้ไปแล้ว (จำกัด 1 สิทธิ์ต่อบัญชี)' };
    }

    const maxUses = Number(codeRow.max_uses) || 0;
    const currentUsed = Number(codeRow.used_count) || 0;
    if (maxUses > 0 && currentUsed >= maxUses) {
      return { success: false, message: 'สิทธิ์การใช้งานโค้ดนี้เต็มแล้ว' };
    }

    // 2. Fetch user profile
    const { data: userProfile, error: userErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    if (userErr || !userProfile) {
      return { success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' };
    }

    const rewardAmount = Number(codeRow.credits) || 0;
    const currentCredits = Number(userProfile.credits) || 0;
    const newCredits = currentCredits + rewardAmount;
    const newUsedCount = currentUsed + 1;
    const newUsedBy = [...usedBy, userId];

    // 3. Update code and profile atomically
    const { error: updateCodeErr } = await supabaseAdmin
      .from('redeem_codes')
      .update({
        used_count: newUsedCount,
        used_by: newUsedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', codeRow.id);

    if (updateCodeErr) {
      throw new Error(`Failed to update code: ${updateCodeErr.message}`);
    }

    const { error: updateProfileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateProfileErr) {
      throw new Error(`Failed to update user credits: ${updateProfileErr.message}`);
    }

    return {
      success: true,
      message: `แลกโค้ดสำเร็จ! คุณได้รับเครดิต ${rewardAmount} บาท`,
      amount: rewardAmount,
      usedCount: newUsedCount,
    };
  } catch (error: any) {
    console.error('Error redeeming code:', error);
    return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการแลกโค้ด' };
  }
}

/**
 * Get all redeem codes (Admin)
 */
export async function getAllRedeemCodes(): Promise<RedeemCode[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('redeem_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting redeem codes:', error.message);
      return [];
    }

    return (data || []).map(mapRowToRedeemCode);
  } catch (err) {
    console.error('Error getting redeem codes:', err);
    return [];
  }
}

export interface CreateRedeemCodeInput {
  code: string;
  amount: number;
  maxUses?: number;
  isActive?: boolean;
}

/**
 * Create a new redeem code (Admin)
 */
export async function createRedeemCode(input: CreateRedeemCodeInput): Promise<RedeemCode> {
  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) throw new Error('กรุณากรอกรหัสโค้ด');
  if (input.amount <= 0) throw new Error('จำนวนเครดิตต้องมากกว่า 0');

  const id = `code_${Date.now()}`;
  const row = {
    id,
    code: cleanCode,
    credits: Math.round(input.amount),
    max_uses: Number(input.maxUses) || 0,
    used_count: 0,
    used_by: [],
    is_active: input.isActive ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('redeem_codes').insert([row]);
  if (error) {
    throw new Error(`Failed to create redeem code in Supabase: ${error.message}`);
  }

  return mapRowToRedeemCode(row);
}

/**
 * Update an existing redeem code (Admin)
 */
export async function updateRedeemCode(
  codeId: string,
  data: Partial<CreateRedeemCodeInput>
): Promise<void> {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.amount !== undefined) updates.credits = Math.round(data.amount);
  if (data.maxUses !== undefined) updates.max_uses = Number(data.maxUses);
  if (data.isActive !== undefined) updates.is_active = Boolean(data.isActive);

  const { error } = await supabaseAdmin
    .from('redeem_codes')
    .update(updates)
    .or(`id.eq.${codeId},code.eq.${codeId.toUpperCase()}`);

  if (error) throw new Error(error.message);
}

/**
 * Delete a redeem code (Admin)
 */
export async function deleteRedeemCode(codeId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('redeem_codes')
    .delete()
    .or(`id.eq.${codeId},code.eq.${codeId.toUpperCase()}`);

  if (error) throw new Error(error.message);
}

/**
 * Auto-seed opening code 'J3AOPENING'
 */
export async function seedOpeningCodeIfNotExists(): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from('redeem_codes')
      .select('id')
      .eq('code', 'J3AOPENING')
      .limit(1)
      .maybeSingle();

    if (!data) {
      await supabaseAdmin.from('redeem_codes').insert([
        {
          id: 'code_j3a_opening',
          code: 'J3AOPENING',
          credits: 20,
          max_uses: 0,
          used_count: 0,
          used_by: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (err) {
    console.warn('seedOpeningCodeIfNotExists note:', err);
  }
}
