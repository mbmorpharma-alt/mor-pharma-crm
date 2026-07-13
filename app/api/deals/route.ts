import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await prisma.deal.findMany({
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const deal = await prisma.deal.create({
    data: {
      title: body.title,
      value: body.value ? Number(body.value) : null,
      stage: body.stage || "ליד",
      notes: body.notes || null,
      contactId: body.contactId ? Number(body.contactId) : null,
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
