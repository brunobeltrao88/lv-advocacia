import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const STATUS_V: Record<string, string> = { ATIVO: "success", SUSPENSO: "warning", ENCERRADO: "info", ARQUIVADO: "default" };
const AREA_V: Record<string, string> = { CIVIL: "default", TRABALHISTA: "purple", CRIMINAL: "danger", TRIBUTARIO: "warning", FAMILIA: "info", PREVIDENCIARIO: "info", EMPRESARIAL: "default", OUTRO: "default" };
const AREA_LABEL: Record<string, string> = { CIVIL: "Civil", TRABALHISTA: "Trabalhista", CRIMINAL: "Criminal", TRIBUTARIO: "Tributário", FAMILIA: "Família", PREVIDENCIARIO: "Previdenciário", EMPRESARIAL: "Empresarial", OUTRO: "Outro" };

export default async function ProcessosPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; area?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q = "", status = "", area = "" } = await searchParams;

  const processos = await prisma.processo.findMany({
    where: {
      ...(status && { status }),
      ...(area && { area }),
      ...(q && {
        OR: [
          { titulo: { contains: q } },
          { numeroCNJ: { contains: q } },
          { cliente: { nome: { contains: q } } },
        ],
      }),
    },
    include: {
      cliente: true,
      advogados: { include: { user: true } },
      _count: { select: { tarefas: true, andamentos: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Processos</h1>
            <p className="text-sm text-stone-500">{processos.length} processo(s) encontrado(s)</p>
          </div>
          <Link href="/processos/novo" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
            <Plus className="h-4 w-4" /> Novo processo
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <form className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-stone-400 shrink-0" />
            <input name="q" defaultValue={q} placeholder="Buscar por título, CNJ, cliente..." className="bg-transparent text-sm text-stone-700 placeholder-stone-400 focus:outline-none w-64" />
          </form>
          <form className="flex gap-2">
            <input type="hidden" name="q" value={q} />
            <select name="status" defaultValue={status} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-amber-500 focus:outline-none">
              <option value="">Todos os status</option>
              <option value="ATIVO">Ativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="ENCERRADO">Encerrado</option>
              <option value="ARQUIVADO">Arquivado</option>
            </select>
            <select name="area" defaultValue={area} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-amber-500 focus:outline-none">
              <option value="">Todas as áreas</option>
              {Object.entries(AREA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="submit" className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900">Filtrar</button>
          </form>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="border-b border-stone-200 bg-stone-50 sticky top-0">
            <tr>
              {["Processo", "Cliente", "Área", "Status", "Valor", "Advogado", "Tarefas", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {processos.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm font-medium text-stone-900 truncate">{p.titulo}</p>
                  {p.numeroCNJ && <p className="text-xs text-stone-400 font-mono">{p.numeroCNJ}</p>}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-stone-700">{p.cliente.nome}</p>
                  <p className="text-xs text-stone-400">{p.cliente.tipo}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={AREA_V[p.area]}>{AREA_LABEL[p.area]}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={STATUS_V[p.status]}>{p.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-stone-700">
                  {p.valorCausa ? formatCurrency(p.valorCausa) : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-stone-700">
                  {p.advogados[0]?.user.name.split(" ")[0] ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-stone-700">
                  {p._count.tarefas}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/processos/${p.id}`} className="text-xs font-medium text-amber-600 hover:underline">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {processos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <p className="text-base">Nenhum processo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
