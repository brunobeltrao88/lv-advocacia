import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const area = searchParams.get("area") ?? "";

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
      _count: { select: { tarefas: true, andamentos: true, audiencias: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(processos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const data = await req.json();
  const processo = await prisma.processo.create({
    data: {
      titulo: data.titulo,
      numeroCNJ: data.numeroCNJ,
      area: data.area,
      fase: data.fase ?? "INICIAL",
      status: "ATIVO",
      vara: data.vara,
      comarca: data.comarca,
      tribunal: data.tribunal,
      uf: data.uf,
      valorCausa: data.valorCausa ? Number(data.valorCausa) : null,
      dataDistribuicao: data.dataDistribuicao ? new Date(data.dataDistribuicao) : null,
      clienteId: data.clienteId,
      advogados: { create: { userId: session.id, papel: "TITULAR" } },
      andamentos: {
        create: { descricao: "Processo cadastrado no sistema", tipo: "GERAL" },
      },
    },
    include: { cliente: true, advogados: { include: { user: true } } },
  });

  return NextResponse.json(processo, { status: 201 });
}
