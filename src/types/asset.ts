import type { BorrowingStatus } from './database'

/**
 * An AUSG asset from the official inventory.
 * Maps to the `assets` table.
 *
 * NOTE: tag_number is stored as TEXT because some tag numbers contain
 * letters, leading zeros, or special formats (e.g. "001-A", "00123").
 *
 * NOTE: quantity_text preserves the original Excel value (e.g. "12*")
 * while quantity_numeric holds the parsed integer when possible.
 */
export interface Asset {
  id: string
  tag_number?: string
  item_description?: string
  date_acquired?: string
  quantity_text?: string          // original text from Excel (may contain "12*" etc.)
  quantity_numeric?: number       // parsed integer, null if not parseable
  actual_count?: number
  unit_cost?: number
  total_cost?: number
  life_span?: string
  code?: string
  tag_location_issued_to?: string
  remarks?: string
  import_batch_id?: string        // which import batch this asset came from
  created_at: string
  updated_at: string
  // Derived field — computed from active approved requests, NOT stored in DB
  borrowing_status?: BorrowingStatus
}

/**
 * A record of an Excel inventory import.
 * Maps to the `import_batches` table.
 */
export interface ImportBatch {
  id: string
  file_name: string
  imported_by?: string            // UUID of the profile who ran the import
  imported_at: string
  row_count?: number
  notes?: string
}
