import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "";

  const clientes = await prisma.cliente.findMany({
    where: {
      ativo: true,
      ...(q && {
        OR: [
          { nome: { contains: q } },
          { cpfCnpj: { contains: q } },
          { email: { contains: q } },
          { telefone: { contains: q } },
        ],
      }),
    },
    include: { _count: { select: { processos: true } } },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const data = await req.json();
  const cliente = await prisma.cliente.create({ data });
  return NextResponse.json(cliente, { status: 201 });
}
