/**
 * HOME FEED SKELETON LOADER — AI-34
 * Full skeleton matching the real home feed layout.
 * Shown by Next.js automatically while server data fetches.
 */
export default function Loading() {
    return (
        <div className="py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Page header skeleton */}
                <div className="space-y-2">
                    <div className="h-8 w-48 rounded-lg bg-muted/60 animate-pulse" />
                    <div className="h-4 w-64 rounded bg-muted/40 animate-pulse" />
                </div>

                {/* Confession card skeletons */}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        {/* Anonymous avatar + timestamp */}
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-muted/60 animate-pulse" />
                            <div className="space-y-1.5">
                                <div className="h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                                <div className="h-3 w-14 rounded bg-muted/40 animate-pulse" />
                            </div>
                        </div>

                        {/* Confession text lines */}
                        <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                            <div className="h-4 w-[88%] rounded bg-muted/40 animate-pulse" />
                            {i % 2 === 0 && (
                                <div className="h-4 w-[72%] rounded bg-muted/40 animate-pulse" />
                            )}
                        </div>

                        {/* Like & report actions */}
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
