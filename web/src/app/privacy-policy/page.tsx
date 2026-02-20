import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy — ConfessIt",
    description:
        "Read the ConfessIt Privacy Policy to understand how we collect, use, and protect your data on our anonymous confession platform.",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = "February 20, 2026";

    return (
        <div className="container mx-auto max-w-3xl py-12 px-4">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">
                    Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
                </p>
                <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
                    <strong className="text-foreground">TL;DR:</strong> ConfessIt is built around anonymity.
                    Your confessions are never publicly linked to your identity. We collect minimal data,
                    we don't sell it, and you can delete your account at any time.
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-10 text-[0.95rem] leading-relaxed text-foreground/80">

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
                    <p>
                        ConfessIt (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an anonymous online confession platform where
                        registered users can share thoughts, feelings, and secrets without their identity being
                        revealed to the public. This Privacy Policy explains how we collect, use, store, and
                        protect information when you use our website (<strong>confessit.app</strong>).
                    </p>
                    <p className="mt-3">
                        By using ConfessIt, you agree to the practices described in this policy. If you do not
                        agree, please discontinue use of our platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>

                    <h3 className="text-base font-semibold text-foreground mb-2 mt-4">2.1 Information You Provide</h3>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                            <strong>Email address</strong> — required for account creation and email verification.
                            Your email is never displayed publicly.
                        </li>
                        <li>
                            <strong>Username</strong> — a unique handle you choose. This is stored internally but
                            is <em>never shown on any public confession</em>.
                        </li>
                        <li>
                            <strong>Password</strong> — stored as a secure cryptographic hash via Supabase Auth.
                            We never store your plain-text password.
                        </li>
                        <li>
                            <strong>Confession content</strong> — text you submit (max 1,000 characters). All
                            confessions are displayed publicly under the label &quot;Anonymous&quot;.
                        </li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-2 mt-5">2.2 Automatically Collected Information</h3>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                            <strong>IP address</strong> — logged by our hosting provider (Vercel) for security,
                            rate-limiting, and abuse prevention. Not stored permanently by us.
                        </li>
                        <li>
                            <strong>Browser / device type</strong> — collected in server logs for debugging and
                            compatibility.
                        </li>
                        <li>
                            <strong>Usage data</strong> — pages visited, timestamps of actions (e.g., post
                            creation, likes). Used for moderation and platform health.
                        </li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-2 mt-5">2.3 Cookies</h3>
                    <p>
                        We use minimal, essential cookies only:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li>
                            <strong>Authentication session cookie</strong> — set by Supabase Auth to keep you
                            logged in. This is a strictly necessary cookie and cannot be opted out of while using
                            the platform.
                        </li>
                    </ul>
                    <p className="mt-2">
                        We do <strong>not</strong> use advertising cookies, cross-site tracking, or analytics
                        cookies from third parties (e.g., Google Analytics).
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>To create and manage your account.</li>
                        <li>To send a one-time email verification link upon signup.</li>
                        <li>To send a password reset link if you request one.</li>
                        <li>
                            To enforce our rate limits (max 5 confessions per day) and detect abuse.
                        </li>
                        <li>
                            To allow administrators and super administrators to review reported content and take
                            moderation actions (e.g., account suspension, post deletion).
                        </li>
                        <li>
                            To detect dangerous or self-harm-related content and display mental health helpline
                            information automatically.
                        </li>
                        <li>To maintain our activity log for admin accountability.</li>
                    </ul>
                    <p className="mt-4">
                        We do <strong>not</strong> use your data for targeted advertising, profiling, or sale to
                        third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">4. Anonymity &amp; How It Works</h2>
                    <p>
                        Every confession posted on ConfessIt is displayed publicly as &quot;Anonymous&quot;. Your
                        username and email are <strong>never</strong> shown on the public feed or confession
                        detail pages.
                    </p>
                    <p className="mt-3">
                        However, your account is internally linked to your confessions in our database for the
                        following legitimate purposes:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li>Allowing you to view and delete your own confessions.</li>
                        <li>Enforcing per-user rate limits.</li>
                        <li>
                            Allowing Super Administrators to investigate serious violations (e.g., threats, illegal
                            content) when strictly necessary.
                        </li>
                    </ul>
                    <p className="mt-3">
                        <strong>Important:</strong> While we take privacy seriously, ConfessIt is not designed
                        to be used for illegal activities. In the event of a credible legal obligation (e.g., a
                        court order), we may be required to disclose account information to law enforcement.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Storage &amp; Security</h2>
                    <p>
                        All data is stored securely using <strong>Supabase</strong> (PostgreSQL database hosted
                        on AWS infrastructure). We implement the following security measures:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li>Row Level Security (RLS) policies on all database tables.</li>
                        <li>All communication is encrypted via HTTPS / TLS (enforced by Vercel).</li>
                        <li>Passwords are hashed using Supabase Auth&apos;s built-in bcrypt implementation.</li>
                        <li>Admin and Super Admin routes are protected by server-side middleware.</li>
                    </ul>
                    <p className="mt-3">
                        While we take reasonable precautions, no system is 100% secure. We cannot guarantee
                        absolute security of your data.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                            <strong>Your account data</strong> (email, username, password hash) is retained as
                            long as your account is active.
                        </li>
                        <li>
                            <strong>Confessions</strong> are retained indefinitely unless deleted by you, an
                            Admin, or a Super Admin.
                        </li>
                        <li>
                            <strong>Reports and admin action logs</strong> are retained for accountability
                            purposes even after the underlying content is deleted.
                        </li>
                        <li>
                            <strong>On account deletion:</strong> your personal information (email, username) is
                            permanently purged. Your confessions may be anonymized or deleted depending on our
                            moderation needs.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">7. Third-Party Services</h2>
                    <p>We rely on the following trusted third-party services:</p>
                    <div className="mt-3 space-y-3">
                        <div className="p-3 rounded-md border border-border bg-muted/20">
                            <p className="font-medium text-foreground">Supabase</p>
                            <p className="text-sm">Database, Authentication, and backend infrastructure. Supabase&apos;s privacy policy applies to their data handling: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">supabase.com/privacy</a></p>
                        </div>
                        <div className="p-3 rounded-md border border-border bg-muted/20">
                            <p className="font-medium text-foreground">Vercel</p>
                            <p className="text-sm">Hosting and content delivery. Vercel&apos;s privacy policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">vercel.com/legal/privacy-policy</a></p>
                        </div>
                    </div>
                    <p className="mt-3">
                        We do not integrate any social media logins, ad networks, or data brokers.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights</h2>
                    <p>Depending on your location, you may have the following rights:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
                        <li><strong>Correction:</strong> Update your username or email through your account settings.</li>
                        <li><strong>Deletion:</strong> Delete your account at any time via the &quot;Delete Account&quot; option in your settings. This triggers a permanent data purge.</li>
                        <li><strong>Objection:</strong> Object to certain types of processing (where applicable under law).</li>
                    </ul>
                    <p className="mt-3">
                        To exercise any of these rights, contact us at the email below.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">9. Children&apos;s Privacy</h2>
                    <p>
                        ConfessIt is not intended for use by anyone under the age of <strong>13</strong> (or 16
                        in the EU under GDPR). We do not knowingly collect personal information from minors. If
                        you believe a minor has created an account, please contact us immediately and we will
                        delete the account.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. When we do, we will update the
                        &quot;Last updated&quot; date at the top of this page. Continued use of ConfessIt after changes
                        are posted constitutes your acceptance of the updated policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
                    <p>
                        If you have any questions, concerns, or requests regarding this Privacy Policy, please
                        contact us:
                    </p>
                    <div className="mt-3 p-4 rounded-lg border border-border bg-muted/20 text-sm">
                        <p><strong>Email:</strong> <a href="mailto:privacy@confessit.app" className="text-primary underline hover:no-underline">privacy@confessit.app</a></p>
                        <p className="mt-1"><strong>Platform:</strong> confessit.app</p>
                    </div>
                </section>

            </div>

            {/* Footer Nav */}
            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
                <a href="/terms-of-service" className="hover:text-foreground transition-colors underline underline-offset-4">
                    Terms of Service →
                </a>
                <a href="/" className="hover:text-foreground transition-colors">
                    ← Back to Home
                </a>
            </div>
        </div>
    );
}
