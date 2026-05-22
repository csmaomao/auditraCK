'use client'

/**
 * RequestViewModal — read-only view of a full request record.
 *
 * Shows all request fields, requested assets (from snapshot fields),
 * and attached files (metadata only — no auto-download).
 */

import RequestStatusBadge from './RequestStatusBadge'
import { formatDate, formatTime } from '@/utils/formatDate'
import type { RequestWithAssets } from '@/services/requestService'
import type { AttachmentRow } from '@/services/documentService'
import { getAttachmentUrlAction } from '@/app/actions/attachments'
import { useState } from 'react'

interface RequestViewModalProps {
  request: RequestWithAssets
  attachments: AttachmentRow[]
  onClose: () => void
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-gray-200 text-sm">{value || '—'}</p>
    </div>
  )
}

function CheckField({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${checked ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-600'}`}>
        {checked ? '✓' : '✗'}
      </span>
      <span className="text-gray-300 text-sm">{label}</span>
    </div>
  )
}

export default function RequestViewModal({
  request,
  attachments,
  onClose,
}: RequestViewModalProps) {
  const [loadingUrlId, setLoadingUrlId] = useState<string | null>(null)

  async function handleViewAttachment(att: AttachmentRow) {
    setLoadingUrlId(att.id)
    const result = await getAttachmentUrlAction(att.storage_path)
    setLoadingUrlId(null)
    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else {
      alert(result.error ?? 'Could not generate download link')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl my-4 sm:my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-white text-base font-semibold truncate">Request Details</h2>
            <RequestStatusBadge status={request.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-2 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-6">

          {/* Request Details */}
          <section>
            <h3 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-gray-800">
              Request Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Organization Name" value={request.organization_name} />
              <Field label="Event Name" value={request.event_name} />
              <Field label="Purpose" value={request.purpose} />
              <Field label="Date Submitted" value={formatDate(request.date_submitted)} />
              <Field label="Event Date" value={formatDate(request.event_date)} />
              <Field
                label="Time"
                value={
                  request.start_time || request.end_time
                    ? `${formatTime(request.start_time)} – ${formatTime(request.end_time)}`
                    : undefined
                }
              />
              <Field label="Venue / Location" value={request.venue} />
              <Field label="Contact Person" value={request.contact_person} />
              <Field label="Adamson Email" value={request.adamson_email} />
            </div>
          </section>

          {/* Paperwork Status */}
          <section>
            <h3 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-gray-800">
              Paperwork Status
            </h3>
            <div className="space-y-2">
              <CheckField label="Secretary Signed" checked={request.secretary_signed} />
              <CheckField label="Auditor Signed" checked={request.auditor_signed} />
              <CheckField label="President Approved" checked={request.president_approved} />
            </div>
          </section>

          {/* Remarks */}
          {request.remarks && (
            <section>
              <h3 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-gray-800">
                Remarks
              </h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{request.remarks}</p>
            </section>
          )}

          {/* Requested Assets */}
          <section>
            <h3 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-gray-800">
              Requested Assets
            </h3>
            {request.request_assets.length === 0 ? (
              <p className="text-gray-500 text-sm">No assets listed for this request.</p>
            ) : (
              <div className="space-y-2">
                {request.request_assets.map((ra) => (
                  <div
                    key={ra.id}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {ra.asset_description ?? 'Unknown asset'}
                      </p>
                      {ra.asset_tag_number && (
                        <p className="text-gray-500 text-xs">#{ra.asset_tag_number}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs shrink-0">
                      Qty: {ra.quantity_requested}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Attachments */}
          <section>
            <h3 className="text-white text-sm font-semibold mb-3 pb-2 border-b border-gray-800">
              Attachments
            </h3>
            {attachments.length === 0 ? (
              <p className="text-gray-500 text-sm">No attachments for this request.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg"
                  >
                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="flex-1 text-white text-sm truncate min-w-0">{att.file_name}</span>
                    <span className="text-gray-500 text-xs shrink-0 hidden sm:inline">
                      {new Date(att.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleViewAttachment(att)}
                      disabled={loadingUrlId === att.id}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium shrink-0 disabled:opacity-50 py-1 px-1"
                    >
                      {loadingUrlId === att.id ? 'Loading…' : 'View'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
