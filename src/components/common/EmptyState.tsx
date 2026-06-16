/**
 * EmptyState — displayed when a table or list has no data.
 *
 * Usage:
 *   <EmptyState message="No requests found." />
 *   <EmptyState message="No assets match your search." action={<Button>Upload Inventory</Button>} />
 */

interface EmptyStateProps {
  message: string
  /** Optional action button or link rendered below the message */
  action?: React.ReactNode
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Neutral icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
