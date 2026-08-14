import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen justify-center overflow-hidden p-2.5 sm:p-5">
      <div className="flex w-full max-w-[1900px] overflow-hidden rounded-[28px] border border-border bg-surface/60 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
        <Nav />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
