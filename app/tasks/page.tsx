"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog, TaskFormValues } from "@/components/task-form-dialog";

type Task = {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
  contact: { id: number; name: string } | null;
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

  if (due < now) {
    return <Badge className="bg-red-100 text-red-800">⚠️ באיחור</Badge>;
  }
  if (due < startOfTomorrow) {
    return <Badge className="bg-orange-100 text-orange-800">🔥 היום</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-800">📅 מאוחר יותר</Badge>;
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

  function renderTask(task: Task) {
    return (
      <div
        key={task.id}
        className="flex items-center gap-3 rounded-lg border bg-background p-3"
      >
        <Checkbox checked={task.completed} onCheckedChange={() => toggleCompleted(task)} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={task.completed ? "line-through text-muted-foreground" : ""}>
              {task.title}
            </span>
            {dueTag(task.dueDate, task.completed)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {task.contact && (
              <a
                href={`/contacts/${task.contact.id}`}
                className="text-primary hover:underline"
              >
                {task.contact.name}
              </a>
            )}
            {task.dueDate && (
              <span>{new Date(task.dueDate).toLocaleString("he-IL")}</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing({
              id: task.id,
              title: task.title,
              dueDate: toDatetimeLocal(task.dueDate),
              contactId: task.contact ? String(task.contact.id) : "",
            });
            setDialogOpen(true);
          }}
        >
          ✏️
        </Button>
        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl p-4 flex flex-col gap-4">
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
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">אין משימות ממתינות</p>
            )}
            {pending.map(renderTask)}
          </div>

          {done.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                הושלמו ({done.length})
              </h2>
              {done.map(renderTask)}
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
