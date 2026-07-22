"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { followUpTemplates } from "@/lib/whatsapp";

export function FollowUpMenu({
  contactId,
  name,
  phone,
  onSent,
}: {
  contactId: number;
  name: string;
  phone: string;
  onSent?: () => void;
}) {
  const [sending, setSending] = useState(false);

  if (!phone) return null;

  async function send(message: string) {
    setSending(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "שליחת ההודעה נכשלה");
        return;
      }
      onSent?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" disabled={sending}>
            {sending ? "שולח..." : "💬 פולו אפ"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" dir="rtl">
        {followUpTemplates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => send(template.build(name))}
          >
            {template.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
