import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Hit on a schedule (see .github/workflows/keep-alive.yml) to stop the
// Vercel function and the Prisma Postgres connection from scaling to zero
// between real visits, which is what causes the multi-second "cold start"
// delay on the first request after a period of inactivity.
export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
