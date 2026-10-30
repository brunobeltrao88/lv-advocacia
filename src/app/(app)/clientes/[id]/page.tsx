import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, Phone, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const STATUS_V: Record<string, string> = { ATIVO: "success", SUSPENSO: "warning", ENCERRADO: "info", ARQUIVADO: "default" };
const AREA_LABEL: Record<string, string> = { CIVIL: "Civil", TRABALHISTA: "Trabalhista", CRIMINAL: "Criminal", TRIBUTARIO: "Tributário", FAMILIA: "Família", PREVIDENCIARIO: "Previdenciário", EMPRESARIAL: "Empresarial", OUTRO: "Outro" };
const FIN_STATUS_V: Record<string, string> = { PENDENTE: "warning", PAGO: "success", CANCELADO: "default", VENCIDO: "danger" };

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      processos: {
        include: { advogados: { include: { user: true } } },
        orderBy: { updatedAt: "desc" },
      },
      financeiros: { orderBy: { createdAt: "desc" }, take: 10 },
      documentos: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!cliente) notFound();

  const totalReceber = cliente.financeiros.filter(f => f.status === "PENDENTE").reduce((s, f) => s + f.valor, 0);
  const totalRecebido = cliente.financeiros.filter(f => f.status === "PAGO").reduce((s, f) => s + f.valor, 0);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-start gap-4">
          <Link href="/clientes" className="mt-1 text-stone-400 hover:text-stone-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
              {cliente.tipo === "PJ" ? <Building2 className="h-5 w-5 text-stone-500" /> : <User className="h-5 w-5 text-stone-500" />}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">{cliente.nome}</h1>
              <p className="text-sm text-stone-500">{cliente.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}{cliente.cpfCnpj ? ` · ${cliente.cpfCnpj}` : ""}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Contato</h2>
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                  <span className="truncate">{cliente.email}</span>
                </div>
              )}
              {cliente.celular && (
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>{cliente.celular}</span>
                </div>
              )}
              {cliente.telefone && (
                <div className="flex items-center gap-2 text-sm text-stone-700">
                  <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                  <span>{cliente.telefone}</span>
                </div>
              )}
              {(cliente.endereco || cliente.cidade) && (
                <div className="flex items-start gap-2 text-sm text-stone-700">
                  <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                  <span>{[cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {!cliente.email && !cliente.celular && !cliente.telefone && !cliente.endereco && (
                <p className="text-xs text-stone-400">Nenhum contato cadastrado</p>
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Resumo financeiro</h2>
              <div>
                <p className="text-xs text-stone-400">A receber</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(totalReceber)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">Recebido (total)</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(totalRecebido)}</p>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Observações</h2>
                <p className="text-sm text-stone-600 whitespace-pre-line">{cliente.observacoes}</p>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processos */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-stone-900">Processos ({cliente.processos.length})</h2>
                <Link href={`/processos/novo?clienteId=${cliente.id}`} className="text-xs text-amber-600 hover:underline">+ Novo processo</Link>
              </div>
              <div className="divide-y divide-stone-50">
                {cliente.processos.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">{p.titulo}</p>
                      {p.numeroCNJ && <p className="text-xs font-mono text-stone-400">{p.numeroCNJ}</p>}
                      <p className="text-xs text-stone-400">{AREA_LABEL[p.area]}{p.comarca ? ` · ${p.comarca}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant={STATUS_V[p.status]}>{p.status}</Badge>
                      <Link href={`/processos/${p.id}`} className="text-xs text-amber-600 hover:underline">Ver →</Link>
                    </div>
                  </div>
                ))}
                {cliente.processos.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-stone-400">Nenhum processo</p>
                )}
              </div>
            </div>

            {/* Financeiro recente */}
            {cliente.financeiros.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-stone-900">Movimentações financeiras</h2>
                </div>
                <div className="divide-y divide-stone-50">
                  {cliente.financeiros.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm text-stone-900">{f.descricao}</p>
                        <p className="text-xs text-stone-400">{f.dataVencimento ? formatDate(f.dataVencimento) : formatDate(f.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={FIN_STATUS_V[f.status]}>{f.status}</Badge>
                        <span className="text-sm font-semibold text-stone-900">{formatCurrency(f.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
