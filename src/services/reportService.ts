/**
 * reportService.ts
 *
 * Fetches data for the Monthly / Range Approved Borrowing Report.
 *
 * Report basis: date_submitted (not event_date).
 * A request appears in the report if it was SUBMITTED within the selected period.
 *
 * Free-plan optimizations:
 *   - Explicit column selection — no select('*').
 *   - Asset data from request_assets snapshot fields — no live assets table query.
 *   - No realtime subscriptions or polling.
 */

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/services/auditLogService'

export interface ReportAsset {
  id: string
  asset_tag_number: string | null
  asset_description: string | null
  quantity_requested: number
}

export interface ReportRow {
  id: string
  date_submitted: string | null
  event_date: string
  event_end_date: string | null
  start_time: string | null
  end_time: string | null
  organization_name: string
  event_name: string
  venue: string
  remarks: string | null
  assets: ReportAsset[]
}

// ---------------------------------------------------------------------------
// Single-month report (legacy — used by the server component default load)
// ---------------------------------------------------------------------------

export async function getApprovedBorrowingReport(
  month: number,
  year: number,
  userId: string
): Promise<ReportRow[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return getApprovedRequestsInRange(startDate, endDate, userId)
}

// ---------------------------------------------------------------------------
// Range report — the primary query used by both single-month and range export
// ---------------------------------------------------------------------------

/**
 * Fetch Approved requests where date_submitted is between startDate and endDate
 * (inclusive). Sorted by date_submitted ASC → event_date ASC → event_name ASC.
 *
 * Free-plan: explicit columns, snapshot fields only, no live assets join.
 */
export async function getApprovedRequestsInRange(
  startDate: string,   // YYYY-MM-DD
  endDate: string,     // YYYY-MM-DD
  userId: string
): Promise<ReportRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requests')
    .select(
      `id, organization_name, event_name, date_submitted, event_date, event_end_date,
       start_time, end_time, venue, remarks,
       request_assets(id, asset_tag_number, asset_description, quantity_requested)`
    )
    .eq('status', 'Approved')
    .gte('date_submitted', startDate)
    .lte('date_submitted', endDate)
    .order('date_submitted', { ascending: true })
    .order('event_date',    { ascending: true })
    .order('event_name',    { ascending: true })

  if (error) {
    console.error('[reportService.getApprovedRequestsInRange]', error.message)
    return []
  }

  // Log internally (fire-and-forget)
  logActivity(
    userId,
    'Monthly report generated',
    'report',
    undefined,
    `Approved borrowing report ${startDate} – ${endDate}`
  )

  return (data ?? []).map((row) => ({
    id: row.id,
    date_submitted: row.date_submitted,
    event_date: row.event_date,
    event_end_date: (row as { event_end_date?: string | null }).event_end_date ?? null,
    start_time: row.start_time,
    end_time: row.end_time,
    organization_name: row.organization_name,
    event_name: row.event_name,
    venue: row.venue,
    remarks: row.remarks,
    assets: (row.request_assets ?? []) as ReportAsset[],
  }))
}

// ---------------------------------------------------------------------------
// Last-2-months helper (used by the Reports page)
// ---------------------------------------------------------------------------

/**
 * Returns the date range covering the last 2 complete months up to today.
 * e.g. if today is June 15 2026, returns { startDate: '2026-04-01', endDate: '2026-06-30' }
 */
export function getLast2MonthsRange(): { startDate: string; endDate: string; label: string } {
  const now = new Date()
  // Start: first day of 2 months ago
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  // End: last day of current month
  const endMonth = now.getMonth() + 1
  const endYear = now.getFullYear()
  const lastDay = new Date(endYear, endMonth, 0).getDate()

  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${lastDay}`

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const label = `${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${MONTHS[now.getMonth()]} ${endYear}`

  return { startDate, endDate, label }
}
