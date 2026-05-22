'use client'

/**
 * RequestTable — displays all logged requests in a sortable table.
 *
 * Columns: Organization, Event Name, Event Date, Venue,
 *          Secretary Signed, Auditor Signed, President Approved, Status, Actions
 *
 * Actions per row: Edit, Delete
 */

import RequestStatusBadge from './RequestStatusBadge'
import { formatDateShort } from '@/utils/formatDate'
import type { RequestRow } from '@/services/requestService'

interface RequestTableProps {
  requests: RequestRow[]
  onView: (request: RequestRow) => void
  onEdit: (request: RequestRow) => void
  onDelete: (request: RequestRow) => void
}

function CheckIcon({ checked }: { checked: boolean }) {
  return checked ? (
    <svg className="w-4 h-4 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-gray-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function RequestTable({ requests, onView, onEdit, onDelete }: RequestTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {[
              'Organization',
              'Event Name',
              'Event Date',
              'Venue',
              'Sec.',
              'Aud.',
              'Pres.',
              'Status',
              '',
            ].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-3 last:pr-0 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-gray-800/30 transition-colors">
              <td className="py-3 pr-3 text-gray-300 max-w-[140px] truncate">
                {req.organization_name}
              </td>
              <td className="py-3 pr-3 text-white font-medium max-w-[180px] truncate">
                {req.event_name}
              </td>
              <td className="py-3 pr-3 text-gray-300 whitespace-nowrap">
                {formatDateShort(req.event_date)}
              </td>
              <td className="py-3 pr-3 text-gray-300 max-w-[140px] truncate">
                {req.venue}
              </td>
              <td className="py-3 pr-3 text-center">
                <CheckIcon checked={req.secretary_signed} />
              </td>
              <td className="py-3 pr-3 text-center">
                <CheckIcon checked={req.auditor_signed} />
              </td>
              <td className="py-3 pr-3 text-center">
                <CheckIcon checked={req.president_approved} />
              </td>
              <td className="py-3 pr-3">
                <RequestStatusBadge status={req.status} />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onView(req)}
                    className="text-gray-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(req)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(req)}
                    className="text-gray-500 hover:text-red-400 text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
