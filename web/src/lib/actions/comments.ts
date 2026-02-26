'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type CommentReportReason = 'spam' | 'harassment' | 'hate_speech' | 'self_harm' | 'misinformation' | 'other'

export interface CommentData {
    id: string
    confession_id: string
    content: string
    username: string
    likes_count: number
    created_at: string
    user_id: string
    currentUserLiked?: boolean
    reportedByUser?: boolean
}

// Validation schemas
const AddCommentSchema = z.object({
    confessionId: z.string().uuid(),
    content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long (max 500 chars)'),
})

export async function getComments(confessionId: string): Promise<{ success: boolean; comments?: CommentData[]; error?: string }> {
    try {
        const supabase = await createClient()

        // Fetch comments with nested profiles
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                id, confession_id, content, likes_count, created_at, user_id, profiles(username)
            `)
            .eq('confession_id', confessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })

        if (error) throw error

        if (!comments || comments.length === 0) {
            return { success: true, comments: [] }
        }

        // Map the joined data
        const mappedComments = comments.map(c => ({
            id: c.id,
            confession_id: c.confession_id,
            content: c.content,
            username: (c.profiles as any)?.username || 'user',
            likes_count: c.likes_count,
            created_at: c.created_at,
            user_id: c.user_id,
        })) as CommentData[]

        // Get current user to check likes/reports
        const { data: { user } } = await supabase.auth.getUser()

        // Enrich comments with currentUserLiked and reportedByUser
        let enrichedComments = mappedComments

        if (user) {
            const commentIds = comments.map(c => c.id)

            // Fetch likes by this user for these comments
            const { data: likes } = await supabase
                .from('comment_likes')
                .select('comment_id')
                .eq('user_id', user.id)
                .in('comment_id', commentIds)

            const likedSet = new Set(likes?.map(l => l.comment_id) || [])

            // Fetch reports by this user for these comments
            const { data: reports } = await supabase
                .from('comment_reports')
                .select('comment_id')
                .eq('reported_by', user.id)
                .in('comment_id', commentIds)

            const reportedSet = new Set(reports?.map(r => r.comment_id) || [])

            enrichedComments = mappedComments.map(c => ({
                ...c,
                currentUserLiked: likedSet.has(c.id),
                reportedByUser: reportedSet.has(c.id)
            }))
        } else {
            enrichedComments = mappedComments.map(c => ({
                ...c,
                currentUserLiked: false,
                reportedByUser: false
            }))
        }

        return { success: true, comments: enrichedComments }
    } catch (error: any) {
        console.error('getComments error:', error)
        return { success: false, error: error.message || 'Failed to load comments' }
    }
}

export async function addComment(confessionId: string, content: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'You must be logged in to comment.' }
        }

        // Validate
        const validation = AddCommentSchema.safeParse({ confessionId, content })
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0].message }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_suspended, username')
            .eq('id', user.id)
            .single()

        if (profile?.is_suspended) {
            return { success: false, error: 'Your account is suspended. You cannot comment.' }
        }

        const { data, error } = await supabase
            .from('comments')
            .insert({
                confession_id: confessionId,
                user_id: user.id,
                content: content.trim()
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error inserting comment:', error)
            return { success: false, error: 'Failed to post comment.' }
        }

        revalidatePath(`/confession/${confessionId}`)
        return { success: true, comment: { ...data, username: profile?.username || 'user' } }
    } catch (error: any) {
        console.error('addComment error:', error)
        return { success: false, error: 'An unexpected error occurred.' }
    }
}

export async function toggleCommentLike(commentId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Must be logged in to like.' }

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('comment_id', commentId)
            .single()

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('comment_likes')
                .delete()
                .eq('id', existingLike.id)

            if (error) throw error

            return { success: true, liked: false }
        } else {
            // Like
            const { error } = await supabase
                .from('comment_likes')
                .insert({ user_id: user.id, comment_id: commentId })

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    return { success: true, liked: true }
                }
                throw error
            }

            return { success: true, liked: true }
        }
    } catch (error: any) {
        console.error('toggleCommentLike error:', error)
        return { success: false, error: 'Failed to toggle like.' }
    }
}

export async function reportComment(commentId: string, reason: CommentReportReason) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: 'Must be logged in to report.' }

        const { error } = await supabase
            .from('comment_reports')
            .insert({
                comment_id: commentId,
                reported_by: user.id,
                reason: reason
            })

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'You have already reported this comment.' }
            }
            if (error.code === '23514') { // Check constraint
                return { success: false, error: 'You cannot report your own comment.' }
            }
            throw error
        }

        return { success: true }
    } catch (error: any) {
        console.error('reportComment error:', error)
        return { success: false, error: 'Failed to report comment. Try again.' }
    }
}
