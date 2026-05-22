/**
 * Assets page — server component.
 *
 * Reads search, statusFilter, and page from URL search params.
 * Fetches only the current page of assets server-side.
 *
 * Free-plan optimization:
 *   - Supabase range() fetches only PAGE_SIZE rows per request.
 *   - Explicit column selection — no select('*').
 *   - Borrowing status derived from one lightweight request_assets query.
 *   - No realtime subscriptions or polling.
 */

import { getAssets } from '@/services/assetService'
import AssetsPageClient from '@/components/assets/AssetsPageClient'

export const metadata = { title: 'Assets — AudiTRACK' }

interface AssetsPageProps {
  searchParams?: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const params = await searchParams
  const search = params?.search ?? ''
  const status = params?.status ?? 'All'
  const page   = Math.max(1, parseInt(params?.page ?? '1', 10))

  const { data, count, pageSize } = await getAssets(search, status, page)

  return (
    <AssetsPageClient
      initialAssets={data}
      totalCount={count}
      pageSize={pageSize}
      currentPage={page}
      currentSearch={search}
      currentStatus={status}
    />
  )
}
