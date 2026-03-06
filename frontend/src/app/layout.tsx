import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Cursor from "@/components/Cursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentScout AI — Neural Resume Intelligence",
  description: "LLM-powered extraction, 12-factor scoring, and deterministic ranking for 25+ resumes in under 30 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        </head>
        <body>
          <Cursor />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
