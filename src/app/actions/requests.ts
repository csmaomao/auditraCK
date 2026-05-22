'use server'

/**
 * Server actions for the Requests feature.
 * Called from client components (RequestForm, RequestTable).
 * All Supabase calls happen server-side — credentials never reach the browser.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createRequest,
  updateRequest,
  deleteRequest,
} from '@/services/requestService'
import type { RequestFormData } from '@/types/request'

/** Create a new request. Returns the new request id on success. */
export async function createRequestAction(
  data: RequestFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated. Please sign in again.' }
  }

  // Check that a profile row exists for this user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('[createRequestAction] Profile not found for user:', user.id, profileError?.message)
    return {
      success: false,
      error: 'Request could not be saved. Please check your Supabase profile role and database permissions. Your user account may not have a profile row — run migration 002 in Supabase to fix this.',
    }
  }

  const result = await createRequest(data, user.id)

  if (!result) {
    return {
      success: false,
      error: 'Request could not be saved. Please check your Supabase profile role and database permissions.',
    }
  }

  revalidatePath('/requests')
  revalidatePath('/dashboard')
  return { success: true, id: result.id }
}

/** Update an existing request. */
export async function updateRequestAction(
  id: string,
  data: RequestFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated. Please sign in again.' }

  const ok = await updateRequest(id, data, user.id)
  if (!ok) {
    return {
      success: false,
      error: 'Request could not be updated. Please check your Supabase profile role and database permissions.',
    }
  }

  revalidatePath('/requests')
  revalidatePath('/dashboard')
  return { success: true }
}

/** Delete a request. */
export async function deleteRequestAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated. Please sign in again.' }

  const ok = await deleteRequest(id, user.id)
  if (!ok) return { success: false, error: 'Failed to delete request' }

  revalidatePath('/requests')
  revalidatePath('/dashboard')
  return { success: true }
}
