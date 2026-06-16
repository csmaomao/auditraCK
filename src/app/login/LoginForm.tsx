'use client'

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
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      fetch('/api/auth/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, action: 'User logged in' }),
      }).catch(() => {})
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputCls = `
    w-full px-3 py-2.5 rounded-lg text-sm
    bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
    disabled:opacity-50
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email address
        </label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="auditor@adamson.edu.ph" className={inputCls} disabled={loading} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Password
        </label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" className={inputCls} disabled={loading} />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={loading} className="
        w-full py-2.5 px-4 rounded-lg text-sm font-semibold
        bg-blue-600 hover:bg-blue-700 text-white
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
        disabled:opacity-60 disabled:cursor-not-allowed
      ">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

    </form>
  )
}
