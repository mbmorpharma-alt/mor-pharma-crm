import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/green-api";
import { nextBusinessDay } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const message: string = body.message;

  if (!message) {
    return NextResponse.json({ error: "חסרה הודעה" }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: Number(id) } });
  if (!contact || !contact.phone) {
    return NextResponse.json({ error: "לא נמצא איש קשר עם טלפון" }, { status: 400 });
  }

  try {
    await sendWhatsAppMessage(contact.phone, message);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שליחת וואטסאפ נכשלה" },
      { status: 502 }
    );
  }

  const now = new Date();
  const dateLabel = `${now.toLocaleDateString("he-IL")} ${now.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const activity = await prisma.activity.create({
    data: {
      type: "פולו אפ",
      note: `פולו אפ נשלח ${dateLabel} - "${message}"`,
      contactId: contact.id,
    },
  });

  const nextTask = await prisma.task.findFirst({
    where: { contactId: contact.id, completed: false },
    orderBy: { dueDate: "asc" },
  });

  let task = null;
  if (nextTask) {
    task = await prisma.task.update({
      where: { id: nextTask.id },
      data: { dueDate: nextBusinessDay(now) },
    });
  }

  return NextResponse.json({ ok: true, activity, task });
}
