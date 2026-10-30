import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q = "", tipo = "" } = await searchParams;

  const clientes = await prisma.cliente.findMany({
    where: {
      ativo: true,
      ...(tipo && { tipo }),
      ...(q && {
        OR: [
          { nome: { contains: q } },
          { cpfCnpj: { contains: q } },
          { email: { contains: q } },
        ],
      }),
    },
    include: {
      _count: { select: { processos: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Clientes</h1>
            <p className="text-sm text-stone-500">{clientes.length} cliente(s) encontrado(s)</p>
          </div>
          <Link href="/clientes/novo" className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
            <Plus className="h-4 w-4" /> Novo cliente
          </Link>
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          <form className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-stone-400 shrink-0" />
            <input name="q" defaultValue={q} placeholder="Buscar por nome, CPF/CNPJ..." className="bg-transparent text-sm text-stone-700 placeholder-stone-400 focus:outline-none w-56" />
          </form>
          <form className="flex gap-2">
            <input type="hidden" name="q" value={q} />
            <select name="tipo" defaultValue={tipo} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-amber-500 focus:outline-none">
              <option value="">Todos os tipos</option>
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
            <button type="submit" className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-900">Filtrar</button>
          </form>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100">
                  {c.tipo === "PJ" ? (
                    <Building2 className="h-5 w-5 text-stone-500" />
                  ) : (
                    <User className="h-5 w-5 text-stone-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{c.nome}</p>
                  <p className="text-xs text-stone-400">{c.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                  {c.cpfCnpj && <p className="text-xs font-mono text-stone-400">{c.cpfCnpj}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                <span>{c._count.processos} processo(s)</span>
                {c.email && <span className="truncate max-w-32">{c.email}</span>}
              </div>
            </Link>
          ))}
        </div>

        {clientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <User className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-base">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
