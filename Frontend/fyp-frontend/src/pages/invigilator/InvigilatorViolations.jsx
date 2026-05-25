import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = { pending: "warning", confirmed: "success", dismissed: "secondary" };
const severityVariant = { low: "secondary", medium: "warning", high: "destructive" };

export default function InvigilatorViolations() {
  const role = sessionStorage.getItem("role") || "invigilator";
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role, hallIds: [] };
  const [rows, setRows] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, h] = await Promise.all([api.getViolations(), api.getExamHalls()]);
        setRows(r);
        setHalls(h);
      } catch (e) { toast.error(e.message || "Failed to load"); }
      finally { setLoading(false); }
    })();
  }, []);

  const hallName = (id) => halls.find((h) => h.id === id)?.hallNumber || id || "—";

  const setStatus = async (id, status) => {
    try {
      await api.updateViolationStatus(id, status);
      toast.success(`Marked ${status}`);
      const [r] = await Promise.all([api.getViolations()]);
      setRows(r);
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Violations in My Halls">
      <div className="space-y-4 animate-fade-in">
        {loading ? <LoadingSpinner /> : (
          <DataTable
            emptyMessage="No violations in your halls"
            columns={[
              { header: "Type",       accessor: "type" },
              { header: "Confidence", accessor: (r) => `${Math.round((r.confidence || 0) * 100)}%` },
              { header: "Hall",       accessor: (r) => hallName(r.hallId) },
              { header: "When",       accessor: (r) => new Date(r.timestamp).toLocaleString() },
              { header: "Severity",   accessor: (r) => r.severity ? <StatusBadge variant={severityVariant[r.severity] || "default"}>{r.severity}</StatusBadge> : "—" },
              { header: "Status",     accessor: (r) => <StatusBadge variant={statusVariant[r.status] || "default"}>{r.status}</StatusBadge> },
              {
                header: "",
                className: "w-48",
                accessor: (r) => (
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={r.status === "confirmed"}
                      onClick={() => setStatus(r.id, "confirmed")}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={r.status === "dismissed"}
                      onClick={() => setStatus(r.id, "dismissed")}
                    >
                      Dismiss
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
