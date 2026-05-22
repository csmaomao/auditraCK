import type { RequestStatus, BorrowingStatus } from '@/types/database'

/**
 * Returns Tailwind CSS classes for a request status badge.
 * Used by StatusBadge and RequestStatusBadge components.
 *
 * To change a status color, update the mapping here — it applies everywhere.
 */
export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Cancelled: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    Completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  }
  return colors[status] ?? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

/**
 * Returns Tailwind CSS classes for an asset borrowing status badge.
 */
export function getBorrowingStatusColor(status: BorrowingStatus): string {
  const colors: Record<BorrowingStatus, string> = {
    Available: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Booked: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  }
  return colors[status] ?? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

/**
 * Derives the correct request status based on paperwork checkboxes.
 *
 * Rules:
 *   - All three signed → Approved (unless already Rejected/Cancelled/Completed)
 *   - Not all signed + currently Approved → revert to Pending
 *   - Not all signed + any other status → keep the current status
 *
 * This is called both in the UI (for live feedback) and server-side
 * (in requestService) so the logic is enforced in both places.
 */
export function deriveStatusFromPaperwork(
  secretarySigned: boolean,
  auditorSigned: boolean,
  presidentApproved: boolean,
  currentStatus: RequestStatus
): RequestStatus {
  const allSigned = secretarySigned && auditorSigned && presidentApproved

  // Statuses the Auditor sets manually — never auto-override these
  const manualStatuses: RequestStatus[] = ['Rejected', 'Cancelled', 'Completed']

  if (allSigned && !manualStatuses.includes(currentStatus)) {
    return 'Approved'
  }

  if (!allSigned && currentStatus === 'Approved') {
    return 'Pending'
  }

  return currentStatus
}
