/**
 * requestService.ts
 *
 * All database operations for the Requests feature.
 * Called from server components and server actions only.
 *
 * Free-plan optimizations:
 *   - All SELECT queries specify explicit columns — no select('*').
 *   - getRequests() is paginated (default page size 50).
 *   - getRecentRequests() is hard-capped at 10 rows.
 *   - request_assets are fetched in a separate targeted query, not via a
 *     large join that would inflate row transfer size.
 *   - No realtime subscriptions or polling anywhere in this service.
 *   - Activity logging is fire-and-forget (errors are swallowed so they
 *     never block the main operation).
 */

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/services/auditLogService'
import { deriveStatusFromPaperwork } from '@/utils/statusHelpers'
import type { RequestStatus } from '@/types/database'
import type { RequestFormData } from '@/types/request'

// ---------------------------------------------------------------------------
// Types returned by this service
// ---------------------------------------------------------------------------

export interface RequestRow {
  id: string
  organization_name: string
  event_name: string
  purpose: string | null
  date_submitted: string | null
  event_date: string
  event_end_date: string | null
  start_time: string | null
  end_time: string | null
  venue: string
  contact_person: string | null
  adamson_email: string | null
  secretary_signed: boolean
  auditor_signed: boolean
  president_approved: boolean
  status: RequestStatus
  remarks: string | null
  created_at: string
  updated_at: string
}

export interface RequestAssetRow {
  id: string
  request_id: string
  asset_id: string | null
  asset_tag_number: string | null
  asset_description: string | null
  quantity_requested: number
  quantity_returned: number
  remarks: string | null
}

export interface RequestWithAssets extends RequestRow {
  request_assets: RequestAssetRow[]
}

export interface GetRequestsOptions {
  search?: string
  status?: RequestStatus | 'All'
  page?: number
  pageSize?: number
}

// ---------------------------------------------------------------------------
// AUTO-COMPLETE
// ---------------------------------------------------------------------------

/**
 * Auto-complete past approved requests.
 */
export async function autoCompletePassedRequests(): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('requests')
    .update({ status: 'Completed', updated_at: new Date().toISOString() })
    .eq('status', 'Approved')
    .lt('event_date', today)
    // Only complete when the end date has passed (or start date if no end date)
    .or(`event_end_date.is.null,event_end_date.lt.${today}`)

  if (error) {
    console.error('[requestService.autoCompletePassedRequests]', error.message)
  }
}

// ---------------------------------------------------------------------------
// AUTO-DELETE OLD REQUESTS
// ---------------------------------------------------------------------------

/**
 * Delete requests older than 2 months, EXCEPT Approved requests.
 *
 * Rule:
 *   - Deletes requests where date_submitted < first day of 2 months ago
 *   - Skips any request with status = 'Approved' (keep active bookings)
 *   - request_assets and documents are deleted automatically via ON DELETE CASCADE
 *
 * Called on the Requests page load — lightweight, fire-and-forget.
 * Free-plan: single DELETE with two filters, no row data transferred.
 */
export async function deleteOldRequests(): Promise<void> {
  const supabase = await createClient()

  // Calculate the cutoff: first day of the month 2 months ago
  const now = new Date()
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const cutoff = cutoffDate.toISOString().split('T')[0] // YYYY-MM-DD

  const { error } = await supabase
    .from('requests')
    .delete()
    .lt('date_submitted', cutoff)
    .neq('status', 'Approved') // never delete active Approved requests

  if (error) {
    console.error('[requestService.deleteOldRequests]', error.message)
  }
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of requests with optional search and status filter.
 * Returns requests only — assets are fetched separately when needed (e.g. edit form).
 *
 * Free-plan: explicit columns, paginated, no joins.
 */
export async function getRequests(options: GetRequestsOptions = {}): Promise<{
  data: RequestRow[]
  count: number
}> {
  const { search = '', status = 'All', page = 1, pageSize = 50 } = options
  const supabase = await createClient()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('requests')
    .select(
      'id, organization_name, event_name, purpose, date_submitted, event_date, event_end_date, start_time, end_time, venue, contact_person, adamson_email, secretary_signed, auditor_signed, president_approved, status, remarks, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'All') {
    query = query.eq('status', status)
  }

  if (search.trim()) {
    // Case-insensitive search across organization name and event name
    query = query.or(
      `organization_name.ilike.%${search.trim()}%,event_name.ilike.%${search.trim()}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[requestService.getRequests]', error.message)
    return { data: [], count: 0 }
  }

  return { data: (data ?? []) as RequestRow[], count: count ?? 0 }
}

/**
 * Fetch the N most recent requests for the Dashboard recent requests table.
 * Only fetches the 6 columns needed for that table.
 *
 * Free-plan: 6 columns, hard limit of 10 rows.
 */
export async function getRecentRequests(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requests')
    .select('id, event_name, organization_name, event_date, venue, status')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[requestService.getRecentRequests]', error.message)
    return []
  }

  return data ?? []
}

/**
 * Fetch a single request with its associated request_assets.
 * Used when opening the edit form.
 *
 * Free-plan: two targeted queries instead of one large join.
 */
export async function getRequestWithAssets(
  id: string
): Promise<RequestWithAssets | null> {
  const supabase = await createClient()

  const [requestResult, assetsResult] = await Promise.all([
    supabase
      .from('requests')
      .select(
        'id, organization_name, event_name, purpose, date_submitted, event_date, event_end_date, start_time, end_time, venue, contact_person, adamson_email, secretary_signed, auditor_signed, president_approved, status, remarks, created_at, updated_at'
      )
      .eq('id', id)
      .single(),

    supabase
      .from('request_assets')
      .select(
        'id, request_id, asset_id, asset_tag_number, asset_description, quantity_requested, quantity_returned, remarks'
      )
      .eq('request_id', id),
  ])

  if (requestResult.error || !requestResult.data) return null

  return {
    ...(requestResult.data as RequestRow),
    request_assets: (assetsResult.data ?? []) as RequestAssetRow[],
  }
}

/**
 * Fetch approved requests for a given month — used by Calendar and Reports.
 * Includes request_assets snapshot fields for asset display.
 *
 * Free-plan: scoped to a single month, only approved status, explicit columns.
 */
export async function getApprovedRequestsForMonth(year: number, month: number) {
  const supabase = await createClient()

  // Build date range for the month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const { data, error } = await supabase
    .from('requests')
    .select(
      `id, organization_name, event_name, event_date, start_time, end_time, venue, remarks,
       request_assets(id, asset_id, asset_tag_number, asset_description, quantity_requested)`
    )
    .eq('status', 'Approved')
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[requestService.getApprovedRequestsForMonth]', error.message)
    return []
  }

  return data ?? []
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

/**
 * Create a new request and its associated request_assets.
 *
 * IMPORTANT: For each asset, we save both asset_id AND snapshot fields
 * (asset_tag_number, asset_description). This ensures old request records
 * remain readable even after the assets table is replaced by an Excel import.
 */
export async function createRequest(
  data: RequestFormData,
  userId: string
): Promise<{ id: string } | null> {
  const supabase = await createClient()

  // Step 1: Insert the request row.
  // Derive the correct status from paperwork checkboxes server-side.
  // This ensures the rule is enforced even if the client sends wrong data.
  const derivedStatus = deriveStatusFromPaperwork(
    data.secretary_signed ?? false,
    data.auditor_signed ?? false,
    data.president_approved ?? false,
    'Pending' // new requests always start from Pending baseline
  )

  const { data: inserted, error: insertError } = await supabase
    .from('requests')
    .insert({
      organization_name: data.organization_name,
      event_name: data.event_name,
      purpose: data.purpose || null,
      date_submitted: data.date_submitted || null,
      event_date: data.event_date,
      event_end_date: data.event_end_date || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      venue: data.venue,
      contact_person: data.contact_person || null,
      adamson_email: data.adamson_email || null,
      secretary_signed: data.secretary_signed ?? false,
      auditor_signed: data.auditor_signed ?? false,
      president_approved: data.president_approved ?? false,
      status: derivedStatus,
      remarks: data.remarks || null,
      created_by: userId,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('[requestService.createRequest] Insert failed:', insertError?.message, insertError?.details, insertError?.hint)
    return null
  }

  // Step 2: Insert request_assets with snapshot fields
  if (data.assets.length > 0) {
    const assetRows = data.assets.map((a) => ({
      request_id: inserted.id,
      asset_id: a.asset_id,
      asset_tag_number: a.asset_tag_number ?? null,
      asset_description: a.asset_description ?? null,
      quantity_requested: a.quantity_requested,
      remarks: a.remarks ?? null,
    }))

    const { error: assetsError } = await supabase
      .from('request_assets')
      .insert(assetRows)

    if (assetsError) {
      console.error('[requestService.createRequest assets]', assetsError.message)
    }
  }

  // Step 3: Log internally (fire-and-forget)
  logActivity(userId, 'Request created', 'request', inserted.id, data.event_name)

  return { id: inserted.id }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

/**
 * Update an existing request and replace its request_assets.
 *
 * Assets are replaced (delete + re-insert) to keep the logic simple.
 * Snapshot fields are always written on every save.
 */
export async function updateRequest(
  id: string,
  data: RequestFormData,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Step 1: Update the request row.
  // Derive the correct status from paperwork checkboxes server-side.
  const derivedStatus = deriveStatusFromPaperwork(
    data.secretary_signed ?? false,
    data.auditor_signed ?? false,
    data.president_approved ?? false,
    data.status // pass the Auditor's chosen status as the baseline
  )

  const { error: updateError } = await supabase
    .from('requests')
    .update({
      organization_name: data.organization_name,
      event_name: data.event_name,
      purpose: data.purpose || null,
      date_submitted: data.date_submitted || null,
      event_date: data.event_date,
      event_end_date: data.event_end_date || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      venue: data.venue,
      contact_person: data.contact_person || null,
      adamson_email: data.adamson_email || null,
      secretary_signed: data.secretary_signed ?? false,
      auditor_signed: data.auditor_signed ?? false,
      president_approved: data.president_approved ?? false,
      status: derivedStatus,
      remarks: data.remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    console.error('[requestService.updateRequest] Update failed:', updateError.message, updateError.details, updateError.hint)
    return false
  }

  // Step 2: Replace request_assets — delete existing, insert new
  await supabase.from('request_assets').delete().eq('request_id', id)

  if (data.assets.length > 0) {
    const assetRows = data.assets.map((a) => ({
      request_id: id,
      asset_id: a.asset_id,
      asset_tag_number: a.asset_tag_number ?? null,
      asset_description: a.asset_description ?? null,
      quantity_requested: a.quantity_requested,
      remarks: a.remarks ?? null,
    }))

    const { error: assetsError } = await supabase
      .from('request_assets')
      .insert(assetRows)

    if (assetsError) {
      console.error('[requestService.updateRequest assets]', assetsError.message)
    }
  }

  // Step 3: Log internally (fire-and-forget)
  logActivity(userId, 'Request updated', 'request', id, data.event_name)

  return true
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/**
 * Delete a request. request_assets and documents are deleted automatically
 * by the ON DELETE CASCADE constraints in the database schema.
 */
export async function deleteRequest(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('requests').delete().eq('id', id)

  if (error) {
    console.error('[requestService.deleteRequest]', error.message)
    return false
  }

  logActivity(userId, 'Request deleted', 'request', id)

  return true
}
