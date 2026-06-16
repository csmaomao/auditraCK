'use client'

import { useState, useRef } from 'react'
import { ALLOWED_FILE_EXTENSIONS } from '@/utils/constants'
import { uploadAttachmentAction, deleteAttachmentAction, getAttachmentUrlAction } from '@/app/actions/attachments'
import type { AttachmentRow } from '@/services/documentService'

interface RequestAttachmentsProps {
  requestId: string
  initialAttachments: AttachmentRow[]
}

export default function RequestAttachments({ requestId, initialAttachments }: RequestAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachmentRow[]>(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loadingUrlId, setLoadingUrlId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext as typeof ALLOWED_FILE_EXTENSIONS[number])) {
      setUploadError(`File type "${ext}" is not allowed. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`)
      return
    }
    setUploadError(null)
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('requestId', requestId)
    const result = await uploadAttachmentAction(formData)
    if (!result.success) {
      setUploadError(result.error ?? 'Upload failed')
    } else {
      window.location.reload()
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this attachment? This cannot be undone.')) return
    setDeletingId(id)
    const result = await deleteAttachmentAction(id)
    if (result.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id))
    } else {
      alert(result.error ?? 'Failed to delete attachment')
    }
    setDeletingId(null)
  }

  async function handleView(attachment: AttachmentRow) {
    setLoadingUrlId(attachment.id)
    const result = await getAttachmentUrlAction(attachment.storage_path)
    setLoadingUrlId(null)
    if (!result.url) {
      alert(result.error ?? 'Could not generate download link')
      return
    }
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-3">
      {attachments.length === 0 ? (
        <p className="text-gray-500 text-xs">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="flex-1 text-gray-900 dark:text-white text-sm truncate">{att.file_name}</span>
              <span className="text-gray-500 text-xs shrink-0">
                {new Date(att.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button type="button" onClick={() => handleView(att)} disabled={loadingUrlId === att.id} className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs font-medium shrink-0 disabled:opacity-50">
                {loadingUrlId === att.id ? 'Loading…' : 'View'}
              </button>
              <button type="button" onClick={() => handleDelete(att.id)} disabled={deletingId === att.id} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 disabled:opacity-50" aria-label={`Delete ${att.file_name}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input ref={fileInputRef} type="file" accept={ALLOWED_FILE_EXTENSIONS.join(',')} onChange={handleFileChange} className="hidden" id="attachment-upload" />
        <label
          htmlFor="attachment-upload"
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer
            text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
            border border-gray-200 dark:border-gray-700 transition-colors duration-150
            ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {uploading ? 'Uploading…' : 'Attach file'}
        </label>
        <p className="text-gray-400 text-xs mt-1">Allowed: {ALLOWED_FILE_EXTENSIONS.join(', ')}</p>
      </div>
      {uploadError && <p className="text-red-500 dark:text-red-400 text-xs">{uploadError}</p>}
    </div>
  )
}
