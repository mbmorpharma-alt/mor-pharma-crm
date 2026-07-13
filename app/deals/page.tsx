"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { DealFormDialog, DealFormValues } from "@/components/deal-form-dialog";

type Deal = {
  id: number;
  title: string;
  value: number | null;
  stage: string;
  notes: string | null;
  contact: { id: number; name: string } | null;
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DealFormValues | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/deals");
    setDeals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteDeal(id: number) {
    if (!confirm("למחוק את העסקה?")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    load();
  }

  function openEdit(deal: Deal) {
    setEditing({
      id: deal.id,
      title: deal.title,
      value: deal.value != null ? String(deal.value) : "",
      stage: deal.stage,
      notes: deal.notes ?? "",
      contactId: deal.contact ? String(deal.contact.id) : "",
    });
    setDialogOpen(true);
  }

  return (
    <div dir="rtl" className="mx-auto max-w-6xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">עסקאות</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + עסקה חדשה
        </Button>
      </div>

      {loading && <p className="text-center text-muted-foreground">טוען...</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
            return (
              <div key={stage} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold">{stage}</span>
                  <span className="text-xs text-muted-foreground">
                    {stageDeals.length} · ₪{total.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {stageDeals.map((deal) => (
                    <Card
                      key={deal.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => openEdit(deal)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{deal.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {deal.value != null && <span>₪{deal.value.toLocaleString()}</span>}
                        {deal.contact && (
                          <a
                            href={`/contacts/${deal.contact.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline"
                          >
                            {deal.contact.name}
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDeal(deal.id);
                          }}
                          className="self-start text-red-500 hover:text-red-700"
                        >
                          מחיקה
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DealFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}
