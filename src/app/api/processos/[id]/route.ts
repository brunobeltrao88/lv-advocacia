import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const processo = await prisma.processo.findUnique({
    where: { id },
    include: {
      cliente: true,
      advogados: { include: { user: true } },
      andamentos: { orderBy: { data: "desc" } },
      audiencias: { orderBy: { data: "asc" } },
      tarefas: { include: { responsavel: true }, orderBy: { prazo: "asc" } },
      documentos: { orderBy: { createdAt: "desc" } },
      financeiros: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!processo) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(processo);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const processo = await prisma.processo.update({
    where: { id },
    data: {
      titulo: data.titulo,
      numeroCNJ: data.numeroCNJ,
      area: data.area,
      fase: data.fase,
      status: data.status,
      vara: data.vara,
      comarca: data.comarca,
      tribunal: data.tribunal,
      uf: data.uf,
      valorCausa: data.valorCausa ? Number(data.valorCausa) : undefined,
    },
  });

  return NextResponse.json(processo);
}
