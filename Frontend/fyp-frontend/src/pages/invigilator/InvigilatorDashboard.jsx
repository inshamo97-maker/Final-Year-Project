import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, Building2, Video, Bell, BookOpenCheck } from "lucide-react";
import { io } from "socket.io-client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser } from "@/services/api";
import * as api from "@/services/api";
import RealTimeAlertsPanel from "@/components/RealTimeAlertsPanel";
import { toast } from "sonner";

const SOCKET_URL   = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000";
const alertVariant = { pending: "warning", reviewed: "success" };

export default function InvigilatorDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser() || { name: "Invigilator", id: "inv", role: "invigilator" };

  const [stats, setStats]             = useState({ totalStudents: 0, activeAlerts: 0, examHalls: 0, activeExamsInMyHalls: 0 });
  const [examHalls, setExamHalls]     = useState([]);
  const [cameras, setCameras]         = useState([]);
  const [session, setSession]         = useState({ examName: "—", duration: "—", timeLeft: "—", students: "—" });
  const [alerts, setAlerts]           = useState([]);
  const [liveAlerts, setLiveAlerts]   = useState([]);
  const [halls, setHalls]             = useState([]);
  const [selectedHall, setSelectedHall]     = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [s, hallOpts, camOpts, sess, recentAlerts, allHalls, aiAlerts] = await Promise.all([
          api.getInvigilatorDashboardStats(),
          api.getExamHallOptions(),
          api.getCameraOptions(),
          api.getCurrentSession(),
          api.getAiAlerts(),
          api.getExamHalls(),
          api.getAiAlerts(),
        ]);
        setStats(s);
        setExamHalls(hallOpts);
        setCameras(camOpts);
        setSession(sess);
        setAlerts((recentAlerts || []).slice(0, 5));
        setHalls(allHalls);
        setLiveAlerts((aiAlerts || []).slice(0, 20));

        if (hallOpts.length > 0) setSelectedHall(String(hallOpts[0].id));
        if (camOpts.length > 0)  setSelectedCamera(String(camOpts[0].id));
      } catch (e) {
        toast.error(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Socket.IO ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL);
    let active   = true;

    (async () => {
      try {
        const h = await api.getExamHalls();
        if (!active) return;
        (h || [])
          .map((hall) => String(hall?.id ?? "").match(/(\d+)/)?.[1])
          .filter(Boolean)
          .forEach((hid) => socket.emit("join-hall", Number(hid)));
      } catch { /* best-effort */ }
    })();

    socket.on("ai-alert", (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 20));
      setStats((prev) => ({ ...prev, activeAlerts: (prev.activeAlerts || 0) + 1 }));
      toast.warning(`New alert: ${alert.type || "violation"} — Hall ${alert.hall_id ?? "?"}`);
    });

    return () => { active = false; socket.disconnect(); };
  }, []);

  const hallName = (id) => halls.find((h) => String(h.id) === String(id))?.hallNumber || id || "—";
  const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";
  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Dashboard">
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6 animate-fade-in">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Students"    value={stats.totalStudents}        icon={Users}          variant="primary"     onClick={() => navigate("/invigilator/students")} />
            <StatCard title="Active Alerts"     value={stats.activeAlerts}         icon={AlertTriangle}  variant="destructive" onClick={() => navigate("/invigilator/alerts")} />
            <StatCard title="Exam Halls"        value={stats.examHalls}            icon={Building2}      variant="default"     onClick={() => navigate("/invigilator/exam-halls")} />
            <StatCard title="Active Exams"      value={stats.activeExamsInMyHalls} icon={BookOpenCheck}  variant="accent" />
          </div>

          {/* ── Live feed + controls ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* Feed */}
            <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Live Feed</h2>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </span>
              </div>

              <div className="live-feed-gradient aspect-video rounded-lg relative overflow-hidden border border-border/50 bg-black">
                <img
                  src={`${FASTAPI_URL}/stream/${selectedHall}`}                  
                  alt="Live exam hall camera"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                {/* Fallback */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-muted-foreground/60 px-4">
                    <Video className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-2 sm:mb-4 opacity-40" />
                    <p className="text-sm sm:text-lg font-medium">LIVE FEED</p>
                    <p className="text-xs sm:text-sm">waiting for exam to start</p>
                  </div>
                </div>
                {/* Grid overlay */}
                <div className="absolute inset-2 sm:inset-4 border border-dashed border-white/10 rounded-lg grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-dashed border-white/5" />
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 order-1 lg:order-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Camera Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">

                <div className="space-y-4 p-4 bg-card rounded-lg border border-border shadow-card">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Exam Hall</label>
                    <Select value={selectedHall || ""} onValueChange={setSelectedHall}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose hall" /></SelectTrigger>
                      <SelectContent>
                        {examHalls.map((hall) => (
                          <SelectItem key={hall.id} value={String(hall.id)}>{hall.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Camera</label>
                    <Select value={selectedCamera || ""} onValueChange={setSelectedCamera}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose camera" /></SelectTrigger>
                      <SelectContent>
                        {cameras.map((cam) => (
                          <SelectItem key={cam.id} value={String(cam.id)}>{cam.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-card rounded-lg border border-border shadow-card space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Current Session</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Exam</span>    <span className="font-medium text-right truncate max-w-[120px]">{session.examName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{session.duration}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time Left</span><span className="font-medium text-warning">{session.timeLeft}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Students</span><span className="font-medium">{session.students}</span></div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Alerts section ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent alerts table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Recent Alerts</h2>
              </div>
              <DataTable
                emptyMessage="No alerts yet"
                columns={[
                  { header: "Type",    accessor: "violationType" },
                  { header: "Hall",    accessor: (r) => hallName(r.hallId) },
                  { header: "Student", accessor: "studentId" },
                  { header: "Status",  accessor: (r) => (
                    <StatusBadge variant={alertVariant[r.status] || "default"}>{r.status}</StatusBadge>
                  )},
                ]}
                data={alerts}
              />
              <button
                onClick={() => navigate("/invigilator/alerts")}
                className="text-sm text-primary hover:underline"
              >
                View all alerts →
              </button>
            </div>

            {/* Real-time AI alerts */}
            <RealTimeAlertsPanel alerts={liveAlerts} />

          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
