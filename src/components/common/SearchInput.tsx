'use client'

/**
 * SearchInput — debounced text input for filtering tables.
 *
 * Calls onChange after the user stops typing (300ms debounce by default).
 * This avoids triggering a new query on every keystroke.
 *
 * Usage:
 *   <SearchInput
 *     placeholder="Search by organization or event name…"
 *     onChange={(value) => setSearch(value)}
 *   />
 */

import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  placeholder?: string
  defaultValue?: string
  /** Called with the debounced search value */
  onChange: (value: string) => void
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
}

export default function SearchInput({
  placeholder = 'Search…',
  defaultValue = '',
  onChange,
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any pending timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Schedule the onChange call after the debounce delay
    timerRef.current = setTimeout(() => {
      onChange(value)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, debounceMs, onChange])

  return (
    <div className="relative">
      {/* Search icon */}
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-3 py-2 rounded-lg text-sm
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
        "
      />
    </div>
  )
}
