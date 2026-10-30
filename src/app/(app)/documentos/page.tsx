import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, FileCheck, FileSignature, Gavel } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

const TIPO_LABEL: Record<string, string> = { PETICAO: "Petição", CONTRATO: "Contrato", PROCURACAO: "Procuração", SENTENCA: "Sentença", RECURSO: "Recurso", OUTRO: "Outro" };
const TIPO_ICON: Record<string, React.ElementType> = { PETICAO: FileText, CONTRATO: FileCheck, PROCURACAO: FileSignature, SENTENCA: Gavel, RECURSO: FileText, OUTRO: FileText };
const TIPO_COLOR: Record<string, string> = { PETICAO: "text-blue-500", CONTRATO: "text-green-500", PROCURACAO: "text-purple-500", SENTENCA: "text-red-500", RECURSO: "text-orange-500", OUTRO: "text-stone-400" };

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tipo = "", q = "" } = await searchParams;

  const documentos = await prisma.documento.findMany({
    where: {
      ...(tipo && { tipo }),
      ...(q && { nome: { contains: q } }),
    },
    include: {
      processo: { select: { id: true, titulo: true } },
      cliente: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Documentos</h1>
            <p className="text-sm text-stone-500">{documentos.length} documento(s)</p>
          </div>
        </div>

        <form className="mt-4 flex gap-3 flex-wrap">
          <input name="q" defaultValue={q} placeholder="Buscar por nome..." className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700 placeholder-stone-400 focus:outline-none w-56" />
          <select name="tipo" defaultValue={tipo} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900">Filtrar</button>
        </form>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {documentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <FileText className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">Nenhum documento encontrado</p>
            <p className="mt-1 text-sm">Documentos podem ser vinculados a processos individualmente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documentos.map(d => {
              const Icon = TIPO_ICON[d.tipo] ?? FileText;
              const color = TIPO_COLOR[d.tipo] ?? "text-stone-400";
              return (
                <div key={d.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-8 w-8 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{d.nome}</p>
                      <p className="text-xs text-stone-400">{TIPO_LABEL[d.tipo]}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {d.processo && (
                      <Link href={`/processos/${d.processo.id}`} className="block text-xs text-amber-600 hover:underline truncate">
                        {d.processo.titulo}
                      </Link>
                    )}
                    {d.cliente && (
                      <Link href={`/clientes/${d.cliente.id}`} className="block text-xs text-stone-500 hover:underline truncate">
                        {d.cliente.nome}
                      </Link>
                    )}
                    {d.descricao && <p className="text-xs text-stone-400 truncate">{d.descricao}</p>}
                    <p className="text-xs text-stone-300">{formatDate(d.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
