'use client'

/**
 * Sidebar — client component.
 *
 * Desktop: fixed left panel (w-64).
 * Mobile/tablet: drawer that slides in from the left, toggled by hamburger.
 *
 * Accepts `isOpen` and `onClose` props from AppShell for mobile drawer control.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Requests',
    href: '/requests',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Assets',
    href: '/assets',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

interface SidebarProps {
  userEmail?: string
  userFullName?: string
  /** Mobile drawer: whether the sidebar is open */
  isOpen?: boolean
  /** Mobile drawer: close callback */
  onClose?: () => void
}

export default function Sidebar({ userEmail, userFullName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <aside className="flex flex-col w-64 h-full bg-gray-900 border-r border-gray-800">

      {/* AUSG branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/ausg-logo.png"
          alt="AUSG Logo"
          className="w-9 h-9 rounded-lg object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-bold leading-tight truncate">AUSG</p>
          <p className="text-gray-500 text-xs leading-tight truncate">AudiTRACK</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-white transition-colors shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={isActive ? 'text-blue-400' : 'text-gray-500'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        {(userFullName || userEmail) && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {userFullName || 'Auditor'}
            </p>
            {userEmail && (
              <p className="text-gray-500 text-xs truncate">{userEmail}</p>
            )}
          </div>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
              text-gray-400 hover:text-white hover:bg-gray-800
              border border-transparent
              transition-colors duration-150
            "
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </form>
      </div>

    </aside>
  )

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-hidden="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 flex">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
