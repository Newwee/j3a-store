import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from server component
            }
          },
        },
      }
    );

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && sessionData?.user) {
      const user = sessionData.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const meta = user.user_metadata || {};
      const displayName =
        meta.full_name || meta.name || meta.user_name || (userEmail ? userEmail.split('@')[0] : 'Customer');
      const avatarUrl = meta.avatar_url || meta.picture || null;

      // Master admin check
      const adminEmails = (
        process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
        'pongpataradanai@gmail.com,admin@j3astore.com,mynameisyee0@gmail.com'
      )
        .toLowerCase()
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      const isMasterAdmin = Boolean(userEmail && adminEmails.includes(userEmail));

      try {
        // Ensure profile exists in profiles table
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingProfile) {
          // New User Registration via Google OAuth
          await supabaseAdmin.from('profiles').insert([
            {
              id: user.id,
              email: userEmail || null,
              display_name: displayName,
              avatar_url: avatarUrl,
              role: isMasterAdmin ? 'admin' : 'customer',
              credits: 0.0,
              tier: isMasterAdmin ? 'VIP' : 'Bronze',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

          // Clear any old account deletion request
          await supabaseAdmin
            .from('deletion_requests')
            .delete()
            .or(`id.eq.${user.id},user_id.eq.${user.id}`);

          // Dispatch Discord Welcome Notification for new member
          fetch(`${requestUrl.origin}/api/notifications/discord`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'member_registered',
              data: {
                userName: displayName,
                userEmail: userEmail,
                provider: 'google',
              },
            }),
          }).catch((notifyErr) => console.warn('Discord new member notify error:', notifyErr));
        } else {
          // Sync avatar/display name if empty or promote master admin
          const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (avatarUrl) updates.avatar_url = avatarUrl;
          if (isMasterAdmin && existingProfile.role !== 'admin') updates.role = 'admin';

          await supabaseAdmin.from('profiles').update(updates).eq('id', user.id);

          // Clear any active deletion request upon explicit login
          await supabaseAdmin
            .from('deletion_requests')
            .delete()
            .or(`id.eq.${user.id},user_id.eq.${user.id}`);
        }
      } catch (profileErr) {
        console.error('Error syncing user profile on Google OAuth callback:', profileErr);
      }

      // Clean redirect to intended page
      const cleanNext = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(`${requestUrl.origin}${cleanNext}`);
    } else if (exchangeError) {
      console.error('Supabase exchangeCodeForSession error:', exchangeError);
    }
  }

  // Fallback if code exchange fails
  return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`);
}
