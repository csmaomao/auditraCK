import type { RequestStatus } from '@/types/database'
import type { Asset } from '@/types/asset'

/**
 * All allowed request statuses.
 * Update this array if you add new statuses — it drives filter tabs,
 * form dropdowns, and status badge colors throughout the app.
 */
export const REQUEST_STATUSES: RequestStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
  'Completed',
]

/**
 * File extensions allowed for request attachments.
 * Update this array to allow or block additional file types.
 */
export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.xlsx',
] as const

/**
 * Maps Excel column headers (from the official AUSG inventory spreadsheet)
 * to Asset interface field names.
 *
 * If the AUSG inventory spreadsheet changes column names, update the keys here.
 * The values must match field names in the Asset interface.
 */
export const EXCEL_COLUMN_MAP: Record<string, keyof Asset> = {
  'Tag Number': 'tag_number',
  'Items/Brand/Description': 'item_description',
  'Date Acquired': 'date_acquired',
  'Qty': 'quantity_text',
  'Actual Count': 'actual_count',
  'Cost': 'unit_cost',
  'Total Cost': 'total_cost',
  'Life Span': 'life_span',
  'Code': 'code',
  'Tag Location Issued to': 'tag_location_issued_to',
  'Remarks': 'remarks',
}

/** Month names for the report month picker and calendar headings */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
] as const
