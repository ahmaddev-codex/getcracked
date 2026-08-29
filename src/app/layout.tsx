import type { Metadata } from "next";
import "./globals.css";
import { SignedOutNotice } from "./SignedOutNotice";

export const metadata: Metadata = {
  title: "GetCracked",
  description:
    "Build real systems. Step by step. In your browser. Interactive DSA, System Design labs, and company-wise interview prep.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SignedOutNotice />
        {children}
      </body>
    </html>
  );
}
