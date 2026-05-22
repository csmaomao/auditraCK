/**
 * RequestStatusBadge — colored badge for request statuses.
 *
 * Colors: Pending=yellow, Approved=green, Rejected=red, Cancelled=gray, Completed=blue
 * Wraps StatusBadge with the correct color class from statusHelpers.
 */

import StatusBadge from '@/components/common/StatusBadge'
import { getStatusColor } from '@/utils/statusHelpers'
import type { RequestStatus } from '@/types/database'

interface RequestStatusBadgeProps {
  status: RequestStatus
}

export default function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  return <StatusBadge label={status} className={getStatusColor(status)} />
}
