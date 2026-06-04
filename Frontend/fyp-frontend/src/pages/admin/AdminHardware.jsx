import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResourceFormDialog } from "@/components/ui/resource-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CsvUploadButton } from "@/components/ui/csv-upload-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Power, Camera, Mic, Volume2 } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

// ── Per-device config ─────────────────────────────────────────────────────────

const TABS = [
  { key: "cameras",     label: "Cameras",     icon: Camera  },
  { key: "microphones", label: "Microphones", icon: Mic     },
  { key: "speakers",    label: "Speakers",    icon: Volume2 },
];

const speakerStatusVariant = { active: "success", inactive: "secondary", offline: "destructive" };

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminHardware() {
  const user = getCurrentUser() || { name: "Admin", id: "admin", role: "admin" };

  const [tab, setTab]         = useState("cameras");
  const [rows, setRows]       = useState([]);
  const [halls, setHalls]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // ── Load data whenever tab changes ─────────────────────────────────────────
  const reload = async (device = tab) => {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([api[device].list(), api.getExamHalls()]);
      setRows(r);
      setHalls(h);
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(tab); }, [tab]);

  const hallName = (id) => halls.find((h) => String(h.id) === String(id))?.hallNumber || "—";

  // ── Field definitions per device ───────────────────────────────────────────
  const fields = useMemo(() => {
    const hallOptions = halls.map((h) => ({ value: h.id, label: h.hallNumber }));

    if (tab === "cameras") return [
      { name: "position",  label: "Position",   type: "text",   required: true },
      { name: "ip_address", label: "IP Address", type: "text",   required: true },
      { name: "model",     label: "Model",      type: "text",   required: true },
      { name: "hallId",    label: "Hall",       type: "select", required: true, options: hallOptions },
    ];

   if (tab === "microphones") return [
  {
    name: "ipAddress",
    label: "Source",
    type: "text",
    required: true,
  },
  { name: "range", label: "Range", type: "text" },
  {
    name: "sensitivity",
    label: "Sensitivity",
    type: "select",
    options: [
      { value: "Low", label: "Low" },
      { value: "Medium", label: "Medium" },
      { value: "High", label: "High" },
    ],
  },
  { name: "row", label: "Row", type: "number" },
  { name: "column", label: "Column", type: "number" },
  {
    name: "hallId",
    label: "Hall",
    type: "select",
    required: true,
    options: hallOptions,
  },
];
    if (tab === "speakers") return [
      { name: "label",     label: "Label",          type: "text",   required: true },
      { name: "ipAddress", label: "IP Address",     type: "text",   required: true },
      { name: "volume",    label: "Volume (0–100)", type: "number" },
      { name: "hallId",    label: "Hall",           type: "select", required: true, options: hallOptions },
    ];

    return [];
  }, [tab, halls]);

  // ── Columns per device ──────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const actions = (r) => (
      <div className="flex gap-2 justify-end items-center" onClick={(e) => e.stopPropagation()}>
        {/* Cameras & Microphones: power toggle */}
        {(tab === "cameras" || tab === "microphones") && (
          <Button size="sm" variant="outline" onClick={() => handleToggle(r)}>
            <Power className="h-3.5 w-3.5" />
          </Button>
        )}
        {/* Speakers: status dropdown */}
        {tab === "speakers" && (
          <Select value={r.status} onValueChange={(v) => handleSpeakerStatus(r.id, v)}>
            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => { setEditing(r); setFormOpen(true); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );

    if (tab === "cameras") return [
      { header: "Position",   accessor: "position" },
      { header: "IP Address", accessor: "ipAddress" },
      { header: "Model",      accessor: "model" },
      { header: "Hall",       accessor: (r) => hallName(r.hallId) },
      { header: "Active",     accessor: (r) => (
        <StatusBadge variant={r.isActive ? "success" : "destructive"}>
          {r.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      )},
      { header: "", className: "w-44", accessor: actions },
    ];

    if (tab === "microphones") return [
  { header: "Source", accessor: "ipAddress" },
  { header: "Range", accessor: "range" },
  { header: "Sensitivity", accessor: "sensitivity" },
  { header: "Hall", accessor: (r) => hallName(r.hallId) },
  { header: "Row", accessor: "row" },
  { header: "Column", accessor: "column" },
      { header: "Active",      accessor: (r) => (
        <StatusBadge variant={r.isActive ? "success" : "destructive"}>
          {r.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      )},
      { header: "", className: "w-44", accessor: actions },
    ];

    if (tab === "speakers") return [
      { header: "Label",      accessor: "label" },
      { header: "IP Address", accessor: "ipAddress" },
      { header: "Volume",     accessor: (r) => `${r.volume ?? 50}%` },
      { header: "Hall",       accessor: (r) => hallName(r.hallId) },
      { header: "Status",     accessor: (r) => (
        <StatusBadge variant={speakerStatusVariant[r.status] || "default"}>
          {r.status}
        </StatusBadge>
      )},
      { header: "", className: "w-72", accessor: actions },
    ];

    return [];
  }, [tab, halls, rows]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleToggle = async (row) => {
    try {
      await api[tab].setActive(row.id, !row.isActive);
      toast.success("Updated");
      reload();
    } catch (e) { toast.error(e.message || "Update failed"); }
  };

  const handleSpeakerStatus = async (id, status) => {
    try {
      await api.speakers.setStatus(id, status);
      toast.success("Status updated");
      reload();
    } catch (e) { toast.error(e.message || "Update failed"); }
  };

  const onSubmit = async (payload) => {
    try {
      if (editing) {
        await api[tab].update(editing.id, payload);
      } else {
        const defaults = tab === "speakers"
          ? { status: "inactive" }
          : { isActive: true };
        await api[tab].create({ ...defaults, ...payload });
      }
      toast.success("Saved");
      setFormOpen(false);
      reload();
    } catch (e) { toast.error(e.message || "Save failed"); }
  };

  const onDelete = async (row) => {
    try {
      await api[tab].remove(row.id);
      toast.success("Deleted");
      reload();
    } catch (e) { toast.error(e.message || "Delete failed"); }
  };

  const tabLabel = TABS.find((t) => t.key === tab)?.label || "Device";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Hardware">
      <div className="space-y-4 animate-fade-in">

        {/* ── Tab switcher ── */}
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

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-2 justify-end">
          <CsvUploadButton onUpload={(f) => api[tab].uploadCsv(f)} />
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add {tabLabel.slice(0, -1)}
          </Button>
        </div>

        {/* ── Table ── */}
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

      {/* ── Form dialog ── */}
      <ResourceFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        title={editing ? `Edit ${tabLabel.slice(0, -1)}` : `Add ${tabLabel.slice(0, -1)}`}
        fields={fields}
        initialValues={editing || {}}
        onSubmit={onSubmit}
      />

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title={`Delete ${tabLabel.slice(0, -1)}?`}
        description="This action is permanent."
        destructive
        confirmLabel="Delete"
        onConfirm={() => onDelete(confirmDel)}
      />
    </DashboardLayout>
  );
}