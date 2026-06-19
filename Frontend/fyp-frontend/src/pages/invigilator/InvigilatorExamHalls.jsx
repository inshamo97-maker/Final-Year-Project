import { useState, useEffect } from "react";
import {
  Building2, Users, Camera, AlertTriangle, Monitor,
  User, Clock, MapPin, CheckCircle, XCircle
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

import { toast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

const seatColors = {
  occupied: "bg-success/60 border-success",
  empty: "bg-muted border-border",
  flagged: "bg-destructive/60 border-destructive animate-pulse-soft",
};

export default function InvigilatorExamHalls() {
  const user =
    getCurrentUser() || {
      name: "Dr. Sarah Johnson",
      id: "INV001",
      role: "invigilator",
    };

  const [examHalls, setExamHalls] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState(null);

  const [seating, setSeating] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
const [activeExamId, setActiveExamId] = useState(null);
  // ✅ 1. Load halls
  useEffect(() => {
  api.getInvigilatorHallDetails().then((halls) => {
    setExamHalls(halls);
    if (halls.length > 0) setSelectedHallId(halls[0].id);
  });

  // fetch running exam
  api.getExams().then((exams) => {
    const running = exams.find((e) => e.status === "running");
    setActiveExamId(running?.id ?? null);
  }).catch(() => {});
}, []);

  const selectedHall =
    examHalls.find((h) => h.id === selectedHallId) || null;

  // ✅ 2. Load seating separately (IMPORTANT FIX)
 useEffect(() => {
  if (!selectedHallId) return;

  api.getSeatAllocationsByExam(selectedHallId, activeExamId)
    .then(setSeating)
    .catch(() => {
      toast({ title: "Error", description: "Failed to load seating", variant: "destructive" });
    });
}, [selectedHallId, activeExamId]);

  const handleSeatClick = (seat, seatLabel) => {
    if (seat.status === "empty") {
      toast({
        title: "Empty Seat",
        description: `Seat ${seatLabel} - No student assigned`,
      });
    } else if (seat.status === "flagged" && seat.alert && seat.student) {
      setSelectedAlert({
        alert: seat.alert,
        student: seat.student,
        seatLabel,
      });
    } else if (seat.status === "occupied" && seat.student) {
      setSelectedStudent(seat.student);
    }
  };

  const alertTypeColors = {
    Whisper: "warning",
    "Head Turn": "default",
    Gesture: "warning",
  };

  const statusColors = {
    Pending: "warning",
    Reviewed: "success",
    Ignored: "secondary",
  };

  // ✅ safety guard
  if (!selectedHall) return null;

  return (
    <DashboardLayout
      userRole={user.role}
      userName={user.name}
      userId={user.id}
      pageTitle="Exam Hall Details"
    >
      <div className="space-y-4 sm:space-y-6 animate-fade-in">

        {/* Hall selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium text-foreground">
            Select Exam Hall:
          </label>

          <Select value={selectedHallId} onValueChange={setSelectedHallId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {examHalls.map((hall) => (
                <SelectItem key={hall.id} value={hall.id}>
                  {hall.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Hall Name"
            value={selectedHall.name.split(" - ")[0]}
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Total Students"
            value={`${selectedHall.totalStudents} / ${selectedHall.capacity}`}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Active Cameras"
            value={selectedHall.activeCameras}
            icon={Camera}
            variant="accent"
          />
          <StatCard
            title="Current Alerts"
            value={selectedHall.currentAlerts}
            icon={AlertTriangle}
            variant={
              selectedHall.currentAlerts > 0 ? "destructive" : "default"
            }
          />
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Seating */}
          <div className="lg:col-span-2 bg-card rounded-lg border p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Seating Layout</h3>

            <div className="flex flex-col gap-2 items-center overflow-x-auto">
              {seating.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2">
                  <span className="w-6 text-xs flex items-center justify-center">
                    {String.fromCharCode(65 + rowIndex)}
                  </span>

                  {row.map((seat, seatIndex) => {
                    const seatLabel =
                      `${String.fromCharCode(65 + rowIndex)}${seatIndex + 1}`;

                    return (
                      <div
                        key={seatIndex}
                        className={`w-8 h-8 rounded border-2 cursor-pointer transition-all ${seatColors[seat.status]}`}
                        title={`Seat ${seatLabel}`}
                        onClick={() => handleSeatClick(seat, seatLabel)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Cameras */}
          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Camera List</h3>

            <div className="space-y-3">
              {selectedHall.cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      camera.status === "active"
                        ? "bg-success/10"
                        : "bg-muted"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{camera.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {camera.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Detail Dialog */}
<Dialog
  open={!!selectedStudent}
  onOpenChange={() => setSelectedStudent(null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Student Details</DialogTitle>
    </DialogHeader>

    {selectedStudent && (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{selectedStudent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>Roll No: {selectedStudent.rollNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{selectedStudent.department}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-success">Seated Correctly</span>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

{/* Alert Detail Dialog */}
<Dialog
  open={!!selectedAlert}
  onOpenChange={() => setSelectedAlert(null)}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Alert Details — Seat {selectedAlert?.seatLabel}</DialogTitle>
    </DialogHeader>

    {selectedAlert && (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{selectedAlert.student.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>Roll No: {selectedAlert.student.rollNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-destructive font-medium">
            {selectedAlert.alert.alertType}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {selectedAlert.alert.time
              ? new Date(selectedAlert.alert.time).toLocaleTimeString()
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <StatusBadge status={selectedAlert.alert.status} />
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      </div>
    </DashboardLayout>
  );
}