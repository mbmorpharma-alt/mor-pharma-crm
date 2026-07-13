import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id: Number(id) },
    include: { contact: true, tasks: true },
  });

  if (!deal) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(deal);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const deal = await prisma.deal.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      value: body.value ? Number(body.value) : null,
      stage: body.stage,
      notes: body.notes ?? null,
      contactId: body.contactId ? Number(body.contactId) : null,
    },
  });

  return NextResponse.json(deal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.deal.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
