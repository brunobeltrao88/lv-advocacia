import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, DollarSign, CheckSquare, Clock, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/utils/format";
import { AddAndamentoForm } from "@/components/processos/add-andamento-form";

const STATUS_V: Record<string, string> = { ATIVO: "success", SUSPENSO: "warning", ENCERRADO: "info", ARQUIVADO: "default" };
const AREA_LABEL: Record<string, string> = { CIVIL: "Civil", TRABALHISTA: "Trabalhista", CRIMINAL: "Criminal", TRIBUTARIO: "Tributário", FAMILIA: "Família", PREVIDENCIARIO: "Previdenciário", EMPRESARIAL: "Empresarial", OUTRO: "Outro" };
const AREA_V: Record<string, string> = { CIVIL: "default", TRABALHISTA: "purple", CRIMINAL: "danger", TRIBUTARIO: "warning", FAMILIA: "info", PREVIDENCIARIO: "info", EMPRESARIAL: "default", OUTRO: "default" };
const TIPO_AND_LABEL: Record<string, string> = { GERAL: "Geral", AUDIENCIA: "Audiência", DESPACHO: "Despacho", SENTENCA: "Sentença", RECURSO: "Recurso", INTIMACAO: "Intimação", PETICAO: "Petição" };
const PRIORIDADE_V: Record<string, string> = { URGENTE: "danger", ALTA: "warning", NORMAL: "default", BAIXA: "info" };
const STATUS_FIN_V: Record<string, string> = { PENDENTE: "warning", PAGO: "success", CANCELADO: "default", VENCIDO: "danger" };
const TIPO_FIN_LABEL: Record<string, string> = { HONORARIO: "Honorário", DESPESA: "Despesa", REEMBOLSO: "Reembolso", CUSTAS: "Custas" };

const TABS = [
  { key: "andamentos", label: "Andamentos", icon: Clock },
  { key: "audiencias", label: "Audiências", icon: Calendar },
  { key: "tarefas", label: "Tarefas", icon: CheckSquare },
  { key: "financeiro", label: "Financeiro", icon: DollarSign },
  { key: "documentos", label: "Documentos", icon: FileText },
];

export default async function ProcessoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const { tab = "andamentos" } = await searchParams;

  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      cliente: true,
      advogados: { include: { user: true } },
      andamentos: { orderBy: { data: "desc" } },
      audiencias: { orderBy: { data: "asc" } },
      tarefas: { include: { responsavel: true }, orderBy: { createdAt: "desc" } },
      financeiros: { orderBy: { createdAt: "desc" } },
      documentos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!processo) notFound();

  const totalHonorarios = processo.financeiros.filter(f => f.tipo === "HONORARIO" && f.status === "PAGO").reduce((s, f) => s + f.valor, 0);
  const totalPendente = processo.financeiros.filter(f => f.status === "PENDENTE").reduce((s, f) => s + f.valor, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-start gap-4">
          <Link href="/processos" className="mt-1 text-stone-400 hover:text-stone-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-stone-900 truncate">{processo.titulo}</h1>
              <Badge variant={STATUS_V[processo.status]}>{processo.status}</Badge>
              <Badge variant={AREA_V[processo.area]}>{AREA_LABEL[processo.area]}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-stone-500 flex-wrap">
              {processo.numeroCNJ && <span className="font-mono text-xs">{processo.numeroCNJ}</span>}
              <span>Cliente: <span className="font-medium text-stone-700">{processo.cliente.nome}</span></span>
              {processo.vara && <span>Vara: {processo.vara}</span>}
              {processo.comarca && <span>Comarca: {processo.comarca}</span>}
              {processo.valorCausa && <span>Valor: {formatCurrency(processo.valorCausa)}</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex gap-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Link
                key={t.key}
                href={`/processos/${id}?tab=${t.key}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.key === "andamentos" && <span className="ml-1 text-xs text-stone-400">({processo.andamentos.length})</span>}
                {t.key === "tarefas" && <span className="ml-1 text-xs text-stone-400">({processo.tarefas.filter(x => x.status !== "CONCLUIDA" && x.status !== "CANCELADA").length})</span>}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {/* ANDAMENTOS */}
        {tab === "andamentos" && (
          <div className="max-w-3xl space-y-6">
            <AddAndamentoForm processoId={id} />
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-stone-200" />
              <div className="space-y-4">
                {processo.andamentos.map((a) => (
                  <div key={a.id} className="relative pl-10">
                    <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full border-2 border-amber-500 bg-white" />
                    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded px-2 py-0.5">
                          {TIPO_AND_LABEL[a.tipo] ?? a.tipo}
                        </span>
                        <span className="text-xs text-stone-400">{formatDatetime(a.data)}</span>
                      </div>
                      <p className="mt-2 text-sm text-stone-700 whitespace-pre-line">{a.descricao}</p>
                    </div>
                  </div>
                ))}
                {processo.andamentos.length === 0 && (
                  <p className="pl-10 text-sm text-stone-400">Nenhum andamento registrado.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AUDIÊNCIAS */}
        {tab === "audiencias" && (
          <div className="max-w-3xl space-y-3">
            {processo.audiencias.map((a) => (
              <div key={a.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-center">
                  <span className="text-sm font-bold text-amber-700 leading-none">{new Date(a.data).getDate()}</span>
                  <span className="text-xs text-amber-500">{new Date(a.data).toLocaleString("pt-BR", { month: "short" })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-stone-900">{a.titulo}</p>
                    <Badge variant={a.status === "AGENDADA" ? "warning" : a.status === "REALIZADA" ? "success" : "default"}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{formatDatetime(a.data)}{a.local ? ` · ${a.local}` : ""}</p>
                  {a.observacoes && <p className="mt-1 text-xs text-stone-400">{a.observacoes}</p>}
                </div>
              </div>
            ))}
            {processo.audiencias.length === 0 && (
              <p className="text-sm text-stone-400">Nenhuma audiência agendada.</p>
            )}
          </div>
        )}

        {/* TAREFAS */}
        {tab === "tarefas" && (
          <div className="max-w-3xl space-y-3">
            {processo.tarefas.map((t) => (
              <div key={t.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-stone-900">{t.titulo}</p>
                    <Badge variant={PRIORIDADE_V[t.prioridade]}>{t.prioridade}</Badge>
                    <Badge variant={t.status === "CONCLUIDA" ? "success" : t.status === "EM_ANDAMENTO" ? "info" : "default"}>{t.status}</Badge>
                  </div>
                  {t.descricao && <p className="mt-0.5 text-xs text-stone-500">{t.descricao}</p>}
                  <p className="mt-1 text-xs text-stone-400">
                    {t.prazo ? `Prazo: ${formatDate(t.prazo)}` : "Sem prazo"}
                    {t.responsavel && ` · ${t.responsavel.name}`}
                  </p>
                </div>
              </div>
            ))}
            {processo.tarefas.length === 0 && (
              <p className="text-sm text-stone-400">Nenhuma tarefa vinculada.</p>
            )}
          </div>
        )}

        {/* FINANCEIRO */}
        {tab === "financeiro" && (
          <div className="max-w-3xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs text-green-600">Honorários recebidos</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalHonorarios)}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Valores pendentes</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(totalPendente)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {processo.financeiros.map((f) => (
                <div key={f.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-stone-900">{f.descricao}</p>
                      <Badge variant={STATUS_FIN_V[f.status]}>{f.status}</Badge>
                      <span className="text-xs text-stone-400">{TIPO_FIN_LABEL[f.tipo]}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {f.dataVencimento ? `Venc: ${formatDate(f.dataVencimento)}` : "Sem vencimento"}
                      {f.dataPagamento ? ` · Pago: ${formatDate(f.dataPagamento)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">{formatCurrency(f.valor)}</p>
                </div>
              ))}
              {processo.financeiros.length === 0 && (
                <p className="text-sm text-stone-400">Nenhum lançamento financeiro.</p>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTOS */}
        {tab === "documentos" && (
          <div className="max-w-3xl space-y-3">
            {processo.documentos.map((d) => (
              <div key={d.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">{d.nome}</p>
                  <p className="text-xs text-stone-400">{d.tipo} · {formatDate(d.createdAt)}</p>
                  {d.descricao && <p className="text-xs text-stone-500">{d.descricao}</p>}
                </div>
              </div>
            ))}
            {processo.documentos.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-stone-200 p-10 text-center text-stone-400">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">Nenhum documento anexado</p>
                <p className="mt-1 text-xs">Upload de documentos em breve</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
