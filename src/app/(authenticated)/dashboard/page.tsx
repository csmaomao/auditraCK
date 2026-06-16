/**
 * Dashboard page — server component.
 *
 * Always shows stats for the current month only.
 * No month/year selector — the dashboard is a live snapshot of this month.
 *
 * Free-plan optimization:
 *   - All counts use head:true queries (zero row data transferred).
 *   - Recent requests fetch only 7 columns, capped at 10 rows.
 *   - Everything runs in parallel inside getDashboardData().
 */

import { getDashboardData } from '@/services/dashboardService'
import { autoCompletePassedRequests } from '@/services/requestService'
import SummaryCard from '@/components/dashboard/SummaryCard'
import RecentRequestsTable from '@/components/dashboard/RecentRequestsTable'

export const metadata = { title: 'Dashboard — AudiTRACK' }

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconBox() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
function IconBoxOff() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l7-4 7 4M5 8v8l7 4 7-4V8M5 8l7 4 7-4" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function IconFlag() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}

export default async function DashboardPage() {
  await autoCompletePassedRequests()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`

  // Always current month — no URL params needed
  const { stats, recentRequests } = await getDashboardData({ month, year })

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Stats for <span className="text-gray-700 dark:text-gray-300 font-medium">{periodLabel}</span>
        </p>
      </div>

      {/* Summary cards */}
      <section aria-label="Summary statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <SummaryCard title="Pending Requests"      value={stats.pendingCount}          icon={<IconClock />}    color="yellow" />
          <SummaryCard title="Approved Requests"     value={stats.approvedCount}         icon={<IconCheck />}    color="green"  />
          <SummaryCard title="Available Assets"      value={stats.availableAssetsCount}  icon={<IconBox />}      color="purple" />
          <SummaryCard title="Borrowed / Reserved"   value={stats.borrowedReservedCount} icon={<IconBoxOff />}   color="red"    />
          <SummaryCard title="Upcoming Reservations" value={stats.upcomingCount}         icon={<IconCalendar />} color="blue"   />
          <SummaryCard title="Completed Requests"    value={stats.completedCount}        icon={<IconFlag />}     color="gray"   />
        </div>
      </section>

      {/* Recent requests table */}
      <section aria-label="Recent requests">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-900 dark:text-white text-sm font-semibold">Recent Requests</h2>
              <p className="text-gray-500 text-xs mt-0.5">{periodLabel}</p>
            </div>
            <a href="/requests" className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
              View all →
            </a>
          </div>
          <RecentRequestsTable requests={recentRequests} />
        </div>
      </section>

    </div>
  )
}
