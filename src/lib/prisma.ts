import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { withVerifiedSsl } from "@/lib/database-url";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const databaseUrl = connectionString;

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: withVerifiedSsl(databaseUrl),
    }),
  });
}

function hasCurrentModels(client: PrismaClient) {
  return typeof client.documentShare?.create === "function";
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;

  // Dev HMR keeps the first PrismaClient on globalThis. After a schema
  // generate that adds models, that cached instance is missing delegates
  // until the process restarts. Replace it when the current schema is newer.
  if (existing && hasCurrentModels(existing)) {
    return existing;
  }

  if (existing) {
    void existing.$disconnect().catch((error: unknown) => {
      console.error("Failed to disconnect stale Prisma client:", error);
    });
  }

  const prisma = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

const prisma = getPrismaClient();

export default prisma;
