import { formatTime } from '@/utils/formatDate'
import type { CalendarEvent } from './CalendarSidePanel'

interface ReservationCalendarProps {
  year: number
  month: number
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (event: CalendarEvent) => void
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function ReservationCalendar({ year, month, events, selectedEventId, onSelectEvent }: ReservationCalendarProps) {
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const existing = eventsByDate.get(event.event_date) ?? []
    eventsByDate.set(event.event_date, [...existing, event])
  }

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNumber = idx - firstDayOfMonth + 1
          const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth

          if (!isCurrentMonth) {
            return <div key={idx} className="min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/30" />
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
          const dayEvents = eventsByDate.get(dateStr) ?? []
          const isToday = dateStr === today

          return (
            <div key={idx} className="min-h-[56px] sm:min-h-[80px] border-b border-r border-gray-100 dark:border-gray-800/50 p-1 sm:p-1.5">
              <div className="flex justify-end mb-0.5 sm:mb-1">
                <span className={`text-xs font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {dayNumber}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => {
                  const isSelected = event.id === selectedEventId
                  return (
                    <button key={event.id} type="button" onClick={() => onSelectEvent(event)} title={`${event.event_name} — ${event.organization_name}`}
                      className={`w-full text-left px-1 sm:px-1.5 py-0.5 rounded text-xs truncate transition-colors duration-100 ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-600/20 text-blue-600 dark:text-blue-300 hover:bg-blue-600/40'}`}>
                      <span className="hidden sm:inline">
                        {event.start_time && <span className="opacity-70 mr-1">{formatTime(event.start_time)}</span>}
                        {event.event_name}
                      </span>
                      <span className="sm:hidden">•</span>
                    </button>
                  )
                })}
                {dayEvents.length > 2 && <p className="text-gray-500 text-xs px-1">+{dayEvents.length - 2}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
