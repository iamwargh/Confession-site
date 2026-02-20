'use client'

import { useState, useEffect } from 'react'
import { X, Heart, Phone, ExternalLink } from 'lucide-react'

/**
 * MENTAL HEALTH WARNING COMPONENT — AI-21 (Claude Opus 4.6)
 * 
 * Shows a compassionate, non-intrusive banner when a confession
 * contains mental health related keywords.
 * 
 * Design Philosophy:
 * - NOT blocking — the confession still posts
 * - Caring and supportive tone, not clinical
 * - Shows relevant India helpline numbers
 * - Dismissable but noticeable
 * - Appears BOTH to the poster (before submitting) and 
 *   to readers (when viewing a confession with such content)
 */

interface HelplineInfo {
    name: string
    number: string
    description: string
    url?: string
    available: string
}

// India-specific helplines (confirmed by human task H-10)
const HELPLINES: HelplineInfo[] = [
    {
        name: 'iCall',
        number: '9152987821',
        description: 'Psychosocial helpline by TISS',
        url: 'https://icallhelpline.org',
        available: 'Mon-Sat, 8am-10pm',
    },
    {
        name: 'Vandrevala Foundation',
        number: '1860-2662-345',
        description: '24/7 mental health support',
        url: 'https://www.vandrevalafoundation.com',
        available: '24/7',
    },
    {
        name: 'AASRA',
        number: '9820466726',
        description: 'Crisis intervention & suicide prevention',
        url: 'http://www.aasra.info',
        available: '24/7',
    },
]

interface MentalHealthWarningProps {
    /** Whether to show the warning */
    show: boolean
    /** Specific keywords that were detected (optional, for adaptive messaging) */
    detectedKeywords?: string[]
    /** Called when user dismisses the warning */
    onDismiss?: () => void
    /** Variant: 'poster' shows before submitting, 'reader' shows when viewing */
    variant?: 'poster' | 'reader'
}

export function MentalHealthWarning({
    show,
    detectedKeywords = [],
    onDismiss,
    variant = 'reader'
}: MentalHealthWarningProps) {
    const [isVisible, setIsVisible] = useState(show)
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        setIsVisible(show)
    }, [show])

    if (!isVisible) return null

    const handleDismiss = () => {
        setIsVisible(false)
        onDismiss?.()
    }

    // Adaptive messaging based on detected keywords
    const isSuicidal = detectedKeywords.some(k =>
        ['suicidal', 'kill myself', 'end my life', 'ending it', 'better off dead', 'no reason to live', 'want to die'].includes(k)
    )
    const isSelfHarm = detectedKeywords.some(k =>
        ['self harm', 'self-harm', 'selfharm', 'cutting myself', 'hurt myself', 'hurting myself'].includes(k)
    )

    return (
        <div
            className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-5 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-500"
            role="alert"
            aria-live="polite"
        >
            {/* Decorative gradient border glow */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

            {/* Close button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-400 transition-colors p-1 rounded-full hover:bg-amber-500/10"
                aria-label="Dismiss warning"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-amber-400" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Main message */}
                    <h3 className="text-base font-semibold text-amber-200 mb-1">
                        {variant === 'poster' ? 'Before you post...' : 'You\'re not alone'}
                    </h3>

                    <p className="text-sm text-amber-100/80 leading-relaxed mb-3">
                        {isSuicidal
                            ? 'If you\'re having thoughts of suicide, please reach out to someone who can help. You matter, and support is available right now.'
                            : isSelfHarm
                                ? 'If you\'re struggling with self-harm, please know that help is available. You deserve support and care.'
                                : 'This appears to touch on sensitive topics. If you or someone you know needs support, these resources are available 24/7.'
                        }
                    </p>

                    {/* Helpline Cards */}
                    <div className="space-y-2">
                        {HELPLINES.slice(0, isExpanded ? HELPLINES.length : 2).map((helpline) => (
                            <div
                                key={helpline.name}
                                className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
                            >
                                <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-amber-100">{helpline.name}</span>
                                        <span className="text-xs text-amber-300/60">({helpline.available})</span>
                                    </div>
                                    <a
                                        href={`tel:${helpline.number.replace(/[^0-9+]/g, '')}`}
                                        className="text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors"
                                    >
                                        {helpline.number}
                                    </a>
                                </div>
                                {helpline.url && (
                                    <a
                                        href={helpline.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-400/50 hover:text-amber-400 transition-colors"
                                        aria-label={`Visit ${helpline.name} website`}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Show more / less */}
                    {HELPLINES.length > 2 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-2 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                        >
                            {isExpanded ? 'Show less' : `Show ${HELPLINES.length - 2} more helpline${HELPLINES.length - 2 > 1 ? 's' : ''}`}
                        </button>
                    )}

                    {/* Supportive footer for poster variant */}
                    {variant === 'poster' && (
                        <p className="mt-3 text-xs text-amber-100/50 italic">
                            Your confession will still be posted. This message is just a reminder that help is available. ❤️
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
