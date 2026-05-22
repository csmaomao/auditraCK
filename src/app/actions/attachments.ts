'use server'

/**
 * Server actions for request attachments.
 * File uploads go through here so the Supabase service role key
 * never reaches the browser.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  uploadAttachment,
  deleteAttachment,
  getSignedUrl,
} from '@/services/documentService'

/** Upload a file attachment for a request. */
export async function uploadAttachmentAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  const requestId = formData.get('requestId') as string | null

  if (!file || !requestId) {
    return { success: false, error: 'Missing file or request ID' }
  }

  try {
    await uploadAttachment(file, requestId, user.id)
    revalidatePath('/requests')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Delete an attachment by its document record ID. */
export async function deleteAttachmentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const ok = await deleteAttachment(id)
  if (!ok) return { success: false, error: 'Failed to delete attachment' }
  revalidatePath('/requests')
  return { success: true }
}

/**
 * Generate a signed URL for viewing/downloading an attachment.
 * Called only when the Auditor clicks View or Download.
 *
 * Free-plan: signed URLs are generated on-demand, expire in 1 hour.
 */
export async function getAttachmentUrlAction(
  storagePath: string
): Promise<{ url: string | null; error?: string }> {
  const url = await getSignedUrl(storagePath)
  if (!url) return { url: null, error: 'Could not generate download link' }
  return { url }
}
