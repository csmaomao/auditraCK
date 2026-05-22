'use client'

/**
 * AssetSelector — searchable asset picker for the RequestForm.
 *
 * Fetches the imported asset inventory once on mount and filters client-side.
 * When an asset is selected, saves both asset_id AND snapshot fields
 * (asset_tag_number, asset_description) so old request records remain readable
 * even after the assets table is replaced by a future Excel import.
 *
 * Schedule overlap check:
 *   When the form has an event_date, checks whether each selected asset is
 *   already linked to an Approved request on the same date. Shows a warning
 *   but does NOT block saving — the Auditor decides.
 *
 * Free-plan optimizations:
 *   - Asset list fetched once on mount (7 columns, capped at 500 rows).
 *   - Overlap check is a single scoped query per asset, triggered only when
 *     event_date is set and an asset is added.
 *   - Client-side filtering — no extra Supabase calls per keystroke.
 *   - No realtime subscriptions.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RequestAssetInput } from '@/types/request'

interface AssetOption {
  id: string
  tag_number: string | null
  item_description: string | null
  quantity_numeric: number | null
  quantity_text: string | null
  code: string | null
  tag_location_issued_to: string | null
}

interface AssetSelectorProps {
  value: RequestAssetInput[]
  onChange: (assets: RequestAssetInput[]) => void
  /** Event date from the form — used for overlap checking */
  eventDate?: string
  /** Existing request ID — excluded from overlap check when editing */
  excludeRequestId?: string
}

export default function AssetSelector({
  value,
  onChange,
  eventDate,
  excludeRequestId,
}: AssetSelectorProps) {
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  // Map of asset_id → overlap warning message
  const [overlapWarnings, setOverlapWarnings] = useState<Record<string, string>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch asset list once on mount
  useEffect(() => {
    async function fetchAssets() {
      setLoading(true)
      setFetchError(null)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('assets')
        .select('id, tag_number, item_description, quantity_numeric, quantity_text, code, tag_location_issued_to')
        .order('item_description', { ascending: true })
        .limit(500)

      if (error) {
        setFetchError('Could not load assets. Please refresh and try again.')
      } else {
        setAssets((data ?? []) as AssetOption[])
      }
      setLoading(false)
    }
    fetchAssets()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Check if an asset has an overlapping Approved request on the same event_date.
   * Only checks Approved requests. Warns but does not block saving.
   *
   * Free-plan: scoped query — only fetches request_id for the specific asset + date.
   */
  const checkOverlap = useCallback(async (assetId: string): Promise<string | null> => {
    if (!eventDate) return null

    const supabase = createClient()
    let query = supabase
      .from('request_assets')
      .select('request_id, requests!inner(status, event_date, event_name)')
      .eq('asset_id', assetId)
      .eq('requests.status', 'Approved')
      .eq('requests.event_date', eventDate)

    // When editing, exclude the current request from the overlap check
    if (excludeRequestId) {
      query = query.neq('request_id', excludeRequestId)
    }

    const { data } = await query

    if (data && data.length > 0) {
      // requests is returned as an array by Supabase joins
      const eventNames = data.flatMap((row) => {
        const reqs = row.requests as { event_name: string }[] | { event_name: string } | null
        if (!reqs) return []
        return Array.isArray(reqs) ? reqs.map((r) => r.event_name) : [reqs.event_name]
      })

      if (eventNames.length === 0) return null
      if (eventNames.length === 1) {
        return `This asset is already booked for an approved request on this date: "${eventNames[0]}".`
      }
      return `This asset is already booked for ${eventNames.length} approved requests on this date: ${eventNames.map((n) => `"${n}"`).join(', ')}.`
    }
    return null
  }, [eventDate, excludeRequestId])

  // Client-side filter across 4 fields
  const filtered = assets.filter((a) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      a.item_description?.toLowerCase().includes(term) ||
      a.tag_number?.toLowerCase().includes(term) ||
      a.code?.toLowerCase().includes(term) ||
      a.tag_location_issued_to?.toLowerCase().includes(term)
    )
  })

  const selectedIds = new Set(value.map((v) => v.asset_id))

  async function addAsset(asset: AssetOption) {
    if (selectedIds.has(asset.id)) return

    onChange([
      ...value,
      {
        asset_id: asset.id,
        asset_tag_number: asset.tag_number ?? undefined,
        asset_description: asset.item_description ?? undefined,
        quantity_requested: 1,
      },
    ])
    setSearch('')
    setShowDropdown(false)

    // Run overlap check after adding (non-blocking)
    const warning = await checkOverlap(asset.id)
    if (warning) {
      setOverlapWarnings((prev) => ({ ...prev, [asset.id]: warning }))
    }
  }

  function removeAsset(assetId: string | null) {
    onChange(value.filter((v) => v.asset_id !== assetId))
    if (assetId) {
      setOverlapWarnings((prev) => {
        const next = { ...prev }
        delete next[assetId]
        return next
      })
    }
  }

  function updateQuantity(assetId: string | null, qty: string) {
    const parsed = parseInt(qty, 10)
    onChange(
      value.map((v) =>
        v.asset_id === assetId
          ? { ...v, quantity_requested: isNaN(parsed) ? 1 : Math.max(1, parsed) }
          : v
      )
    )
  }

  function getInventoryQty(assetId: string | null): number | null {
    if (!assetId) return null
    return assets.find((a) => a.id === assetId)?.quantity_numeric ?? null
  }

  return (
    <div className="space-y-3">

      {/* Search input + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            loading
              ? 'Loading assets…'
              : assets.length === 0
              ? 'No assets in inventory — upload an Excel file on the Assets page'
              : 'Search by name, tag number, code, or location…'
          }
          disabled={loading}
          className="
            w-full px-3 py-2 rounded-lg text-sm
            bg-gray-800 border border-gray-700
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
            disabled:opacity-50
          "
        />

        {/* Dropdown */}
        {showDropdown && !loading && (
          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {assets.length === 0 ? (
              <p className="px-3 py-3 text-gray-500 text-sm">
                No assets found. Import an inventory file on the Assets page first.
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-2 text-gray-500 text-sm">No assets match your search.</p>
            ) : (
              filtered.slice(0, 40).map((asset) => {
                const alreadyAdded = selectedIds.has(asset.id)
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => addAsset(asset)}
                    disabled={alreadyAdded}
                    className={`
                      w-full text-left px-3 py-2.5 text-sm border-b border-gray-700/50 last:border-0
                      hover:bg-gray-700 transition-colors
                      ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-white block truncate">
                      {asset.item_description ?? '—'}
                    </span>
                    <span className="text-gray-500 text-xs flex flex-wrap gap-x-3 mt-0.5">
                      {asset.tag_number && <span>#{asset.tag_number}</span>}
                      {asset.code && <span>Code: {asset.code}</span>}
                      {asset.tag_location_issued_to && <span>{asset.tag_location_issued_to}</span>}
                      {asset.quantity_text && <span>Qty: {asset.quantity_text}</span>}
                      {alreadyAdded && <span className="text-blue-400">already added</span>}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {fetchError && <p className="text-red-400 text-xs">{fetchError}</p>}

      {/* Selected assets list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, idx) => {
            const inventoryQty = getInventoryQty(item.asset_id)
            const overQty = inventoryQty !== null && item.quantity_requested > inventoryQty
            const overlapWarning = item.asset_id ? overlapWarnings[item.asset_id] : undefined

            return (
              <div
                key={item.asset_id ?? idx}
                className="px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {item.asset_description ?? 'Unknown asset'}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {item.asset_tag_number && <span>#{item.asset_tag_number}</span>}
                      {inventoryQty !== null && (
                        <span className="ml-2">Inventory: {inventoryQty}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="text-gray-500 text-xs">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity_requested}
                      onChange={(e) => updateQuantity(item.asset_id, e.target.value)}
                      className={`
                        w-16 px-2 py-1 rounded text-sm text-center
                        bg-gray-700 border text-white
                        focus:outline-none focus:ring-1 focus:ring-blue-600
                        ${overQty ? 'border-yellow-500' : 'border-gray-600'}
                      `}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAsset(item.asset_id)}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                    aria-label={`Remove ${item.asset_description}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {overQty && (
                  <p className="text-yellow-400 text-xs mt-1.5">
                    ⚠ Requested quantity ({item.quantity_requested}) exceeds inventory ({inventoryQty}).
                  </p>
                )}
                {overlapWarning && (
                  <p className="text-orange-400 text-xs mt-1.5">
                    ⚠ {overlapWarning}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {value.length === 0 && !loading && (
        <p className="text-gray-600 text-xs">
          No assets added. Search above to add assets. Assets are optional.
        </p>
      )}
    </div>
  )
}
