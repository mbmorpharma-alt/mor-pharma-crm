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

export function CloseDealDialog({
  open,
  onOpenChange,
  contactName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  onConfirm: (amount: number) => Promise<void> | void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onConfirm(Number(amount));
      onOpenChange(false);
    } catch {
      setError("השמירה נכשלה או נמשכת יותר מדי זמן — בדוק חיבור ונסה שוב");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>✅ סגירת עסקה עם {contactName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="closeAmount">כמה הלקוח קנה? (₪)</Label>
            <Input
              id="closeAmount"
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "סגירה ורישום עסקה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
