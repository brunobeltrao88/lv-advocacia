import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { MarcarPagoButton } from "@/components/financeiro/marcar-pago-button";

const STATUS_V: Record<string, string> = { PENDENTE: "warning", PAGO: "success", CANCELADO: "default", VENCIDO: "danger" };
const TIPO_LABEL: Record<string, string> = { HONORARIO: "Honorário", DESPESA: "Despesa", REEMBOLSO: "Reembolso", CUSTAS: "Custas" };
const TIPO_V: Record<string, string> = { HONORARIO: "success", DESPESA: "danger", REEMBOLSO: "info", CUSTAS: "warning" };

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tipo = "", status = "" } = await searchParams;

  const [financeiros, stats] = await Promise.all([
    prisma.financeiro.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(status && { status }),
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        processo: { select: { id: true, titulo: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.financeiro.groupBy({
      by: ["tipo", "status"],
      _sum: { valor: true },
      _count: true,
    }),
  ]);

  const honorariosPagos = stats.filter(s => s.tipo === "HONORARIO" && s.status === "PAGO").reduce((a, s) => a + (s._sum.valor ?? 0), 0);
  const honorariosPendentes = stats.filter(s => s.tipo === "HONORARIO" && s.status === "PENDENTE").reduce((a, s) => a + (s._sum.valor ?? 0), 0);
  const despesas = stats.filter(s => s.tipo === "DESPESA" && s.status === "PAGO").reduce((a, s) => a + (s._sum.valor ?? 0), 0);
  const saldo = honorariosPagos - despesas;

  const resumo = [
    { label: "Honorários recebidos", value: formatCurrency(honorariosPagos), icon: TrendingUp, color: "bg-green-50 text-green-700", border: "border-green-200" },
    { label: "A receber", value: formatCurrency(honorariosPendentes), icon: Clock, color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
    { label: "Despesas pagas", value: formatCurrency(despesas), icon: TrendingDown, color: "bg-red-50 text-red-700", border: "border-red-200" },
    { label: "Saldo", value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700", border: saldo >= 0 ? "border-green-200" : "border-red-200" },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Financeiro</h1>
            <p className="text-sm text-stone-500">{financeiros.length} lançamento(s)</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {resumo.map(r => (
            <div key={r.label} className={`rounded-xl border ${r.border} bg-white p-4`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-stone-500">{r.label}</p>
                <div className={`rounded-lg p-1.5 ${r.color}`}><r.icon className="h-3.5 w-3.5" /></div>
              </div>
              <p className="text-lg font-bold text-stone-900">{r.value}</p>
            </div>
          ))}
        </div>

        <form className="mt-4 flex gap-3 flex-wrap">
          <select name="tipo" defaultValue={tipo} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="status" defaultValue={status} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="VENCIDO">Vencido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <button type="submit" className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900">Filtrar</button>
        </form>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="border-b border-stone-200 bg-stone-50 sticky top-0">
            <tr>
              {["Descrição", "Tipo", "Cliente / Processo", "Vencimento", "Status", "Valor", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {financeiros.map(f => {
              const vencida = f.dataVencimento && new Date(f.dataVencimento) < new Date() && f.status === "PENDENTE";
              return (
                <tr key={f.id} className={`hover:bg-stone-50 transition-colors ${vencida ? "bg-red-50/30" : ""}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-stone-900">{f.descricao}</p>
                    {f.formaPagamento && <p className="text-xs text-stone-400">{f.formaPagamento}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={TIPO_V[f.tipo]}>{TIPO_LABEL[f.tipo]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {f.cliente && <p className="text-xs text-stone-700">{f.cliente.nome}</p>}
                    {f.processo && (
                      <Link href={`/processos/${f.processo.id}`} className="text-xs text-amber-600 hover:underline truncate block max-w-[160px]">
                        {f.processo.titulo}
                      </Link>
                    )}
                    {!f.cliente && !f.processo && <span className="text-xs text-stone-400">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm ${vencida ? "text-red-600 font-medium" : "text-stone-700"}`}>
                      {f.dataVencimento ? formatDate(f.dataVencimento) : "—"}
                    </span>
                    {f.dataPagamento && <p className="text-xs text-green-600">Pago: {formatDate(f.dataPagamento)}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_V[f.status]}>{f.status}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-stone-900">{formatCurrency(f.valor)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {f.status === "PENDENTE" && <MarcarPagoButton id={f.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {financeiros.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <DollarSign className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">Nenhum lançamento encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
