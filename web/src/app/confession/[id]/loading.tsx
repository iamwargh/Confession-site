/**
 * CONFESSION DETAIL PAGE SKELETON LOADER — AI-34
 * Shown while the single confession is fetched from Supabase.
 */
export default function ConfessionDetailLoading() {
    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Back link skeleton */}
                <div className="h-5 w-24 rounded bg-muted/40 animate-pulse" />

                {/* Confession card skeleton */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-muted/60 animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                            <div className="h-3 w-14 rounded bg-muted/40 animate-pulse" />
                        </div>
                    </div>

                    {/* Full text skeleton — more lines since it's a detail view */}
                    <div className="space-y-2.5">
                        <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                        <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                        <div className="h-4 w-[93%] rounded bg-muted/40 animate-pulse" />
                        <div className="h-4 w-[80%] rounded bg-muted/40 animate-pulse" />
                        <div className="h-4 w-[60%] rounded bg-muted/40 animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <div className="h-5 w-16 rounded bg-muted/40 animate-pulse" />
                        <div className="h-4 w-12 rounded bg-muted/30 animate-pulse" />
                    </div>
                </div>

                {/* Comments placeholder skeleton */}
                <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
                    <div className="h-5 w-28 rounded bg-muted/50 animate-pulse" />
                    <div className="h-4 w-56 rounded bg-muted/30 animate-pulse" />
                </div>
            </div>
        </div>
    )
}
