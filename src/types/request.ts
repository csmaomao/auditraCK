import type { RequestStatus } from './database'

/**
 * A logged borrower's form request.
 * Maps to the `requests` table.
 */
export interface Request {
  id: string
  organization_name: string
  event_name: string
  purpose?: string
  date_submitted?: string       // ISO date string (YYYY-MM-DD)
  event_date: string            // ISO date string — start date of the borrowing period
  event_end_date?: string       // ISO date string — end date (null = single-day)
  start_time?: string           // HH:MM format
  end_time?: string             // HH:MM format
  venue: string
  contact_person?: string
  adamson_email?: string
  secretary_signed: boolean
  auditor_signed: boolean
  president_approved: boolean
  status: RequestStatus
  remarks?: string
  created_by?: string           // UUID of the profile who created this
  created_at: string
  updated_at: string
}

/**
 * An asset linked to a request.
 * Maps to the `request_assets` table.
 *
 * IMPORTANT: asset_id is nullable because the assets table can be replaced
 * by an Excel import. The snapshot fields (asset_tag_number, asset_description)
 * preserve the original asset info even after the assets table is replaced.
 */
export interface RequestAsset {
  id: string
  request_id: string
  asset_id: string | null         // nullable — set to NULL when asset is deleted/replaced
  asset_tag_number?: string       // snapshot: tag number at time of selection
  asset_description?: string      // snapshot: description at time of selection
  quantity_requested: number
  quantity_returned: number
  remarks?: string
  created_at: string
}

/** Data shape used when creating or updating a request */
export interface RequestFormData {
  organization_name: string
  event_name: string
  purpose?: string
  date_submitted?: string
  event_date: string
  event_end_date?: string       // optional — null/empty = single-day event
  start_time?: string
  end_time?: string
  venue: string
  contact_person?: string
  adamson_email?: string
  secretary_signed: boolean
  auditor_signed: boolean
  president_approved: boolean
  status: RequestStatus
  remarks?: string
  /** Assets to attach to this request */
  assets: RequestAssetInput[]
}

/** Input shape for a single asset when saving a request */
export interface RequestAssetInput {
  asset_id: string | null
  asset_tag_number?: string
  asset_description?: string
  quantity_requested: number
  remarks?: string
}
