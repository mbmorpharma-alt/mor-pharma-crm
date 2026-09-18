import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const campaign = searchParams.get("campaign") || "";
  const pageParam = searchParams.get("page");

  const where = {
    AND: [
      status ? { status } : {},
      campaign ? { campaign } : {},
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { company: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const include = {
    tasks: {
      where: { completed: false },
      orderBy: { dueDate: "asc" as const },
      take: 1,
    },
    activities: {
      where: { type: "פולו אפ" },
      orderBy: { createdAt: "desc" as const },
      take: 1,
    },
  };

  // No `page` param: legacy behavior — return every matching contact as a
  // plain array (used by the dashboard's stats and the contact-picker
  // dropdowns, which need the full list, not one page of it).
  if (!pageParam) {
    const contacts = await prisma.contact.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize")) || 50));

  // Sort key (most recently touched first) depends on each contact's
  // nearest open task, which Prisma can't sort by directly — so fetch every
  // matching contact with its task/activity `include` (the same shape used
  // above; fast — unlike the equivalent `select`, which is pathologically
  // slow with the driver adapter), sort in memory, then slice the page.
  // The DB round trip is cheap either way; what pagination actually saves
  // is the JSON payload size and client-side render cost of one page vs.
  // the full list.
  const allMatching = await prisma.contact.findMany({ where, include });

  allMatching.sort((a, b) => {
    const aTime = new Date(a.tasks[0]?.updatedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.tasks[0]?.updatedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  const total = allMatching.length;
  const pageContacts = allMatching.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ contacts: pageContacts, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      company: body.company || null,
      notes: body.notes || null,
      status: body.status || "חדש",
      isExistingCustomer: body.isExistingCustomer ?? false,
      campaign: body.campaign || null,
      bookCount: body.bookCount || null,
      whatsappSummary: body.whatsappSummary || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
