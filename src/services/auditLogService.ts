/**
 * auditLogService.ts
 *
 * Internal activity logging — NOT exposed as a user-facing page.
 * Writes lightweight records to activity_logs for background tracking.
 *
 * Free-plan optimization:
 *   - Inserts only the minimum required fields (no SELECT after insert).
 *   - Fire-and-forget: errors are caught and logged to console only,
 *     so a logging failure never breaks the main user action.
 *   - No realtime subscriptions or polling — logs are write-only from
 *     the app's perspective.
 */

import { createClient } from '@/lib/supabase/server'

export type LogAction =
  | 'User logged in'
  | 'User logged out'
  | 'Request created'
  | 'Request updated'
  | 'Request deleted'
  | 'Asset inventory imported'
  | 'Monthly report generated'

/**
 * Writes a single row to activity_logs.
 *
 * @param userId     - UUID of the authenticated user performing the action
 * @param action     - Short action label (use LogAction constants above)
 * @param targetType - Optional: the table/entity being acted on (e.g. 'request')
 * @param targetId   - Optional: UUID of the specific record being acted on
 * @param description - Optional: human-readable detail about what changed
 */
export async function logActivity(
  userId: string,
  action: LogAction,
  targetType?: string,
  targetId?: string,
  description?: string
): Promise<void> {
  try {
    const supabase = await createClient()

    // Insert only the fields we need — no SELECT, no extra round-trips
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      description: description ?? null,
    })

    if (error) {
      // Log to console but do not throw — a logging failure should never
      // interrupt the main user action
      console.error('[auditLogService] Failed to write activity log:', error.message)
    }
  } catch (err) {
    console.error('[auditLogService] Unexpected error:', err)
  }
}
