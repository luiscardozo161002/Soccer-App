import { Nav } from "@/components/nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center p-2.5 sm:p-5">
      <div className="flex w-full max-w-[1440px] overflow-hidden rounded-[28px] border border-white/70 bg-white/55 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm">
        <Nav />
        <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
