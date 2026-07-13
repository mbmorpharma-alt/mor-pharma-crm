"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/statuses";

type Contact = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  contact: { id: number; name: string } | null;
};

type Deal = {
  id: number;
  title: string;
  value: number | null;
  stage: string;
};

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [contactsRes, tasksRes, dealsRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/tasks"),
        fetch("/api/deals"),
      ]);
      setContacts(await contactsRes.json());
      setTasks(await tasksRes.json());
      setDeals(await dealsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">טוען...</div>;
  }

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  );
  const pendingTasks = tasks.filter((t) => !t.completed);
  const openDeals = deals.filter(
    (d) => d.stage !== "סגור-נוצח" && d.stage !== "סגור-הפסד"
  );
  const dealsValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statCards = [
    { label: "אנשי קשר", value: contacts.length },
    { label: "משימות ממתינות", value: pendingTasks.length },
    { label: "משימות באיחור", value: overdueTasks.length, highlight: overdueTasks.length > 0 },
    { label: "עסקאות פתוחות", value: openDeals.length },
    { label: "שווי עסקאות פתוחות", value: `₪${dealsValue.toLocaleString()}` },
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-6xl p-4 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">דשבורד</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  stat.highlight ? "text-red-600" : ""
                }`}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>אנשי קשר אחרונים</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentContacts.length === 0 && (
              <p className="text-sm text-muted-foreground">אין אנשי קשר עדיין</p>
            )}
            {recentContacts.map((c) => (
              <a
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted"
              >
                <span>{c.name}</span>
                <Badge className={STATUS_COLORS[c.status] ?? ""}>{c.status}</Badge>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>משימות באיחור</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {overdueTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">אין משימות באיחור 🎉</p>
            )}
            {overdueTasks.map((t) => (
              <a
                key={t.id}
                href="/tasks"
                className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted"
              >
                <span>{t.title}</span>
                {t.contact && <span className="text-muted-foreground">{t.contact.name}</span>}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
