import type { Metadata } from "next";
import { Balsamiq_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SignedOutNotice } from "./SignedOutNotice";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { AssistantProvider, AssistantPanel } from "@/components/assistant";

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
  icons: {
    icon: "/getcracked_favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${nodeFont.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the theme before first paint. A React effect runs after
            paint, which is one frame of the wrong theme on every load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="icon" href="/getcracked_favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col">
        <AssistantProvider>
          <SignedOutNotice />
          <SiteHeader />
          {children}
          <AssistantPanel />
          <div className="fixed bottom-3 right-3 z-40">
            <ThemeToggle />
          </div>
        </AssistantProvider>

        {/* Vercel's own analytics and Core Web Vitals reporting. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
