import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const contacts = await prisma.contact.findMany({
    where: {
      AND: [
        status ? { status } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: {
      tasks: {
        where: { completed: false },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
      activities: {
        where: { type: "פולו אפ" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
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
      bookCount: body.bookCount || null,
      whatsappSummary: body.whatsappSummary || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
