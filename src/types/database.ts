/**
 * Shared union types that mirror the database CHECK constraints.
 * Update these if you add new statuses or roles in the database.
 */

/** Status of a borrower's form request */
export type RequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'

/** Derived availability status of an asset (not stored in DB, computed at query time) */
export type BorrowingStatus = 'Available' | 'Booked'

/** Role of an authenticated user */
export type UserRole = 'auditor' | 'admin'
