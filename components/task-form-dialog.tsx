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

export type TaskFormValues = {
  id?: number;
  title: string;
  dueDate: string;
  contactId: string;
};

const EMPTY: TaskFormValues = { title: "", dueDate: "", contactId: "" };

export function TaskFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: TaskFormValues | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY);
      setError("");
      fetch("/api/tasks/common-titles")
        .then((res) => res.json())
        .then(setTitleSuggestions)
        .catch(() => setTitleSuggestions([]));
    }
  }, [open, initial]);

  const filteredSuggestions = titleSuggestions.filter((s) =>
    s.includes(values.title.trim())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = values.id ? `/api/tasks/${values.id}` : "/api/tasks";
    const method = values.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          dueDate: values.dueDate || null,
          contactId: values.contactId || null,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error("השמירה נכשלה, נסה שוב");
      onOpenChange(false);
      onSaved();
    } catch {
      setError("השמירה נכשלה או נמשכת יותר מדי זמן — בדוק חיבור ונסה שוב");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{values.id ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              required
              autoComplete="off"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="block w-full px-3 py-2 text-right text-sm hover:bg-accent"
                    onClick={() => {
                      setValues({ ...values, title: suggestion });
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="dueDate">תאריך ושעה</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={values.dueDate}
              onChange={(e) => setValues({ ...values, dueDate: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
