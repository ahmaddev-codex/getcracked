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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://getcracked-dev.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "GetCracked — Master DSA & System Design Step by Step",
    template: "%s | GetCracked",
  },
  description:
    "The premier interactive engineering interview preparation platform. Master Data Structures & Algorithms with step-by-step visualizers, solve real-world System Design labs, and crack FAANG technical interviews in your browser.",
  keywords: [
    "data structures visualizer",
    "system design interview",
    "coding interview practice",
    "dsa roadmap",
    "leetcode alternatives",
    "interactive coding problems",
    "software engineering interview",
    "binary search tree visualizer",
    "heap sift down animation",
    "company interview questions",
    "multi-language code runner",
  ],
  authors: [{ name: "GetCracked Team" }],
  creator: "GetCracked",
  publisher: "GetCracked",
  category: "Education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "GetCracked",
    title: "GetCracked — Master DSA & System Design Step by Step",
    description:
      "Interactive Data Structure visualizers, real-world System Design architecture labs, multi-language sandbox, and curated FAANG company challenge sets.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GetCracked — Technical Interview Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GetCracked — Master DSA & System Design Step by Step",
    description:
      "Interactive Data Structure visualizers, real-world System Design architecture labs, multi-language sandbox, and curated FAANG company challenge sets.",
    images: ["/opengraph-image"],
    creator: "@getcracked",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/getcracked_favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/getcracked_favicon.svg",
    apple: "/getcracked.png",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "GetCracked",
      description:
        "Master Data Structures & Algorithms and Real-World System Design step by step in your browser.",
      publisher: {
        "@type": "Organization",
        name: "GetCracked",
        logo: {
          "@type": "ImageObject",
          url: `${APP_URL}/getcracked_logo_dark.svg`,
        },
      },
    },
    {
      "@type": "EducationalApplication",
      name: "GetCracked Interactive Learning Platform",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Stepwise Data Structure Visualizer with True Spatial Motion",
        "In-Browser Multi-Language Code Runner (TypeScript, JavaScript, Python, Java, C++, Go)",
        "Interactive System Design Topology Canvas and Capacity Estimator",
        "Targeted FAANG Problem Sets with Automated Test Execution",
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${nodeFont.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the theme before first paint. A React effect runs after
            paint, which is one frame of the wrong theme on every load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="icon" href="/getcracked_favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/getcracked.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
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
