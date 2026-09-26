import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const include = {
  contact: {
    include: {
      activities: {
        where: { type: "פולו אפ" },
        orderBy: { createdAt: "desc" as const },
        take: 1,
      },
    },
  },
  deal: true,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const completedParam = searchParams.get("completed");

  // No `page` param: legacy behavior — every task as a plain array (used by
  // the dashboard, which needs the full set to compute pending/overdue counts).
  if (!pageParam) {
    const tasks = await prisma.task.findMany({
      include,
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(tasks);
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize")) || 100));
  const where = completedParam !== null ? { completed: completedParam === "true" } : {};

  // dueDate is a plain column here (unlike contacts' "next task" sort key,
  // which needs a nested relation) so the DB can order and paginate directly
  // — no need for the fetch-all-then-slice workaround used in /api/contacts.
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({ tasks, total, page, pageSize });
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
