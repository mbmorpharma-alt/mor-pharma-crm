"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskFormDialog, TaskFormValues } from "@/components/task-form-dialog";
import { FollowUpMenu } from "@/components/follow-up-menu";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { usePrivacyMode, maskPhone, BLUR_NAME_CLASS } from "@/lib/use-privacy-mode";
import { cn } from "@/lib/utils";

type Task = {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  contact: {
    id: number;
    name: string;
    phone: string | null;
    activities: { id: number; note: string }[];
  } | null;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function dueTag(dueDate: string | null, completed: boolean) {
  if (!dueDate || completed) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const time = due.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const date = due.toLocaleDateString("he-IL", { day: "numeric", month: "long" });

  if (due < now) {
    return (
      <Badge className="bg-red-100 text-red-800">
        ⚠️ באיחור {date} {time}
      </Badge>
    );
  }
  if (due < startOfTomorrow) {
    return <Badge className="bg-orange-100 text-orange-800">🔥 היום {time}</Badge>;
  }
  return (
    <Badge className="bg-blue-100 text-blue-800">
      📅 {date} {time}
    </Badge>
  );
}

const CONTACT_PILL_COLORS = [
  "border-violet-200 bg-violet-50 text-violet-800",
  "border-pink-200 bg-pink-50 text-pink-800",
  "border-emerald-200 bg-emerald-50 text-emerald-800",
  "border-amber-200 bg-amber-50 text-amber-800",
  "border-cyan-200 bg-cyan-50 text-cyan-800",
];

function contactPillColor(id: number) {
  return CONTACT_PILL_COLORS[id % CONTACT_PILL_COLORS.length];
}

const PAGE_SIZE = 100;

export default function TasksPage() {
  const { hidden } = usePrivacyMode();
  const [pending, setPending] = useState<Task[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [done, setDone] = useState<Task[]>([]);
  const [doneTotal, setDoneTotal] = useState(0);
  const [donePage, setDonePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskFormValues | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [pendingRes, doneRes] = await Promise.all([
      fetch(`/api/tasks?completed=false&page=${pendingPage}&pageSize=${PAGE_SIZE}`),
      fetch(`/api/tasks?completed=true&page=${donePage}&pageSize=${PAGE_SIZE}`),
    ]);
    const pendingData: { tasks: Task[]; total: number } = await pendingRes.json();
    const doneData: { tasks: Task[]; total: number } = await doneRes.json();
    setPending(pendingData.tasks);
    setPendingTotal(pendingData.total);
    setDone(doneData.tasks);
    setDoneTotal(doneData.total);
    setLoading(false);
  }, [pendingPage, donePage]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleCompleted(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        dueDate: task.dueDate,
        completed: !task.completed,
        contactId: task.contact?.id ?? null,
      }),
    });
    load();
  }

  async function deleteTask(id: number) {
    if (!confirm("למחוק את המשימה?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  function paginationBar(
    page: number,
    setPage: (p: number) => void,
    total: number
  ) {
    if (total <= PAGE_SIZE) return null;
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          מציג {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} מתוך {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            הקודם
          </Button>
          <span>
            עמוד {page} מתוך {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * PAGE_SIZE >= total}
            onClick={() => setPage(page + 1)}
          >
            הבא
          </Button>
        </div>
      </div>
    );
  }

  function renderTaskRow(task: Task) {
    return (
      <TableRow key={task.id}>
        <TableCell>
          {task.contact ? (
            <a
              href={`/contacts/${task.contact.id}`}
              className={cn(
                "hover:underline",
                contactPillColor(task.contact.id).match(/text-\S+/)?.[0] ?? "",
                hidden && BLUR_NAME_CLASS
              )}
            >
              {task.contact.name}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {task.contact?.phone ? (
            <div className="flex items-center gap-2">
              <span>{hidden ? maskPhone(task.contact.phone) : task.contact.phone}</span>
              <a
                href={`whatsapp://send?phone=${toWhatsAppNumber(task.contact.phone)}`}
                title="פתח וואטסאפ"
              >
                💬
              </a>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className={task.completed ? "line-through text-muted-foreground" : ""}>
            {task.title}
          </div>
          {task.contact?.activities[0] && (
            <div className="mt-1 text-xs text-green-700">
              {task.contact.activities[0].note}
            </div>
          )}
        </TableCell>
        <TableCell>{dueTag(task.dueDate, task.completed)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {task.contact?.phone && (
              <FollowUpMenu
                contactId={task.contact.id}
                name={task.contact.name}
                phone={task.contact.phone}
                onSent={load}
                pill
              />
            )}
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleCompleted(task)}
              title="הושלם"
            />
            <button
              onClick={() => {
                setEditing({
                  id: task.id,
                  title: task.title,
                  dueDate: toDatetimeLocal(task.dueDate),
                  contactId: task.contact ? String(task.contact.id) : "",
                });
                setDialogOpen(true);
              }}
              title="עריכה"
              className="text-muted-foreground hover:text-foreground"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              title="מחיקה"
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-none p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">משימות</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + משימה חדשה
        </Button>
      </div>

      {loading && <p className="text-center text-muted-foreground">טוען...</p>}

      {!loading && (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              ממתינות ({pendingTotal})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין משימות ממתינות</p>
            ) : (
              <>
                {paginationBar(pendingPage, setPendingPage, pendingTotal)}
                <div className="rounded-lg border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם</TableHead>
                        <TableHead>טלפון</TableHead>
                        <TableHead>משימה</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{pending.map(renderTaskRow)}</TableBody>
                  </Table>
                </div>
                {paginationBar(pendingPage, setPendingPage, pendingTotal)}
              </>
            )}
          </div>

          {doneTotal > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                הושלמו ({doneTotal})
              </h2>
              {paginationBar(donePage, setDonePage, doneTotal)}
              <div className="rounded-lg border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>טלפון</TableHead>
                      <TableHead>משימה</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{done.map(renderTaskRow)}</TableBody>
                </Table>
              </div>
              {paginationBar(donePage, setDonePage, doneTotal)}
            </div>
          )}
        </>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}
