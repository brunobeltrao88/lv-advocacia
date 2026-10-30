import { Suspense } from "react";

export const instant = false;
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Suspense fallback={<aside className="w-64 shrink-0 bg-stone-900" />}>
        <Sidebar />
      </Suspense>
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
