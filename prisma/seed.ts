import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const hash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lv.adv.br" },
    update: {},
    create: {
      name: "Dr. Lucas Verona",
      email: "admin@lv.adv.br",
      passwordHash: hash,
      role: "ADMIN",
      oab: "SP 123.456",
    },
  });

  const adv2 = await prisma.user.upsert({
    where: { email: "valentina@lv.adv.br" },
    update: {},
    create: {
      name: "Dra. Valentina Lopes",
      email: "valentina@lv.adv.br",
      passwordHash: hash,
      role: "ADVOGADO",
      oab: "SP 234.567",
    },
  });

  // Clientes
  const c1 = await prisma.cliente.create({
    data: {
      nome: "Carlos Eduardo Mendes",
      tipo: "PF",
      cpfCnpj: "123.456.789-00",
      email: "carlos@email.com",
      telefone: "(11) 3333-4444",
      celular: "(11) 99999-1234",
      cidade: "São Paulo",
      estado: "SP",
    },
  });

  const c2 = await prisma.cliente.create({
    data: {
      nome: "Tech Solutions Ltda",
      tipo: "PJ",
      cpfCnpj: "12.345.678/0001-90",
      email: "contato@techsolutions.com.br",
      telefone: "(11) 4444-5555",
      cidade: "São Paulo",
      estado: "SP",
    },
  });

  const c3 = await prisma.cliente.create({
    data: {
      nome: "Maria Fernanda Costa",
      tipo: "PF",
      cpfCnpj: "987.654.321-00",
      email: "maria@email.com",
      celular: "(21) 98888-5678",
      cidade: "Rio de Janeiro",
      estado: "RJ",
    },
  });

  // Processos
  const p1 = await prisma.processo.create({
    data: {
      titulo: "Ação de Indenização por Danos Morais",
      numeroCNJ: "1234567-89.2024.8.26.0100",
      area: "CIVIL",
      fase: "CONHECIMENTO",
      status: "ATIVO",
      vara: "3ª Vara Cível",
      comarca: "São Paulo",
      tribunal: "TJSP",
      uf: "SP",
      valorCausa: 50000,
      dataDistribuicao: new Date("2024-03-15"),
      clienteId: c1.id,
      advogados: { create: { userId: admin.id, papel: "TITULAR" } },
      andamentos: {
        create: [
          { descricao: "Petição inicial protocolada", tipo: "PETICAO", data: new Date("2024-03-15") },
          { descricao: "Despacho: cite-se o réu", tipo: "DESPACHO", data: new Date("2024-04-02") },
          { descricao: "Citação realizada com sucesso", tipo: "GERAL", data: new Date("2024-04-20") },
        ],
      },
      audiencias: {
        create: {
          titulo: "Audiência de Conciliação",
          data: new Date("2025-02-10T14:00:00"),
          local: "3ª Vara Cível - SP",
          tipo: "CONCILIACAO",
          status: "AGENDADA",
        },
      },
    },
  });

  const p2 = await prisma.processo.create({
    data: {
      titulo: "Rescisão Contratual c/c Cobrança",
      numeroCNJ: "9876543-21.2024.5.02.0001",
      area: "TRABALHISTA",
      fase: "INICIAL",
      status: "ATIVO",
      vara: "1ª Vara do Trabalho",
      comarca: "São Paulo",
      tribunal: "TRT2",
      uf: "SP",
      valorCausa: 120000,
      dataDistribuicao: new Date("2024-06-01"),
      clienteId: c2.id,
      advogados: { create: { userId: adv2.id, papel: "TITULAR" } },
      andamentos: {
        create: [
          { descricao: "Petição inicial distribuída", tipo: "PETICAO", data: new Date("2024-06-01") },
        ],
      },
    },
  });

  // Tarefas
  await prisma.tarefa.createMany({
    data: [
      {
        titulo: "Elaborar contestação",
        descricao: "Prazo fatal para contestação do processo de indenização",
        prazo: new Date("2025-01-15"),
        prioridade: "URGENTE",
        status: "PENDENTE",
        processoId: p1.id,
        responsavelId: admin.id,
      },
      {
        titulo: "Protocolar recurso ordinário",
        descricao: "Recurso contra decisão de primeira instância",
        prazo: new Date("2025-01-28"),
        prioridade: "ALTA",
        status: "EM_ANDAMENTO",
        processoId: p2.id,
        responsavelId: adv2.id,
      },
      {
        titulo: "Reunião com cliente Carlos Mendes",
        descricao: "Apresentar andamento do processo e discutir estratégia",
        prazo: new Date("2025-01-08"),
        prioridade: "NORMAL",
        status: "PENDENTE",
        processoId: p1.id,
        responsavelId: admin.id,
      },
      {
        titulo: "Atualizar cadastro da Tech Solutions",
        prazo: new Date("2025-01-10"),
        prioridade: "BAIXA",
        status: "PENDENTE",
        responsavelId: adv2.id,
      },
    ],
  });

  // Financeiro
  await prisma.financeiro.createMany({
    data: [
      {
        tipo: "HONORARIO",
        descricao: "Honorários advocatícios - 1ª parcela",
        valor: 5000,
        status: "PAGO",
        dataPagamento: new Date("2024-03-20"),
        formaPagamento: "PIX",
        clienteId: c1.id,
        processoId: p1.id,
      },
      {
        tipo: "HONORARIO",
        descricao: "Honorários advocatícios - 2ª parcela",
        valor: 5000,
        status: "PENDENTE",
        dataVencimento: new Date("2025-02-01"),
        clienteId: c1.id,
        processoId: p1.id,
      },
      {
        tipo: "HONORARIO",
        descricao: "Honorários - Rescisão Contratual",
        valor: 12000,
        status: "PAGO",
        dataPagamento: new Date("2024-06-05"),
        formaPagamento: "TED",
        clienteId: c2.id,
        processoId: p2.id,
      },
      {
        tipo: "CUSTAS",
        descricao: "Custas judiciais iniciais",
        valor: 850,
        status: "PAGO",
        dataPagamento: new Date("2024-03-15"),
        clienteId: c1.id,
        processoId: p1.id,
      },
      {
        tipo: "HONORARIO",
        descricao: "Consulta jurídica",
        valor: 800,
        status: "VENCIDO",
        dataVencimento: new Date("2024-12-15"),
        clienteId: c3.id,
      },
    ],
  });

  console.log("✅ Seed concluído — L&V Advocacia");
  console.log("   Login: admin@lv.adv.br / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
