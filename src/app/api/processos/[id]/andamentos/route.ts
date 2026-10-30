import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { descricao, tipo } = await req.json();

  const andamento = await prisma.andamento.create({
    data: { processoId: id, descricao, tipo: tipo ?? "GERAL" },
  });

  return NextResponse.json(andamento, { status: 201 });
}
