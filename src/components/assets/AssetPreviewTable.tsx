import { formatCurrency } from '@/utils/formatCurrency'
import type { ParsedAssetRow } from '@/utils/excelParser'

interface AssetPreviewTableProps {
  rows: ParsedAssetRow[]
  fileName: string
}

export default function AssetPreviewTable({ rows, fileName }: AssetPreviewTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-900 dark:text-white text-sm font-medium">Preview: {fileName}</p>
          <p className="text-gray-500 text-xs mt-0.5">{rows.length} row{rows.length !== 1 ? 's' : ''} parsed — review before importing</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            <tr>
              {['Tag Number','Item / Brand / Description','Date Acquired','Qty','Actual Count','Unit Cost','Total Cost','Life Span','Code','Tag Location / Issued To','Remarks'].map((h) => (
                <th key={h} className="text-left text-gray-500 dark:text-gray-400 font-medium px-3 py-2 border-b border-gray-200 dark:border-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/80 dark:divide-gray-800/60">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.tag_number ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-900 dark:text-white max-w-[200px] truncate">{row.item_description ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.date_acquired ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.quantity_text ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.actual_count !== null ? row.actual_count : '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.unit_cost !== null ? formatCurrency(row.unit_cost) : '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.total_cost !== null ? formatCurrency(row.total_cost) : '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.life_span ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300">{row.code ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.tag_location_issued_to ?? '—'}</td>
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{row.remarks ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
