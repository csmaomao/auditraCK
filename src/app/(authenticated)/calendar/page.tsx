/**
 * Calendar page — server component.
 *
 * Reads year/month from URL search params (defaults to current month).
 * Fetches only Approved requests for the selected month — no full history.
 *
 * Free-plan optimizations:
 *   - Fetches only the selected month's Approved requests.
 *   - Explicit column selection — no select('*').
 *   - request_assets fetched via join (snapshot fields only).
 *   - No realtime subscriptions or polling.
 *   - Month navigation triggers a new server fetch via router.push(),
 *     not a client-side Supabase call.
 */

import { getApprovedRequestsForMonth } from '@/services/requestService'
import CalendarPageClient from '@/components/calendar/CalendarPageClient'
import type { CalendarEvent } from '@/components/calendar/CalendarSidePanel'

export const metadata = { title: 'Calendar — AudiTRACK' }

interface CalendarPageProps {
  searchParams?: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const now = new Date()

  const year = parseInt(params?.year ?? String(now.getFullYear()), 10)
  const month = parseInt(params?.month ?? String(now.getMonth() + 1), 10)

  // Clamp to valid range
  const safeYear = isNaN(year) ? now.getFullYear() : Math.max(2020, Math.min(2099, year))
  const safeMonth = isNaN(month) ? now.getMonth() + 1 : Math.max(1, Math.min(12, month))

  const rawEvents = await getApprovedRequestsForMonth(safeYear, safeMonth)

  // Shape the data to match CalendarEvent — getApprovedRequestsForMonth already
  // fetches the right columns including request_assets snapshot fields
  const events: CalendarEvent[] = (rawEvents as CalendarEvent[])

  return (
    <CalendarPageClient
      year={safeYear}
      month={safeMonth}
      events={events}
    />
  )
}
