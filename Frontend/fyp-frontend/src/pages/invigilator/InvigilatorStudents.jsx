import { useState, useEffect, useMemo } from "react";
import { Search, X, User, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";
import { toast } from "sonner";

function normaliseStudent(s, violations = [], halls = [], activeExamId = null) {
  const hallId   = s.hallId ?? s.hall_id ?? null;
  const hallObj  = halls.find((h) => String(h.id) === String(hallId));
  const hallName = hallObj?.hallNumber ?? s.examHall ?? "—";
  const sid        = String(s.id ?? "");
  const rollNumber = s.rollNumber ?? s.studentId ?? s.registrationNumber ?? sid;

  const alertCount = violations.filter((v) => {
    const matchStudent =
      String(v.studentId ?? v.student_id) === sid ||
      String(v.studentId ?? v.student_id) === rollNumber;
    const matchExam = activeExamId
      ? String(v.examId ?? v.exam_id) === String(activeExamId)
      : true;
    return matchStudent && matchExam;
  }).length;

  return {
    id:                 sid,
    studentId:          rollNumber,
    name:               s.name ?? "Unknown",
    seatNumber:         s.seatNumber ?? s.seat_number ?? "—",
    examHall:           hallName,
    hallId,
    status:             alertCount > 0 ? "Flagged" : "Normal",
    alertCount,
    email:              s.email ?? "—",
    department:         s.programName ?? s.department ?? "—",
    registrationNumber: s.registrationNumber ?? rollNumber,
  };
}

export default function InvigilatorStudents() {
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role: "invigilator" };

const [rawStudents, setRawStudents]         = useState([]);
const [violations, setViolations]           = useState([]);
const [halls, setHalls]                     = useState([]);
const [exams, setExams]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [searchQuery, setSearchQuery]         = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [selectedExam, setSelectedExam]       = useState("all");
  const [attendanceMap, setAttendanceMap]     = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
const activeExamFilter = selectedExam !== "all" ? selectedExam : null;

const students = useMemo(
  () => rawStudents.map((s) => normaliseStudent(s, violations, halls, activeExamFilter)),
  [rawStudents, violations, halls, activeExamFilter]
);
  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [rawRes, violsRes, hallsRes, examsRes] = await Promise.allSettled([
          api.getStudentList(),
          api.getViolations(),
          api.getExamHalls(),
          api.getExams(),
        ]);

        console.log("students:", rawRes.status, rawRes.value || rawRes.reason);
        console.log("viols:",    violsRes.status, violsRes.reason || "ok");
        console.log("halls:",    hallsRes.status, hallsRes.reason || "ok");
        console.log("exams:",    examsRes.status, examsRes.reason || "ok");

        const raw      = rawRes.status    === "fulfilled" ? rawRes.value   || [] : [];
        const viols    = violsRes.status  === "fulfilled" ? violsRes.value || [] : [];
        const hallList = hallsRes.status  === "fulfilled" ? hallsRes.value || [] : [];
        const examList = examsRes.status  === "fulfilled" ? examsRes.value || [] : [];

       setHalls(hallList);
setExams(examList);
setViolations(viols);
setRawStudents(raw);
      } catch (e) {
        toast.error(e?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Fetch attendance when exam selected ──────────────────────────────────
  useEffect(() => {
    if (!selectedExam || selectedExam === "all") {
      setAttendanceMap({});
      return;
    }
    (async () => {
      setAttendanceLoading(true);
      try {
        const rows = await api.getAttendanceByExam(selectedExam);
        const list = Array.isArray(rows) ? rows : [];
        const presentIds = new Set(list.map((r) => String(r.student_id)));
        const map = {};
        students.forEach((s) => {
          map[s.id] = presentIds.has(s.id) ? "Present" : "Absent";
        });
        setAttendanceMap(map);
      } catch (e) {
        toast.error("Failed to load attendance");
      } finally {
        setAttendanceLoading(false);
      }
    })();
  }, [selectedExam, students]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.registrationNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedExam("all");
  };

  const hasFilters = statusFilter !== "all" || searchQuery || selectedExam !== "all";

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { header: "Roll No",    accessor: "studentId" },
    { header: "Name",       accessor: "name"       },
    { header: "Seat",       accessor: "seatNumber" },
    { header: "Hall",       accessor: "examHall"   },
    { header: "Status",     accessor: (r) => (
      <StatusBadge variant={r.status === "Flagged" ? "destructive" : "success"}>
        {r.status}
      </StatusBadge>
    )},
    { header: "Alerts",     accessor: (r) => r.alertCount > 0
      ? <span className="text-destructive font-medium">{r.alertCount}</span>
      : <span className="text-muted-foreground">0</span>
    },
    { header: "Attendance", accessor: (r) => {
      if (selectedExam === "all")  return <span className="text-muted-foreground text-xs">Select exam</span>;
      if (attendanceLoading)       return <span className="text-muted-foreground text-xs">...</span>;
      const att = attendanceMap[r.id];
      return (
        <StatusBadge variant={att === "Present" ? "success" : "destructive"}>
          {att ?? "—"}
        </StatusBadge>
      );
    }},
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Student List">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">

        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name} — {e.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {students.length} students
              {students.filter((s) => s.status === "Flagged").length > 0 && (
                <span className="ml-2 text-destructive font-medium">
                  · {students.filter((s) => s.status === "Flagged").length} flagged
                </span>
              )}
              {selectedExam !== "all" && !attendanceLoading && (
                <span className="ml-2 text-muted-foreground">
                  · {Object.values(attendanceMap).filter((v) => v === "Present").length} present
                  · {Object.values(attendanceMap).filter((v) => v === "Absent").length} absent
                </span>
              )}
            </p>

            <DataTable
              columns={columns}
              data={filtered}
              emptyMessage="No students found"
              onRowClick={(row) => setSelectedStudent(row)}
            />
          </>
        )}
      </div>

      <Sheet open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader><SheetTitle>Student Details</SheetTitle></SheetHeader>
          {selectedStudent && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.studentId}</p>
                  <StatusBadge
                    variant={selectedStudent.status === "Flagged" ? "destructive" : "success"}
                    className="mt-1"
                  >
                    {selectedStudent.status}
                  </StatusBadge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Seat</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />{selectedStudent.seatNumber}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hall</p>
                    <p className="font-medium">{selectedStudent.examHall}</p>
                  </div>
                </div>

                {selectedExam !== "all" && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Attendance</p>
                    <StatusBadge
                      variant={attendanceMap[selectedStudent.id] === "Present" ? "success" : "destructive"}
                    >
                      {attendanceMap[selectedStudent.id] ?? "—"}
                    </StatusBadge>
                  </div>
                )}

                {selectedStudent.email !== "—" && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium text-sm">{selectedStudent.email}</p>
                  </div>
                )}

                {selectedStudent.department !== "—" && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Department</p>
                    <p className="font-medium">{selectedStudent.department}</p>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registration No</p>
                  <p className="font-medium text-sm">{selectedStudent.registrationNumber}</p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  selectedStudent.alertCount > 0
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-success/5 border-success/20"
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedStudent.alertCount > 0
                      ? <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      : <CheckCircle   className="h-5 w-5 text-success shrink-0" />
                    }
                    <div>
                      <p className="font-medium">
                        {selectedStudent.alertCount > 0
                          ? `${selectedStudent.alertCount} Violation(s) Recorded`
                          : "No Violations"
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.alertCount > 0
                          ? "Review in Violations section"
                          : "Student behaviour is normal"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}