/**
 * AssetPreviewTable — shows parsed Excel rows before the Auditor confirms import.
 *
 * Displays all mapped columns from the uploaded file.
 * Nothing is saved to Supabase until the Auditor clicks Confirm Import.
 */

import { formatCurrency } from '@/utils/formatCurrency'
import type { ParsedAssetRow } from '@/utils/excelParser'

interface AssetPreviewTableProps {
  rows: ParsedAssetRow[]
  fileName: string
}

export default function AssetPreviewTable({ rows, fileName }: AssetPreviewTableProps) {
  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Preview: {fileName}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {rows.length} row{rows.length !== 1 ? 's' : ''} parsed — review before importing
          </p>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700 max-h-72 overflow-y-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr>
              {[
                'Tag Number',
                'Item / Brand / Description',
                'Date Acquired',
                'Qty',
                'Actual Count',
                'Unit Cost',
                'Total Cost',
                'Life Span',
                'Code',
                'Tag Location / Issued To',
                'Remarks',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-gray-400 font-medium px-3 py-2 border-b border-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800/30">
                <td className="px-3 py-1.5 text-gray-300">{row.tag_number ?? '—'}</td>
                <td className="px-3 py-1.5 text-white max-w-[200px] truncate">
                  {row.item_description ?? '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-300">{row.date_acquired ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-300">{row.quantity_text ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-300">
                  {row.actual_count !== null ? row.actual_count : '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-300">
                  {row.unit_cost !== null ? formatCurrency(row.unit_cost) : '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-300">
                  {row.total_cost !== null ? formatCurrency(row.total_cost) : '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-300">{row.life_span ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-300">{row.code ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-300 max-w-[160px] truncate">
                  {row.tag_location_issued_to ?? '—'}
                </td>
                <td className="px-3 py-1.5 text-gray-300 max-w-[160px] truncate">
                  {row.remarks ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
