"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "ינו", "פבר", "מרץ", "אפר", "מאי", "יונ",
  "יול", "אוג", "ספט", "אוק", "נוב", "דצמ",
];

export function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number; // 0-11
  onChange: (year: number, month: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setViewYear(year);
          setOpen((o) => !o);
        }}
        className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted"
      >
        <Calendar className="size-4 text-muted-foreground" />
        <span className="font-medium tabular-nums" dir="ltr">
          {String(month + 1).padStart(2, "0")}/{year}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-2 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
            <div dir="ltr" className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div dir="rtl" className="grid grid-cols-4 gap-1.5">
              {MONTH_LABELS.map((label, i) => {
                const selected = viewYear === year && i === month;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      onChange(viewYear, i);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-md py-1.5 text-sm",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
