'use client'

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
  eventDate?: string
  eventEndDate?: string
  excludeRequestId?: string
}

export default function AssetSelector({ value, onChange, eventDate, eventEndDate, excludeRequestId }: AssetSelectorProps) {
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [overlapWarnings, setOverlapWarnings] = useState<Record<string, string>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      if (error) setFetchError('Could not load assets. Please refresh and try again.')
      else setAssets((data ?? []) as AssetOption[])
      setLoading(false)
    }
    fetchAssets()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkOverlap = useCallback(async (assetId: string): Promise<string | null> => {
    if (!eventDate) return null
    const supabase = createClient()
    // The end of OUR range (use start date if no end date specified)
    const ourEnd = eventEndDate || eventDate

    // Fetch all approved requests for this asset that overlap our date range.
    // Two ranges [A,B] and [C,D] overlap if A <= D and C <= B.
    // Here: our range is [eventDate, ourEnd]; their range is [event_date, COALESCE(event_end_date, event_date)]
    let query = supabase
      .from('request_assets')
      .select('request_id, requests!inner(status, event_date, event_end_date, event_name)')
      .eq('asset_id', assetId)
      .eq('requests.status', 'Approved')
      .lte('requests.event_date', ourEnd)   // their start <= our end
    if (excludeRequestId) query = query.neq('request_id', excludeRequestId)
    const { data } = await query
    if (!data || data.length === 0) return null

    // Filter client-side for the other half of the overlap condition:
    // their end (event_end_date ?? event_date) >= our start
    const overlapping = data.filter((row) => {
      const req = row.requests as { event_date: string; event_end_date: string | null; event_name: string } | null
      if (!req) return false
      const theirEnd = req.event_end_date ?? req.event_date
      return theirEnd >= eventDate
    })

    if (overlapping.length === 0) return null

    const eventNames = overlapping.map((row) => {
      const req = row.requests as { event_name: string } | null
      return req?.event_name ?? 'unknown'
    })

    if (eventNames.length === 1) return `This asset is already booked for an approved request that overlaps these dates: "${eventNames[0]}".`
    return `This asset is already booked for ${eventNames.length} approved requests that overlap these dates: ${eventNames.map((n) => `"${n}"`).join(', ')}.`
  }, [eventDate, eventEndDate, excludeRequestId])

  const filtered = assets.filter((a) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return a.item_description?.toLowerCase().includes(term) || a.tag_number?.toLowerCase().includes(term) || a.code?.toLowerCase().includes(term) || a.tag_location_issued_to?.toLowerCase().includes(term)
  })

  const selectedIds = new Set(value.map((v) => v.asset_id))

  async function addAsset(asset: AssetOption) {
    if (selectedIds.has(asset.id)) return
    onChange([...value, { asset_id: asset.id, asset_tag_number: asset.tag_number ?? undefined, asset_description: asset.item_description ?? undefined, quantity_requested: 1 }])
    setSearch('')
    setShowDropdown(false)
    const warning = await checkOverlap(asset.id)
    if (warning) setOverlapWarnings((prev) => ({ ...prev, [asset.id]: warning }))
  }

  function removeAsset(assetId: string | null) {
    onChange(value.filter((v) => v.asset_id !== assetId))
    if (assetId) setOverlapWarnings((prev) => { const next = { ...prev }; delete next[assetId]; return next })
  }

  function updateQuantity(assetId: string | null, qty: string) {
    const parsed = parseInt(qty, 10)
    onChange(value.map((v) => v.asset_id === assetId ? { ...v, quantity_requested: isNaN(parsed) ? 1 : Math.max(1, parsed) } : v))
  }

  function getInventoryQty(assetId: string | null): number | null {
    if (!assetId) return null
    return assets.find((a) => a.id === assetId)?.quantity_numeric ?? null
  }

  const inputCls = `
    w-full px-3 py-2 rounded-lg text-sm
    bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
    disabled:opacity-50
  `

  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder={loading ? 'Loading assets…' : assets.length === 0 ? 'No assets in inventory — upload an Excel file on the Assets page' : 'Search by name, tag number, code, or location…'}
          disabled={loading}
          className={inputCls}
        />
        {showDropdown && !loading && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {assets.length === 0 ? (
              <p className="px-3 py-3 text-gray-500 text-sm">No assets found. Import an inventory file on the Assets page first.</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-2 text-gray-500 text-sm">No assets match your search.</p>
            ) : (
              filtered.slice(0, 40).map((asset) => {
                const alreadyAdded = selectedIds.has(asset.id)
                return (
                  <button key={asset.id} type="button" onClick={() => addAsset(asset)} disabled={alreadyAdded}
                    className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <span className="text-gray-900 dark:text-white block truncate">{asset.item_description ?? '—'}</span>
                    <span className="text-gray-500 text-xs flex flex-wrap gap-x-3 mt-0.5">
                      {asset.tag_number && <span>#{asset.tag_number}</span>}
                      {asset.code && <span>Code: {asset.code}</span>}
                      {asset.tag_location_issued_to && <span>{asset.tag_location_issued_to}</span>}
                      {asset.quantity_text && <span>Qty: {asset.quantity_text}</span>}
                      {alreadyAdded && <span className="text-blue-500 dark:text-blue-400">already added</span>}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {fetchError && <p className="text-red-500 dark:text-red-400 text-xs">{fetchError}</p>}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, idx) => {
            const inventoryQty = getInventoryQty(item.asset_id)
            const overQty = inventoryQty !== null && item.quantity_requested > inventoryQty
            const overlapWarning = item.asset_id ? overlapWarnings[item.asset_id] : undefined
            return (
              <div key={item.asset_id ?? idx} className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white text-sm truncate">{item.asset_description ?? 'Unknown asset'}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {item.asset_tag_number && <span>#{item.asset_tag_number}</span>}
                      {inventoryQty !== null && <span className="ml-2">Inventory: {inventoryQty}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="text-gray-500 text-xs">Qty</label>
                    <input type="number" min={1} value={item.quantity_requested} onChange={(e) => updateQuantity(item.asset_id, e.target.value)}
                      className={`w-16 px-2 py-1 rounded text-sm text-center bg-white dark:bg-gray-700 border text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 ${overQty ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600'}`} />
                  </div>
                  <button type="button" onClick={() => removeAsset(item.asset_id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 mt-0.5" aria-label={`Remove ${item.asset_description}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {overQty && <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1.5">⚠ Requested quantity ({item.quantity_requested}) exceeds inventory ({inventoryQty}).</p>}
                {overlapWarning && <p className="text-orange-600 dark:text-orange-400 text-xs mt-1.5">⚠ {overlapWarning}</p>}
              </div>
            )
          })}
        </div>
      )}

      {value.length === 0 && !loading && <p className="text-gray-400 text-xs">No assets added. Search above to add assets. Assets are optional.</p>}
    </div>
  )
}
