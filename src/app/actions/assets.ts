'use server'

/**
 * Server actions for the Assets feature.
 * importAssetsAction is the only write operation — called after Confirm Import.
 * All Supabase writes happen server-side; credentials never reach the browser.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { importAssets } from '@/services/assetService'
import type { ParsedAssetRow } from '@/utils/excelParser'

export async function importAssetsAction(
  rows: ParsedAssetRow[],
  fileName: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const result = await importAssets(rows, { fileName, userId: user.id })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  revalidatePath('/assets')
  revalidatePath('/dashboard')
  return { success: true, count: rows.length }
}
