'use client'

/**
 * AssetTable — displays all AUSG assets with derived Borrowing Status.
 *
 * The "Booked" status badge is clickable — clicking it opens AssetBookingModal
 * which fetches and lists all Approved requests currently booking that asset.
 * "Available" badges are not interactive.
 *
 * Free-plan: no data is fetched until the Auditor clicks a Booked badge.
 */

import { useState } from 'react'
import StatusBadge from '@/components/common/StatusBadge'
import EmptyState from '@/components/common/EmptyState'
import AssetBookingModal from './AssetBookingModal'
import { getBorrowingStatusColor } from '@/utils/statusHelpers'
import { formatCurrency } from '@/utils/formatCurrency'
import type { AssetRow } from '@/services/assetService'

interface AssetTableProps {
  assets: AssetRow[]
}

interface SelectedAsset {
  id: string
  item_description: string | null
  tag_number: string | null
}

export default function AssetTable({ assets }: AssetTableProps) {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null)

  if (assets.length === 0) {
    return (
      <EmptyState message="No assets in the inventory. Upload an Excel file to import assets." />
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {[
                'Tag #',
                'Item / Description',
                'Date Acquired',
                'Qty',
                'Actual',
                'Unit Cost',
                'Total Cost',
                'Life Span',
                'Code',
                'Location / Issued To',
                'Remarks',
                'Status',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-3 last:pr-0 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                  {asset.tag_number ?? '—'}
                </td>
                <td className="py-3 pr-3 text-white font-medium max-w-[200px] truncate">
                  {asset.item_description ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 whitespace-nowrap text-xs">
                  {asset.date_acquired ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs">
                  {asset.quantity_text ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs">
                  {asset.actual_count !== null ? asset.actual_count : '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs whitespace-nowrap">
                  {asset.unit_cost !== null ? formatCurrency(asset.unit_cost) : '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs whitespace-nowrap">
                  {asset.total_cost !== null ? formatCurrency(asset.total_cost) : '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs whitespace-nowrap">
                  {asset.life_span ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs">
                  {asset.code ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs max-w-[140px] truncate">
                  {asset.tag_location_issued_to ?? '—'}
                </td>
                <td className="py-3 pr-3 text-gray-300 text-xs max-w-[140px] truncate">
                  {asset.remarks ?? '—'}
                </td>
                <td className="py-3">
                  {asset.borrowing_status === 'Booked' ? (
                    /* Clickable badge — opens booking details modal */
                    <button
                      type="button"
                      onClick={() => setSelectedAsset({
                        id: asset.id,
                        item_description: asset.item_description ?? null,
                        tag_number: asset.tag_number ?? null,
                      })}
                      className="group"
                      title="Click to view booking details"
                    >
                      <StatusBadge
                        label="Booked"
                        className={`
                          ${getBorrowingStatusColor('Booked')}
                          cursor-pointer group-hover:opacity-80 transition-opacity
                          underline decoration-dotted underline-offset-2
                        `}
                      />
                    </button>
                  ) : (
                    /* Non-interactive badge for Available */
                    <StatusBadge
                      label={asset.borrowing_status}
                      className={getBorrowingStatusColor(asset.borrowing_status)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking details modal — rendered outside the table to avoid z-index issues */}
      {selectedAsset && (
        <AssetBookingModal
          assetId={selectedAsset.id}
          assetDescription={selectedAsset.item_description}
          assetTagNumber={selectedAsset.tag_number}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  )
}
