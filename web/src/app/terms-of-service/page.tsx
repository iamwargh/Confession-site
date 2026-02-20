import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service — ConfessIt",
    description:
        "Read the ConfessIt Terms of Service. Understand the rules for using our anonymous confession platform, including acceptable use, prohibited content, and account policies.",
};

export default function TermsOfServicePage() {
    const lastUpdated = "February 20, 2026";

    return (
        <div className="container mx-auto max-w-3xl py-12 px-4">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
                <p className="text-sm text-muted-foreground">
                    Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
                </p>
                <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> By creating an account or using
                    ConfessIt, you agree to these Terms. Please read them carefully. Violation of these Terms
                    may result in permanent suspension or deletion of your account.
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-10 text-[0.95rem] leading-relaxed text-foreground/80">

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                    <p>
                        These Terms of Service (&quot;Terms&quot;) govern your access to and use of ConfessIt
                        (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), an anonymous confession-sharing website. By
                        registering an account, posting content, or simply browsing the platform, you agree to
                        be bound by these Terms and our{" "}
                        <a href="/privacy-policy" className="text-primary underline hover:no-underline">
                            Privacy Policy
                        </a>
                        .
                    </p>
                    <p className="mt-3">
                        If you do not agree to these Terms, you must not use ConfessIt.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">2. Eligibility</h2>
                    <p>To use ConfessIt, you must:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li>Be at least <strong>13 years of age</strong> (or 16 in the EU, in compliance with GDPR).</li>
                        <li>
                            Provide a valid email address during registration and verify it before posting
                            content.
                        </li>
                        <li>
                            Not be an individual previously banned or permanently suspended from ConfessIt.
                        </li>
                        <li>
                            Have the legal capacity to enter into binding agreements in your jurisdiction.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">3. Account Registration</h2>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>
                            You must create an account using a real, valid email address. Disposable or fraudulent
                            email addresses may result in account removal.
                        </li>
                        <li>
                            Your chosen username must be unique and must not impersonate another person or brand.
                        </li>
                        <li>
                            You are responsible for maintaining the confidentiality of your password and for all
                            activity that occurs under your account.
                        </li>
                        <li>
                            You must immediately notify us if you become aware of any unauthorized use of your
                            account.
                        </li>
                        <li>
                            You may only maintain <strong>one active account</strong>. Creating multiple accounts
                            to circumvent bans or rate-limits is strictly prohibited.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">4. Acceptable Use</h2>
                    <p>
                        ConfessIt is a platform for sharing personal thoughts, feelings, and confessions
                        anonymously. Users are expected to use the platform in good faith and within the
                        bounds of these Terms.
                    </p>
                    <p className="mt-3 font-medium text-foreground">You MAY:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-1">
                        <li>Share personal confessions, thoughts, secrets, or feelings (text only, max 1,000 characters).</li>
                        <li>Like or react to other users&apos; confessions.</li>
                        <li>Report content that you believe violates these Terms.</li>
                        <li>Delete your own confessions at any time.</li>
                        <li>Delete your account and associated data at any time.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">5. Prohibited Content &amp; Conduct</h2>
                    <p>
                        The following types of content and behavior are strictly <strong>prohibited</strong> on
                        ConfessIt. Violations may result in immediate content removal, account suspension, or
                        permanent ban:
                    </p>

                    <div className="mt-4 space-y-4">
                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Illegal Content</p>
                            <p className="text-sm">
                                Any content that is illegal under applicable laws, including but not limited to:
                                child sexual abuse material (CSAM), threats of violence, incitement to terrorism,
                                doxxing (posting private personal information of others), or content that violates
                                intellectual property rights.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Harassment &amp; Targeted Abuse</p>
                            <p className="text-sm">
                                Posting confessions that are specifically designed to harass, bully, threaten, or
                                intimidate a specific individual, whether identified by name, username, or other
                                identifiable information.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Hate Speech</p>
                            <p className="text-sm">
                                Content that promotes, glorifies, or incites hatred or violence against individuals
                                or groups based on race, ethnicity, religion, gender, sexual orientation, disability,
                                or national origin.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Self-Harm Promotion</p>
                            <p className="text-sm">
                                Content that <em>promotes</em> or <em>encourages</em> suicide or self-harm. Note:
                                expressing personal feelings of distress is allowed — we have automatic support
                                resources displayed for such content. However, instructional or promotional content
                                is not permitted.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Spam &amp; Abuse</p>
                            <p className="text-sm">
                                Posting repetitive, irrelevant, or automated content. Attempting to game the like
                                system. Using the platform for advertising, affiliate marketing, or phishing.
                                Creating multiple accounts to bypass the 5-posts-per-day rate limit.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Platform Manipulation</p>
                            <p className="text-sm">
                                Attempting to bypass security measures, exploit vulnerabilities, engage in SQL
                                injection or XSS attacks, reverse-engineer the platform, or interfere with its
                                normal operation.
                            </p>
                        </div>

                        <div className="p-3 rounded-md border border-destructive/30 bg-destructive/5">
                            <p className="font-medium text-foreground mb-1">🚫 Impersonation</p>
                            <p className="text-sm">
                                Creating an account or posting content that falsely implies you are a ConfessIt
                                admin, staff member, or another real person.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">6. Content Ownership &amp; License</h2>
                    <p>
                        You retain ownership of the confessions you post. However, by submitting content to
                        ConfessIt, you grant us a <strong>non-exclusive, worldwide, royalty-free license</strong>{" "}
                        to display, store, and distribute your content on the platform.
                    </p>
                    <p className="mt-3">
                        This license ends when you delete your confession or your account, subject to the
                        retention policies outlined in our Privacy Policy.
                    </p>
                    <p className="mt-3">
                        You represent and warrant that you own or have the necessary rights to the content you
                        post, and that posting it does not violate the rights of any third party.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">7. Moderation &amp; Enforcement</h2>
                    <p>
                        ConfessIt operates with a three-tier moderation system: <strong>Users</strong>,{" "}
                        <strong>Admins</strong>, and <strong>Super Admins</strong>.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                        <li>
                            We reserve the right to remove any content that violates these Terms without prior
                            notice.
                        </li>
                        <li>
                            Accounts may be temporarily <strong>locked</strong> (1 day to 1 week) or{" "}
                            <strong>permanently banned</strong> at our discretion for violations.
                        </li>
                        <li>
                            An automated keyword filter scans confession content before it is posted. Content
                            matching banned keywords will be rejected.
                        </li>
                        <li>
                            Confessions containing keywords associated with mental health crises will
                            automatically display helpline information. This is a safety feature, not moderation.
                        </li>
                        <li>
                            If your account is locked or banned, you will receive a notification upon your next
                            login attempt. You may contact us to appeal a decision.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">8. Rate Limits</h2>
                    <p>
                        To maintain platform quality and prevent spam, each account is limited to a maximum of{" "}
                        <strong>5 confessions per day</strong>. Attempting to circumvent this limit (e.g., by
                        creating multiple accounts) is a violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">9. Mental Health &amp; Crisis Resources</h2>
                    <p>
                        We take user wellbeing seriously. If your confession contains keywords associated with
                        self-harm or mental health crises, ConfessIt will automatically display links to relevant
                        crisis helplines, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
                        <li><strong>iCall (India):</strong> 9152987821</li>
                        <li><strong>Vandrevala Foundation (India):</strong> 1860-2662-345 / 1800-2333-330</li>
                        <li><strong>AASRA (India):</strong> 9820466627</li>
                        <li><strong>International Association for Suicide Prevention:</strong> <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Find a crisis centre</a></li>
                    </ul>
                    <p className="mt-3">
                        This service is offered in good faith but is <strong>not a substitute for
                            professional mental health care</strong>. If you or someone you know is in immediate
                        danger, please contact your local emergency services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">10. Account Termination</h2>
                    <p>
                        <strong>You may delete your account</strong> at any time through your account settings.
                        Upon deletion, your personal data (email, username) will be permanently purged.
                    </p>
                    <p className="mt-3">
                        <strong>We may terminate or suspend your account</strong> immediately and without
                        notice if you:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                        <li>Violate any provision of these Terms.</li>
                        <li>Engage in activity that we reasonably believe poses a risk to other users or the platform.</li>
                        <li>Fail to maintain a valid, verified email address.</li>
                        <li>Create multiple accounts to evade a previous ban.</li>
                    </ul>
                    <p className="mt-3">
                        Upon permanent ban, you are prohibited from creating new accounts on ConfessIt.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">11. Disclaimers</h2>
                    <p>
                        ConfessIt is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> without
                        warranties of any kind, either express or implied, including but not limited to
                        warranties of merchantability, fitness for a particular purpose, or non-infringement.
                    </p>
                    <p className="mt-3">
                        We do not guarantee that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                        <li>The platform will be available at all times without interruptions.</li>
                        <li>Content posted by users is accurate, truthful, or appropriate.</li>
                        <li>The platform will be free from viruses or security vulnerabilities.</li>
                    </ul>
                    <p className="mt-3">
                        ConfessIt is not responsible for the content posted by users. All confessions represent
                        the personal views of anonymous users and do not reflect the views of ConfessIt or its
                        team.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">12. Limitation of Liability</h2>
                    <p>
                        To the fullest extent permitted by applicable law, ConfessIt and its operators shall not
                        be liable for any indirect, incidental, special, consequential, or punitive damages
                        arising from:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Your use of or inability to use the platform.</li>
                        <li>Unauthorized access to or alteration of your data.</li>
                        <li>Statements or conduct of third parties on the platform.</li>
                        <li>Any other matter relating to the platform.</li>
                    </ul>
                    <p className="mt-3">
                        In jurisdictions that do not allow the exclusion or limitation of liability for
                        consequential or incidental damages, our liability is limited to the maximum extent
                        permitted by law.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">13. Governing Law</h2>
                    <p>
                        These Terms are governed by and construed in accordance with the laws of{" "}
                        <strong>India</strong>, without regard to its conflict of law principles. Any disputes
                        arising from these Terms shall be subject to the exclusive jurisdiction of the courts
                        located in India.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">14. Changes to These Terms</h2>
                    <p>
                        We reserve the right to modify these Terms at any time. When we make changes, we will
                        update the &quot;Last updated&quot; date at the top of this page. Your continued use of ConfessIt
                        after any changes take effect constitutes your acceptance of the updated Terms.
                    </p>
                    <p className="mt-3">
                        For significant changes, we may attempt to notify registered users via email.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground mb-3">15. Contact Us</h2>
                    <p>
                        For questions about these Terms, to report a violation, or to appeal a moderation
                        decision, please contact us:
                    </p>
                    <div className="mt-3 p-4 rounded-lg border border-border bg-muted/20 text-sm">
                        <p><strong>Email:</strong> <a href="mailto:support@confessit.app" className="text-primary underline hover:no-underline">support@confessit.app</a></p>
                        <p className="mt-1"><strong>Platform:</strong> confessit.app</p>
                    </div>
                </section>

            </div>

            {/* Footer Nav */}
            <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
                <a href="/privacy-policy" className="hover:text-foreground transition-colors underline underline-offset-4">
                    ← Privacy Policy
                </a>
                <a href="/" className="hover:text-foreground transition-colors">
                    ← Back to Home
                </a>
            </div>
        </div>
    );
}
