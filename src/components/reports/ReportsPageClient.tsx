'use client'

/**
 * ReportsPageClient
 *
 * Strictly monthly: one month/year selector.
 * Fetches Approved requests submitted in the selected month.
 *
 * Export options:
 *   - Print / Save as PDF  (window.print() — paginated A4 sheets)
 *   - Export as Excel      (xlsx, client-side, one row per asset)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MONTH_NAMES } from '@/utils/constants'
import { formatDate, formatTime } from '@/utils/formatDate'
import type { ReportRow } from '@/services/reportService'

interface ReportsPageClientProps {
  rows: ReportRow[]
  generated: boolean
  periodLabel: string
  defaultMonth: number
  defaultYear: number
}

// ---------------------------------------------------------------------------
// Pagination constants
// ---------------------------------------------------------------------------
const UNITS_PER_PAGE        = 28
const UNITS_HEADER_BLOCK    = 8
const UNITS_TABLE_HEADER    = 1
const UNITS_ROW_BASE        = 2
const UNITS_PER_EXTRA_ASSET = 1
const UNITS_SIGNATURE       = 10

function rowUnits(row: ReportRow) {
  return UNITS_ROW_BASE + Math.max(0, row.assets.length - 1) * UNITS_PER_EXTRA_ASSET
}

function paginateRows(rows: ReportRow[]) {
  const pages: ReportRow[][] = []
  let current: ReportRow[] = []
  let used = UNITS_HEADER_BLOCK + UNITS_TABLE_HEADER

  for (const row of rows) {
    const cost = rowUnits(row)
    if (used + cost > UNITS_PER_PAGE && current.length > 0) {
      pages.push(current)
      current = []
      used = UNITS_TABLE_HEADER
    }
    current.push(row)
    used += cost
  }
  if (current.length > 0 || pages.length === 0) pages.push(current)

  const signatureOnLastDataPage = used + UNITS_SIGNATURE <= UNITS_PER_PAGE
  return { pages, signatureOnLastDataPage }
}

// ---------------------------------------------------------------------------
// Table columns (no separate Qty — qty is inside Assets Borrowed)
// ---------------------------------------------------------------------------
const COLUMNS = [
  'Date Submitted', 'Event Date', 'Time',
  'Organization', 'Event Name', 'Venue',
  'Assets Borrowed', 'Remarks',
]
const COL_WIDTHS = ['11%', '10%', '9%', '12%', '13%', '12%', '22%', '11%']

// ---------------------------------------------------------------------------
// Print sub-components
// ---------------------------------------------------------------------------

function TableHeader() {
  return (
    <thead>
      <tr>
        {COLUMNS.map((h, i) => (
          <th key={h} style={{
            border: '1px solid #333', padding: '3pt 4pt',
            backgroundColor: '#f0f0f0', fontWeight: 'bold',
            textAlign: 'left', fontSize: '7.5pt', wordBreak: 'break-word',
            width: COL_WIDTHS[i],
          }}>{h}</th>
        ))}
      </tr>
    </thead>
  )
}

const TD: React.CSSProperties = {
  border: '1px solid #333', padding: '3pt 4pt',
  wordBreak: 'break-word', fontSize: '8pt',
}

function DataRows({ rows }: { rows: ReportRow[] }) {
  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} style={{ verticalAlign: 'top', pageBreakInside: 'avoid' }}>
          <td style={TD}>{formatDate(row.date_submitted)}</td>
          <td style={TD}>{row.event_end_date ? `${formatDate(row.event_date)} – ${formatDate(row.event_end_date)}` : formatDate(row.event_date)}</td>
          <td style={TD}>
            {row.start_time
              ? `${formatTime(row.start_time)}${row.end_time ? ` – ${formatTime(row.end_time)}` : ''}`
              : '—'}
          </td>
          <td style={TD}>{row.organization_name}</td>
          <td style={{ ...TD, fontWeight: 'bold' }}>{row.event_name}</td>
          <td style={TD}>{row.venue}</td>
          {/* Assets Borrowed — description + tag + qty all in one cell */}
          <td style={TD}>
            {row.assets.length === 0
              ? <em style={{ color: '#777' }}>No assets listed</em>
              : row.assets.map((a, i) => (
                <div key={a.id} style={{
                  marginBottom: i < row.assets.length - 1 ? '5pt' : 0,
                  paddingBottom: i < row.assets.length - 1 ? '4pt' : 0,
                  borderBottom: i < row.assets.length - 1 ? '1px solid #ccc' : 'none',
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '7.5pt', wordBreak: 'break-word' }}>
                    {a.asset_description ?? '—'}
                  </div>
                  {a.asset_tag_number && (
                    <div style={{ color: '#555', fontSize: '7pt' }}>Tag: #{a.asset_tag_number}</div>
                  )}
                  <div style={{ color: '#333', fontSize: '7pt' }}>Qty: {a.quantity_requested}</div>
                </div>
              ))
            }
          </td>
          <td style={{ ...TD, color: '#444' }}>{row.remarks ?? '—'}</td>
        </tr>
      ))}
    </tbody>
  )
}

function SignatureBlock() {
  return (
    <div className="signature-block" style={{
      marginTop: '12mm', paddingTop: '8mm', fontSize: '9pt',
      breakInside: 'avoid', pageBreakInside: 'avoid',
    }}>
      <div className="signature-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '10mm' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 3pt' }}>Prepared by:</p>
        <p style={{ borderBottom: '1px solid #000', width: '220pt', marginBottom: '2pt' }}>&nbsp;</p>
        <p style={{ margin: '0' }}>Auditor, Adamson University Student Government</p>
      </div>
      <p style={{ fontWeight: 'bold', margin: '0 0 3pt' }}>Noted by:</p>
      <div className="signature-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '10mm' }}>
        <p style={{ borderBottom: '1px solid #000', width: '220pt', marginBottom: '2pt' }}>&nbsp;</p>
        <p style={{ margin: '0' }}>Secretary, Adamson University Student Government</p>
      </div>
      <div className="signature-item" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '0' }}>
        <p style={{ borderBottom: '1px solid #000', width: '220pt', marginBottom: '2pt' }}>&nbsp;</p>
        <p style={{ margin: '0' }}>President, Adamson University Student Government</p>
      </div>
    </div>
  )
}

const SHEET_STYLE: React.CSSProperties = {
  width: '210mm', minHeight: '297mm',
  margin: '0 auto 16px auto', padding: '10mm 12mm',
  boxSizing: 'border-box', background: 'white', color: 'black',
  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
  fontFamily: 'Arial, sans-serif', fontSize: '9pt', overflow: 'hidden',
}

const TABLE_STYLE: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
  fontSize: '8pt', tableLayout: 'fixed',
}

// ---------------------------------------------------------------------------
// Excel export — one row per asset, no merged cells, clean alignment
// ---------------------------------------------------------------------------
async function exportToExcel(rows: ReportRow[], periodLabel: string) {
  const XLSX = await import('xlsx')

  const preparedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Column headers for the data table
  const headers = [
    'Date Submitted', 'Event Date', 'Time',
    'Organization', 'Event Name', 'Venue',
    'Asset Description', 'Tag Number', 'Quantity', 'Remarks',
  ]

  // Build flat rows — one row per asset (or one "No assets" row per request)
  const dataRows: (string | number)[][] = []

  for (const row of rows) {
    const dateSubmitted = row.date_submitted ?? ''
    const eventDate     = row.event_end_date
      ? `${row.event_date} – ${row.event_end_date}`
      : row.event_date
    const time          = row.start_time
      ? `${row.start_time}${row.end_time ? ` – ${row.end_time}` : ''}`
      : ''
    const org     = row.organization_name
    const event   = row.event_name
    const venue   = row.venue
    const remarks = row.remarks ?? ''

    if (row.assets.length === 0) {
      dataRows.push([dateSubmitted, eventDate, time, org, event, venue, 'No assets listed', '', '', remarks])
    } else {
      row.assets.forEach((a, i) => {
        dataRows.push([
          i === 0 ? dateSubmitted : '',   // repeat request fields only on first asset row
          i === 0 ? eventDate     : '',
          i === 0 ? time          : '',
          i === 0 ? org           : '',
          i === 0 ? event         : '',
          i === 0 ? venue         : '',
          a.asset_description ?? '',
          a.asset_tag_number  ?? '',
          a.quantity_requested,
          i === 0 ? remarks       : '',
        ])
      })
    }
  }

  // Assemble the full sheet as an array-of-arrays
  const sheetData: (string | number)[][] = [
    // Report header block (spans visually but no merged cells)
    ['Adamson University Student Government'],
    ['Office of the Auditor'],
    ['Approved Asset Borrowing Report'],
    [`For the Month of: ${periodLabel}`],
    [`Prepared on: ${preparedDate}`],
    [`Status: Approved only | Report basis: Date Submitted`],
    [],                 // blank separator
    headers,            // column headers row
    ...dataRows,        // data rows
    [],                 // blank before signature
    [],
    ['Prepared by:'],
    ['____________________________'],
    ['Auditor, Adamson University Student Government'],
    [],
    ['Noted by:'],
    ['____________________________'],
    ['Secretary, Adamson University Student Government'],
    [],
    ['____________________________'],
    ['President, Adamson University Student Government'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Column widths — aligned to the 10 data columns
  ws['!cols'] = [
    { wch: 16 }, // Date Submitted
    { wch: 14 }, // Event Date
    { wch: 14 }, // Time
    { wch: 26 }, // Organization
    { wch: 26 }, // Event Name
    { wch: 20 }, // Venue
    { wch: 34 }, // Asset Description
    { wch: 18 }, // Tag Number
    { wch: 6  }, // Qty
    { wch: 20 }, // Remarks
  ]

  // Apply wrapText + top-align to every populated cell — no merged cells
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) continue
      ws[addr].s = {
        alignment: { wrapText: true, vertical: 'top' },
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')

  const safeLabel = periodLabel.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
  XLSX.writeFile(wb, `AUSG_Report_${safeLabel}.xlsx`)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ReportsPageClient({
  rows, generated, periodLabel, defaultMonth, defaultYear,
}: ReportsPageClientProps) {
  const router = useRouter()
  const now = new Date()
  const currentYear = now.getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i)

  const [month, setMonth] = useState(defaultMonth)
  const [year,  setYear]  = useState(defaultYear)

  const preparedDate = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  function handleGenerate() {
    router.push(`/reports?month=${month}&year=${year}`)
  }

  const { pages, signatureOnLastDataPage } = generated
    ? paginateRows(rows)
    : { pages: [[]] as ReportRow[][], signatureOnLastDataPage: true }

  const totalPages = pages.length + (signatureOnLastDataPage ? 0 : 1)

  const selectCls = 'px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600'

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="no-print">
        <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Approved Asset Borrowing Report</p>
      </div>

      {/* Controls */}
      <div className="no-print bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 space-y-4">

        {/* Month / Year selectors */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectCls}>
              {MONTH_NAMES.map((n, i) => (
                <option key={n} value={i + 1}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {isCurrentMonth && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30 self-end mb-0.5">
              Current month
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>

          {generated && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Print / PDF</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                type="button"
                onClick={() => exportToExcel(rows, periodLabel)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
            </>
          )}

          {generated && totalPages > 1 && (
            <span className="text-gray-500 text-xs">
              {totalPages} page{totalPages !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Paginated A4 preview — scrollable on small screens */}
      {generated && (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="report-print-area min-w-[320px]">

          {pages.map((pageRows, pageIdx) => {
            const isFirstPage = pageIdx === 0
            const isLastDataPage = pageIdx === pages.length - 1
            const showSignature = isLastDataPage && signatureOnLastDataPage

            return (
              <div key={pageIdx} className="report-sheet" style={SHEET_STYLE}>

                {/* Header — page 1 only */}
                {isFirstPage && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '6pt' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/branding/ausg-header.png" alt="AUSG Header"
                        style={{ width: '100%', maxHeight: '32mm', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '8pt' }}>
                      <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 2pt' }}>
                        Adamson University Student Government
                      </p>
                      <p style={{ fontSize: '9pt', margin: '0 0 2pt' }}>Office of the Auditor</p>
                      <p style={{ fontSize: '11pt', fontWeight: 'bold', margin: '3pt 0 2pt' }}>
                        Approved Asset Borrowing Report
                      </p>
                      <p style={{ fontSize: '9pt', margin: '0 0 2pt' }}>
                        For the Month of: <strong>{periodLabel}</strong>
                      </p>
                      <p style={{ fontSize: '8pt', color: '#555', margin: '0 0 1pt' }}>
                        Status: Approved only &nbsp;|&nbsp; Report basis: Date Submitted
                      </p>
                      <p style={{ fontSize: '8pt', color: '#555', margin: '0' }}>
                        Prepared on: {preparedDate}
                      </p>
                    </div>
                  </>
                )}

                {!isFirstPage && (
                  <p style={{ fontSize: '8pt', color: '#777', marginBottom: '4pt', textAlign: 'right' }}>
                    (continued — page {pageIdx + 1})
                  </p>
                )}

                {rows.length === 0 ? (
                  <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#555', margin: '20pt 0' }}>
                    No approved requests submitted in {periodLabel}.
                  </p>
                ) : (
                  <table style={TABLE_STYLE}>
                    <colgroup>
                      {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
                    </colgroup>
                    <TableHeader />
                    <DataRows rows={pageRows} />
                  </table>
                )}

                {showSignature && <SignatureBlock />}
              </div>
            )
          })}

          {!signatureOnLastDataPage && (
            <div className="report-sheet" style={SHEET_STYLE}>
              <SignatureBlock />
            </div>
          )}

          </div>
        </div>
      )}

    </div>
  )
}
