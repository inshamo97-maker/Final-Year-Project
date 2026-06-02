import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check,X } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = {
  pending: "warning",
  confirmed: "success",
  dismissed: "secondary"
};
export default function InvigilatorAlertsPage() {
  const role = sessionStorage.getItem("role") || "invigilator";
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role };
  const [rows, setRows] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([api.getAiAlerts(), api.getExamHalls()]);
      setRows(
  r.filter(alert => alert.status === "pending")
);
      setHalls(h);
    } catch (e) { toast.error(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const hallName = (id) => halls.find((h) => String(h.id) === String(id))?.hallNumber || id || "-";

  const updateStatus = async (row, status) => {
  try {
    await api.updateAlertStatus(row.id, status);
    toast.success(`Alert ${status}`);
    reload();
  } catch (e) {
    toast.error(e.message || "Update failed");
  }
};

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="My Alerts">
      <div className="space-y-4 animate-fade-in">
        {loading ? <LoadingSpinner /> : (
          <DataTable
            emptyMessage="No alerts assigned to your halls"
            columns={[
              { header: "Type",    accessor: "violationType" },
              { header: "Hall",    accessor: (r) => hallName(r.hallId) },
              { header: "Student", accessor: "studentId" },
              { header: "When",    accessor: (r) => new Date(r.timestamp).toLocaleString() },
              { header: "Status",  accessor: (r) => <StatusBadge variant={statusVariant[r.status] || "default"}>{r.status}</StatusBadge> },
              { header: "", className: "w-40",
                accessor: (r) => (
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
  <Button
    size="sm"
    variant="outline"
    onClick={() => updateStatus(r, "confirmed")}
  >
    <Check className="h-3.5 w-3.5 mr-1" />
    Confirm
  </Button>

  <Button
    size="sm"
    variant="destructive"
    onClick={() => updateStatus(r, "dismissed")}
  >
    <X className="h-3.5 w-3.5 mr-1" />
    Dismiss
  </Button>
</div>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
