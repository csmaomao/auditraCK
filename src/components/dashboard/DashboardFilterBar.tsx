'use client'

/**
 * DashboardFilterBar — month/year selector for the Dashboard.
 *
 * Navigates to /dashboard?month=N&year=Y on change.
 * "All time" navigates to /dashboard?allTime=1.
 * No Supabase calls here — navigation triggers a server-side re-fetch.
 */

import { useRouter } from 'next/navigation'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface DashboardFilterBarProps {
  currentMonth: number   // 1-based
  currentYear: number
  isAllTime: boolean
}

export default function DashboardFilterBar({
  currentMonth,
  currentYear,
  isAllTime,
}: DashboardFilterBarProps) {
  const router = useRouter()
  const now = new Date()
  const currentYearNow = now.getFullYear()
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYearNow - 3 + i)

  const isCurrentMonth = !isAllTime
    && currentMonth === now.getMonth() + 1
    && currentYear === now.getFullYear()

  function navigate(month: number, year: number) {
    router.push(`/dashboard?month=${month}&year=${year}`)
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(Number(e.target.value), currentYear)
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(currentMonth, Number(e.target.value))
  }

  function handleAllTime() {
    router.push('/dashboard?allTime=1')
  }

  function handleCurrentMonth() {
    navigate(now.getMonth() + 1, now.getFullYear())
  }

  const selectCls = `
    px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700
    text-white focus:outline-none focus:ring-2 focus:ring-blue-600
    disabled:opacity-50
  `

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-900 border border-gray-800 rounded-xl px-3 sm:px-4 py-3">

      {/* Month selector */}
      <select
        value={isAllTime ? '' : currentMonth}
        onChange={handleMonthChange}
        disabled={isAllTime}
        className={selectCls}
        aria-label="Select month"
      >
        {MONTH_NAMES.map((name, idx) => (
          <option key={name} value={idx + 1}>{name}</option>
        ))}
      </select>

      {/* Year selector */}
      <select
        value={isAllTime ? '' : currentYear}
        onChange={handleYearChange}
        disabled={isAllTime}
        className={selectCls}
        aria-label="Select year"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Current month shortcut */}
      {!isCurrentMonth && !isAllTime && (
        <button
          type="button"
          onClick={handleCurrentMonth}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:text-white bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 transition-colors"
        >
          This month
        </button>
      )}

      {/* Current month indicator */}
      {isCurrentMonth && (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
          Current month
        </span>
      )}

      {/* Divider */}
      <span className="text-gray-700 text-sm">|</span>

      {/* All-time toggle */}
      <button
        type="button"
        onClick={isAllTime ? handleCurrentMonth : handleAllTime}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isAllTime
            ? 'bg-gray-700 text-white border border-gray-600'
            : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700'
        }`}
      >
        {isAllTime ? '✓ All time' : 'All time'}
      </button>

    </div>
  )
}
