import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";

// Session-gated and not meant for search results — robots.txt disallows
// /admin too, but that only advises crawlers not to fetch it; this actually
// blocks indexing if a crawler reaches it some other way (a stray link, etc).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen justify-center overflow-hidden p-2.5 sm:p-5">
      <div className="flex w-full max-w-[1600px] overflow-hidden rounded-[28px] border border-border bg-surface/60 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
        <Nav />
        <main className="scrollbar-modern min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
