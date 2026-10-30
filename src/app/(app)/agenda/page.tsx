import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDatetime } from "@/lib/utils/format";

const TIPO_V: Record<string, string> = { COMUM: "default", CONCILIACAO: "info", INSTRUCAO: "warning", JULGAMENTO: "danger", VIRTUAL: "purple" };
const STATUS_V: Record<string, string> = { AGENDADA: "warning", REALIZADA: "success", CANCELADA: "default", ADIADA: "info" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { periodo = "proximas" } = await searchParams;

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const endOf3Months = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);

  const where =
    periodo === "proximas"
      ? { data: { gte: now }, status: "AGENDADA" as const }
      : periodo === "mes"
      ? { data: { gte: now, lte: endOfMonth } }
      : periodo === "3meses"
      ? { data: { gte: now, lte: endOf3Months } }
      : {};

  const audiencias = await prisma.audiencia.findMany({
    where,
    include: {
      processo: {
        include: { cliente: true },
      },
    },
    orderBy: { data: "asc" },
  });

  // Group by month
  const grouped = audiencias.reduce<Record<string, typeof audiencias>>((acc, a) => {
    const key = new Date(a.data).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const TABS = [
    { key: "proximas", label: "Próximas" },
    { key: "mes", label: "Este mês" },
    { key: "3meses", label: "3 meses" },
    { key: "", label: "Todas" },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Agenda</h1>
            <p className="text-sm text-stone-500">{audiencias.length} audiência(s)</p>
          </div>
        </div>

        <nav className="mt-4 flex gap-1">
          {TABS.map(t => (
            <Link
              key={t.key}
              href={`/agenda?periodo=${t.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                periodo === t.key ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Calendar className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">Nenhuma audiência encontrada</p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-8">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400 capitalize">{month}</h2>
                <div className="space-y-3">
                  {items.map(a => (
                    <div key={a.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm flex items-start gap-4 hover:border-amber-200 transition-colors">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-center">
                        <span className="text-lg font-bold text-amber-700 leading-none">{new Date(a.data).getDate()}</span>
                        <span className="text-xs text-amber-500 capitalize">
                          {new Date(a.data).toLocaleString("pt-BR", { weekday: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-stone-900">{a.titulo}</p>
                          <Badge variant={STATUS_V[a.status]}>{a.status}</Badge>
                          <Badge variant={TIPO_V[a.tipo]}>{a.tipo}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDatetime(a.data)}
                          {a.local ? ` · ${a.local}` : ""}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <Link href={`/processos/${a.processo.id}`} className="text-xs text-amber-600 hover:underline">
                            {a.processo.titulo}
                          </Link>
                          <span className="text-xs text-stone-400">· {a.processo.cliente.nome}</span>
                        </div>
                        {a.observacoes && <p className="mt-1 text-xs text-stone-400">{a.observacoes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
