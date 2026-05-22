/**
 * excelParser.ts
 *
 * Parses the official AUSG inventory Excel file into an array of asset rows.
 * Runs entirely client-side — no data is sent to Supabase until the Auditor
 * clicks "Confirm Import". This keeps egress at zero during the preview step.
 *
 * Column mapping follows EXCEL_COLUMN_MAP in constants.ts.
 *
 * Special handling:
 *   - Tag Number: always stored as TEXT (may contain letters, leading zeros, "001-A")
 *   - Qty: stored as original text (may contain "12*", "N/A") AND parsed to integer
 *   - Cost / Total Cost: stripped of currency symbols and commas before parsing
 *   - Missing columns: treated as null, never throw
 */

import * as XLSX from 'xlsx'
import { EXCEL_COLUMN_MAP } from '@/utils/constants'
import type { Asset } from '@/types/asset'

/** A parsed asset row ready for preview and eventual DB insert */
export type ParsedAssetRow = Omit<
  Asset,
  'id' | 'import_batch_id' | 'created_at' | 'updated_at' | 'borrowing_status'
>

/**
 * Parses an Excel (.xlsx or .xls) file and returns an array of asset rows.
 *
 * @param file - The File object from the file input or dropzone
 * @returns Array of parsed asset rows (may be empty if the sheet has no data rows)
 * @throws Error with a user-friendly message if the file cannot be read
 */
export async function parseExcelFile(file: File): Promise<ParsedAssetRow[]> {
  const buffer = await file.arrayBuffer()

  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      // Keep raw cell values so we can preserve text like "12*" in Qty
      raw: false,
      cellText: true,
    })
  } catch {
    throw new Error('Could not read the file. Make sure it is a valid .xlsx or .xls file.')
  }

  // Use the first sheet
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('The Excel file has no sheets.')
  }

  const sheet = workbook.Sheets[sheetName]

  // Convert to array of objects using the first row as headers
  // defval: null ensures missing cells become null instead of undefined
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false, // format all values as strings first; we parse numbers ourselves
  })

  if (rows.length === 0) {
    return []
  }

  return rows.map((row) => parseRow(row))
}

/**
 * Maps a single raw Excel row to a ParsedAssetRow.
 * Uses EXCEL_COLUMN_MAP to find the right column header.
 * Any unrecognised column is ignored; any missing mapped column becomes null.
 */
function parseRow(row: Record<string, unknown>): ParsedAssetRow {
  // Helper: get a cell value by its Excel column header name
  function cell(excelHeader: string): string | null {
    const value = row[excelHeader]
    if (value === null || value === undefined || value === '') return null
    return String(value).trim()
  }

  // Tag Number — always text, never coerce to number
  const tag_number = cell('Tag Number')

  // Item description
  const item_description = cell('Items/Brand/Description')

  // Date acquired — keep as text
  const date_acquired = cell('Date Acquired')

  // Qty — preserve original text (e.g. "12*") AND attempt numeric parse
  const quantity_text = cell('Qty')
  const quantity_numeric = parseQuantity(quantity_text)

  // Actual Count — attempt numeric parse
  const actual_count_raw = cell('Actual Count')
  const actual_count = actual_count_raw !== null ? parseIntSafe(actual_count_raw) : null

  // Cost / Unit Cost — strip currency symbols and commas
  const unit_cost = parseNumericCurrency(cell('Cost'))

  // Total Cost
  const total_cost = parseNumericCurrency(cell('Total Cost'))

  // Life Span — keep as text
  const life_span = cell('Life Span')

  // Code
  const code = cell('Code')

  // Tag Location / Issued To
  const tag_location_issued_to = cell('Tag Location Issued to')

  // Remarks
  const remarks = cell('Remarks')

  return {
    tag_number:              tag_number              ?? undefined,
    item_description:        item_description        ?? undefined,
    date_acquired:           date_acquired           ?? undefined,
    quantity_text:           quantity_text           ?? undefined,
    quantity_numeric:        quantity_numeric        ?? undefined,
    actual_count:            actual_count            ?? undefined,
    unit_cost:               unit_cost               ?? undefined,
    total_cost:              total_cost              ?? undefined,
    life_span:               life_span               ?? undefined,
    code:                    code                    ?? undefined,
    tag_location_issued_to:  tag_location_issued_to  ?? undefined,
    remarks:                 remarks                 ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to parse a quantity string to an integer.
 * Strips non-numeric characters (e.g. "12*" → 12, "N/A" → null).
 */
function parseQuantity(value: string | null): number | null {
  if (!value) return null
  // Extract leading digits only
  const match = value.match(/^(\d+)/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return isNaN(n) ? null : n
}

/**
 * Parses a currency string to a float.
 * Strips ₱, $, commas, and spaces (e.g. "₱1,500.00" → 1500.00).
 */
function parseNumericCurrency(value: string | null): number | null {
  if (!value) return null
  const cleaned = value.replace(/[₱$,\s]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

/**
 * Parses a string to an integer, returning null if not parseable.
 */
function parseIntSafe(value: string): number | null {
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? null : n
}
