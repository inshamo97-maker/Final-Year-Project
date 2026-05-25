import { useState, useEffect } from "react";
import { Building2, Users, Camera, AlertTriangle, Monitor, User, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

const seatColors = {
  occupied: "bg-success/60 border-success",
  empty: "bg-muted border-border",
  flagged: "bg-destructive/60 border-destructive animate-pulse-soft",
};

export default function InvigilatorExamHalls() {
  const user = getCurrentUser() || { name: "Dr. Sarah Johnson", id: "INV001", role: "invigilator" };
  const [examHalls, setExamHalls] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState("1");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    api.getInvigilatorHallDetails().then((halls) => { setExamHalls(halls); if (halls.length > 0) setSelectedHallId(halls[0].id); });
  }, []);

  const selectedHall = examHalls.find(h => h.id === selectedHallId) || examHalls[0];

  const handleSeatClick = (seat, seatLabel) => {
    if (seat.status === "empty") { toast({ title: "Empty Seat", description: `Seat ${seatLabel} - No student assigned` }); }
    else if (seat.status === "flagged" && seat.alert && seat.student) { setSelectedAlert({ alert: seat.alert, student: seat.student, seatLabel }); }
    else if (seat.status === "occupied" && seat.student) { setSelectedStudent(seat.student); }
  };

  const alertTypeColors = { "Whisper": "warning", "Head Turn": "default", "Gesture": "warning" };
  const statusColors = { "Pending": "warning", "Reviewed": "success", "Ignored": "secondary" };

  if (!selectedHall) return null;

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Exam Hall Details">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium text-foreground">Select Exam Hall:</label>
          <Select value={selectedHallId} onValueChange={setSelectedHallId}><SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent>{examHalls.map((hall) => (<SelectItem key={hall.id} value={hall.id}>{hall.name}</SelectItem>))}</SelectContent></Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Hall Name" value={selectedHall.name.split(" - ")[0]} icon={Building2} variant="primary" />
          <StatCard title="Total Students" value={`${selectedHall.totalStudents} / ${selectedHall.capacity}`} icon={Users} variant="default" />
          <StatCard title="Active Cameras" value={selectedHall.activeCameras} icon={Camera} variant="accent" />
          <StatCard title="Current Alerts" value={selectedHall.currentAlerts} icon={AlertTriangle} variant={selectedHall.currentAlerts > 0 ? "destructive" : "default"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4 sm:p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Seating Layout</h3>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success/60 border border-success" /><span className="text-muted-foreground">Occupied</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted border border-border" /><span className="text-muted-foreground">Empty</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive/60 border border-destructive" /><span className="text-muted-foreground">Flagged</span></div>
              </div>
            </div>
            <div className="mb-4 text-center"><div className="inline-block px-4 sm:px-6 py-1 bg-muted rounded text-xs font-medium text-muted-foreground uppercase tracking-wider">Front / Stage</div></div>
            <div className="flex flex-col gap-1 sm:gap-2 items-center overflow-x-auto pb-2">
              {selectedHall.seating.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 sm:gap-2">
                  <span className="w-5 sm:w-6 text-xs text-muted-foreground flex items-center justify-center">{String.fromCharCode(65 + rowIndex)}</span>
                  {row.map((seat, seatIndex) => {
                    const seatLabel = `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;
                    return (<div key={seatIndex} className={`w-6 h-6 sm:w-8 sm:h-8 rounded border-2 transition-all duration-200 hover:scale-110 cursor-pointer ${seatColors[seat.status]}`} title={`Seat ${seatLabel} - ${seat.status}${seat.student ? ` (${seat.student.name})` : ''}`} onClick={() => handleSeatClick(seat, seatLabel)} />);
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-card">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Camera List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {selectedHall.cameras.map((camera) => (
                <div key={camera.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <div className={`p-2 rounded-lg ${camera.status === "active" ? "bg-success/10" : "bg-muted"}`}><Monitor className={`h-4 w-4 ${camera.status === "active" ? "text-success" : "text-muted-foreground"}`} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{camera.name}</p><p className={`text-xs ${camera.status === "active" ? "text-success" : "text-muted-foreground"}`}>{camera.status === "active" ? "● Active" : "○ Inactive"}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Student Details</DialogTitle></DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><User className="h-8 w-8 text-muted-foreground" /></div><div><h3 className="font-semibold text-lg">{selectedStudent.name}</h3><p className="text-sm text-muted-foreground">{selectedStudent.id}</p></div></div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Roll Number</p><p className="font-medium">{selectedStudent.rollNumber}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p><p className="font-medium">{selectedStudent.department}</p></div>
                  <div className="col-span-2 space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p><p className="font-medium text-sm">{selectedStudent.email}</p></div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Alert Details</DialogTitle></DialogHeader>
            {selectedAlert && (
              <div className="space-y-5">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border"><div className="text-center text-muted-foreground"><User className="h-12 w-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Alert snapshot / video</p></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Alert ID</p><p className="font-medium">{selectedAlert.alert.id}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Seat</p><p className="font-medium">{selectedAlert.seatLabel}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Student</p><p className="font-medium">{selectedAlert.student.name}</p><p className="text-sm text-muted-foreground">{selectedAlert.student.id}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Alert Type</p><StatusBadge variant={alertTypeColors[selectedAlert.alert.alertType]}>{selectedAlert.alert.alertType}</StatusBadge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" /> Time</p><p className="font-medium">{selectedAlert.alert.time}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p><p className="font-medium">{selectedHall.name}</p></div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border border-border"><p className="text-sm text-muted-foreground">AI detected suspicious activity: <strong>{selectedAlert.alert.alertType.toLowerCase()}</strong> behavior observed from student {selectedAlert.student.name} at seat {selectedAlert.seatLabel} at {selectedAlert.alert.time}. Please review the footage and take appropriate action.</p></div>
                {selectedAlert.alert.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button className="flex-1" onClick={() => setSelectedAlert(null)}><CheckCircle className="h-4 w-4 mr-2" />Mark as Reviewed</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedAlert(null)}><XCircle className="h-4 w-4 mr-2" />Ignore</Button>
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
