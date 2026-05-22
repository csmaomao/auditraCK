'use server'

/**
 * Server actions for authentication.
 *
 * signOut() is called from the Sidebar logout button (Phase 3).
 * It signs the user out via Supabase, logs the action internally,
 * then redirects to /login.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/services/auditLogService'

export async function signOut() {
  const supabase = await createClient()

  // Get the current user before signing out so we can log their ID
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.auth.signOut()

  // Log the logout action internally (fire-and-forget — errors are swallowed)
  if (user) {
    await logActivity(user.id, 'User logged out')
  }

  redirect('/login')
}
