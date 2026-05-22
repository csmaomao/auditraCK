'use client'

/**
 * CalendarPageClient — manages month navigation, event selection, and modal state.
 *
 * Data is fetched server-side for the initial month and passed as props.
 * When the Auditor navigates to a different month, a new server fetch is
 * triggered via router.push() with month/year search params — no client-side
 * Supabase calls, no polling, no subscriptions.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReservationCalendar from './ReservationCalendar'
import CalendarSidePanel from './CalendarSidePanel'
import CalendarEventModal from './CalendarEventModal'
import type { CalendarEvent } from './CalendarSidePanel'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarPageClientProps {
  year: number
  month: number          // 1-based
  events: CalendarEvent[]
}

export default function CalendarPageClient({
  year,
  month,
  events,
}: CalendarPageClientProps) {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  function navigate(direction: 'prev' | 'next') {
    let newYear = year
    let newMonth = month

    if (direction === 'prev') {
      newMonth -= 1
      if (newMonth < 1) { newMonth = 12; newYear -= 1 }
    } else {
      newMonth += 1
      if (newMonth > 12) { newMonth = 1; newYear += 1 }
    }

    router.push(`/calendar?year=${newYear}&month=${newMonth}`)
  }

  return (
    <div className="space-y-4">

      {/* Page heading + month navigation */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-semibold">Calendar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Approved reservations</p>
        </div>

        {/* Navigation: [ < ] Month Year [ > ] */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('prev')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="px-2 sm:px-3 py-1.5 text-sm font-semibold text-white min-w-[110px] sm:min-w-[130px] text-center">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={() => navigate('next')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Two-column layout: calendar (~70%) + side panel (~30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* Monthly calendar grid */}
        <ReservationCalendar
          year={year}
          month={month}
          events={events}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={setSelectedEvent}
        />

        {/* Side panel */}
        <CalendarSidePanel
          events={events}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={setSelectedEvent}
          monthLabel={monthLabel}
        />

      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <CalendarEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

    </div>
  )
}
