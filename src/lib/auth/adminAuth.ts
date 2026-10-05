import { supabaseAdmin } from '@/lib/supabase/admin';

const ADMIN_EMAILS = [
  'pongpataradanai@gmail.com',
  'admin@j3astore.com',
  'mynameisyee0@gmail.com',
  'ratchadejchaisomvit@gmail.com',
];

export async function verifyAdminRequest(req: Request): Promise<{ isAdmin: boolean; error?: string; user?: any }> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { isAdmin: false, error: 'Missing authorization token' };
  }

  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !user) {
    return { isAdmin: false, error: 'Invalid or expired session token' };
  }

  const isMaster = Boolean(user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = isMaster || profile?.role === 'admin';
  if (!isAdmin) {
    return { isAdmin: false, error: 'Forbidden: Admin access required', user };
  }

  return { isAdmin: true, user };
}
