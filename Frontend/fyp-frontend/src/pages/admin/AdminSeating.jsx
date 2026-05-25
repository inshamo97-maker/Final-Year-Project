import { useState, useEffect, useRef } from "react";
import { Save, RotateCcw, User, X, Upload, FileSpreadsheet, Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";

const createInitialSeating = (rows, cols) => {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      id: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
      studentId: null,
      studentName: null,
    }))
  );
};

export default function AdminSeating() {
  const user = getCurrentUser() || { name: "Prof. Michael Chen", id: "ADM001", role: "admin" };
  const [seatingPlanUploaded, setSeatingPlanUploaded] = useState(true);
  const [studentsUploaded, setStudentsUploaded] = useState(true);
  const [halls, setHalls] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState("1");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const seatingPlanInputRef = useRef(null);
  const studentsInputRef = useRef(null);

 useEffect(() => {
  api.getSeatingHalls()
    .then((h) => {
      const safeHalls = Array.isArray(h) ? h : [];

      setHalls(safeHalls);

      if (safeHalls.length > 0) {
        setSelectedHallId(String(safeHalls[0].id));
      }
    })
    .catch((err) => {
      console.error("Failed to load halls:", err);
      toast.error("Failed to load halls");
    });

  api.getSeatingStudents()
    .then((s) => {
      setStudents(Array.isArray(s) ? s : []);
    })
    .catch((err) => {
      console.error("Failed to load students:", err);
      toast.error("Failed to load students");
    });
}, []);

const selectedHall =
  halls.find((h) => String(h.id) === String(selectedHallId)) || halls[0];

  const handleSeatingPlanUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
  const newHalls = await api.uploadSeatingPlan(file);

const safeHalls = Array.isArray(newHalls) ? newHalls : [];

setHalls(safeHalls);

if (safeHalls.length > 0) {
  setSelectedHallId(String(safeHalls[0].id));
}

setSeatingPlanUploaded(true);
    toast.success(`Seating plan uploaded: ${file.name}`);
  };

  const handleStudentsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newStudents = await api.uploadStudentsList(file);
    setStudents(newStudents); setStudentsUploaded(true);
    toast.success(`Students file uploaded: ${file.name}`);
    autoMapStudents(newStudents);
  };

  const autoMapStudents = (studentList) => {
    setHalls((prev) => {
      let studentIndex = 0;
      return prev.map((hall) => {
        const newSeats = hall.seats.map((row) => row.map((seat) => {
          if (studentIndex < studentList.length) {
            const student = studentList[studentIndex]; studentIndex++;
            return { ...seat, studentId: student.id, studentName: student.name };
          }
          return seat;
        }));
        return { ...hall, seats: newSeats };
      });
    });
    toast.success("Students automatically mapped to seats");
  };

  const handleAssignStudent = (studentId, studentName) => {
    if (!selectedSeat) return;
    setHalls((prev) => prev.map((hall) => {
      if (String(hall.id) !== String(selectedHallId)) return hall;
      const newSeats = hall.seats.map((row, rowIndex) => row.map((seat, colIndex) => {
        if (seat.studentId === studentId) return { ...seat, studentId: null, studentName: null };
        if (rowIndex === selectedSeat.row && colIndex === selectedSeat.col) return { ...seat, studentId, studentName };
        return seat;
      }));
      return { ...hall, seats: newSeats };
    }));
    setSelectedSeat(null); setStudentSearch("");
toast.success(
  `${studentName} assigned to seat ${
    selectedHall?.seats?.[selectedSeat.row]?.[selectedSeat.col]?.id || ""
  }`
);  };

  const handleClearSeat = (row, col) => {
    setHalls((prev) => prev.map((hall) => {
      if (String(hall.id) !== String(selectedHallId)) return hall;
      const newSeats = hall.seats.map((r, rowIndex) => r.map((seat, colIndex) => {
        if (rowIndex === row && colIndex === col) return { ...seat, studentId: null, studentName: null };
        return seat;
      }));
      return { ...hall, seats: newSeats };
    }));
    toast.info("Seat cleared");
  };

  const handleReset = () => {
    setHalls((prev) => prev.map((hall) => {
      if (String(hall.id) !== String(selectedHallId)) return hall;
      return { ...hall, seats: createInitialSeating(hall.rows, hall.cols) };
    }));
    toast.info("Seating layout reset");
  };

  const handleSave = async () => {
    try {
      await api.saveSeatingPlan(halls);
      toast.success("Seating plan saved successfully!");
    } catch (err) {
      console.error("Failed to save seating plan:", err);
      toast.error(err?.message || "Failed to save seating plan");
    }
  };

  const filteredStudents = students.filter((s) => String(s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) || String(s.id || "").toLowerCase().includes(studentSearch.toLowerCase()));
const assignedCount =selectedHall?.seats?.flat()?.filter((s) => s.studentId).length || 0;
  const totalSeats = selectedHall ? selectedHall.rows * selectedHall.cols : 0;

  if (!seatingPlanUploaded) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Manage Seating Plan">
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center"><FileSpreadsheet className="h-10 w-10 text-primary" /></div>
            <div><h2 className="text-xl font-semibold text-foreground mb-2">Upload Seating Plan</h2><p className="text-muted-foreground text-sm">Upload a seating plan file (CSV/Excel) to define exam halls and seat layouts</p></div>
            <input ref={seatingPlanInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleSeatingPlanUpload} className="hidden" />
            <Button onClick={() => seatingPlanInputRef.current?.click()} size="lg"><Upload className="h-4 w-4 mr-2" />Upload Seating Plan</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!studentsUploaded) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Manage Seating Plan">
        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-success"><div className="w-6 h-6 bg-success rounded-full flex items-center justify-center"><Check className="h-4 w-4 text-success-foreground" /></div><span className="text-sm font-medium">Seating Plan</span></div>
              <div className="w-8 h-px bg-border self-center" />
              <div className="flex items-center gap-2 text-muted-foreground"><div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium">2</div><span className="text-sm">Students</span></div>
            </div>
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center"><User className="h-10 w-10 text-primary" /></div>
            <div><h2 className="text-xl font-semibold text-foreground mb-2">Upload Students List</h2><p className="text-muted-foreground text-sm">Upload a students file (CSV/Excel) to automatically map students to seats</p></div>
            <input ref={studentsInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleStudentsUpload} className="hidden" />
            <Button onClick={() => studentsInputRef.current?.click()} size="lg"><Upload className="h-4 w-4 mr-2" />Upload Students List</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedHall) {
    return (
      <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Manage Seating Plan">
        <div className="bg-card rounded-lg border border-border p-6 shadow-card text-center text-muted-foreground">
          No exam halls found. Upload or create an exam hall first.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Manage Seating Plan">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <label className="text-sm font-medium text-foreground">Exam Hall:</label>
              <Select value={selectedHallId} onValueChange={setSelectedHallId}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
<SelectContent>
  {halls.map((hall) => (
    <SelectItem
      key={hall.id}
      value={String(hall.id)}
    >
      {hall.name}
    </SelectItem>
  ))}
</SelectContent>              </Select>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <input ref={seatingPlanInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleSeatingPlanUpload} className="hidden" />
              <input ref={studentsInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleStudentsUpload} className="hidden" />
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => studentsInputRef.current?.click()}><FileSpreadsheet className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Upload Student Excel File</span></Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => seatingPlanInputRef.current?.click()}><Upload className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Upload New Plan</span></Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleReset}><RotateCcw className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Reset Layout</span></Button>
              <Button size="sm" className="text-xs sm:text-sm" onClick={handleSave}><Save className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Save Seating Plan</span></Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="px-3 sm:px-4 py-2 bg-card rounded-lg border border-border"><span className="text-muted-foreground">Total: </span><span className="font-semibold">{totalSeats}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-success/10 rounded-lg border border-success/20"><span className="text-muted-foreground">Assigned: </span><span className="font-semibold text-success">{assignedCount}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-muted rounded-lg border border-border"><span className="text-muted-foreground">Available: </span><span className="font-semibold">{totalSeats - assignedCount}</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-3 bg-card rounded-lg border border-border p-4 sm:p-6 shadow-card overflow-hidden">
            <div className="mb-4 text-center"><div className="inline-block px-4 sm:px-6 py-1 bg-muted rounded text-xs font-medium text-muted-foreground uppercase tracking-wider">Front / Stage</div></div>
            <div className="flex flex-col gap-1 sm:gap-2 items-center overflow-x-auto pb-4">
              {selectedHall?.seats?.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 sm:gap-2">
                  <span className="w-5 sm:w-6 text-xs text-muted-foreground flex items-center justify-center">{String.fromCharCode(65 + rowIndex)}</span>
                  {row.map((seat, colIndex) => (
                    <div key={seat.id} onClick={() => { if (seat.studentId) handleClearSeat(rowIndex, colIndex); else setSelectedSeat({ row: rowIndex, col: colIndex }); }}
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
                        ${seat.studentId ? "bg-success/20 border-success hover:bg-success/30" : selectedSeat?.row === rowIndex && selectedSeat?.col === colIndex ? "bg-primary/20 border-primary ring-2 ring-primary/30" : "bg-muted border-border hover:border-primary/50"}`}
                      title={seat.studentId ? `${seat.studentName} (${seat.studentId})` : `Seat ${seat.id} - Click to assign`}>
                      {seat.studentId ? <User className="h-3 w-3 sm:h-4 sm:w-4 text-success" /> : <span className="text-[10px] sm:text-xs text-muted-foreground">{seat.id}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-success/20 border-2 border-success" /><span className="text-muted-foreground">Assigned</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-muted border-2 border-border" /><span className="text-muted-foreground">Available</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary/20 border-2 border-primary" /><span className="text-muted-foreground">Selected</span></div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Change Seat Assignment</h3>
            {selectedSeat ? (
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20"><p className="text-xs text-muted-foreground">Selected Seat</p><p className="font-semibold text-lg text-primary">{selectedHall?.seats[selectedSeat.row][selectedSeat.col].id}</p></div>
                <div className="relative">
                  <Input placeholder="Search student..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pr-8" />
                  {studentSearch && (<button onClick={() => setStudentSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>)}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredStudents.map((student) => (<button key={student.id} onClick={() => handleAssignStudent(student.id, student.name)} className="w-full p-2 text-left rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"><p className="text-sm font-medium text-foreground">{student.name}</p><p className="text-xs text-muted-foreground">{student.id}</p></button>))}
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setSelectedSeat(null)}>Cancel Selection</Button>
              </div>
            ) : (<p className="text-sm text-muted-foreground text-center py-8">Click on any seat to reassign a student</p>)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
