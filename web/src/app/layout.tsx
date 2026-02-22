import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "OffChest — Anonymous Confessions",
  description:
    "A safe, anonymous space to share your deepest confessions, feelings, and secrets. Your truth matters.",
  keywords: ["confessions", "anonymous", "secrets", "feelings", "truth"],
  metadataBase: new URL("https://offchest.app"),
  openGraph: {
    title: "OffChest — Anonymous Confessions",
    description: "Share your secrets anonymously. A safe space for your truth.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          outfit.variable
        )}
      >
        <ToastProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col w-full h-full max-w-screen-xl mx-auto">
              {children}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
