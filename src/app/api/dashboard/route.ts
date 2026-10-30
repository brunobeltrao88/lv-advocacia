import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const [
    totalProcessos,
    processosAtivos,
    totalClientes,
    tarefasPendentes,
    tarefasUrgentes,
    receitaMes,
    despesasMes,
    proximasAudiencias,
    proximosPrazos,
  ] = await Promise.all([
    prisma.processo.count(),
    prisma.processo.count({ where: { status: "ATIVO" } }),
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.tarefa.count({ where: { status: { in: ["PENDENTE", "EM_ANDAMENTO"] } } }),
    prisma.tarefa.count({ where: { status: "PENDENTE", prioridade: "URGENTE" } }),
    prisma.financeiro.aggregate({
      where: {
        tipo: "HONORARIO",
        status: "PAGO",
        dataPagamento: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { valor: true },
    }),
    prisma.financeiro.aggregate({
      where: {
        tipo: { in: ["DESPESA", "CUSTAS"] },
        status: "PAGO",
        dataPagamento: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { valor: true },
    }),
    prisma.audiencia.findMany({
      where: { data: { gte: new Date() }, status: "AGENDADA" },
      include: { processo: { include: { cliente: true } } },
      orderBy: { data: "asc" },
      take: 5,
    }),
    prisma.tarefa.findMany({
      where: { status: { in: ["PENDENTE", "EM_ANDAMENTO"] }, prazo: { gte: new Date() } },
      include: { processo: true, responsavel: true },
      orderBy: { prazo: "asc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    totalProcessos,
    processosAtivos,
    totalClientes,
    tarefasPendentes,
    tarefasUrgentes,
    receitaMes: receitaMes._sum.valor ?? 0,
    despesasMes: despesasMes._sum.valor ?? 0,
    proximasAudiencias,
    proximosPrazos,
  });
}
