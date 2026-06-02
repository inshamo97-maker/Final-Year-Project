import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Trash2, Check } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = { pending: "warning", reviewed: "success" };

export default function AdminAlerts() {
  const user = getCurrentUser() || { name: "Admin", id: "admin", role: "admin" };
  const [rows, setRows] = useState([]);
  const [invs, setInvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);

  const reload = async () => {
    setLoading(true);
    try {
      const [allAlerts, i] = await Promise.all([api.getAiAlerts(), api.getInvigilators()]);
      // Filter to show only pending alerts (hide reviewed ones)
      setRows(allAlerts); setInvs(i);
    } catch (e) { toast.error(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const invName = (id) => invs.find((x) => x.id === id)?.name || id || "—";


  const onDelete = async (row) => {
    try { await api.deleteAlert(row.id); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(e.message || "Delete failed"); }
  };

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Alerts">
      <div className="space-y-4 animate-fade-in">
        {loading ? <LoadingSpinner /> : (
          <DataTable
            emptyMessage="No alerts"
            columns={[
              { header: "Violation Type", accessor: "violationType" },
              { header: "Sent To",        accessor: (r) => invName(r.sentTo) },
              { header: "When",           accessor: (r) => new Date(r.timestamp).toLocaleString() },
              { header: "Status",         accessor: (r) => <StatusBadge variant={statusVariant[r.status] || "default"}>{r.status}</StatusBadge> },
              { header: "", className: "w-56",
                accessor: (r) => (
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Delete alert?" description="This is permanent."
        destructive confirmLabel="Delete" onConfirm={() => onDelete(confirmDel)}
      />
    </DashboardLayout>
  );
}
