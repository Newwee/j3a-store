import { supabase } from '@/lib/supabase/client';

export type CodeType = 'credit' | 'discount_percent' | 'discount_fixed';

export interface RedeemCode {
  id: string;
  code: string;
  codeType: CodeType;
  amount: number;
  discountPercent?: number;
  minSpend?: number;
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

export interface ValidateDiscountResult {
  valid: boolean;
  message: string;
  code?: string;
  codeType?: CodeType;
  discountAmount?: number;
  discountPercent?: number;
  minSpend?: number;
  isCreditCode?: boolean;
  creditAmount?: number;
}

function mapRowToRedeemCode(row: any): RedeemCode {
  const usedBy = Array.isArray(row.used_by)
    ? row.used_by
    : typeof row.used_by === 'string'
    ? JSON.parse(row.used_by || '[]')
    : [];

  const rawType = row.code_type || 'credit';
  let codeType: CodeType = 'credit';
  if (rawType === 'discount_percent' || row.discount_type === 'percent') {
    codeType = 'discount_percent';
  } else if (rawType === 'discount_fixed' || row.discount_type === 'fixed') {
    codeType = 'discount_fixed';
  }

  const creditsNum = Number(row.credits) || 0;
  const discountVal = Number(row.discount_value) || creditsNum;

  return {
    id: row.id,
    code: row.code,
    codeType,
    amount: codeType === 'discount_percent' ? discountVal : (creditsNum || discountVal || 0),
    discountPercent: codeType === 'discount_percent' ? (discountVal || creditsNum) : undefined,
    minSpend: Number(row.min_spend) || 0,
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
 * Redeem a code for the specified user (Calls secure API)
 */
export async function redeemCodeForUser(codeStr: string, userId: string): Promise<RedeemResult> {
  if (!userId) {
    return { success: false, message: 'กรุณาเข้าสู่ระบบก่อนแลกโค้ด' };
  }

  const cleanCode = codeStr.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'กรุณากรอกโค้ดของขวัญ' };
  }

  // 1. Try secure API route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: cleanCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.error || 'ไม่สามารถแลกโค้ดได้' };
      }
      return {
        success: true,
        message: json.message || `แลกโค้ดสำเร็จ! คุณได้รับเครดิต ${json.amount} บาท`,
        amount: json.amount,
        usedCount: json.usedCount,
      };
    }
  } catch (apiErr) {
    console.warn('API redeem fallback to direct client:', apiErr);
  }

  // 2. Direct authenticated supabase client fallback
  try {
    const { data: codeRow, error: codeErr } = await supabase
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

    const { data: userProfile, error: userErr } = await supabase
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

    await supabase
      .from('redeem_codes')
      .update({
        used_count: newUsedCount,
        used_by: newUsedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', codeRow.id);

    await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

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
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/codes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.codes)) {
          return json.codes.map(mapRowToRedeemCode);
        }
      }
    }
  } catch (apiErr) {
    console.warn('API get codes fallback to direct client:', apiErr);
  }

  // 2. Direct authenticated supabase client fallback
  try {
    const { data, error } = await supabase
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
  codeType?: CodeType;
  amount: number;
  discountPercent?: number;
  minSpend?: number;
  maxUses?: number;
  isActive?: boolean;
  expiresAt?: string;
}

/**
 * Create a new redeem code (Admin)
 */
export async function createRedeemCode(input: CreateRedeemCodeInput): Promise<RedeemCode> {
  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanCode) throw new Error('กรุณากรอกรหัสโค้ด');
  if (input.amount <= 0 && (!input.discountPercent || input.discountPercent <= 0)) {
    throw new Error('มูลค่าส่วนลดหรือจำนวนเครดิตต้องมากกว่า 0');
  }

  const codeType = input.codeType || 'credit';
  const discountVal = codeType === 'discount_percent' ? (Number(input.discountPercent) || input.amount) : input.amount;

  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'create',
          code: cleanCode,
          codeType,
          amount: input.amount,
          discountValue: discountVal,
          discountPercent: input.discountPercent,
          minSpend: input.minSpend || 0,
          maxUses: input.maxUses || 0,
          isActive: input.isActive ?? true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to create code via admin API');
      }
      return mapRowToRedeemCode(json.code);
    }
  } catch (apiErr: any) {
    console.warn('API create code fallback to direct client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const id = `code_${Date.now()}`;
  const row = {
    id,
    code: cleanCode,
    code_type: codeType,
    discount_type: codeType === 'discount_percent' ? 'percent' : 'fixed',
    discount_value: discountVal,
    credits: Math.round(input.amount),
    min_spend: Number(input.minSpend) || 0,
    max_uses: Number(input.maxUses) || 0,
    used_count: 0,
    used_by: [],
    is_active: input.isActive ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('redeem_codes').insert([row]);
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
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          codeId,
          data,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to update code via admin API');
      }
      return;
    }
  } catch (apiErr: any) {
    console.warn('API update code fallback to direct client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (data.amount !== undefined) updates.credits = Math.round(data.amount);
  if (data.maxUses !== undefined) updates.max_uses = Number(data.maxUses);
  if (data.isActive !== undefined) updates.is_active = Boolean(data.isActive);

  const { error } = await supabase
    .from('redeem_codes')
    .update(updates)
    .or(`id.eq.${codeId},code.eq.${codeId.toUpperCase()}`);

  if (error) throw new Error(error.message);
}

/**
 * Delete a redeem code (Admin)
 */
export async function deleteRedeemCode(codeId: string): Promise<void> {
  // 1. Try secure Admin API Route first
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          codeId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Failed to delete code via admin API');
      }
      return;
    }
  } catch (apiErr: any) {
    console.warn('API delete code fallback to direct client:', apiErr);
    if (apiErr?.message && !apiErr.message.includes('fetch')) {
      throw apiErr;
    }
  }

  // 2. Direct authenticated supabase client fallback
  const { error } = await supabase
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
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'seed' }),
      });
      return;
    }

    const { data } = await supabase
      .from('redeem_codes')
      .select('id')
      .eq('code', 'J3AOPENING')
      .limit(1)
      .maybeSingle();

    if (!data) {
      await supabase.from('redeem_codes').insert([
        {
          id: 'code_j3a_opening',
          code: 'J3AOPENING',
          credits: 20,
          code_type: 'credit',
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

/**
 * Validate a discount coupon code during checkout
 */
export async function validateDiscountCode(
  codeStr: string,
  subtotal: number,
  userId?: string
): Promise<ValidateDiscountResult> {
  const clean = codeStr.trim().toUpperCase();
  if (!clean) {
    return { valid: false, message: 'กรุณากรอกโค้ดส่วนลด' };
  }

  try {
    const { data: row, error } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('code', clean)
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      return { valid: false, message: 'ไม่พบโค้ดนี้ในระบบ หรือโค้ดไม่ถูกต้อง' };
    }

    const code = mapRowToRedeemCode(row);

    if (!code.isActive) {
      return { valid: false, message: 'โค้ดนี้หมดอายุหรือถูกปิดการใช้งานแล้ว' };
    }

    if (code.expiresAt && new Date(code.expiresAt).getTime() < Date.now()) {
      return { valid: false, message: 'โค้ดนี้หมดอายุการใช้งานแล้ว' };
    }

    if (code.maxUses > 0 && code.usedCount >= code.maxUses) {
      return { valid: false, message: 'สิทธิ์การใช้งานโค้ดนี้เต็มแล้ว' };
    }

    if (userId && code.usedByUsers.includes(userId)) {
      return { valid: false, message: 'คุณเคยใช้สิทธิ์โค้ดนี้ไปแล้ว' };
    }

    // Check if this is a general credit code (not checkout discount)
    if (code.codeType === 'credit') {
      return {
        valid: false,
        isCreditCode: true,
        code: code.code,
        creditAmount: code.amount,
        message: `โค้ด "${code.code}" เป็นโค้ดของขวัญเติมเครดิต ฿${code.amount} เข้ากระเป๋าเงิน (ไม่ใช่โค้ดลดราคาสินค้า)`,
      };
    }

    // Checkout Discount code: Check minSpend
    if (code.minSpend && code.minSpend > 0 && subtotal < code.minSpend) {
      return {
        valid: false,
        message: `ยอดสั่งซื้อไม่ถึงขั้นต่ำสำหรับโค้ดนี้ (ขั้นต่ำ ฿${code.minSpend})`,
      };
    }

    let discountAmount = 0;
    if (code.codeType === 'discount_percent') {
      const pct = code.discountPercent || code.amount;
      discountAmount = Math.round((subtotal * pct) / 100);
    } else {
      discountAmount = Math.min(subtotal, code.amount);
    }

    return {
      valid: true,
      code: code.code,
      codeType: code.codeType,
      discountAmount,
      discountPercent: code.discountPercent,
      minSpend: code.minSpend,
      message: `ใช้โค้ดส่วนลด "${code.code}" สำเร็จ! ลดทันที ฿${discountAmount}`,
    };
  } catch (err: any) {
    console.error('Error validating discount code:', err);
    return { valid: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ด' };
  }
}

/**
 * Record usage of a checkout discount code when an order is created
 */
export async function recordDiscountUsage(codeStr: string, userId?: string): Promise<void> {
  const clean = codeStr.trim().toUpperCase();
  if (!clean) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'record_discount', code: clean }),
      });
      return;
    }
  } catch (apiErr) {
    console.warn('API record discount usage fallback:', apiErr);
  }

  // Fallback direct
  try {
    const { data: row } = await supabase
      .from('redeem_codes')
      .select('id, used_count, used_by')
      .eq('code', clean)
      .limit(1)
      .maybeSingle();

    if (row) {
      const usedBy: string[] = Array.isArray(row.used_by)
        ? row.used_by
        : typeof row.used_by === 'string'
        ? JSON.parse(row.used_by || '[]')
        : [];

      const newUsedCount = (Number(row.used_count) || 0) + 1;
      const newUsedBy = userId ? Array.from(new Set([...usedBy, userId])) : usedBy;

      await supabase
        .from('redeem_codes')
        .update({
          used_count: newUsedCount,
          used_by: newUsedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    }
  } catch (err) {
    console.warn('Direct record discount usage error:', err);
  }
}
