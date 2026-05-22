'use client'

/**
 * CalendarEventModal — read-only detail view for a calendar event.
 *
 * Shows all request fields and requested assets (from snapshot fields).
 * No attachments section — this is a quick-view from the calendar.
 * No auto-download of any files.
 */

import { formatDate, formatTime } from '@/utils/formatDate'
import type { CalendarEvent } from './CalendarSidePanel'

interface CalendarEventModalProps {
  event: CalendarEvent
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

export default function CalendarEventModal({ event, onClose }: CalendarEventModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-event-title"
    >
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl my-4 sm:my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 mb-1">
              Approved
            </span>
            <h2 id="calendar-event-title" className="text-white text-base font-semibold truncate">
              {event.event_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-3 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-5 space-y-5">

          {/* Key details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization" value={event.organization_name} />
            <Field label="Event Date" value={formatDate(event.event_date)} />
            <Field
              label="Time"
              value={
                event.start_time || event.end_time
                  ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
                  : undefined
              }
            />
            <Field label="Venue / Location" value={event.venue} />
          </div>

          {/* Remarks */}
          {event.remarks && (
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Remarks</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{event.remarks}</p>
            </div>
          )}

          {/* Requested Assets */}
          <div>
            <p className="text-white text-sm font-semibold mb-2 pb-2 border-b border-gray-800">
              Requested Assets
            </p>
            {event.request_assets.length === 0 ? (
              <p className="text-gray-500 text-sm">No assets listed for this request.</p>
            ) : (
              <div className="space-y-2">
                {event.request_assets.map((ra) => (
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
          </div>

        </div>
      </div>
    </div>
  )
}
