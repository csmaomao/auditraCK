/**
 * SummaryCard — displays a single metric on the Dashboard.
 *
 * Used for: Pending Requests, Approved Requests, Available Assets,
 * Borrowed/Reserved Assets, Upcoming Reservations, Completed Requests.
 */

type CardColor = 'purple' | 'green' | 'yellow' | 'red' | 'blue' | 'gray'

interface SummaryCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color?: CardColor
}

const colorMap: Record<CardColor, { bg: string; icon: string; value: string }> = {
  purple: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-400',
    value: 'text-blue-300',
  },
  green: {
    bg: 'bg-green-500/10 border-green-500/20',
    icon: 'text-green-400',
    value: 'text-green-300',
  },
  yellow: {
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: 'text-yellow-400',
    value: 'text-yellow-300',
  },
  red: {
    bg: 'bg-red-500/10 border-red-500/20',
    icon: 'text-red-400',
    value: 'text-red-300',
  },
  blue: {
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-400',
    value: 'text-blue-300',
  },
  gray: {
    bg: 'bg-gray-500/10 border-gray-500/20',
    icon: 'text-gray-400',
    value: 'text-gray-300',
  },
}

export default function SummaryCard({
  title,
  value,
  icon,
  color = 'purple',
}: SummaryCardProps) {
  const c = colorMap[color]

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${c.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 ${c.value}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`shrink-0 mt-0.5 ${c.icon}`} aria-hidden="true">
          {icon}
        </div>
      </div>
    </div>
  )
}
