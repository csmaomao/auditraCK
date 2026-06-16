import { formatDateShort, formatTime } from '@/utils/formatDate'

export interface CalendarEvent {
  id: string
  organization_name: string
  event_name: string
  event_date: string
  event_end_date: string | null
  start_time: string | null
  end_time: string | null
  venue: string
  remarks: string | null
  request_assets: {
    id: string
    asset_id: string | null
    asset_tag_number: string | null
    asset_description: string | null
    quantity_requested: number
  }[]
}

interface CalendarSidePanelProps {
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (event: CalendarEvent) => void
  monthLabel: string
}

export default function CalendarSidePanel({ events, selectedEventId, onSelectEvent, monthLabel }: CalendarSidePanelProps) {
  return (
    <aside className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-gray-900 dark:text-white text-sm font-semibold">Approved Requests This Month</h2>
        <p className="text-gray-500 text-xs mt-0.5">{monthLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">No approved requests this month.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200/80 dark:divide-gray-800/60">
            {events.map((event) => {
              const isSelected = event.id === selectedEventId
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={`
                      w-full text-left px-4 py-3 transition-colors duration-100
                      ${isSelected
                        ? 'bg-blue-600/15 border-l-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent'
                      }
                    `}
                  >
                    <p className="text-blue-600 dark:text-blue-400 text-xs font-medium mb-0.5">
                      {formatDateShort(event.event_date)}
                      {event.start_time && (
                        <span className="text-gray-500 ml-2">
                          {formatTime(event.start_time)}{event.end_time && ` – ${formatTime(event.end_time)}`}
                        </span>
                      )}
                    </p>
                    <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{event.event_name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">{event.organization_name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs truncate">{event.venue}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {events.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
          <p className="text-gray-400 text-xs">{events.length} approved request{events.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </aside>
  )
}
