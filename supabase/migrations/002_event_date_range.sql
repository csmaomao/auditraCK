-- =============================================================================
-- Migration 002: Add event_end_date to requests
-- Allows borrowing periods that span multiple days (e.g. June 5 to June 9).
-- event_date remains as the start date. event_end_date is nullable —
-- if NULL, the request covers a single day (same behavior as before).
-- =============================================================================

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS event_end_date DATE;

-- Index for range-based overlap queries
CREATE INDEX IF NOT EXISTS idx_requests_event_end_date ON requests(event_end_date);

COMMENT ON COLUMN requests.event_end_date IS
  'Optional end date for multi-day borrowing periods. NULL means single-day event.';
