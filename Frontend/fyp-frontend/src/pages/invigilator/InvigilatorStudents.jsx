import { useState, useEffect } from "react";
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

// ── Shape normaliser ──────────────────────────────────────────────────────────
// Backend returns snake_case while the UI uses camelCase.
function normaliseStudent(s, violations = [], halls = []) {
  const hallId   = s.hall_id ?? s.hallId ?? null;
  const hallObj  = halls.find((h) => String(h.id) === String(hallId));
  const hallName = hallObj?.hallNumber ?? s.examHall ?? "—";

  // Count violations for this student
  const sid        = String(s.id ?? s.studentId ?? "");
  const rollNumber = s.roll_number ?? s.rollNumber ?? s.registration_number ?? s.studentId ?? sid;
  const alertCount = violations.filter(
    (v) => String(v.student_id ?? v.studentId) === sid ||
           String(v.student_id ?? v.studentId) === rollNumber
  ).length;

  return {
    id:          sid,
    studentId:   rollNumber,
    name:        s.name ?? "Unknown",
    seatNumber:  s.seat_number ?? s.seatNumber ?? "—",
    examHall:    hallName,
    hallId,
    status:      alertCount > 0 ? "Flagged" : "Normal",
    alertCount,
    email:       s.email ?? "—",
    department:  s.department ?? "—",
    registrationNumber: s.registration_number ?? s.registrationNumber ?? rollNumber,
  };
}

export default function InvigilatorStudents() {
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role: "invigilator" };

  const [students, setStudents]       = useState([]);
  const [halls, setHalls]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hallFilter, setHallFilter]   = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [raw, viols, hallList] = await Promise.all([
          api.getStudentList(),
          api.getViolations(),
          api.getExamHalls(),
        ]);
        setHalls(hallList);
        setStudents((raw || []).map((s) => normaliseStudent(s, viols, hallList)));
      } catch (e) {
        toast.error(e?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Unique hall names for filter dropdown ───────────────────────────────────
  const hallOptions = [...new Set(students.map((s) => s.examHall).filter((h) => h && h !== "—"))];

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.registrationNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchHall   = hallFilter   === "all" || s.examHall === hallFilter;
    return matchSearch && matchStatus && matchHall;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setHallFilter("all");
  };

  const hasFilters = statusFilter !== "all" || hallFilter !== "all" || searchQuery;

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { header: "Roll No",   accessor: "studentId"  },
    { header: "Name",      accessor: "name"        },
    { header: "Seat",      accessor: "seatNumber"  },
    { header: "Hall",      accessor: "examHall"    },
    { header: "Status",    accessor: (r) => (
      <StatusBadge variant={r.status === "Flagged" ? "destructive" : "success"}>
        {r.status}
      </StatusBadge>
    )},
    { header: "Alerts",    accessor: (r) => r.alertCount > 0
      ? <span className="text-destructive font-medium">{r.alertCount}</span>
      : <span className="text-muted-foreground">0</span>
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Student List">
      <div className="space-y-4 sm:space-y-6 animate-fade-in">

        {/* Search + filters */}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Hall" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Halls</SelectItem>
                {hallOptions.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
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

      {/* Student detail sheet */}
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
