"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function RouteAwareShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCommunity = pathname?.startsWith("/community");

  if (isCommunity) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
