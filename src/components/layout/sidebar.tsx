"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Briefcase, Users, CheckSquare,
  Calendar, DollarSign, FileText, Settings, LogOut, Scale,
} from "lucide-react";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/processos", icon: Briefcase, label: "Processos" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/tarefas", icon: CheckSquare, label: "Tarefas & Prazos" },
  { href: "/agenda", icon: Calendar, label: "Agenda" },
  { href: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { href: "/documentos", icon: FileText, label: "Documentos" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-stone-900">
      {/* Logo L&V */}
      <div className="flex items-center gap-3 border-b border-stone-700 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-wide">L&V</p>
          <p className="text-xs text-stone-400">Advocacia</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-600 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-700 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
