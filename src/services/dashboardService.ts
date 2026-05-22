/**
 * dashboardService.ts
 *
 * Fetches lightweight summary data for the Dashboard page.
 *
 * Supports an optional month/year filter. When provided, counts are scoped
 * to requests submitted (date_submitted) in that month. When omitted, counts
 * are all-time.
 *
 * Free-plan optimizations:
 *   - All counts use `{ count: 'exact', head: true }` — zero row data transferred.
 *   - Recent requests fetch only 6 columns, capped at 10 rows.
 *   - Borrowing status derived from a single targeted request_assets query.
 *   - No realtime subscriptions or polling.
 */

import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  pendingCount: number
  approvedCount: number
  completedCount: number
  upcomingCount: number
  availableAssetsCount: number
  borrowedReservedCount: number
}

export interface RecentRequest {
  id: string
  event_name: string
  organization_name: string
  event_date: string
  date_submitted: string | null
  venue: string
  status: string
}

export interface DashboardData {
  stats: DashboardStats
  recentRequests: RecentRequest[]
}

export interface DashboardFilter {
  /** 1-based month (1 = January). Omit for all-time. */
  month?: number
  year?: number
}

/**
 * Returns all data needed to render the Dashboard page.
 * When filter is provided, counts are scoped to that month/year.
 * When filter is omitted, counts are all-time.
 */
export async function getDashboardData(filter?: DashboardFilter): Promise<DashboardData> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Build date range for the selected month (used for request counts)
  let startDate: string | null = null
  let endDate: string | null = null

  if (filter?.month && filter?.year) {
    const m = filter.month
    const y = filter.year
    startDate = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m, 0).getDate()
    endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`
  }

  // Build base count queries — apply date_submitted filter when a month is selected
  const pendingBase = supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending')
  const approvedBase = supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved')
  const completedBase = supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Completed')

  // Upcoming: Approved requests with event_date in the future (within selected month if filtered)
  let upcomingQuery = supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Approved')
    .gt('event_date', today)

  if (startDate && endDate) {
    upcomingQuery = upcomingQuery
      .gte('event_date', startDate)
      .lte('event_date', endDate)
  }

  // Recent requests — filtered by date_submitted if month is selected
  let recentQuery = supabase
    .from('requests')
    .select('id, event_name, organization_name, event_date, date_submitted, venue, status')
    .order('date_submitted', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (startDate && endDate) {
    recentQuery = recentQuery
      .gte('date_submitted', startDate)
      .lte('date_submitted', endDate)
  }

  const [
    pendingResult,
    approvedResult,
    completedResult,
    upcomingResult,
    totalAssetsResult,
    borrowedAssetIdsResult,
    recentResult,
  ] = await Promise.all([
    startDate ? pendingBase.gte('date_submitted', startDate).lte('date_submitted', endDate!) : pendingBase,
    startDate ? approvedBase.gte('date_submitted', startDate).lte('date_submitted', endDate!) : approvedBase,
    startDate ? completedBase.gte('date_submitted', startDate).lte('date_submitted', endDate!) : completedBase,
    upcomingQuery,

    // Total asset count — always all-time (inventory doesn't change by month)
    supabase.from('assets').select('*', { count: 'exact', head: true }),

    // Asset_ids linked to active Approved requests — always all-time for borrowing status
    supabase
      .from('request_assets')
      .select('asset_id, requests!inner(status)')
      .eq('requests.status', 'Approved')
      .not('asset_id', 'is', null),

    recentQuery,
  ])

  // Derive borrowed/reserved count
  const activeBorrowedIds = new Set(
    (borrowedAssetIdsResult.data ?? [])
      .map((row: { asset_id: string | null }) => row.asset_id)
      .filter(Boolean)
  )
  const borrowedReservedCount = activeBorrowedIds.size
  const totalAssets = totalAssetsResult.count ?? 0
  const availableAssetsCount = Math.max(0, totalAssets - borrowedReservedCount)

  return {
    stats: {
      pendingCount: pendingResult.count ?? 0,
      approvedCount: approvedResult.count ?? 0,
      completedCount: completedResult.count ?? 0,
      upcomingCount: upcomingResult.count ?? 0,
      availableAssetsCount,
      borrowedReservedCount,
    },
    recentRequests: (recentResult.data ?? []) as RecentRequest[],
  }
}
