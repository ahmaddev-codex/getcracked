import type { Metadata } from "next";
import { Balsamiq_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SignedOutNotice } from "./SignedOutNotice";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

/**
 * The roadmap node face (K5).
 *
 * Measured from the reference rather than guessed: the only web font it serves
 * is `balsamiq.woff2`, and the only place it applies it is the text inside
 * roadmap nodes. Header, navigation and headings all compute to the system
 * stack, so this is deliberately *not* the body font — using it everywhere
 * would look less like the reference, not more.
 *
 * Balsamiq Sans is SIL Open Font License, so it can be embedded. `next/font`
 * self-hosts it at build time, so there is no third-party request at runtime
 * and no layout shift while it loads.
 */
const nodeFont = Balsamiq_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-node-family",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "GetCracked",
  description:
    "Build real systems. Step by step. In your browser. Interactive DSA, System Design labs, and company-wise interview prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${nodeFont.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the theme before first paint. A React effect runs after
            paint, which is one frame of the wrong theme on every load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SignedOutNotice />
        <SiteHeader />
        {children}
        <div className="fixed bottom-3 right-3 z-50">
          <ThemeToggle />
        </div>

        {/* Vercel's own analytics and Core Web Vitals reporting. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
