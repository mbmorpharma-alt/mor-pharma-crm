"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLORS } from "@/lib/statuses";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { ContactFormDialog, ContactFormValues } from "@/components/contact-form-dialog";
import { FollowUpMenu } from "@/components/follow-up-menu";
import { TaskFormDialog, TaskFormValues } from "@/components/task-form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type Deal = {
  id: number;
  title: string;
  value: number | null;
  stage: string;
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
};

type Activity = {
  id: number;
  type: string;
  note: string;
  createdAt: string;
};

type ContactDetail = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  status: string;
  whatsappSummary: string | null;
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
};

export default function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskFormValues | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/contacts/${id}`);
    if (res.ok) {
      setContact(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "תהליך", note: noteText, contactId: id }),
    });
    setNoteText("");
    setSavingNote(false);
    load();
  }

  async function toggleTaskCompleted(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        dueDate: task.dueDate,
        completed: !task.completed,
        contactId: id,
      }),
    });
    load();
  }

  async function deleteTask(taskId: number) {
    if (!confirm("למחוק את המשימה?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">טוען...</div>;
  }

  if (!contact) {
    return <div className="p-4 text-center text-muted-foreground">איש הקשר לא נמצא</div>;
  }

  const editValues: ContactFormValues = {
    id: contact.id,
    name: contact.name,
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    company: contact.company ?? "",
    notes: contact.notes ?? "",
    status: contact.status,
    whatsappSummary: contact.whatsappSummary ?? "",
  };

  return (
    <div dir="rtl" className="mx-auto max-w-4xl p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          {contact.company && (
            <p className="text-muted-foreground">{contact.company}</p>
          )}
          <Badge className={`mt-2 ${STATUS_COLORS[contact.status] ?? ""}`}>
            {contact.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <FollowUpMenu
            contactId={contact.id}
            name={contact.name}
            phone={contact.phone ?? ""}
            onSent={load}
          />
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            ✏️ עריכה
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>פרטים</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">טלפון: </span>
            {contact.phone ? (
              <a
                href={`https://wa.me/${toWhatsAppNumber(contact.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {contact.phone} 💬
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">אימייל: </span>
            {contact.email || "—"}
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">הערות: </span>
            {contact.notes || "—"}
          </div>
          {contact.whatsappSummary && (
            <div className="col-span-2">
              <span className="text-muted-foreground">סיכום וואטסאפ: </span>
              {contact.whatsappSummary}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>עסקאות ({contact.deals.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {contact.deals.length === 0 && (
            <p className="text-muted-foreground text-sm">אין עסקאות</p>
          )}
          {contact.deals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <span>{deal.title}</span>
              <div className="flex items-center gap-2">
                {deal.value != null && <span>₪{deal.value}</span>}
                <Badge variant="secondary">{deal.stage}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>משימות ({contact.tasks.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingTask({ title: "", dueDate: "", contactId: String(contact.id) });
              setTaskDialogOpen(true);
            }}
          >
            + הוסף משימה
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {contact.tasks.length === 0 && (
            <p className="text-muted-foreground text-sm">אין משימות</p>
          )}
          {contact.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-md border p-2 text-sm"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTaskCompleted(task)}
              />
              <span
                className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </span>
              {task.dueDate && (
                <span className="text-muted-foreground text-xs">
                  {new Date(task.dueDate).toLocaleString("he-IL")}
                </span>
              )}
              <button
                onClick={() => {
                  setEditingTask({
                    id: task.id,
                    title: task.title,
                    dueDate: toDatetimeLocal(task.dueDate),
                    contactId: String(contact.id),
                  });
                  setTaskDialogOpen(true);
                }}
                title="עריכה"
              >
                ✏️
              </button>
              <button onClick={() => deleteTask(task.id)} title="מחיקה">
                ✕
              </button>
            </div>
          ))}
          {(() => {
            const lastFollowUp = contact.activities.find((a) => a.type === "פולו אפ");
            return lastFollowUp ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
                {lastFollowUp.note}
              </div>
            ) : null;
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>היסטוריית פעילות ({contact.activities.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={addNote} className="flex flex-col gap-2">
            <Textarea
              placeholder="כתוב על התהליך עם הלקוח..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button type="submit" size="sm" className="self-start" disabled={savingNote}>
              {savingNote ? "שומר..." : "הוסף הערה"}
            </Button>
          </form>
          {contact.activities.length === 0 && (
            <p className="text-muted-foreground text-sm">אין פעילות</p>
          )}
          {contact.activities.map((activity) => (
            <div key={activity.id} className="rounded-md border p-2 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{activity.type}</Badge>
                <span className="text-muted-foreground text-xs">
                  {new Date(activity.createdAt).toLocaleString("he-IL")}
                </span>
              </div>
              <p className="mt-1">{activity.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editValues}
        onSaved={load}
      />

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        initial={editingTask}
        onSaved={load}
      />
    </div>
  );
}
