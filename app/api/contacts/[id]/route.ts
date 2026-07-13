import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id: Number(id) },
    include: {
      deals: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(contact);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const contact = await prisma.contact.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
      status: body.status,
      bookCount: body.bookCount ?? null,
      whatsappSummary: body.whatsappSummary ?? null,
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.contact.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
