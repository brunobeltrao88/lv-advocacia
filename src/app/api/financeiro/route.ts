import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") ?? "";
  const status = searchParams.get("status") ?? "";

  const financeiros = await prisma.financeiro.findMany({
    where: {
      ...(tipo && { tipo }),
      ...(status && { status }),
    },
    include: { cliente: true, processo: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(financeiros);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const data = await req.json();
  const financeiro = await prisma.financeiro.create({
    data: {
      tipo: data.tipo,
      descricao: data.descricao,
      valor: Number(data.valor),
      status: data.status ?? "PENDENTE",
      dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : null,
      formaPagamento: data.formaPagamento,
      clienteId: data.clienteId || null,
      processoId: data.processoId || null,
    },
  });
  return NextResponse.json(financeiro, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, status } = await req.json();
  const item = await prisma.financeiro.update({
    where: { id },
    data: {
      status,
      ...(status === "PAGO" ? { dataPagamento: new Date() } : {}),
    },
  });
  return NextResponse.json(item);
}
