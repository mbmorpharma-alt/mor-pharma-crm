import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Small pool + short timeouts: this runs inside serverless functions, where
// each cold instance opens its own pool. Without these, idle connections
// from past instances pile up against Prisma Postgres's connection limit,
// and once it's exhausted, new requests queue silently for a free slot —
// which can take minutes instead of failing fast with a visible error.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
