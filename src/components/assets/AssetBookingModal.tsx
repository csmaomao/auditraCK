'use client'

/**
 * AssetBookingModal — shows all Approved requests currently booking a specific asset.
 *
 * Fetched on open so no data is transferred until the Auditor clicks.
 * Free-plan: fetches only 6 columns from requests joined through request_assets.
 * No polling, no subscriptions.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateShort, formatTime } from '@/utils/formatDate'

interface BookingEntry {
  request_id: string
  event_name: string
  organization_name: string
  event_date: string
  start_time: string | null
  end_time: string | null
  status: string
}

interface AssetBookingModalProps {
  assetId: string
  assetDescription: string | null
  assetTagNumber: string | null
  onClose: () => void
}

export default function AssetBookingModal({
  assetId,
  assetDescription,
  assetTagNumber,
  onClose,
}: AssetBookingModalProps) {
  const [bookings, setBookings] = useState<BookingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('request_assets')
        .select(`
          request_id,
          requests!inner(
            event_name,
            organization_name,
            event_date,
            start_time,
            end_time,
            status
          )
        `)
        .eq('asset_id', assetId)
        .eq('requests.status', 'Approved')

      if (fetchError) {
        setError('Could not load booking details.')
        setLoading(false)
        return
      }

      const entries: BookingEntry[] = (data ?? []).map((row) => {
        const req = (row.requests as unknown) as {
          event_name: string
          organization_name: string
          event_date: string
          start_time: string | null
          end_time: string | null
          status: string
        }
        return {
          request_id: row.request_id,
          event_name: req.event_name,
          organization_name: req.organization_name,
          event_date: req.event_date,
          start_time: req.start_time,
          end_time: req.end_time,
          status: req.status,
        }
      })

      // Sort chronologically: event_date ASC, then start_time ASC
      entries.sort((a, b) => {
        const dateCmp = a.event_date.localeCompare(b.event_date)
        if (dateCmp !== 0) return dateCmp
        const aTime = a.start_time ?? ''
        const bTime = b.start_time ?? ''
        return aTime.localeCompare(bTime)
      })

      setBookings(entries)
      setLoading(false)
    }

    fetchBookings()
  }, [assetId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-5 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 id="booking-modal-title" className="text-white text-sm font-semibold">
              Booking Details
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {assetDescription ?? 'Asset'}
              {assetTagNumber && (
                <span className="text-gray-600 ml-1">#{assetTagNumber}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
          {loading && (
            <p className="text-gray-500 text-sm text-center py-8">Loading bookings…</p>
          )}

          {!loading && error && (
            <p className="text-red-400 text-sm text-center py-8">{error}</p>
          )}

          {!loading && !error && bookings.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              No active bookings found for this asset.
            </p>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Organization', 'Event Name', 'Event Date', 'Time', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 pr-4 last:pr-0 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {bookings.map((b) => (
                  <tr key={b.request_id} className="hover:bg-gray-800/30 transition-colors align-top">
                    {/* Organization — full name, wraps on long text */}
                    <td className="py-3 pr-4 text-gray-300 text-xs" style={{ minWidth: '140px', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {b.organization_name}
                    </td>
                    <td className="py-3 pr-4 text-white font-medium text-xs" style={{ minWidth: '140px', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {b.event_name}
                    </td>
                    <td className="py-3 pr-4 text-gray-300 text-xs whitespace-nowrap">
                      {formatDateShort(b.event_date)}
                    </td>
                    <td className="py-3 pr-4 text-gray-300 text-xs whitespace-nowrap">
                      {b.start_time
                        ? `${formatTime(b.start_time)}${b.end_time ? ` – ${formatTime(b.end_time)}` : ''}`
                        : '—'}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
