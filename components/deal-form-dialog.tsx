"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STAGES } from "@/lib/deal-stages";

export type DealFormValues = {
  id?: number;
  title: string;
  value: string;
  stage: string;
  notes: string;
  contactId: string;
};

type ContactOption = { id: number; name: string };

const EMPTY: DealFormValues = {
  title: "",
  value: "",
  stage: "ליד",
  notes: "",
  contactId: "",
};

export function DealFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DealFormValues | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<DealFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY);
      fetch("/api/contacts")
        .then((res) => res.json())
        .then((data) => setContacts(data));
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = values.id ? `/api/deals/${values.id}` : "/api/deals";
    const method = values.id ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        value: values.value || null,
        stage: values.stage,
        notes: values.notes || null,
        contactId: values.contactId || null,
      }),
    });

    setSaving(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{values.id ? "עריכת עסקה" : "עסקה חדשה"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              required
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="value">שווי (₪)</Label>
            <Input
              id="value"
              type="number"
              value={values.value}
              onChange={(e) => setValues({ ...values, value: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stage">שלב</Label>
            <Select
              value={values.stage}
              onValueChange={(v) => setValues({ ...values, stage: !v ? values.stage : v })}
            >
              <SelectTrigger id="stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contactId">איש קשר</Label>
            <Select
              value={values.contactId}
              onValueChange={(v) =>
                setValues({ ...values, contactId: !v || v === "none" ? "" : v })
              }
            >
              <SelectTrigger id="contactId" className="w-full">
                <SelectValue placeholder="ללא איש קשר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא איש קשר</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "שמירה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
