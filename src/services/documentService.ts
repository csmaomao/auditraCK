/**
 * documentService.ts
 *
 * Manages file attachments linked to requests.
 * Files are stored in Supabase Storage (bucket: documents).
 * Metadata is stored in the documents table.
 *
 * Free-plan optimizations:
 *   - Attachments are NOT auto-downloaded. Only metadata is fetched on load.
 *   - Signed URLs are generated ONLY when the Auditor clicks View/Download.
 *     Signed URLs expire after 60 minutes to limit exposure.
 *   - The documents bucket is private — no public URLs.
 *   - File metadata query fetches only needed columns.
 *   - No realtime subscriptions or polling.
 */

import { createClient } from '@/lib/supabase/server'
import { ALLOWED_FILE_EXTENSIONS } from '@/utils/constants'

export interface AttachmentRow {
  id: string
  request_id: string | null
  file_name: string
  file_type: string
  document_type: string | null
  storage_path: string
  uploaded_at: string
  // file_url is NOT included here — it is generated on-demand via signed URL
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

/**
 * Fetch attachment metadata for a request.
 * Does NOT include file_url — signed URLs are generated on demand.
 *
 * Free-plan: explicit columns, no file_url in the default fetch.
 */
export async function getRequestAttachments(
  requestId: string
): Promise<AttachmentRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select('id, request_id, file_name, file_type, document_type, storage_path, uploaded_at')
    .eq('request_id', requestId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('[documentService.getRequestAttachments]', error.message)
    return []
  }

  return (data ?? []) as AttachmentRow[]
}

/**
 * Generate a signed URL for a single attachment.
 * Called only when the Auditor clicks View or Download.
 *
 * Free-plan: signed URLs are generated on-demand, not stored, expire in 60 min.
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 60 * 60) // 1 hour expiry

  if (error) {
    console.error('[documentService.getSignedUrl]', error.message)
    return null
  }

  return data?.signedUrl ?? null
}

// ---------------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------------

/**
 * Upload a file attachment and save its metadata to the documents table.
 *
 * Storage path format: documents/{requestId}/{timestamp}-{filename}
 *
 * Validates the file extension before uploading.
 * Returns the new attachment record on success, null on failure.
 */
export async function uploadAttachment(
  file: File,
  requestId: string,
  uploadedBy: string
): Promise<AttachmentRow | null> {
  // Validate extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext as typeof ALLOWED_FILE_EXTENSIONS[number])) {
    throw new Error(
      `File type "${ext}" is not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
    )
  }

  const supabase = await createClient()

  // Build storage path
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `documents/${requestId}/${timestamp}-${safeName}`

  // Upload to Supabase Storage (private bucket)
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[documentService.uploadAttachment storage]', uploadError.message)
    throw new Error('Failed to upload file. Please try again.')
  }

  // Save metadata to documents table
  // file_url is left empty — we use signed URLs on demand
  const { data: inserted, error: dbError } = await supabase
    .from('documents')
    .insert({
      request_id: requestId,
      file_name: file.name,
      file_type: file.type,
      document_type: null,
      file_url: '', // not used — signed URLs generated on demand
      storage_path: storagePath,
      uploaded_by: uploadedBy,
    })
    .select('id, request_id, file_name, file_type, document_type, storage_path, uploaded_at')
    .single()

  if (dbError || !inserted) {
    // Clean up the uploaded file if DB insert fails
    await supabase.storage.from('documents').remove([storagePath])
    console.error('[documentService.uploadAttachment db]', dbError?.message)
    throw new Error('Failed to save attachment record. Please try again.')
  }

  return inserted as AttachmentRow
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/**
 * Delete an attachment from both Supabase Storage and the documents table.
 */
export async function deleteAttachment(id: string): Promise<boolean> {
  const supabase = await createClient()

  // Fetch the storage path first
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !doc) {
    console.error('[documentService.deleteAttachment fetch]', fetchError?.message)
    return false
  }

  // Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path])

  if (storageError) {
    console.error('[documentService.deleteAttachment storage]', storageError.message)
    // Continue to delete the DB record even if storage delete fails
  }

  // Delete from DB
  const { error: dbError } = await supabase.from('documents').delete().eq('id', id)

  if (dbError) {
    console.error('[documentService.deleteAttachment db]', dbError.message)
    return false
  }

  return true
}
