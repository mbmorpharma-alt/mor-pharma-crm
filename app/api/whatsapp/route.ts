import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { detectCampaign } from "@/lib/campaigns";

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
  const detectedCampaign = detectCampaign(message);

  // WhatsApp (or the bot) can deliver the same message's webhook twice in
  // quick succession. A Postgres advisory lock keyed by the normalized phone
  // serializes those concurrent calls, so the second one always sees the
  // contact the first one just created instead of racing it and creating a
  // duplicate.
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${normalized})::bigint)`;

    const allContacts = await tx.contact.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true, campaign: true },
    });
    const match = allContacts.find(
      (c) => c.phone && toWhatsAppNumber(c.phone) === normalized
    );

    const isNew = !match;
    const updatedOrCreated = match
      ? await tx.contact.update({
          where: { id: match.id },
          data: {
            name: name && name.trim() ? name : undefined,
            campaign: !match.campaign && detectedCampaign ? detectedCampaign : undefined,
          },
        })
      : await tx.contact.create({
          data: {
            name: name && name.trim() ? name : `ליד וואטסאפ ${phone}`,
            phone,
            status: "חדש",
            campaign: detectedCampaign ?? undefined,
          },
        });

    return { contact: updatedOrCreated, isNew };
  });

  await prisma.activity.create({
    data: {
      type: "וואטסאפ",
      note: message || "פנייה חדשה בוואטסאפ",
      contactId: result.contact.id,
    },
  });

  return NextResponse.json({ ok: true, contactId: result.contact.id, isNew: result.isNew });
}
