'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AssetUploadDropzone from './AssetUploadDropzone'
import AssetPreviewTable from './AssetPreviewTable'
import ConfirmImportModal from './ConfirmImportModal'
import AssetTable from './AssetTable'
import SearchInput from '@/components/common/SearchInput'
import FilterTabs from '@/components/common/FilterTabs'
import { importAssetsAction } from '@/app/actions/assets'
import type { ParsedAssetRow } from '@/utils/excelParser'
import type { AssetRow } from '@/services/assetService'

interface AssetsPageClientProps {
  initialAssets: AssetRow[]
  totalCount: number
  pageSize: number
  currentPage: number
  currentSearch: string
  currentStatus: string
}

const BORROWING_FILTERS = ['All', 'Available', 'Booked']

export default function AssetsPageClient({ initialAssets, totalCount, pageSize, currentPage, currentSearch, currentStatus }: AssetsPageClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedAssetRow[] | null>(null)
  const [parsedFileName, setParsedFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  function navigate(opts: { search?: string; status?: string; page?: number }) {
    const search = opts.search ?? currentSearch
    const status = opts.status ?? currentStatus
    const page = opts.page ?? 1
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status && status !== 'All') params.set('status', status)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.push(`/assets${qs ? `?${qs}` : ''}`)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback((value: string) => navigate({ search: value, page: 1 }), [currentStatus])

  function handleStatusFilter(value: string) { navigate({ status: value, page: 1 }) }
  function handlePage(newPage: number) { navigate({ page: newPage }) }

  function handleParsed(rows: ParsedAssetRow[], fileName: string) {
    setParseError(null); setParsedRows(rows); setParsedFileName(fileName)
  }

  function handleCancelPreview() {
    setParsedRows(null); setParsedFileName(''); setParseError(null); setShowUpload(false)
  }

  async function handleConfirmImport() {
    if (!parsedRows) return
    setImporting(true); setImportError(null)
    const result = await importAssetsAction(parsedRows, parsedFileName)
    setImporting(false); setShowConfirm(false)
    if (!result.success) { setImportError(result.error ?? 'Import failed. Please try again.'); return }
    setParsedRows(null); setParsedFileName(''); setShowUpload(false); router.refresh()
  }

  const btnSecondary = 'px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors'

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Assets</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalCount} asset{totalCount !== 1 ? 's' : ''} in inventory</p>
        </div>
        <button type="button" onClick={() => { setShowUpload((v) => !v); setParsedRows(null); setParseError(null) }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="hidden sm:inline">Upload Inventory</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>

      {showUpload && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-gray-900 dark:text-white text-sm font-semibold">Upload Excel Inventory</h2>
          {!parsedRows ? (
            <>
              <AssetUploadDropzone onParsed={handleParsed} onError={(msg) => setParseError(msg)} />
              {parseError && <p className="text-red-500 dark:text-red-400 text-sm">{parseError}</p>}
            </>
          ) : (
            <>
              <AssetPreviewTable rows={parsedRows} fileName={parsedFileName} />
              {importError && <p className="text-red-500 dark:text-red-400 text-sm">{importError}</p>}
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={handleCancelPreview} className={btnSecondary}>Cancel</button>
                <button type="button" onClick={() => setShowConfirm(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Confirm Import ({parsedRows.length} rows)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <SearchInput placeholder="Search by tag, description, code, location…" defaultValue={currentSearch} onChange={handleSearch} />
        </div>
        <FilterTabs options={BORROWING_FILTERS} active={currentStatus} onChange={handleStatusFilter} />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <AssetTable assets={initialAssets} />
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalCount} total assets</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button type="button" onClick={() => handlePage(currentPage - 1)} disabled={currentPage <= 1} className={`${btnSecondary} disabled:opacity-40 disabled:cursor-not-allowed`}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => { if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…'); acc.push(p); return acc }, [])
              .map((item, idx) =>
                item === '…' ? (
                  <span key={`ellipsis-${idx}`} className="text-gray-400 text-sm px-1">…</span>
                ) : (
                  <button key={item} type="button" onClick={() => handlePage(item as number)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${item === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
                    {item}
                  </button>
                )
              )}
            <button type="button" onClick={() => handlePage(currentPage + 1)} disabled={currentPage >= totalPages} className={`${btnSecondary} disabled:opacity-40 disabled:cursor-not-allowed`}>Next →</button>
          </div>
        </div>
      )}

      <ConfirmImportModal open={showConfirm} rowCount={parsedRows?.length ?? 0} fileName={parsedFileName} loading={importing} onConfirm={handleConfirmImport} onCancel={() => setShowConfirm(false)} />
    </div>
  )
}
