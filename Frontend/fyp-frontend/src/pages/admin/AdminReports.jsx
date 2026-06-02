import { useState, useEffect } from "react";
import { FileText, Download, AlertTriangle, CheckCircle, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

export default function AdminReports() {
  const user = getCurrentUser() || { name: "Prof. Michael Chen", id: "ADM001", role: "admin" };
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hallFilter, setHallFilter] = useState("all");

  useEffect(() => {
    api.getReports()
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load reports:", err);
        toast.error(err?.message || "Failed to load reports");
      });
  }, []);

  const filteredReports = reports.filter((report) => {
  const reportDate = report.date
    ? new Date(report.date)
    : null;

  const matchesHall =
    hallFilter === "all" ||
    report.examHall === hallFilter;

  const matchesStartDate =
    !startDate ||
    reportDate >= new Date(startDate);

  const matchesEndDate =
    !endDate ||
    reportDate <= new Date(endDate);

  return (
    matchesHall &&
    matchesStartDate &&
    matchesEndDate
  );
});
  const totalAlerts = filteredReports.reduce((sum, r) => sum + r.totalAlerts, 0);
  const reviewedAlerts = filteredReports.reduce((sum, r) => sum + r.reviewedAlerts, 0);
  const totalStudents = filteredReports.reduce((sum, r) => sum + r.studentsMonitored, 0);
  const hallOptions = [...new Set(reports.map((report) => report.examHall).filter(Boolean))];

  const handleExport = async (format) => { await api.exportReport(format); toast.success(`Report exported as ${format.toUpperCase()}`); };

  const columns = [
    { header: "Report ID", accessor: "id" },
    { header: "Date", accessor: "date" },
    { header: "Exam Hall", accessor: "examHall" },
    { header: "Exam Name", accessor: "examName" },
    { header: "Alerts", accessor: (row) => (<span className={row.totalAlerts > 10 ? "text-warning font-medium" : ""}>{row.totalAlerts}</span>) },
    { header: "Reviewed", accessor: (row) => (<StatusBadge variant={row.reviewedAlerts === row.totalAlerts ? "success" : "warning"}>{row.reviewedAlerts}/{row.totalAlerts}</StatusBadge>) },
    { header: "Students", accessor: "studentsMonitored" },
    { header: "Duration", accessor: "duration" },
  ];

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="bg-card rounded-lg border border-border p-4 shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div className="space-y-2"><Label className="text-xs text-muted-foreground">Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" /></div>
            <div className="space-y-2"><Label className="text-xs text-muted-foreground">End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" /></div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Exam Hall</Label>
              <Select value={hallFilter} onValueChange={setHallFilter}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Halls</SelectItem>
                  {hallOptions.map((hall) => (
                    <SelectItem key={hall} value={hall}>{hall}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-10" onClick={() => { setStartDate(""); setEndDate(""); setHallFilter("all"); }}>Clear</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Reports" value={filteredReports.length} icon={FileText} variant="primary" />
          <StatCard title="Total Alerts" value={totalAlerts} icon={AlertTriangle} variant="warning" />
          <StatCard title="Reviewed Alerts" value={reviewedAlerts} icon={CheckCircle} variant="accent" />
          <StatCard title="Students Monitored" value={totalStudents} icon={Building2} variant="default" />
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={() => handleExport("txt")} variant="outline" size="sm"><Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export Text</span></Button>
          <Button onClick={() => handleExport("csv")} variant="outline" size="sm"><Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export CSV</span></Button>
        </div>

        <DataTable columns={columns} data={filteredReports} />
      </div>
    </DashboardLayout>
  );
}
