/**
 * MY CONFESSIONS PAGE SKELETON LOADER — AI-34
 * Shown by Next.js automatically while the server component fetches data.
 */
export default function MyConfessionsLoading() {
    return (
        <div className="py-8 px-4 min-h-screen">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 rounded-lg bg-muted/60 animate-pulse" />
                        <div className="h-4 w-36 rounded bg-muted/40 animate-pulse" />
                    </div>
                    <div className="h-9 w-20 rounded-md bg-muted/60 animate-pulse" />
                </div>

                {/* Confession card skeletons */}
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        {/* Card header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-muted/60 animate-pulse" />
                                <div className="space-y-1.5">
                                    <div className="h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                                    <div className="h-3 w-14 rounded bg-muted/40 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-6 w-6 rounded bg-muted/30 animate-pulse" />
                        </div>

                        {/* Content lines */}
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                            <div className="h-4 w-[85%] rounded bg-muted/40 animate-pulse" />
                            <div className="h-4 w-[70%] rounded bg-muted/40 animate-pulse" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                            <div className="h-5 w-16 rounded bg-muted/40 animate-pulse" />
                            <div className="h-4 w-12 rounded bg-muted/30 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
