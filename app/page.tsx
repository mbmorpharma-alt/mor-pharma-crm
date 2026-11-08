"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/month-picker";
import { Input } from "@/components/ui/input";
import { usePrivacyMode, formatMoney, BLUR_NAME_CLASS } from "@/lib/use-privacy-mode";
import { cn } from "@/lib/utils";
import { CAMPAIGN_NAMES } from "@/lib/campaigns";
import { STATUSES, STATUS_CHART_COLORS } from "@/lib/statuses";

type Contact = {
  id: number;
  name: string;
  phone: string | null;
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
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

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

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return contacts
      .filter((c) => c.name.includes(q) || (c.phone ?? "").includes(q))
      .slice(0, 8);
  }, [contacts, query]);

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

  const statusBreakdown = STATUSES.map((status) => ({
    status,
    count: contacts.filter((c) => c.status === status).length,
    color: STATUS_CHART_COLORS[status],
  }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxStatusCount = Math.max(1, ...statusBreakdown.map((s) => s.count));

  const existingVsNewTotal = revenueExisting + revenueNew;

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
    <div dir="rtl" className="mx-auto w-full max-w-none p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder="חיפוש לפי שם או טלפון..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              className="w-64"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                {searchResults.map((c) => (
                  <a
                    key={c.id}
                    href={`/contacts/${c.id}`}
                    className={cn(
                      "block px-3 py-2 text-sm hover:bg-accent",
                      hidden && BLUR_NAME_CLASS
                    )}
                  >
                    {c.name}
                    {c.phone && (
                      <span className="text-muted-foreground"> · {c.phone}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
            {showResults && query.trim() && searchResults.length === 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-2 text-sm text-muted-foreground shadow-md">
                לא נמצאו אנשי קשר
              </div>
            )}
          </div>
          <MonthPicker
            year={periodYear}
            month={periodMonth}
            onChange={(y, m) => {
              setPeriodYear(y);
              setPeriodMonth(m);
            }}
          />
        </div>
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
        {existingVsNewTotal > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-background p-3">
            <span className="shrink-0 text-xs text-muted-foreground">
              חלוקת הכנסות {periodLabel}
            </span>
            <div className="flex h-2 flex-1 overflow-hidden rounded-full">
              <div
                style={{
                  width: `${(revenueExisting / existingVsNewTotal) * 100}%`,
                  backgroundColor: "#e34948",
                }}
              />
              <div className="w-0.5 shrink-0 bg-background" />
              <div
                style={{
                  width: `${(revenueNew / existingVsNewTotal) * 100}%`,
                  backgroundColor: "#2a78d6",
                }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#e34948" }} />{" "}
              קיימים {Math.round((revenueExisting / existingVsNewTotal) * 100)}%
              {"  ·  "}
              <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#2a78d6" }} />{" "}
              חדשים {Math.round((revenueNew / existingVsNewTotal) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 md:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle>🧭 אנשי קשר לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {statusBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">אין עדיין אנשי קשר</p>
            )}
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate">{s.status}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.count / maxStatusCount) * 100}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-end tabular-nums text-muted-foreground">
                  {s.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
