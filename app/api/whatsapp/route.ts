import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWhatsAppNumber } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const body = await request.json();
  const { phone, name, message } = body as {
    phone: string;
    name?: string;
    message?: string;
  };

  if (!phone) {
    return NextResponse.json({ error: "חסר מספר טלפון" }, { status: 400 });
  }

  const normalized = toWhatsAppNumber(phone);

  const allContacts = await prisma.contact.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  const match = allContacts.find(
    (c) => c.phone && toWhatsAppNumber(c.phone) === normalized
  );

  const contact = match
    ? await prisma.contact.update({
        where: { id: match.id },
        data: {
          name: name && name.trim() ? name : undefined,
        },
      })
    : await prisma.contact.create({
        data: {
          name: name && name.trim() ? name : `ליד וואטסאפ ${phone}`,
          phone,
          status: "חדש",
        },
      });

  await prisma.activity.create({
    data: {
      type: "וואטסאפ",
      note: message || "פנייה חדשה בוואטסאפ",
      contactId: contact.id,
    },
  });

  return NextResponse.json({ ok: true, contactId: contact.id, isNew: !match });
}
