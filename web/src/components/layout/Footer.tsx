import Link from 'next/link'
import { Heart } from 'lucide-react'

export function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/95 py-6">
            <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary fill-current" />
                    <span>
                        <span className="font-semibold text-foreground">OffChest</span>
                        {' '}&mdash; A safe, anonymous space.
                    </span>
                </div>

                {/* Links */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link href="/privacy-policy" className="hover:text-foreground transition-colors hover:underline">
                        Privacy Policy
                    </Link>
                    <Link href="/terms-of-service" className="hover:text-foreground transition-colors hover:underline">
                        Terms of Service
                    </Link>
                    <a
                        href="https://github.com/warghkali/Confession-site"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors hover:underline"
                    >
                        GitHub
                    </a>
                    <Link href="/account" className="hover:text-foreground transition-colors hover:underline">
                        My Account
                    </Link>
                </div>
            </div>
        </footer>
    )
}
