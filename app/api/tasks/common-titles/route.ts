import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.$queryRaw<{ title: string; count: bigint }[]>`
    SELECT trim(title) as title, count(*) as count
    FROM "Task"
    WHERE trim(title) <> ''
    GROUP BY trim(title)
    ORDER BY count(*) DESC
    LIMIT 15
  `;

  return NextResponse.json(rows.map((r) => r.title));
}
