'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * GLOBAL ERROR BOUNDARY — AI-34
 * Catches uncaught errors in the React tree and shows a branded recovery UI.
 * The reset() function tries to re-render the subtree that failed.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console (would be replaced by a monitoring service like Sentry in prod)
        console.error('[Global Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
            {/* Icon */}
            <div className="relative">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-9 w-9 text-destructive" />
                </div>
                <div className="absolute inset-0 rounded-full bg-destructive/5 blur-xl scale-150 pointer-events-none" />
            </div>

            {/* Message */}
            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Don&apos;t worry — your secrets are safe. This is just a temporary glitch on our end.
                </p>
                {/* Show digest in dev only */}
                {process.env.NODE_ENV === 'development' && error.digest && (
                    <p className="text-xs text-muted-foreground/50 font-mono">
                        Digest: {error.digest}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button
                    id="error-retry-btn"
                    onClick={reset}
                    variant="default"
                    className="flex items-center gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try again
                </Button>
                <Link href="/">
                    <Button
                        id="error-home-btn"
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Go home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
