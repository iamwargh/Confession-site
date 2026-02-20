export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center container mx-auto px-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-10 w-10 text-primary"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-4 text-muted-foreground max-w-md">
                We&apos;ve sent a verification link to your email address. Please click the link to verify your account.
            </p>
            <div className="mt-8">
                <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the email? <button className="text-primary hover:underline font-medium">Click to resend</button>
                </p>
            </div>
        </div>
    );
}
