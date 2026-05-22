/**
 * Authenticated layout — server component.
 *
 * Wraps all pages under (authenticated)/ with the AppShell.
 * Verifies the session server-side on every render.
 * If no session exists, redirects to /login.
 *
 * Free-plan optimization:
 *   - Fetches only id, email, full_name, role from profiles — not the full row.
 *   - One lightweight query per page load; no polling or subscriptions.
 *   - The page title is derived from the current route segment so each
 *     page doesn't need to pass it separately.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const supabase = await createClient()

  // Verify the session — getUser() validates the JWT with Supabase Auth server
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch only the fields we need for the sidebar display.
  // Free-plan optimization: explicit column selection, no wildcard.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  return (
    <AppShell
      userEmail={profile?.email ?? user.email}
      userFullName={profile?.full_name ?? undefined}
    >
      {children}
    </AppShell>
  )
}
