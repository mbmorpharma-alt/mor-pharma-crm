import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      contact: true,
      deal: true,
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const task = await prisma.task.create({
    data: {
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completed: body.completed ?? false,
      contactId: body.contactId ? Number(body.contactId) : null,
      dealId: body.dealId ? Number(body.dealId) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
