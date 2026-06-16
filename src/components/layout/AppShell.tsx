'use client'

/**
 * AppShell — client component.
 *
 * Desktop: sidebar always visible on the left.
 * Mobile/tablet (<lg): sidebar hidden; hamburger button in top bar toggles a drawer.
 *
 * The main content area scrolls independently of the sidebar on all screen sizes.
 */

import { useState } from 'react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  userEmail?: string
  userFullName?: string
}

export default function AppShell({
  children,
  userEmail,
  userFullName,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Sidebar — desktop: flex column; mobile: drawer via Sidebar internals */}
      <div className="app-sidebar-wrapper hidden lg:flex flex-shrink-0 h-full overflow-y-auto print:hidden">
        <Sidebar userEmail={userEmail} userFullName={userFullName} />
      </div>

      {/* Mobile drawer — rendered by Sidebar when sidebarOpen=true */}
      <div className="lg:hidden print:hidden">
        <Sidebar
          userEmail={userEmail}
          userFullName={userFullName}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Right content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:w-full">

        {/* Mobile top bar — hamburger + branding */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-1 -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/ausg-logo.png"
            alt="AUSG Logo"
            className="w-7 h-7 rounded object-contain"
          />
          <span className="text-gray-900 dark:text-white text-sm font-bold">AudiTRACK</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          {children}
        </main>

      </div>

    </div>
  )
}
