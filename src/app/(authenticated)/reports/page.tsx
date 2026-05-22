/**
 * Reports page — server component.
 *
 * Strictly monthly: user selects one month and year.
 * Fetches Approved requests submitted in that month.
 * Defaults to current month on first load.
 *
 * Free-plan: explicit columns, no select('*'), no polling.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getApprovedRequestsInRange } from '@/services/reportService'
import ReportsPageClient from '@/components/reports/ReportsPageClient'

export const metadata = { title: 'Reports — AudiTRACK' }

interface ReportsPageProps {
  searchParams?: Promise<{ month?: string; year?: string }>
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()

  const month = Math.max(1, Math.min(12, parseInt(params?.month ?? String(now.getMonth() + 1), 10)))
  const year  = Math.max(2020, Math.min(2099, parseInt(params?.year  ?? String(now.getFullYear()), 10)))

  // Only fetch when the user explicitly generates (month/year in URL)
  const generated = !!(params?.month && params?.year)

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay   = new Date(year, month, 0).getDate()
  const endDate   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const rows = generated
    ? await getApprovedRequestsInRange(startDate, endDate, user.id)
    : []

  return (
    <ReportsPageClient
      rows={rows}
      generated={generated}
      periodLabel={periodLabel}
      defaultMonth={month}
      defaultYear={year}
    />
  )
}
