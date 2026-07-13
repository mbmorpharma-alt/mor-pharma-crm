"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { followUpTemplates, whatsappLink } from "@/lib/whatsapp";

export function FollowUpMenu({ name, phone }: { name: string; phone: string }) {
  if (!phone) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm">💬 פולו אפ</Button>} />
      <DropdownMenuContent align="end" dir="rtl">
        {followUpTemplates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            render={
              <a
                href={whatsappLink(phone, template.build(name))}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            {template.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
