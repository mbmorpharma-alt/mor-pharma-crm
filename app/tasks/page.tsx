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
  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

  if (due < now) {
    return <Badge className="bg-red-100 text-red-800">⚠️ באיחור</Badge>;
  }
  if (due < startOfTomorrow) {
    return <Badge className="bg-orange-100 text-orange-800">🔥 היום</Badge>;
  }
  if (due < startOfDayAfter) {
    return <Badge className="bg-purple-100 text-purple-800">📅 מחר</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800">📅 מאוחר יותר</Badge>;
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskFormValues | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const data: Task[] = await res.json();

    data.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleCompleted(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
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
  }

  async function deleteTask(id: number) {
    if (!confirm("למחוק את המשימה?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  function renderTaskRow(task: Task) {
    return (
      <TableRow key={task.id}>
        <TableCell>
          {task.contact ? (
            <a
              href={`/contacts/${task.contact.id}`}
              className={`hover:underline ${
                contactPillColor(task.contact.id).match(/text-\S+/)?.[0] ?? ""
              }`}
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
              <span>{task.contact.phone}</span>
              <a
                href={`https://wa.me/${toWhatsAppNumber(task.contact.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
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
              ממתינות ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין משימות ממתינות</p>
            ) : (
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
            )}
          </div>

          {done.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                הושלמו ({done.length})
              </h2>
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
