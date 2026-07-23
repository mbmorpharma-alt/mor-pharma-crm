"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STATUSES, STATUS_COLORS } from "@/lib/statuses";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { ContactFormDialog, ContactFormValues } from "@/components/contact-form-dialog";
import { FollowUpMenu } from "@/components/follow-up-menu";
import { TaskFormDialog, TaskFormValues } from "@/components/task-form-dialog";

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

type Task = {
  id: number;
  title: string;
  dueDate: string | null;
  completed: boolean;
};

type Contact = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  status: string;
  isExistingCustomer: boolean;
  whatsappSummary: string | null;
  createdAt: string;
  tasks: Task[];
  activities: { id: number; note: string }[];
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContactFormValues | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskForContact, setTaskForContact] = useState<TaskFormValues | null>(null);
  const [companyEditId, setCompanyEditId] = useState<number | null>(null);
  const [companyDraft, setCompanyDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/contacts?${params.toString()}`);
    const data = await res.json();
    setContacts(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  async function updateStatus(id: number, status: string) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contacts.find((c) => c.id === id), status }),
    });
  }

  async function toggleCustomerType(id: number) {
    const current = contacts.find((c) => c.id === id);
    if (!current) return;
    const isExistingCustomer = !current.isExistingCustomer;
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isExistingCustomer } : c))
    );
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, isExistingCustomer }),
    });
  }

  async function saveCompany(id: number) {
    const current = contacts.find((c) => c.id === id);
    setCompanyEditId(null);
    if (!current) return;
    const company = companyDraft.trim() || null;
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, company } : c)));
    await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, company }),
    });
  }

  async function completeTask(taskId: number) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    load();
  }

  async function deleteContact(id: number) {
    if (!confirm("למחוק את איש הקשר? הפעולה תמחק גם משימות ועסקאות משויכות.")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-none p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">אנשי קשר</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          + איש קשר חדש
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="חיפוש לפי שם, טלפון, אימייל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(!v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>חדש/קיים</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>משימה קרובה</TableHead>
              <TableHead>שם העסק</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  טוען...
                </TableCell>
              </TableRow>
            )}
            {!loading && contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  לא נמצאו אנשי קשר
                </TableCell>
              </TableRow>
            )}
            {contacts.map((contact) => {
              const nextTask = contact.tasks[0];
              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <a
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {contact.name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleCustomerType(contact.id)}
                      title="לחיצה להחלפה בין לקוח חדש לקיים"
                    >
                      <Badge
                        className={
                          contact.isExistingCustomer
                            ? "h-6 px-2.5 text-sm bg-red-100 text-red-800"
                            : "h-6 px-2.5 text-sm bg-blue-100 text-blue-800"
                        }
                      >
                        {contact.isExistingCustomer ? "🔁 קיים" : "🆕 חדש"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    {contact.phone ? (
                      <div className="flex items-center gap-2">
                        <span>{contact.phone}</span>
                        <a
                          href={`https://wa.me/${toWhatsAppNumber(contact.phone)}`}
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
                    <div className="flex items-center gap-2">
                      {nextTask ? (
                        <>
                          <span className="text-sm">{nextTask.title}</span>
                          <button
                            onClick={() => completeTask(nextTask.id)}
                            title="סמן כהושלם"
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setTaskForContact({
                                id: nextTask.id,
                                title: nextTask.title,
                                dueDate: toDatetimeLocal(nextTask.dueDate),
                                contactId: String(contact.id),
                              });
                              setTaskDialogOpen(true);
                            }}
                            title="עריכה"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ✏️
                          </button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      <button
                        onClick={() => {
                          setTaskForContact({
                            title: "",
                            dueDate: "",
                            contactId: String(contact.id),
                          });
                          setTaskDialogOpen(true);
                        }}
                        title="הוסף משימה"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        📅
                      </button>
                    </div>
                    {contact.activities[0] && (
                      <div className="mt-1 text-xs text-green-700">
                        {contact.activities[0].note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {companyEditId === contact.id ? (
                      <Input
                        autoFocus
                        value={companyDraft}
                        onChange={(e) => setCompanyDraft(e.target.value)}
                        onBlur={() => saveCompany(contact.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCompany(contact.id);
                          if (e.key === "Escape") setCompanyEditId(null);
                        }}
                        className="h-6 w-40 text-xs"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setCompanyEditId(contact.id);
                          setCompanyDraft(contact.company ?? "");
                        }}
                        title="לחיצה לעריכת שם העסק"
                      >
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          🏢 {contact.company || "הוסף עסק"}
                        </Badge>
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={contact.status}
                      onValueChange={(v) => updateStatus(contact.id, v || contact.status)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue>
                          <Badge className={STATUS_COLORS[contact.status] ?? ""}>
                            {contact.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FollowUpMenu
                        contactId={contact.id}
                        name={contact.name}
                        phone={contact.phone ?? ""}
                        onSent={load}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing({
                            id: contact.id,
                            name: contact.name,
                            phone: contact.phone ?? "",
                            email: contact.email ?? "",
                            company: contact.company ?? "",
                            notes: contact.notes ?? "",
                            status: contact.status,
                            isExistingCustomer: contact.isExistingCustomer,
                            whatsappSummary: contact.whatsappSummary ?? "",
                          });
                          setDialogOpen(true);
                        }}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContact(contact.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ContactFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        initial={taskForContact}
        onSaved={load}
      />
    </div>
  );
}
