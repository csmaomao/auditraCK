/**
 * Currency formatting utilities.
 * AUSG uses Philippine Peso (PHP).
 */

/**
 * Formats a number as Philippine Peso currency.
 * Example: 1500 → "₱1,500.00"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number with comma separators (no currency symbol).
 * Example: 1500 → "1,500.00"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
