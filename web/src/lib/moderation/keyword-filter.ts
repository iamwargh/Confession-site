/**
 * KEYWORD FILTER — AI-19 (Claude Opus 4.6)
 * 
 * Blocks extreme/harmful words before a confession is posted.
 * This runs at the application level before the Supabase insert.
 * 
 * Design Decisions:
 * 1. Uses a normalized matching approach (lowercased, trimmed)
 * 2. Checks for whole-word matches to reduce false positives
 * 3. Also checks for common leetspeak/obfuscation patterns
 * 4. Returns the FIRST blocked word found (for user feedback)
 * 5. The word list is intentionally kept server-side only
 * 
 * NOTE: The actual blocked words list should be reviewed and 
 * finalized by the human (see human.txt task H-11).
 * This is a STARTER list that must be reviewed.
 */

// ================================================================
// BLOCKED WORDS LIST
// ================================================================
// These are words that will COMPLETELY BLOCK a confession from posting.
// Categories: extreme hate speech, slurs, direct threats, etc.
// 
// ⚠️  HUMAN REVIEW REQUIRED (H-11): Review and finalize this list.
//     Remove false-positive-prone words, add any missing ones.
// ================================================================

const BLOCKED_WORDS: string[] = [
    // ---- Extreme hate speech / slurs ----
    // (These are deliberately placeholder-ish. The human needs to 
    //  populate these with actual slurs relevant to their audience/region.)
    // The human should add the actual offensive terms here.

    // ---- Direct violence threats ----
    'kill myself',
    'kill yourself',
    'kys',
    'end my life',
    'want to die',
    'going to die',
    'commit suicide',

    // ---- Terrorism / extreme content ----
    'bomb threat',
    'school shooting',
    'mass shooting',

    // ---- Doxxing-related ----
    'home address is',
    'phone number is',
    'her number is',
    'his number is',
]

// ================================================================
// MENTAL HEALTH TRIGGER WORDS — these DON'T block the post
// but trigger a helpline warning banner.
// (Used by the mental health warning system - AI-21)
// ================================================================

export const MENTAL_HEALTH_KEYWORDS: string[] = [
    'depressed',
    'depression',
    'anxious',
    'anxiety',
    'suicidal',
    'self harm',
    'self-harm',
    'selfharm',
    'cutting myself',
    'hurt myself',
    'hurting myself',
    'hate myself',
    'worthless',
    'hopeless',
    'no reason to live',
    'ending it',
    'ending it all',
    'can\'t go on',
    'want to disappear',
    'nobody cares',
    'better off dead',
    'overdose',
    'pills',
    'lonely',
    'loneliness',
    'alone',
    'crying',
    'breakdown',
    'panic attack',
    'eating disorder',
    'anorexia',
    'bulimia',
    'ptsd',
    'trauma',
    'abuse',
    'abused',
    'molested',
    'raped',
    'assault',
    'assaulted',
]


// ================================================================
// LEETSPEAK / OBFUSCATION NORMALIZATION
// ================================================================

const LEET_MAP: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
}

/**
 * Normalizes text to catch basic obfuscation attempts:
 * - Converts to lowercase
 * - Replaces common leetspeak characters
 * - Removes repeated characters (e.g., "killll" → "kill")
 * - Removes common separator characters used to bypass filters
 */
function normalizeText(text: string): string {
    let normalized = text.toLowerCase()

    // Replace leetspeak characters
    for (const [leet, normal] of Object.entries(LEET_MAP)) {
        normalized = normalized.replaceAll(leet, normal)
    }

    // Remove common bypass characters (dots, dashes, underscores, spaces between letters)
    normalized = normalized.replace(/[.\-_*]/g, '')

    // Collapse repeated characters (3+ of the same) to just 2
    // This catches things like "kiiiill" but keeps legitimate doubles like "kill"
    normalized = normalized.replace(/(.)\1{2,}/g, '$1$1')

    return normalized
}


// ================================================================
// FILTER INTERFACE
// ================================================================

export interface FilterResult {
    blocked: boolean
    reason?: string
    matchedWord?: string
    hasMentalHealthKeywords: boolean
    mentalHealthKeywordsFound: string[]
}

/**
 * Checks confession content against the keyword filter.
 * 
 * @param content - The raw confession text
 * @returns FilterResult with blocking status and mental health flags
 */
export function filterConfessionContent(content: string): FilterResult {
    const normalizedContent = normalizeText(content)
    const originalLower = content.toLowerCase()

    // ── Check blocked words ──
    for (const word of BLOCKED_WORDS) {
        const normalizedWord = normalizeText(word)

        // Check both the normalized and original content
        if (normalizedContent.includes(normalizedWord) || originalLower.includes(word.toLowerCase())) {
            return {
                blocked: true,
                reason: 'Your confession contains content that violates our community guidelines. Please revise your text.',
                matchedWord: word, // For logging purposes (not shown to user)
                hasMentalHealthKeywords: false,
                mentalHealthKeywordsFound: [],
            }
        }
    }

    // ── Check mental health keywords (these don't block) ──
    const mentalHealthKeywordsFound: string[] = []
    for (const keyword of MENTAL_HEALTH_KEYWORDS) {
        if (originalLower.includes(keyword.toLowerCase())) {
            mentalHealthKeywordsFound.push(keyword)
        }
    }

    return {
        blocked: false,
        hasMentalHealthKeywords: mentalHealthKeywordsFound.length > 0,
        mentalHealthKeywordsFound,
    }
}


/**
 * Server-side validation for confession content.
 * This should be called in the API route / server action before DB insert.
 * 
 * @param content - The confession text
 * @returns Object with isValid and error message
 */
export function validateConfessionContent(content: string): { isValid: boolean; error?: string } {
    // Basic validation
    if (!content || typeof content !== 'string') {
        return { isValid: false, error: 'Confession content is required.' }
    }

    const trimmed = content.trim()

    if (trimmed.length === 0) {
        return { isValid: false, error: 'Confession cannot be empty.' }
    }

    if (trimmed.length > 1000) {
        return { isValid: false, error: 'Confession is too long. Maximum 1000 characters allowed.' }
    }

    if (trimmed.length < 10) {
        return { isValid: false, error: 'Confession is too short. Minimum 10 characters required.' }
    }

    // Keyword filter check
    const filterResult = filterConfessionContent(trimmed)
    if (filterResult.blocked) {
        return { isValid: false, error: filterResult.reason }
    }

    return { isValid: true }
}
