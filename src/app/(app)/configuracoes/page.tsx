import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Settings, User, Shield, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [users, stats] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.$transaction([
      prisma.processo.count(),
      prisma.cliente.count(),
      prisma.tarefa.count(),
      prisma.financeiro.count(),
      prisma.audiencia.count(),
      prisma.andamento.count(),
    ]),
  ]);

  const [totalProcessos, totalClientes, totalTarefas, totalFinanceiro, totalAudiencias, totalAndamentos] = stats;
  const dbStats = [
    { label: "Processos", value: totalProcessos },
    { label: "Clientes", value: totalClientes },
    { label: "Tarefas", value: totalTarefas },
    { label: "Lançamentos", value: totalFinanceiro },
    { label: "Audiências", value: totalAudiencias },
    { label: "Andamentos", value: totalAndamentos },
  ];

  const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", ADVOGADO: "Advogado", SECRETARIA: "Secretaria" };
  const ROLE_V: Record<string, string> = { ADMIN: "danger", ADVOGADO: "success", SECRETARIA: "info" };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <h1 className="text-lg font-semibold text-stone-900">Configurações</h1>
        <p className="text-sm text-stone-500">Gerenciar usuários e dados do sistema</p>
      </header>

      <div className="flex-1 overflow-auto p-8 space-y-6">
        {/* Perfil atual */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-stone-900">Seu perfil</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Nome</p>
              <p className="font-medium text-stone-900">{session.name}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">E-mail</p>
              <p className="font-medium text-stone-900">{session.email}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Função</p>
              <Badge variant={ROLE_V[session.role ?? "ADVOGADO"]}>{ROLE_LABEL[session.role ?? "ADVOGADO"]}</Badge>
            </div>
          </div>
        </div>

        {/* Usuários do sistema */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-4">
            <Shield className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-stone-900">Usuários do sistema</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{u.name}</p>
                    <p className="text-xs text-stone-400">{u.email}{u.oab ? ` · OAB ${u.oab}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ROLE_V[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  {!u.active && <Badge variant="default">Inativo</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats do banco */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-stone-900">Banco de dados</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {dbStats.map(s => (
              <div key={s.label} className="rounded-lg bg-stone-50 p-3 text-center">
                <p className="text-xl font-bold text-stone-900">{s.value}</p>
                <p className="text-xs text-stone-400">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400">SQLite · {process.env.DATABASE_URL ?? "file:./dev.db"}</p>
        </div>

        {/* Credenciais de teste */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-xs font-semibold text-amber-700 mb-2">Credenciais de acesso</h3>
          <div className="space-y-1 text-xs text-amber-700 font-mono">
            <p>admin@lv.adv.br · admin123 (Administrador)</p>
            <p>valentina@lv.adv.br · admin123 (Advogada)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
