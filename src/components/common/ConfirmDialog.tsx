'use client'

/**
 * ConfirmDialog — reusable confirmation modal.
 *
 * Shows a title, message, and two buttons (confirm + cancel).
 * The caller controls open/close state and handles the confirm action.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showDialog}
 *     title="Delete request?"
 *     message="This cannot be undone."
 *     confirmLabel="Delete"
 *     confirmVariant="danger"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowDialog(false)}
 *   />
 */

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' renders the confirm button in red; 'primary' in purple */
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  /** Disable buttons while an async action is in progress */
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmClasses =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Panel */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-6">

        <h2 id="confirm-dialog-title" className="text-gray-900 dark:text-white text-base font-semibold mb-2">
          {title}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
              border border-gray-200 dark:border-gray-700
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium text-white
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
              disabled:opacity-50 disabled:cursor-not-allowed
              ${confirmClasses}
            `}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
