"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/month-picker";
import { usePrivacyMode, formatMoney, BLUR_NAME_CLASS } from "@/lib/use-privacy-mode";
import { cn } from "@/lib/utils";
import { CAMPAIGN_NAMES } from "@/lib/campaigns";

type Contact = {
  id: number;
  name: string;
  status: string;
  campaign: string | null;
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
  createdAt: string;
  contact: { id: number; name: string; campaign: string | null } | null;
  wasExistingCustomer: boolean | null;
};

export default function DashboardPage() {
  const { hidden } = usePrivacyMode();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [periodYear, setPeriodYear] = useState(today.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(today.getMonth());

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
  const wonDeals = deals.filter((d) => d.stage === "סגור-נוצח");
  const periodStart = new Date(periodYear, periodMonth, 1);
  const periodEnd = new Date(periodYear, periodMonth + 1, 1);
  const periodWonDeals = wonDeals.filter((d) => {
    const createdAt = new Date(d.createdAt);
    return createdAt >= periodStart && createdAt < periodEnd;
  });
  const revenueExisting = periodWonDeals
    .filter((d) => d.wasExistingCustomer === true)
    .reduce((sum, d) => sum + (d.value ?? 0), 0);
  const revenueNew = periodWonDeals
    .filter((d) => d.wasExistingCustomer === false)
    .reduce((sum, d) => sum + (d.value ?? 0), 0);
  const periodRevenue = revenueExisting + revenueNew;
  const recentSales = [...periodWonDeals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const periodLeads = contacts.filter((c) => {
    const createdAt = new Date(c.createdAt);
    return createdAt >= periodStart && createdAt < periodEnd;
  });
  const periodLabel = `${String(periodMonth + 1).padStart(2, "0")}/${periodYear}`;

  const campaignStats = CAMPAIGN_NAMES.map((name) => {
    const leads = periodLeads.filter((c) => c.campaign === name);
    const closed = periodWonDeals.filter((d) => d.contact?.campaign === name);
    const revenue = closed.reduce((sum, d) => sum + (d.value ?? 0), 0);
    return { name, leadsCount: leads.length, closedCount: closed.length, revenue };
  }).filter((c) => c.leadsCount > 0 || c.closedCount > 0);

  const untaggedLeads = periodLeads.filter((c) => !c.campaign);
  const untaggedClosed = periodWonDeals.filter((d) => !d.contact?.campaign);
  const untaggedRevenue = untaggedClosed.reduce((sum, d) => sum + (d.value ?? 0), 0);
  if (untaggedLeads.length > 0 || untaggedClosed.length > 0) {
    campaignStats.push({
      name: "ללא קמפיין",
      leadsCount: untaggedLeads.length,
      closedCount: untaggedClosed.length,
      revenue: untaggedRevenue,
    });
  }

  const liveStatCards = [
    { label: "אנשי קשר", value: contacts.length },
    { label: "משימות ממתינות", value: pendingTasks.length },
    { label: "משימות באיחור", value: overdueTasks.length, highlight: overdueTasks.length > 0 },
    { label: "עסקאות פתוחות", value: openDeals.length },
    { label: "שווי עסקאות פתוחות", value: formatMoney(dealsValue, hidden) },
  ];

  const periodStatCards = [
    { label: "👥 לידים חדשים", value: periodLeads.length },
    { label: '💰 סה"כ הכנסות', value: formatMoney(periodRevenue, hidden) },
    { label: "💰 מלקוחות קיימים", value: formatMoney(revenueExisting, hidden) },
    { label: "💰 מלקוחות חדשים", value: formatMoney(revenueNew, hidden) },
  ];

  return (
    <div dir="rtl" className="mx-auto max-w-6xl p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <MonthPicker
          year={periodYear}
          month={periodMonth}
          onChange={(y, m) => {
            setPeriodYear(y);
            setPeriodMonth(m);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {liveStatCards.map((stat) => (
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

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">נתוני {periodLabel}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {periodStatCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📣 קמפיינים ב-{periodLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין עדיין לידים או מכירות מתויגים לקמפיין בתקופה הזו</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right text-muted-foreground">
                      <th className="py-2 pe-3 font-medium">קמפיין</th>
                      <th className="py-2 px-3 font-medium">לידים</th>
                      <th className="py-2 px-3 font-medium">נסגרו</th>
                      <th className="py-2 ps-3 font-medium">הכנסות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignStats.map((c) => (
                      <tr
                        key={c.name}
                        className={cn(
                          "border-b last:border-0",
                          c.name === "ללא קמפיין" && "text-muted-foreground italic"
                        )}
                      >
                        <td className="py-2 pe-3">{c.name}</td>
                        <td className="py-2 px-3 tabular-nums">{c.leadsCount}</td>
                        <td className="py-2 px-3 tabular-nums">{c.closedCount}</td>
                        <td
                          className={cn(
                            "py-2 ps-3 font-semibold",
                            c.name === "ללא קמפיין" ? "text-muted-foreground" : "text-green-700"
                          )}
                        >
                          {formatMoney(c.revenue, hidden)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💰 מכירות ב-{periodLabel}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentSales.length === 0 && (
              <p className="text-sm text-muted-foreground">אין מכירות סגורות בתקופה הזו</p>
            )}
            {recentSales.map((d) => (
              <a
                key={d.id}
                href={d.contact ? `/contacts/${d.contact.id}` : "/deals"}
                className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted"
              >
                <div className="flex flex-col gap-0.5">
                  <span className={cn(hidden && BLUR_NAME_CLASS)}>
                    {d.contact?.name ?? d.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(d.createdAt).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {", "}
                      {new Date(d.createdAt).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {d.wasExistingCustomer === true && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
                        🔁 קיים
                      </span>
                    )}
                    {d.wasExistingCustomer === false && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                        🆕 חדש
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-green-700">
                  {formatMoney(d.value ?? 0, hidden)}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
