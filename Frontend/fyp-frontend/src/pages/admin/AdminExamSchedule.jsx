import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResourceFormDialog } from "@/components/ui/resource-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CsvUploadButton } from "@/components/ui/csv-upload-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Pencil, Trash2, Power, BookOpen, Building2 } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const TABS = [
  { key: "exams", label: "Exams",      icon: BookOpen   },
  { key: "halls", label: "Exam Halls", icon: Building2  },
];

const examStatusVariant = { scheduled: "default", active: "success", ended: "secondary" };
const hallStatusVariant  = { open: "success", closed: "secondary" };

export default function AdminExamSchedule() {
  const user = getCurrentUser() || { name: "Admin", id: "admin", role: "admin" };

  const [tab, setTab]           = useState("exams");
  const [rows, setRows]         = useState([]);
  const [halls, setHalls]       = useState([]);   // used for exam hall selector in exam form
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // ── Load data ───────────────────────────────────────────────────────────────
  const reload = async (t = tab) => {
    setLoading(true);
    try {
      if (t === "exams") {
        const [exams, h] = await Promise.all([api.getExams(), api.getExamHalls()]);
        setRows(exams);
        setHalls(h);
      } else {
        setRows(await api.getAdminExamHalls());
      }
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(tab); }, [tab]);

  const hallName = (id) => halls.find((h) => String(h.id) === String(id))?.hallNumber || "—";

  // ── Field definitions ───────────────────────────────────────────────────────
  const fields = useMemo(() => {
    if (tab === "exams") return [
      { name: "name",      label: "Exam Name", type: "text",   required: true },
      { name: "subject",   label: "Subject",   type: "text",   required: true },
      { name: "date",      label: "Date",      type: "date",   required: true },
      { name: "startTime", label: "Start",     type: "time",   required: true },
      { name: "endTime",   label: "End",       type: "time",   required: true },
      { name: "hallId", label: "Hall", type: "select", required: true,
        options: halls.map((h) => ({ value: h.id, label: h.hallNumber })) },
    ];

    return [
      { name: "hallNumber", label: "Hall Number", type: "text",   required: true },
      { name: "floor",      label: "Floor",       type: "number", required: true },
      { name: "capacity",   label: "Capacity",    type: "number", required: true },
      { name: "location",   label: "Location",    type: "text" },
      { name: "status",     label: "Status",      type: "select",
        options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }] },
    ];
  }, [tab, halls]);

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    if (tab === "exams") return [
      { header: "Name",    accessor: "name"    },
      { header: "Subject", accessor: "subject" },
      { header: "Date",    accessor: "date"    },
      { header: "Start",   accessor: "startTime" },
      { header: "End",     accessor: "endTime"   },
      { header: "Hall",    accessor: (r) => hallName(r.hallId) },
      { header: "Status",  accessor: (r) => (
        <StatusBadge variant={examStatusVariant[r.status] || "default"}>{r.status}</StatusBadge>
      )},
      { header: "", className: "w-32",
        accessor: (r) => (
          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => { setEditing(r); setFormOpen(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ];

    return [
      { header: "Hall #",   accessor: "hallNumber" },
      { header: "Floor",    accessor: "floor"      },
      { header: "Capacity", accessor: "capacity"   },
      { header: "Location", accessor: "location"   },
      { header: "Status",   accessor: (r) => (
        <StatusBadge variant={hallStatusVariant[r.status] || "default"}>{r.status}</StatusBadge>
      )},
      { header: "", className: "w-44",
        accessor: (r) => (
          <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => toggleHallStatus(r)}>
              <Power className="h-3.5 w-3.5 mr-1" />
              {r.status === "open" ? "Close" : "Open"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ];
  }, [tab, halls, rows]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const toggleHallStatus = async (row) => {
    const next = row.status === "open" ? "closed" : "open";
    try {
      await api.updateAdminExamHallStatus(row.id, next);
      toast.success(`Hall ${next}`);
      reload();
    } catch (e) { toast.error(e.message || "Update failed"); }
  };

  const onSubmit = async (payload) => {
    try {
      if (tab === "exams") {
        if (editing) await api.updateExam(editing.id, payload);
        else         await api.createExam(payload);
      } else {
        await api.createAdminExamHall({ ...payload, status: payload.status || "open" });
      }
      toast.success("Saved");
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (e) { toast.error(e.message || "Save failed"); }
  };

  const onDelete = async (row) => {
    try {
      if (tab === "exams") await api.deleteExam(row.id);
      else                 await api.deleteAdminExamHall(row.id);
      toast.success("Deleted");
      reload();
    } catch (e) { toast.error(e.message || "Delete failed"); }
  };

  const tabLabel  = TABS.find((t) => t.key === tab)?.label || "";
  const itemLabel = tab === "exams" ? "Exam" : "Hall";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Exam Schedule">
      <div className="space-y-4 animate-fade-in">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 justify-end">
          <CsvUploadButton
            onUpload={(f) => tab === "exams" ? api.uploadExamsCsv(f) : api.uploadExamHallsCsv(f)}
          />
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add {itemLabel}
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            emptyMessage={`No ${tabLabel.toLowerCase()} yet`}
            columns={columns}
            data={rows}
          />
        )}
      </div>

      {/* Form dialog */}
      <ResourceFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        title={editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        fields={fields}
        initialValues={editing || {}}
        onSubmit={onSubmit}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title={`Delete ${itemLabel}?`}
        description={
          tab === "halls"
            ? `Remove ${confirmDel?.hallNumber}? Halls with active exams cannot be deleted.`
            : `Remove ${confirmDel?.name}?`
        }
        destructive
        confirmLabel="Delete"
        onConfirm={() => onDelete(confirmDel)}
      />
    </DashboardLayout>
  );
}
