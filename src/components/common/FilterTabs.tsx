'use client'

/**
 * FilterTabs — tab-style filter buttons.
 *
 * Renders a row of pill/tab buttons. The active tab is highlighted in purple.
 * Typically used for status filters (All / Pending / Approved / …).
 *
 * Usage:
 *   <FilterTabs
 *     options={['All', 'Pending', 'Approved', 'Rejected']}
 *     active="All"
 *     onChange={(value) => setStatusFilter(value)}
 *   />
 */

interface FilterTabsProps {
  options: string[]
  active: string
  onChange: (value: string) => void
}

export default function FilterTabs({ options, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap" role="tablist">
      {options.map((option) => {
        const isActive = option === active
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isActive
                ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-600/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
              }
            `}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
