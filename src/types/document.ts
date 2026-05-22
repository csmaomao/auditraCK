/**
 * A file attachment linked to a request.
 * Maps to the `documents` table.
 *
 * Documents are scanned forms or photos of physical paperwork.
 * They are always linked to a specific request — there is no standalone
 * Documents page. Attachments are managed inside the Requests page.
 *
 * Storage path format: documents/{request_id}/{timestamp}-{filename}
 */
export interface Document {
  id: string
  request_id: string | null       // null only if the linked request was deleted
  file_name: string
  file_type: string               // MIME type (e.g. "application/pdf")
  document_type?: string          // optional label (e.g. "Borrower's Form")
  file_url: string                // public URL from Supabase Storage
  storage_path: string            // internal storage path for deletion
  uploaded_by?: string            // UUID of the profile who uploaded
  uploaded_at: string
}
