import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");

  const activities = await prisma.activity.findMany({
    where: contactId ? { contactId: Number(contactId) } : {},
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const activity = await prisma.activity.create({
    data: {
      type: body.type,
      note: body.note,
      contactId: Number(body.contactId),
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
