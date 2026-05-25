import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = { pending: "warning", confirmed: "success", dismissed: "secondary" };
const severityVariant = { low: "secondary", medium: "warning", high: "destructive" };

export default function AdminViolations() {
  const user = getCurrentUser() || { name: "Admin", id: "admin", role: "admin" };
  const [rows, setRows] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([api.getViolations(), api.getExamHalls()]);
      setRows(r); setHalls(h);
    } catch (e) { toast.error(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const hallName = (id) => halls.find((h) => h.id === id)?.hallNumber || "—";

  const setStatus = async (id, status) => {
    try { await api.updateViolationStatus(id, status); toast.success("Status updated"); reload(); }
    catch (e) { toast.error(e.message || "Update failed"); }
  };
  const onDelete = async (row) => {
    try { await api.deleteViolation(row.id); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(e.message || "Delete failed"); }
  };

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Violations">
      <div className="space-y-4 animate-fade-in">
        {loading ? <LoadingSpinner /> : (
          <DataTable
            emptyMessage="No violations recorded"
            onRowClick={(r) => setDetail(r)}
            columns={[
              { header: "Type",       accessor: "type" },
              { header: "When",       accessor: (r) => new Date(r.timestamp).toLocaleString() },
              { header: "Confidence", accessor: (r) => `${Math.round((r.confidence || 0) * 100)}%` },
              { header: "Hall",       accessor: (r) => hallName(r.hallId) },
              { header: "Student",    accessor: "studentId" },
              { header: "Severity",   accessor: (r) => r.severity ? <StatusBadge variant={severityVariant[r.severity] || "default"}>{r.severity}</StatusBadge> : "—" },
              { header: "Status",     accessor: (r) => <StatusBadge variant={statusVariant[r.status] || "default"}>{r.status}</StatusBadge> },
              { header: "", className: "w-64",
                accessor: (r) => (
                  <div className="flex gap-2 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Violation Details</DialogTitle></DialogHeader>
          {detail && (
            <dl className="grid grid-cols-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Type</dt><dd className="col-span-2">{detail.type}</dd>
              <dt className="text-muted-foreground">When</dt><dd className="col-span-2">{new Date(detail.timestamp).toLocaleString()}</dd>
              <dt className="text-muted-foreground">Confidence</dt><dd className="col-span-2">{Math.round((detail.confidence || 0) * 100)}%</dd>
              <dt className="text-muted-foreground">Hall</dt><dd className="col-span-2">{hallName(detail.hallId)}</dd>
              <dt className="text-muted-foreground">Student</dt><dd className="col-span-2">{detail.studentId}</dd>
              <dt className="text-muted-foreground">Severity</dt><dd className="col-span-2">{detail.severity ?? "—"}</dd>
              <dt className="text-muted-foreground">Status</dt><dd className="col-span-2">{detail.status}</dd>
              <dt className="text-muted-foreground">Camera</dt><dd className="col-span-2">{detail.cameraId}</dd>
              <dt className="text-muted-foreground">Microphone</dt><dd className="col-span-2">{detail.micId}</dd>
              <dt className="text-muted-foreground">Evidence</dt><dd className="col-span-2 break-all">{detail.evidencePath}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Delete violation?" description="This is permanent."
        destructive confirmLabel="Delete" onConfirm={() => onDelete(confirmDel)}
      />
    </DashboardLayout>
  );
}
