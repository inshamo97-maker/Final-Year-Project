import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = { pending: "warning", reviewed: "success" };

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
      setRows(r);
      setHalls(h);
    } catch (e) { toast.error(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const hallName = (id) => halls.find((h) => String(h.id) === String(id))?.hallNumber || id || "-";

  const markReviewed = async (row) => {
    try { await api.updateAlertStatus(row.id, "reviewed"); toast.success("Marked reviewed"); reload(); }
    catch (e) { toast.error(e.message || "Update failed"); }
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
                    <Button size="sm" variant="outline" disabled={r.status === "reviewed"} onClick={() => markReviewed(r)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> {r.status === "reviewed" ? "Reviewed" : "Mark reviewed"}
                    </Button>
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
