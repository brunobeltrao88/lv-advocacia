import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";

function createClient() {
  if (process.env.DATABASE_URL?.startsWith("postgresql") || process.env.DATABASE_URL?.startsWith("postgres")) {
    const WS = require("ws");
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
    if (proxyUrl) {
      const { HttpsProxyAgent } = require("https-proxy-agent");
      const agent = new HttpsProxyAgent(proxyUrl);
      class ProxiedWebSocket extends WS {
        constructor(address: string, protocols?: string | string[]) {
          super(address, protocols, { agent });
        }
      }
      neonConfig.webSocketConstructor = ProxiedWebSocket;
    } else {
      neonConfig.webSocketConstructor = WS;
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as any);
  }
  return new PrismaClient();
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
