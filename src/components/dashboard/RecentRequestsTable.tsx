/**
 * RecentRequestsTable — shows recent requests on the Dashboard.
 *
 * Columns: Event Name, Organization, Date Submitted, Event Date, Venue, Status.
 * Data is passed as a prop (fetched server-side). No client-side Supabase calls.
 */

import Link from 'next/link'
import StatusBadge from '@/components/common/StatusBadge'
import EmptyState from '@/components/common/EmptyState'
import { getStatusColor } from '@/utils/statusHelpers'
import { formatDateShort } from '@/utils/formatDate'
import type { RequestStatus } from '@/types/database'
import type { RecentRequest } from '@/services/dashboardService'

interface RecentRequestsTableProps {
  requests: RecentRequest[]
}

export default function RecentRequestsTable({ requests }: RecentRequestsTableProps) {
  if (requests.length === 0) {
    return <EmptyState message="No requests found for this period." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {['Event Name', 'Organization', 'Date Submitted', 'Event Date', 'Venue', 'Status'].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4 last:pr-0 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-gray-800/40 transition-colors duration-100">
              <td className="py-3 pr-4">
                <Link href="/requests" className="text-white hover:text-blue-400 transition-colors font-medium truncate max-w-[180px] block">
                  {req.event_name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-gray-300 truncate max-w-[140px]">
                {req.organization_name}
              </td>
              <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                {req.date_submitted ? formatDateShort(req.date_submitted) : '—'}
              </td>
              <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                {formatDateShort(req.event_date)}
              </td>
              <td className="py-3 pr-4 text-gray-300 truncate max-w-[140px]">
                {req.venue}
              </td>
              <td className="py-3">
                <StatusBadge label={req.status} className={getStatusColor(req.status as RequestStatus)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
