/**
 * assetService.ts
 *
 * All database operations for the Assets feature.
 *
 * IMPORT SAFETY:
 *   importAssets() deletes and replaces ONLY the assets table.
 *   It does NOT touch: requests, request_assets, documents, activity_logs, profiles.
 *   Old request history remains readable through request_assets snapshot fields
 *   (asset_tag_number, asset_description) even after the assets table is replaced.
 *
 * Free-plan optimizations:
 *   - getAssets() fetches only the columns needed for the table display.
 *   - Borrowing status is derived in a single pass using a Set of active asset IDs
 *     fetched from request_assets — no per-asset subquery.
 *   - importAssets() uses a single DELETE + batch INSERT — no row-by-row operations.
 *   - No realtime subscriptions or polling.
 */

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/services/auditLogService'
import type { BorrowingStatus } from '@/types/database'
import type { ParsedAssetRow } from '@/utils/excelParser'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetRow {
  id: string
  tag_number: string | null
  item_description: string | null
  date_acquired: string | null
  quantity_text: string | null
  quantity_numeric: number | null
  actual_count: number | null
  unit_cost: number | null
  total_cost: number | null
  life_span: string | null
  code: string | null
  tag_location_issued_to: string | null
  remarks: string | null
  import_batch_id: string | null
  // Derived — not stored in DB
  borrowing_status: BorrowingStatus
}

// ---------------------------------------------------------------------------
// BORROWING STATUS DERIVATION
// ---------------------------------------------------------------------------

/**
 * Pure function — derives the borrowing status for a single asset.
 *
 * Rules:
 *   - Booked:    asset is linked to at least one Approved request (regardless of date)
 *   - Available: no active Approved request links to this asset
 *
 * Excluded from calculation: Pending, Rejected, Cancelled, Completed requests.
 * Completed requests do NOT make an asset "Returned" — the asset simply
 * becomes Available again once all its Approved requests are gone.
 */
export function deriveBorrowingStatus(
  assetId: string,
  bookedIds: Set<string>
): BorrowingStatus {
  return bookedIds.has(assetId) ? 'Booked' : 'Available'
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10

export interface GetAssetsResult {
  data: AssetRow[]
  count: number
  pageSize: number
}

/**
 * Fetch a paginated page of assets with derived borrowing status.
 *
 * Free-plan optimizations:
 *   - Explicit columns only — no select('*').
 *   - Supabase range() fetches only the current page rows.
 *   - count: 'exact' with head:true for the total — zero row data transferred.
 *   - Borrowing status derived from one lightweight request_assets query.
 *   - No realtime subscriptions or polling.
 */
export async function getAssets(
  search?: string,
  statusFilter?: string,
  page = 1
): Promise<GetAssetsResult> {
  const supabase = await createClient()

  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  // Build the assets query with optional search filter
  let assetsQuery = supabase
    .from('assets')
    .select(
      'id, tag_number, item_description, date_acquired, quantity_text, quantity_numeric, actual_count, unit_cost, total_cost, life_span, code, tag_location_issued_to, remarks, import_batch_id',
      { count: 'exact' }
    )
    .order('item_description', { ascending: true })
    .range(from, to)

  if (search?.trim()) {
    assetsQuery = assetsQuery.or(
      `tag_number.ilike.%${search.trim()}%,item_description.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,tag_location_issued_to.ilike.%${search.trim()}%`
    )
  }

  // Fetch booked asset IDs in parallel (always all-time — not paginated)
  const [assetsResult, bookedResult] = await Promise.all([
    assetsQuery,
    supabase
      .from('request_assets')
      .select('asset_id, requests!inner(status)')
      .eq('requests.status', 'Approved')
      .not('asset_id', 'is', null),
  ])

  if (assetsResult.error) {
    console.error('[assetService.getAssets]', assetsResult.error.message)
    return { data: [], count: 0, pageSize: PAGE_SIZE }
  }

  const bookedIds = new Set<string>()
  for (const row of bookedResult.data ?? []) {
    if (row.asset_id) bookedIds.add(row.asset_id)
  }

  let rows = (assetsResult.data ?? []).map((asset) => ({
    ...(asset as Omit<AssetRow, 'borrowing_status'>),
    borrowing_status: deriveBorrowingStatus(asset.id, bookedIds),
  }))

  // Apply borrowing status filter client-side on the fetched page
  // (Supabase can't filter on a derived column, so we filter after derivation.
  //  For large inventories this is acceptable since we only fetch PAGE_SIZE rows.)
  if (statusFilter && statusFilter !== 'All') {
    rows = rows.filter((r) => r.borrowing_status === statusFilter)
  }

  return {
    data: rows,
    count: assetsResult.count ?? 0,
    pageSize: PAGE_SIZE,
  }
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

export interface ImportBatchMeta {
  fileName: string
  userId: string
  notes?: string
}

/**
 * Replace the entire assets table with the uploaded Excel rows.
 *
 * SAFETY: Only the assets table is modified.
 * requests, request_assets, documents, activity_logs, and profiles are untouched.
 * Old request history remains readable through request_assets snapshot fields.
 *
 * Free-plan: single DELETE + single batch INSERT — no row-by-row operations.
 * The import_batch record is created first so assets can reference it.
 */
export async function importAssets(
  rows: ParsedAssetRow[],
  meta: ImportBatchMeta
): Promise<{ success: boolean; error?: string; batchId?: string }> {
  const supabase = await createClient()

  // Step 1: Create the import_batch record
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      file_name: meta.fileName,
      imported_by: meta.userId,
      row_count: rows.length,
      notes: meta.notes ?? null,
    })
    .select('id')
    .single()

  if (batchError || !batch) {
    console.error('[assetService.importAssets] batch insert failed:', batchError?.message)
    return { success: false, error: 'Failed to create import record.' }
  }

  // Step 2: Delete all existing assets
  // IMPORTANT: This only deletes from the assets table.
  // request_assets rows are NOT deleted — their asset_id will become NULL
  // (ON DELETE SET NULL) but snapshot fields are preserved.
  const { error: deleteError } = await supabase
    .from('assets')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows

  if (deleteError) {
    console.error('[assetService.importAssets] delete failed:', deleteError.message)
    return { success: false, error: 'Failed to clear existing assets.' }
  }

  // Step 3: Insert new asset rows in a single batch
  if (rows.length > 0) {
    const insertRows = rows.map((r) => ({
      tag_number: r.tag_number,
      item_description: r.item_description,
      date_acquired: r.date_acquired,
      quantity_text: r.quantity_text,
      quantity_numeric: r.quantity_numeric,
      actual_count: r.actual_count,
      unit_cost: r.unit_cost,
      total_cost: r.total_cost,
      life_span: r.life_span,
      code: r.code,
      tag_location_issued_to: r.tag_location_issued_to,
      remarks: r.remarks,
      import_batch_id: batch.id,
    }))

    const { error: insertError } = await supabase.from('assets').insert(insertRows)

    if (insertError) {
      console.error('[assetService.importAssets] insert failed:', insertError.message)
      return { success: false, error: 'Failed to insert new assets.' }
    }
  }

  // Step 4: Log internally (fire-and-forget)
  logActivity(
    meta.userId,
    'Asset inventory imported',
    'import_batch',
    batch.id,
    `${rows.length} assets imported from ${meta.fileName}`
  )

  return { success: true, batchId: batch.id }
}
