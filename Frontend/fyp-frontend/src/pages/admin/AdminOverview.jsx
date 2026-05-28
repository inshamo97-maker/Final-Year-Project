import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, BookOpen, Building2, Camera, Volume2, Mic, AlertTriangle, Bell } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const violationStatusVariant = { pending: "warning", confirmed: "success", dismissed: "secondary" };
const alertStatusVariant     = { pending: "warning", reviewed: "success" };
const fmt = (ts) => (ts ? new Date(ts).toLocaleString() : "—");

export default function AdminOverview() {
const user = getCurrentUser() || {};
const [stats, setStats] = useState({
  totalInvigilators: 0,
  totalExams: 0,
  totalExamHalls: 0,
  totalCameras: 0,
  totalSpeakers: 0,
  totalMicrophones: 0,
});
  const [violations, setViolations] = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, v, a] = await Promise.all([
          api.getAdminDashboardStats(),
          api.getViolations(),
          api.getAiAlerts(),
        ]);
        setStats(s || {
  totalInvigilators: 0,
  totalExams: 0,
  totalExamHalls: 0,
  totalCameras: 0,
  totalSpeakers: 0,
  totalMicrophones: 0,
});
        setViolations(v.slice(0, 5));
        setAlerts(a.slice(0, 5));
      } catch (e) {
        toast.error(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (<DashboardLayout  userRole={user?.role || "admin"}
  userName={user?.name || "Admin"}
  userId={user?.id || "admin"}
  pageTitle="Overview">
    
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6 animate-fade-in">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Invigilators" value={stats.totalInvigilators} icon={Users}      variant="primary" />
            <StatCard title="Exams"        value={stats.totalExams}        icon={BookOpen}   variant="accent" />
            <StatCard title="Exam Halls"   value={stats.totalExamHalls}    icon={Building2}  variant="default" />
            <StatCard title="Cameras"      value={stats.totalCameras}      icon={Camera}     variant="default" />
            <StatCard title="Speakers"     value={stats.totalSpeakers}     icon={Volume2}    variant="default" />
            <StatCard title="Microphones"  value={stats.totalMicrophones}  icon={Mic}        variant="default" />
          </div>

          {/* ── Recent violations + alerts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold">Recent Violations</h2>
              </div>
              <DataTable
                emptyMessage="No violations yet"
                columns={[
                  { header: "Type",   accessor: "type" },
                  { header: "When",   accessor: (r) => fmt(r.timestamp) },
                  { header: "Status", accessor: (r) => (
                    <StatusBadge variant={violationStatusVariant[r.status] || "default"}>
                      {r.status}
                    </StatusBadge>
                  )},
                ]}
                data={violations}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Recent Alerts</h2>
              </div>
              <DataTable
                emptyMessage="No alerts yet"
                columns={[
                  { header: "Type",   accessor: "violationType" },
                  { header: "When",   accessor: (r) => fmt(r.timestamp) },
                  { header: "Status", accessor: (r) => (
                    <StatusBadge variant={alertStatusVariant[r.status] || "default"}>
                      {r.status}
                    </StatusBadge>
                  )},
                ]}
                data={alerts}
              />
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
