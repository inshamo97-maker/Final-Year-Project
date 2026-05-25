import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, AlertTriangle, BarChart3 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

const activityColors = {
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser() || { name: "Prof. Michael Chen", id: "ADM001", role: "admin" };

  const [stats, setStats] = useState({ totalExamHalls: 0, totalStudents: 0, totalAlertsLogged: 0, examsThisWeek: 0 });
  const [activity, setActivity] = useState([]);
  const [overview, setOverview] = useState({ uptime: "0%", activeCameras: 0, pendingIssues: 0, avgResponseTime: "0s" });

  useEffect(() => {
    api.getAdminDashboardStats().then(setStats);
    api.getRecentActivity().then(setActivity);
    api.getSystemOverview().then(setOverview);
  }, []);

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Exam Halls" value={stats.totalExamHalls} icon={Building2} variant="primary" onClick={() => navigate("/admin/exam-halls")} />
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} variant="default" onClick={() => navigate("/admin/seating")} />
          <StatCard title="Total Alerts Logged" value={stats.totalAlertsLogged} icon={AlertTriangle} variant="warning" onClick={() => navigate("/admin/reports")} />
          <StatCard title="Exams This Week" value={stats.examsThisWeek} icon={BarChart3} variant="accent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => navigate("/admin/seating")} className="w-full p-4 rounded-lg bg-primary/5 border border-primary/20 text-left hover:bg-primary/10 transition-colors group">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">Manage Seating Plans</p>
                <p className="text-sm text-muted-foreground">Update student seat assignments</p>
              </button>
              <button onClick={() => navigate("/admin/exam-halls")} className="w-full p-4 rounded-lg bg-accent/5 border border-accent/20 text-left hover:bg-accent/10 transition-colors group">
                <p className="font-medium text-foreground group-hover:text-accent transition-colors">Configure Exam Halls</p>
                <p className="text-sm text-muted-foreground">Add, edit, or remove halls</p>
              </button>
              <button onClick={() => navigate("/admin/reports")} className="w-full p-4 rounded-lg bg-muted border border-border text-left hover:bg-secondary transition-colors">
                <p className="font-medium text-foreground">Generate Reports</p>
                <p className="text-sm text-muted-foreground">Export exam monitoring data</p>
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className={`w-2 h-2 rounded-full ${activityColors[item.type].replace('bg-', 'bg-').replace('/10', '')}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{overview.uptime}</p>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{overview.activeCameras}</p>
              <p className="text-sm text-muted-foreground">Active Cameras</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{overview.pendingIssues}</p>
              <p className="text-sm text-muted-foreground">Pending Issues</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{overview.avgResponseTime}</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
