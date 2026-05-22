/**
 * StatusBadge — generic colored badge for any status string.
 *
 * For request statuses (Pending, Approved, etc.) use getStatusColor()
 * from statusHelpers. For borrowing statuses use getBorrowingStatusColor().
 * Pass the result as the `className` prop.
 */

interface StatusBadgeProps {
  label: string
  /** Tailwind classes for background + text + border color */
  className?: string
}

export default function StatusBadge({ label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
        ${className}
      `}
    >
      {label}
    </span>
  )
}
