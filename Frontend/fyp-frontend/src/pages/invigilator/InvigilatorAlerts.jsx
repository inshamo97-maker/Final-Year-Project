import { useState, useEffect } from "react";
import { AlertTriangle, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

const alertTypeColors = { "Whisper": "warning", "Head Turn": "default", "Gesture": "warning" };
const statusColors = { "Pending": "warning", "Reviewed": "success", "Ignored": "secondary" };

export default function InvigilatorAlerts() {
  const user = getCurrentUser() || { name: "Dr. Sarah Johnson", id: "INV001", role: "invigilator" };
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { api.getAlerts().then(setAlerts); }, []);

  const handleStatusChange = async (alertId, newStatus) => {
    await api.updateAlertStatus(alertId, newStatus);
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, status: newStatus } : alert));
    setSelectedAlert(null);
  };

  const columns = [
    { header: "Alert ID", accessor: "id" },
    { header: "Student ID", accessor: "studentId" },
    { header: "Alert Type", accessor: (row) => (<StatusBadge variant={alertTypeColors[row.alertType]}>{row.alertType}</StatusBadge>) },
    { header: "Time", accessor: "time" },
    { header: "Exam Hall", accessor: "examHall" },
    { header: "Status", accessor: (row) => (<StatusBadge variant={statusColors[row.status]}>{row.status}</StatusBadge>) },
  ];

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Alerts">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border shadow-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{alerts.filter(a => a.status === "Pending").length}</p></div></div></div>
          <div className="bg-card rounded-lg p-4 border border-border shadow-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Reviewed</p><p className="text-2xl font-bold">{alerts.filter(a => a.status === "Reviewed").length}</p></div></div></div>
          <div className="bg-card rounded-lg p-4 border border-border shadow-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><XCircle className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm text-muted-foreground">Ignored</p><p className="text-2xl font-bold">{alerts.filter(a => a.status === "Ignored").length}</p></div></div></div>
        </div>

        <DataTable columns={columns} data={alerts} onRowClick={(row) => setSelectedAlert(row)} />

        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Alert Details</DialogTitle></DialogHeader>
            {selectedAlert && (
              <div className="space-y-5">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border"><div className="text-center text-muted-foreground"><User className="h-12 w-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Alert snapshot / video</p></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Alert ID</p><p className="font-medium">{selectedAlert.id}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Student</p><p className="font-medium">{selectedAlert.studentName}</p><p className="text-sm text-muted-foreground">{selectedAlert.studentId}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Alert Type</p><StatusBadge variant={alertTypeColors[selectedAlert.alertType]}>{selectedAlert.alertType}</StatusBadge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p><StatusBadge variant={statusColors[selectedAlert.status]}>{selectedAlert.status}</StatusBadge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Time</p><p className="font-medium">{selectedAlert.time}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p><p className="font-medium">{selectedAlert.examHall}</p></div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border"><p className="text-sm text-muted-foreground">AI detected suspicious activity: <strong>{selectedAlert.alertType.toLowerCase()}</strong> behavior observed from student {selectedAlert.studentName} at {selectedAlert.time}. Please review the footage and take appropriate action.</p></div>
                {selectedAlert.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={() => handleStatusChange(selectedAlert.id, "Reviewed")}><CheckCircle className="h-4 w-4 mr-2" />Mark as Reviewed</Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleStatusChange(selectedAlert.id, "Ignored")}><XCircle className="h-4 w-4 mr-2" />Ignore</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
