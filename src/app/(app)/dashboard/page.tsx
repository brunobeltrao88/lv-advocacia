import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Users, CheckSquare, DollarSign, AlertTriangle, Calendar } from "lucide-react";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

const PRIORIDADE_VARIANT: Record<string, string> = {
  URGENTE: "danger", ALTA: "warning", NORMAL: "default", BAIXA: "info",
};
const AREA_LABEL: Record<string, string> = {
  CIVIL: "Civil", TRABALHISTA: "Trabalhista", CRIMINAL: "Criminal",
  TRIBUTARIO: "Tributário", FAMILIA: "Família", PREVIDENCIARIO: "Previdenciário",
  EMPRESARIAL: "Empresarial", OUTRO: "Outro",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [totalProcessos, processosAtivos, totalClientes, tarefasPendentes, tarefasUrgentes, receita, proximasAudiencias, proximosPrazos] = await Promise.all([
    prisma.processo.count(),
    prisma.processo.count({ where: { status: "ATIVO" } }),
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.tarefa.count({ where: { status: { in: ["PENDENTE", "EM_ANDAMENTO"] } } }),
    prisma.tarefa.count({ where: { status: "PENDENTE", prioridade: "URGENTE" } }),
    prisma.financeiro.aggregate({
      where: { tipo: "HONORARIO", status: "PAGO", dataPagamento: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { valor: true },
    }),
    prisma.audiencia.findMany({
      where: { data: { gte: new Date() }, status: "AGENDADA" },
      include: { processo: { include: { cliente: true } } },
      orderBy: { data: "asc" }, take: 5,
    }),
    prisma.tarefa.findMany({
      where: { status: { in: ["PENDENTE", "EM_ANDAMENTO"] } },
      include: { processo: { include: { cliente: true } }, responsavel: true },
      orderBy: [{ prioridade: "desc" }, { prazo: "asc" }], take: 6,
    }),
  ]);

  const stats = [
    { label: "Processos ativos", value: processosAtivos, sub: `${totalProcessos} total`, icon: Briefcase, color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
    { label: "Clientes", value: totalClientes, sub: "Ativos", icon: Users, color: "bg-stone-100 text-stone-700", border: "border-stone-200" },
    { label: "Tarefas pendentes", value: tarefasPendentes, sub: `${tarefasUrgentes} urgentes`, icon: CheckSquare, color: tarefasUrgentes > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700", border: tarefasUrgentes > 0 ? "border-red-200" : "border-green-200" },
    { label: "Receita do mês", value: formatCurrency(receita._sum.valor ?? 0), sub: "Honorários pagos", icon: DollarSign, color: "bg-green-50 text-green-700", border: "border-green-200" },
  ];

  return (
    <div className="flex h-full flex-col overflow-auto">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <h1 className="text-lg font-semibold text-stone-900">Bom dia, {session.name.split(" ")[1] ?? session.name} 👋</h1>
        <p className="text-sm text-stone-500">Aqui está o resumo do escritório hoje</p>
      </header>

      <div className="flex-1 overflow-auto p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.border} bg-white p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-stone-500">{s.label}</p>
                <div className={`rounded-lg p-2 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="mt-1 text-xs text-stone-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Próximas audiências */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-stone-900">Próximas audiências</h2>
              </div>
              <Link href="/agenda" className="text-xs text-amber-600 hover:underline">Ver agenda →</Link>
            </div>
            <div className="divide-y divide-stone-50">
              {proximasAudiencias.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-stone-400">Nenhuma audiência agendada</p>
              ) : proximasAudiencias.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 text-center">
                    <span className="text-xs font-bold text-amber-700 leading-none">{new Date(a.data).getDate()}</span>
                    <span className="text-xs text-amber-500">{new Date(a.data).toLocaleString("pt-BR", { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 truncate">{a.titulo}</p>
                    <p className="text-xs text-stone-500 truncate">{a.processo.cliente.nome} · {a.local ?? "Local a definir"}</p>
                    <p className="text-xs text-stone-400">{formatDatetime(a.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos prazos */}
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-stone-900">Tarefas & Prazos</h2>
              </div>
              <Link href="/tarefas" className="text-xs text-amber-600 hover:underline">Ver todas →</Link>
            </div>
            <div className="divide-y divide-stone-50">
              {proximosPrazos.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-stone-400">Nenhuma tarefa pendente</p>
              ) : proximosPrazos.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-900 truncate">{t.titulo}</p>
                      <Badge variant={PRIORIDADE_VARIANT[t.prioridade]}>{t.prioridade}</Badge>
                    </div>
                    {t.processo && <p className="text-xs text-stone-500 truncate">{t.processo.titulo}</p>}
                    <p className="text-xs text-stone-400">{t.prazo ? `Prazo: ${formatDate(t.prazo)}` : "Sem prazo"} · {t.responsavel?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
