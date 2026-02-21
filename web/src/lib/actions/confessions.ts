'use server'

/**
 * CONFESSION SERVER ACTIONS — AI-11, AI-15, AI-16, AI-18, AI-20
 * (Claude Sonnet 4.6)
 *
 * Handles:
 * - createConfession: post a confession (rate-limited, filtered, validated)
 * - toggleLike: like/unlike with optimistic UI support
 * - reportConfession: report with reason
 * - deleteOwnConfession: user deletes their own post
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { filterConfessionContent } from '@/lib/moderation/keyword-filter'

const MAX_POSTS_PER_DAY = 5
const MAX_CONTENT_LENGTH = 1000
const MIN_CONTENT_LENGTH = 10

interface ActionResult {
    success: boolean
    error?: string
    data?: any
}

// ============================================================
// AI-11: CREATE CONFESSION (with AI-20 rate limiting)
// ============================================================

export async function createConfession(content: string): Promise<ActionResult> {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Debug: log auth state
    console.log('[createConfession] auth.getUser result:', {
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        userError: userError?.message ?? null,
    })

    if (!user) {
        console.error('[createConfession] No authenticated user found. userError:', userError)
        return { success: false, error: 'You must be logged in to post.' }
    }

    // Trim and validate content
    const trimmedContent = content.trim()

    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
        return { success: false, error: `Confession must be at least ${MIN_CONTENT_LENGTH} characters.` }
    }
    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
        return { success: false, error: `Confession must be ${MAX_CONTENT_LENGTH} characters or less.` }
    }

    // AI-20: Rate limit — max 5 posts per day
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
        .from('confessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('created_at', startOfDay.toISOString())

    if (countError) {
        console.error('[createConfession] Rate-limit count query error:', {
            code: countError.code,
            message: countError.message,
            details: countError.details,
            hint: countError.hint,
        })
        // Don't block posting if we can't count — just continue
    }

    console.log('[createConfession] Daily post count:', count, '/ max:', MAX_POSTS_PER_DAY)

    if ((count ?? 0) >= MAX_POSTS_PER_DAY) {
        return {
            success: false,
            error: `You've reached the daily limit of ${MAX_POSTS_PER_DAY} confessions. Come back tomorrow.`,
        }
    }

    // Keyword filter (AI-19 logic, checked here before insert)
    const filterResult = filterConfessionContent(trimmedContent)
    if (filterResult.blocked) {
        return {
            success: false,
            error: 'Your confession contains prohibited content and cannot be posted.',
        }
    }

    // Insert the confession
    console.log('[createConfession] Attempting insert for user_id:', user.id)

    const { data: insertData, error: insertError } = await supabase
        .from('confessions')
        .insert({
            user_id: user.id,
            content: trimmedContent,
            likes_count: 0,
            is_deleted: false,
        })
        .select('id')

    if (insertError) {
        console.error('[createConfession] Insert FAILED — full error:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
        })
        // Return the actual Supabase error message in dev, generic in prod
        const isDev = process.env.NODE_ENV === 'development'
        return {
            success: false,
            error: isDev
                ? `DB Error [${insertError.code}]: ${insertError.message}`
                : 'Failed to post confession. Please try again.',
        }
    }

    console.log('[createConfession] Insert SUCCESS, new confession id:', insertData?.[0]?.id)

    revalidatePath('/')
    revalidatePath('/my-confessions')

    return { success: true, data: { showMentalHealthBanner: filterResult.hasMentalHealthKeywords } }
}


// ============================================================
// AI-15: LIKE / UNLIKE TOGGLE
// ============================================================

export async function toggleLike(confessionId: string): Promise<ActionResult & { liked: boolean; newCount: number }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Must be logged in to like.', liked: false, newCount: 0 }

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('confession_id', confessionId)
        .eq('user_id', user.id)
        .single()

    let liked: boolean
    let delta: number

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('id', existingLike.id)

        if (error) return { success: false, error: 'Failed to unlike.', liked: true, newCount: 0 }

        liked = false
        delta = -1
    } else {
        // Like
        const { error } = await supabase
            .from('likes')
            .insert({ confession_id: confessionId, user_id: user.id })

        if (error) {
            if (error.code === '23505') {
                // Duplicate — already liked
                return { success: false, error: 'Already liked.', liked: true, newCount: 0 }
            }
            return { success: false, error: 'Failed to like.', liked: false, newCount: 0 }
        }

        liked = true
        delta = 1
    }

    // Update likes_count in confessions table
    const { data: confessionData } = await supabase
        .from('confessions')
        .select('likes_count')
        .eq('id', confessionId)
        .single()

    const currentCount = confessionData?.likes_count ?? 0
    const newCount = Math.max(0, currentCount + delta)

    await supabase
        .from('confessions')
        .update({ likes_count: newCount })
        .eq('id', confessionId)

    revalidatePath('/')
    revalidatePath('/trending')
    revalidatePath(`/confession/${confessionId}`)

    return { success: true, liked, newCount }
}


// ============================================================
// AI-16: REPORT CONFESSION
// ============================================================

export type ReportReason =
    | 'spam'
    | 'harassment'
    | 'hate_speech'
    | 'self_harm'
    | 'misinformation'
    | 'other'

export async function reportConfession(
    confessionId: string,
    reason: ReportReason,
    details?: string
): Promise<ActionResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Must be logged in to report.' }

    // Check if already reported by this user
    const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('confession_id', confessionId)
        .eq('reported_by', user.id)
        .single()

    if (existing) {
        return { success: false, error: 'You have already reported this confession.' }
    }

    const { error: insertError } = await supabase
        .from('reports')
        .insert({
            confession_id: confessionId,
            reported_by: user.id,
            reason,
            details: details?.trim() || null,
            status: 'pending',
        })

    if (insertError) {
        console.error('Error inserting report:', insertError)
        return { success: false, error: 'Failed to submit report. Please try again.' }
    }

    return { success: true }
}


// ============================================================
// AI-18: DELETE OWN CONFESSION
// ============================================================

export async function deleteOwnConfession(confessionId: string): Promise<ActionResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Verify ownership
    const { data: confession } = await supabase
        .from('confessions')
        .select('user_id')
        .eq('id', confessionId)
        .single()

    if (!confession) return { success: false, error: 'Confession not found.' }

    if (confession.user_id !== user.id) {
        return { success: false, error: 'You can only delete your own confessions.' }
    }

    // Soft delete
    const { error } = await supabase
        .from('confessions')
        .update({ is_deleted: true })
        .eq('id', confessionId)
        .eq('user_id', user.id)

    if (error) return { success: false, error: 'Failed to delete confession.' }

    revalidatePath('/')
    revalidatePath('/my-confessions')

    return { success: true }
}
