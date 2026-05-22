/**
 * Date and time formatting utilities.
 * All functions accept ISO strings from the database and return
 * human-readable strings for display in the UI.
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) to a readable date.
 * Example: "2025-06-15" → "June 15, 2025"
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    // Parse as UTC to avoid timezone-shift issues with date-only strings
    const [year, month, day] = date.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/**
 * Formats an ISO date string to a short date.
 * Example: "2025-06-15" → "Jun 15, 2025"
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const [year, month, day] = date.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

/**
 * Formats a time string (HH:MM or HH:MM:SS) to 12-hour format.
 * Example: "14:30" → "2:30 PM"
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '—'
  try {
    const [hourStr, minuteStr] = time.split(':')
    const hour = parseInt(hourStr, 10)
    const minute = minuteStr || '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minute} ${period}`
  } catch {
    return time
  }
}

/**
 * Formats a time range from start and end time strings.
 * Example: "09:00", "17:00" → "9:00 AM – 5:00 PM"
 */
export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string {
  if (!startTime && !endTime) return '—'
  if (!endTime) return formatTime(startTime)
  if (!startTime) return formatTime(endTime)
  return `${formatTime(startTime)} – ${formatTime(endTime)}`
}
