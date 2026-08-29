import type { Metadata } from "next";
import "./globals.css";
import { SignedOutNotice } from "./SignedOutNotice";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "GetCracked",
  description:
    "Build real systems. Step by step. In your browser. Interactive DSA, System Design labs, and company-wise interview prep.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Applies the theme before first paint. A React effect runs after
            paint, which is one frame of the wrong theme on every load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SignedOutNotice />
        {children}
        <div className="fixed bottom-3 right-3 z-50">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
