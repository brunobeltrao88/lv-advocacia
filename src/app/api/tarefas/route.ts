import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";

  const tarefas = await prisma.tarefa.findMany({
    where: { ...(status && { status }) },
    include: { processo: { include: { cliente: true } }, responsavel: true },
    orderBy: [{ prioridade: "desc" }, { prazo: "asc" }],
  });

  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const data = await req.json();
  const tarefa = await prisma.tarefa.create({
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      prazo: data.prazo ? new Date(data.prazo) : null,
      prioridade: data.prioridade ?? "NORMAL",
      status: "PENDENTE",
      processoId: data.processoId || null,
      responsavelId: data.responsavelId || session.id,
    },
    include: { processo: true, responsavel: true },
  });

  return NextResponse.json(tarefa, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, status } = await req.json();
  const tarefa = await prisma.tarefa.update({ where: { id }, data: { status } });
  return NextResponse.json(tarefa);
}
