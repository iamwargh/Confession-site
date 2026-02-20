export default function NotFound() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center">
            <div className="text-9xl font-black text-muted-foreground/20">404</div>
            <h2 className="text-4xl font-bold tracking-tight">Page not found</h2>
            <p className="text-muted-foreground max-w-md">
                Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or doesn&apos;t exist.
            </p>
            <a
                href="/"
                className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
                Go back home
            </a>
        </div>
    );
}
