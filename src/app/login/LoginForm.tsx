'use client'

/**
 * LoginForm — client component.
 *
 * Handles email/password sign-in via Supabase Auth.
 * On success: redirects to /dashboard and logs "User logged in" internally.
 * On error: displays the error message inline without a page reload.
 *
 * Free-plan optimization:
 *   - Uses the browser Supabase client (no server round-trip for auth).
 *   - Activity log is written server-side via a POST to /api/auth/log
 *     after successful login, so it doesn't block the redirect.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Log the login action internally (fire-and-forget via API route)
    // We use fetch so the log write doesn't block the redirect
    if (data.user) {
      fetch('/api/auth/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          action: 'User logged in',
        }),
      }).catch(() => {
        // Ignore logging errors — they should never block the user
      })
    }

    // Redirect to dashboard on success
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="auditor@adamson.edu.ph"
          className="
            w-full px-3 py-2.5 rounded-lg text-sm
            bg-gray-800 border border-gray-700
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
            disabled:opacity-50
          "
          disabled={loading}
        />
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="
            w-full px-3 py-2.5 rounded-lg text-sm
            bg-gray-800 border border-gray-700
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
            disabled:opacity-50
          "
          disabled={loading}
        />
      </div>

      {/* Inline error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full py-2.5 px-4 rounded-lg text-sm font-semibold
          bg-blue-600 hover:bg-blue-700
          text-white
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

    </form>
  )
}
