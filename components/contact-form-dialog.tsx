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
import { STATUSES } from "@/lib/statuses";

export type ContactFormValues = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
  status: string;
  whatsappSummary: string;
};

const EMPTY: ContactFormValues = {
  name: "",
  phone: "",
  email: "",
  company: "",
  notes: "",
  status: "חדש",
  whatsappSummary: "",
};

export function ContactFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ContactFormValues | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = values.id ? `/api/contacts/${values.id}` : "/api/contacts";
    const method = values.id ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSaving(false);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{values.id ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                required
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company">חברה</Label>
              <Input
                id="company"
                value={values.company}
                onChange={(e) => setValues({ ...values, company: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues({ ...values, status: !v || v === "none" ? "" : v })
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="whatsappSummary">סיכום וואטסאפ</Label>
              <Textarea
                id="whatsappSummary"
                value={values.whatsappSummary}
                onChange={(e) =>
                  setValues({ ...values, whatsappSummary: e.target.value })
                }
              />
            </div>
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
