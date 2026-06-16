'use client'

interface ConfirmImportModalProps {
  open: boolean
  rowCount: number
  fileName: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmImportModal({ open, rowCount, fileName, loading, onConfirm, onCancel }: ConfirmImportModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-labelledby="confirm-import-title">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-6">

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 shrink-0">
            <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 id="confirm-import-title" className="text-gray-900 dark:text-white text-base font-semibold">Replace Asset Inventory?</h2>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            You are about to import <strong className="text-gray-900 dark:text-white">{rowCount} asset{rowCount !== 1 ? 's' : ''}</strong> from{' '}
            <strong className="text-gray-900 dark:text-white">{fileName}</strong>.
          </p>
          <div className="px-3 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs space-y-1">
            <p className="font-medium">This will:</p>
            <p>• Delete all current asset records</p>
            <p>• Replace them with the uploaded Excel file</p>
          </div>
          <div className="px-3 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-xs space-y-1">
            <p className="font-medium">This will NOT affect:</p>
            <p>• Requests and request history</p>
            <p>• Borrowed asset records (snapshot fields are preserved)</p>
            <p>• Uploaded attachments and scanned paperwork</p>
            <p>• Activity logs and profiles</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Importing…' : 'Confirm Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
