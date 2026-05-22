/**
 * POST /api/auth/log
 *
 * Internal API route — writes a login/logout event to activity_logs.
 * Called fire-and-forget from the client after a successful auth action.
 *
 * Free-plan optimization:
 *   - Accepts only the minimum payload (userId + action).
 *   - Performs a single INSERT with no SELECT — one DB write per call.
 *   - No response body needed; returns 204 on success.
 */

import { NextResponse } from 'next/server'
import { logActivity, type LogAction } from '@/services/auditLogService'

const ALLOWED_ACTIONS: LogAction[] = ['User logged in', 'User logged out']

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, action } = body as { userId?: string; action?: string }

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    // Only allow the two auth-related actions through this endpoint
    if (!ALLOWED_ACTIONS.includes(action as LogAction)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await logActivity(userId, action as LogAction)

    return new NextResponse(null, { status: 204 })
  } catch {
    // Never let a logging failure surface as an error to the client
    return new NextResponse(null, { status: 204 })
  }
}
