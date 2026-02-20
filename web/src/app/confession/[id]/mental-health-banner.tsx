'use client'

/**
 * Client wrapper for MentalHealthWarning on confession detail pages.
 * Uses the keyword filter to detect mental health keywords in content
 * and shows the reader-variant banner if any are found.
 */

import { useMemo } from 'react'
import { MentalHealthWarning } from '@/components/moderation/MentalHealthWarning'
import { filterConfessionContent } from '@/lib/moderation/keyword-filter'

interface Props {
    content: string
}

export function MentalHealthBannerWrapper({ content }: Props) {
    const filterResult = useMemo(() => {
        return filterConfessionContent(content)
    }, [content])

    if (!filterResult.hasMentalHealthKeywords) return null

    return (
        <MentalHealthWarning
            show={true}
            variant="reader"
            detectedKeywords={filterResult.mentalHealthKeywordsFound}
        />
    )
}
