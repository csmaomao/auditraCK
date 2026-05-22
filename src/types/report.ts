/**
 * A single row in the Monthly Approved Borrowing Report.
 * Built from an Approved request joined with its request_assets snapshot fields.
 *
 * Asset data comes from request_assets.asset_tag_number and
 * request_assets.asset_description — NOT from the live assets table.
 * This ensures old reports remain accurate even after an Excel import
 * replaces the assets table.
 */
export interface MonthlyReportRow {
  request_id: string
  event_date: string              // ISO date string (YYYY-MM-DD)
  start_time?: string             // HH:MM
  end_time?: string               // HH:MM
  organization_name: string
  event_name: string
  venue: string
  remarks?: string
  /** Assets borrowed for this request, from snapshot fields */
  assets: ReportAssetRow[]
}

/** A single asset line within a report row */
export interface ReportAssetRow {
  asset_tag_number?: string       // from request_assets.asset_tag_number (snapshot)
  asset_description?: string      // from request_assets.asset_description (snapshot)
  quantity_requested: number
}
