'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdultGateClient({ children }: { children: React.ReactNode }) {
    const [isVerified, setIsVerified] = useState(false)
    const router = useRouter()

    if (!isVerified) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-card border border-rose-500/30 shadow-2xl rounded-2xl p-6 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Age Verification</h2>
                        <p className="text-sm text-muted-foreground">
                            This confession contains explicit (18+) content including strong language and adult themes.
                            Are you 18 years of age or older?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={() => router.push('/')}
                            className="h-12 w-full rounded-xl border border-border bg-background hover:bg-accent hover:text-foreground font-medium transition-colors"
                        >
                            No, go back
                        </button>
                        <button
                            onClick={() => setIsVerified(true)}
                            className="h-12 w-full rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-md shadow-rose-900/20"
                        >
                            Yes, I am 18+
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
