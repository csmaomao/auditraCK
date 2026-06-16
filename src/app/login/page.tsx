/**
 * Login page — server component.
 *
 * Renders the centered login card on a dark background.
 * The actual form logic lives in LoginForm (client component)
 * so we can use browser APIs (supabase browser client, router).
 */

import LoginForm from './LoginForm'

export const metadata = {
  title: 'Sign In — AudiTRACK',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* AUSG branding */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/ausg-logo.png"
            alt="AUSG Logo"
            className="inline-block w-16 h-16 rounded-full object-contain mb-4"
          />
          <h1 className="text-gray-900 dark:text-white text-xl font-bold tracking-wide">AUSG</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Asset Reservation Tracker</p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-xl">
          <h2 className="text-gray-900 dark:text-white text-lg font-semibold mb-6">Sign in to AudiTRACK</h2>
          <LoginForm />
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Adamson University Student Government — Auditor Portal
        </p>
      </div>
    </main>
  )
}
