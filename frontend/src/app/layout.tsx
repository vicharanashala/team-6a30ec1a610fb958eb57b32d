import type { Metadata } from "next";
import "./globals.css";
import RouteAwareShell from "../components/route-aware-shell";

// Font stack (loaded via <link> tags below):
//   Plus Jakarta Sans   → body / UI text
//   Bricolage Grotesque → headings / titles
//   DM Serif Display    → TL;DR accent / decorative italic
//   Source Serif 4      → FAQ answer body text
//   Inter               → fallback / narrow UI

export const metadata: Metadata = {
  title: "Samagama — AI-Powered Internship Help Platform",
  description:
    "Official knowledge operating system for the Vicharanashala Internship (IIT Ropar).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-800">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Serif+Display:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap"
        />
      </head>
      <body className="h-full antialiased">
        <RouteAwareShell>{children}</RouteAwareShell>
      </body>
    </html>
  );
}