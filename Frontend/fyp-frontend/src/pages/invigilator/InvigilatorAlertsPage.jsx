import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Check, X, AlertTriangle, Users, ClipboardCheck, TrendingUp } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const statusVariant = {
  pending: "warning",
  confirmed: "success",
  dismissed: "secondary"
};

function StatPill({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function ExamReportCard({ exam, alerts, students, halls, active = false }) {
  const hallName = halls.find(h => String(h.id) === String(exam.hallId))?.hallNumber || exam.hallId || "—";
  const examAlerts = alerts.filter(a => String(a.examId) === String(exam.id));
  const totalAlerts = examAlerts.length;
  const reviewed = examAlerts.filter(a => a.status === "confirmed" || a.status === "dismissed").length;
  const pending = examAlerts.filter(a => a.status === "pending").length;
  const examStudents = students.filter(s => String(s.hallId) === String(exam.hallId));
  const total = new Set(examAlerts.map(a => a.studentId).filter(Boolean)).size || 1;

  const uniqueCheaters = new Set(
    examAlerts
      .filter(a => a.violationType === "head_movement" || a.violationType === "cheating")
      .map(a => a.studentId)
      .filter(Boolean)
  ).size;

  const totalCheatingAlerts = examAlerts.filter(
    a => a.violationType === "head_movement" || a.violationType === "cheating"
  ).length;

  const pctUnique = ((uniqueCheaters / total) * 100).toFixed(1);
  const pctTotal  = ((totalCheatingAlerts / total) * 100).toFixed(1);
console.log("exam:", exam.name);
console.log("total unique students:", total);
console.log("cheating alerts:", totalCheatingAlerts);
console.log("unique cheaters:", uniqueCheaters);
console.log("all studentIds in alerts:", examAlerts.map(a => ({ id: a.studentId, type: a.violationType })));
  return (
    <div className={`rounded-lg border p-4 sm:p-5 space-y-4 ${
      active
        ? "border-primary/50 bg-primary/5 shadow-md"
        : "border-border bg-card"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {active && (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                LIVE
              </span>
            )}
            <h3 className="text-sm font-semibold text-foreground">
              {exam.name} — {exam.subject}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hallName} &nbsp;·&nbsp; {exam.date} &nbsp;·&nbsp; {exam.startTime} – {exam.endTime}
          </p>
        </div>
        <StatusBadge variant={
          exam.status === "running" ? "success" :
          exam.status === "completed" ? "secondary" : "warning"
        }>
          {exam.status}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 border-t border-border/50">
        <StatPill
          label="Total Alerts"
          value={totalAlerts}
          sub={`${pending} pending`}
        />
        <StatPill
          label="Reviewed"
          value={reviewed}
          sub={totalAlerts > 0 ? `${((reviewed / totalAlerts) * 100).toFixed(0)}% done` : "—"}
        />
        <StatPill
          label="Cheating % (unique)"
          value={`${pctUnique}%`}
          sub={`${uniqueCheaters} of ${total} students`}
        />
        <StatPill
          label="Cheating % (by alerts)"
          value={`${pctTotal}%`}
          sub={`${totalCheatingAlerts} alerts / ${total} students`}
        />
      </div>
    </div>
  );
}

export default function InvigilatorAlertsPage() {
  const role = sessionStorage.getItem("role") || "invigilator";
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role };

  const [rows, setRows]       = useState([]);
  const [halls, setHalls]     = useState([]);
  const [exams, setExams]     = useState([]);
  const [alerts, setAlerts]   = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [a, h, e, s] = await Promise.all([
        api.getAiAlerts(),
        api.getExamHalls(),
        api.getExams(),
        api.getStudentList(),
      ]);

      const allAlerts   = a || [];
      const allHalls    = h || [];
      const allExams    = e || [];
      const allStudents = s || [];

      setAlerts(allAlerts);
      setHalls(allHalls);
      setStudents(allStudents);

      // sort: running first, then by date desc
      const sorted = [...allExams].sort((a, b) => {
        if (a.status === "running" && b.status !== "running") return -1;
        if (b.status === "running" && a.status !== "running") return 1;
        return new Date(b.date) - new Date(a.date);
      });
      setExams(sorted);

      setRows(allAlerts.filter(alert => alert.status === "pending"));
    } catch (e) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const hallName = (id) =>
    halls.find(h => String(h.id) === String(id))?.hallNumber || id || "—";

  const updateStatus = async (row, status) => {
    try {
      await api.updateAlertStatus(row.id, status);
      toast.success(`Alert ${status}`);
      reload();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  const activeExams = exams.filter(e => e.status === "running");
  const pastExams   = exams.filter(e => e.status !== "running");

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Alerts & Reports">
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-8 animate-fade-in">

          {/* ── Active exams ── */}
          {activeExams.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
                Running Now
              </h2>
              <div className="space-y-3">
                {activeExams.map(exam => (
                  <ExamReportCard
                    key={exam.id}
                    exam={exam}
                    alerts={alerts}
                    students={students}
                    halls={halls}
                    active
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Past exams ── */}
          {pastExams.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Past Exams
              </h2>
              <div className="space-y-3">
                {pastExams.map(exam => (
                  <ExamReportCard
                    key={exam.id}
                    exam={exam}
                    alerts={alerts}
                    students={students}
                    halls={halls}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Pending alerts table ── */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Pending Alerts
            </h2>
            <DataTable
              emptyMessage="No pending alerts"
              columns={[
                { header: "Type",    accessor: "violationType" },
                { header: "Hall",    accessor: (r) => hallName(r.hallId) },
                { header: "Student", accessor: "studentId" },
                { header: "When",    accessor: (r) => new Date(r.timestamp).toLocaleString() },
                { header: "Status",  accessor: (r) =>
                  <StatusBadge variant={statusVariant[r.status] || "default"}>
                    {r.status}
                  </StatusBadge>
                },
                { header: "", className: "w-40",
                  accessor: (r) => (
                    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r, "confirmed")}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(r, "dismissed")}>
                          <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                        </Button>
                      </div>
                    </div>
                  ),
                },
              ]}
              data={rows}
            />
          </section>

        </div>
      )}
    </DashboardLayout>
  );
}