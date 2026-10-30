import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { TarefaStatusToggle } from "@/components/tarefas/tarefa-status-toggle";
import { NovaTarefaForm } from "@/components/tarefas/nova-tarefa-form";

const PRIORIDADE_V: Record<string, string> = { URGENTE: "danger", ALTA: "warning", NORMAL: "default", BAIXA: "info" };
const STATUS_LABEL: Record<string, string> = { PENDENTE: "Pendente", EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", CANCELADA: "Cancelada" };

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; novo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { status = "ativas", novo = "" } = await searchParams;

  const where = status === "ativas"
    ? { status: { in: ["PENDENTE", "EM_ANDAMENTO"] } }
    : status === "concluidas"
    ? { status: "CONCLUIDA" }
    : {};

  const [tarefas, processos] = await Promise.all([
    prisma.tarefa.findMany({
      where,
      include: {
        processo: { select: { id: true, titulo: true } },
        responsavel: { select: { id: true, name: true } },
      },
      orderBy: [{ prioridade: "desc" }, { prazo: "asc" }],
    }),
    prisma.processo.findMany({
      where: { status: "ATIVO" },
      select: { id: true, titulo: true },
      orderBy: { titulo: "asc" },
      take: 100,
    }),
  ]);

  const users = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } });

  const urgentes = tarefas.filter(t => t.prioridade === "URGENTE" && t.status !== "CONCLUIDA").length;
  const vencidas = tarefas.filter(t => t.prazo && new Date(t.prazo) < new Date() && t.status !== "CONCLUIDA" && t.status !== "CANCELADA").length;

  const TABS = [
    { key: "ativas", label: "Ativas" },
    { key: "concluidas", label: "Concluídas" },
    { key: "", label: "Todas" },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Tarefas & Prazos</h1>
            <p className="text-sm text-stone-500">
              {tarefas.length} tarefa(s)
              {urgentes > 0 && <span className="ml-2 text-red-600 font-medium">· {urgentes} urgente(s)</span>}
              {vencidas > 0 && <span className="ml-2 text-red-600 font-medium">· {vencidas} vencida(s)</span>}
            </p>
          </div>
          <Link href="?novo=1" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
            <Plus className="h-4 w-4" /> Nova tarefa
          </Link>
        </div>

        <nav className="mt-4 flex gap-1">
          {TABS.map(t => (
            <Link
              key={t.key}
              href={`/tarefas?status=${t.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === t.key ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {novo === "1" && (
        <NovaTarefaForm processos={processos} users={users} />
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="border-b border-stone-200 bg-stone-50 sticky top-0">
            <tr>
              {["", "Tarefa", "Processo", "Responsável", "Prazo", "Prioridade", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {tarefas.map(t => {
              const vencida = t.prazo && new Date(t.prazo) < new Date() && t.status !== "CONCLUIDA" && t.status !== "CANCELADA";
              return (
                <tr key={t.id} className={`hover:bg-stone-50 transition-colors ${vencida ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <TarefaStatusToggle id={t.id} status={t.status} />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className={`text-sm font-medium ${t.status === "CONCLUIDA" ? "line-through text-stone-400" : "text-stone-900"}`}>{t.titulo}</p>
                    {t.descricao && <p className="text-xs text-stone-400 truncate">{t.descricao}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {t.processo ? (
                      <Link href={`/processos/${t.processo.id}`} className="text-xs text-amber-600 hover:underline truncate block max-w-[160px]">
                        {t.processo.titulo}
                      </Link>
                    ) : <span className="text-xs text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-700">
                    {t.responsavel?.name.split(" ")[0] ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${vencida ? "text-red-600 font-medium" : "text-stone-700"}`}>
                      {t.prazo ? formatDate(t.prazo) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORIDADE_V[t.prioridade]}>{t.prioridade}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">{STATUS_LABEL[t.status]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tarefas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <CheckSquare className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">Nenhuma tarefa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
