'use client'

/**
 * AssetUploadDropzone — drag-and-drop or click-to-upload for Excel inventory files.
 *
 * Accepts .xlsx and .xls only.
 * Parses the file client-side using excelParser and passes the result to the parent.
 * Nothing is written to Supabase here — that only happens after Confirm Import.
 */

import { useRef, useState } from 'react'
import { parseExcelFile, type ParsedAssetRow } from '@/utils/excelParser'

interface AssetUploadDropzoneProps {
  onParsed: (rows: ParsedAssetRow[], fileName: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

export default function AssetUploadDropzone({
  onParsed,
  onError,
  disabled = false,
}: AssetUploadDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      onError('Only .xlsx and .xls files are accepted.')
      return
    }

    setParsing(true)
    try {
      const rows = await parseExcelFile(file)
      onParsed(rows, file.name)
    } catch (err) {
      onError((err as Error).message)
    } finally {
      setParsing(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled || parsing) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !parsing) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !parsing && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3
        px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer
        transition-colors duration-150
        ${dragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/60'
        }
        ${(disabled || parsing) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || parsing}
      />

      {/* Upload icon */}
      <svg
        className={`w-10 h-10 ${dragging ? 'text-blue-400' : 'text-gray-600'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>

      {parsing ? (
        <p className="text-gray-400 text-sm">Parsing file…</p>
      ) : (
        <>
          <p className="text-gray-300 text-sm font-medium">
            Drop your Excel inventory file here
          </p>
          <p className="text-gray-500 text-xs">
            or click to browse — accepts .xlsx and .xls
          </p>
        </>
      )}
    </div>
  )
}
