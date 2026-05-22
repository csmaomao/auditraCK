/**
 * Requests page — server component.
 *
 * Fetches the initial request list server-side and passes it to the
 * client component for interactive filtering, modal management, and CRUD.
 *
 * Free-plan optimization:
 *   - Fetches only needed columns (no select('*')).
 *   - Paginated at 50 rows per page.
 *   - Search and status filter applied server-side when provided via URL params.
 *   - No realtime subscriptions.
 */

import { getRequests, autoCompletePassedRequests, deleteOldRequests } from '@/services/requestService'
import RequestsPageClient from '@/components/requests/RequestsPageClient'

export const metadata = { title: 'Requests — AudiTRACK' }

interface RequestsPageProps {
  searchParams?: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  // Run maintenance tasks before fetching: auto-complete past events,
  // then delete requests older than 2 months (except Approved).
  await autoCompletePassedRequests()
  await deleteOldRequests()

  const params = await searchParams
  const search = params?.search ?? ''
  const status = params?.status ?? 'All'
  const page = parseInt(params?.page ?? '1', 10)

  const { data, count } = await getRequests({ search, status: status as 'All', page })

  return (
    <RequestsPageClient
      initialRequests={data}
      initialCount={count}
    />
  )
}
