const emptyStore = [];
const invigilatorsStore = emptyStore;
const examHallsStore = emptyStore;
const examsStore = emptyStore;
const camerasStore = emptyStore;
const speakersStore = emptyStore;
const microphonesStore = emptyStore;
const violationsStore = emptyStore;
const alertsStore = emptyStore;
const crud = () => {
  const fail = async () => {
    throw new Error("Local data mode has been removed. Use the backend API.");
  };
  return { list: fail, get: fail, create: fail, update: fail, setStatus: fail, setActive: fail, remove: fail, uploadCsv: fail };
};

// ───────────────────────────────────────────────────────────────────────────────
// Configuration & Environment
// ───────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY = "token";
const USER_KEY  = "user";
const ROLE_KEY  = "role";

const API_BASE_URL = String(import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// ───────────────────────────────────────────────────────────────────────────────
// Core HTTP & Auth Infrastructure
// ───────────────────────────────────────────────────────────────────────────────

function parseJwt(token) {
  try {
    const [, payload] = String(token).split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded  = base64 + "===".slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch { return null; }
}

function buildAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Core HTTP request wrapper with standardized error handling
 * Supports both JSON and FormData bodies
 * Handles backend response envelope format
 */
async function request(path, { method = "GET", body, headers, auth = true, formData } = {}) {
  const url    = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const isForm = Boolean(formData);
  const res    = await fetch(url, {
    method,
    headers: {
      ...(auth ? buildAuthHeaders() : {}),
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
    body: isForm ? formData : body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const payload     = contentType.includes("application/json") ? await res.json() : await res.text();

  if (payload && typeof payload === "object" && typeof payload.success === "boolean") {
    if (payload.success === false) throw new Error(payload.error || payload.message || `Request failed (${res.status})`);
    return payload.data;
  }
  if (!res.ok) {
    const message = (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      (typeof payload === "string" && payload) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload;
}


// ───────────────────────────────────────────────────────────────────────────────
// Data Transform Layer (API format ↔ Frontend format)
// ───────────────────────────────────────────────────────────────────────────────

const invigilatorFromApi = (x) => x ? {
  id: String(x.id),
  name: x.name,
  email: x.email,
  phone: x.phone_number ?? x.phone ?? "",
  department: x.department ?? "",
  hallId: x.hall_id ?? x.hallId ?? null,
  lastLogin: x.last_login ?? x.lastLogin ?? null
} : null;
const invigilatorToApi = (x) => x ? {
  name: x.name,
  email: x.email,
  password: x.password,
  phone_number: x.phone_number ?? x.phone ?? null,
  department: x.department ?? null,
  hall_id: x.hallId ?? null
} : {};
const hallFromApi = (x) => x ? { id: String(x.id), hallNumber: x.hall_number ?? x.hallNumber, floor: x.floor_number ?? x.floor ?? null, capacity: x.capacity, location: x.location ?? "", status: x.status ?? "open" } : null;
const hallToApi   = (x) => x ? { hall_number: x.hall_number ?? x.hallNumber, floor_number: x.floor_number ?? x.floor ?? null, capacity: x.capacity, location: x.location ?? null } : {};

function timeForInput(value) {
  if (!value) return value;
  const text = String(value);
  const match = text.match(/T(\d{2}:\d{2})/) || text.match(/\s(\d{2}:\d{2})/);
  return match ? match[1] : text;
}

const examFromApi = (x) => x ? { id: String(x.id), name: x.name, subject: x.subject, classLevel: x.class_level ?? x.classLevel, programName: x.program_name ?? x.programName, date: x.date
  ? new Date(x.date).toLocaleDateString("en-CA")
  : x.date, startTime: timeForInput(x.start_time ?? x.startTime), endTime: timeForInput(x.end_time ?? x.endTime), status: x.status, hallId: x.hall_id ?? x.hallId } : null;
const examToApi   = (x) => x ? { name: x.name, subject: x.subject, date: x.date, start_time: x.start_time ?? x.startTime, end_time: x.end_time ?? x.endTime, status: x.status, hall_id: x.hall_id ?? x.hallId } : {};

const cameraFromApi = (x) => x ? { id: String(x.id), position: x.position, ipAddress: x.ip_address ?? x.ipAddress, model: x.model, hallId: x.hall_id ?? x.hallId, isActive: x.is_active ?? x.isActive } : null;
const cameraToApi   = (x) => x ? { position: x.position, ip_address: x.ip_address ?? x.ipAddress, model: x.model, hall_id: x.hall_id ?? x.hallId, is_active: x.is_active ?? x.isActive } : {};

const speakerFromApi = (x) => x ? { id: String(x.id), label: x.label, ipAddress: x.ip_address ?? x.ipAddress, volume: x.volume_level ?? x.volume ?? 50, status: x.status, hallId: x.hall_id ?? x.hallId, lastActiveTimestamp: x.last_active_timestamp ?? x.lastActiveTimestamp ?? null } : null;
const speakerToApi   = (x) => x ? { label: x.label, status: x.status, ip_address: x.ip_address ?? x.ipAddress, volume_level: x.volume_level ?? x.volume, hall_id: x.hall_id ?? x.hallId, last_active_timestamp: x.last_active_timestamp ?? x.lastActiveTimestamp ?? null } : {};

const microphoneToApi = (x) => x ? {
  range: x.range ?? null,
  sensitivity: x.sensitivity ?? null,
  hall_id: x.hallId ?? x.hall_id,
  row_number: x.row ?? x.row_number,
  column_number: x.column ?? x.column_number,
  ip_address: x.ipAddress ?? null,
  is_active: x.isActive ?? x.is_active
} : {};
const microphoneFromApi = (x) => x ? {
  id: String(x.id),
  range: x.range ?? null,
  sensitivity: x.sensitivity ?? null,
  hallId: x.hall_id ?? x.hallId,
  row: x.row_number ?? x.row ?? null,
  column: x.column_number ?? x.column ?? null,
  ipAddress: x.ip_address ?? x.ipAddress ?? null,
  isActive: x.is_active ?? x.isActive
} : null;
const violationFromApi = (x) => x ? { id: String(x.id), type: x.type, timestamp: x.timestamp, confidence: x.confidence, hallId: x.hall_id ?? x.hallId, studentId: x.student_id ?? x.studentId, status: x.status, severity: x.severity ?? x.severity_level ?? null, examId: x.exam_id ?? x.examId ?? null, eventId: x.event_id ?? x.eventId ?? null, evidencePath: x.evidence_path ?? x.evidencePath, cameraId: x.camera_id ?? x.cameraId, micId: x.mic_id ?? x.micId,violation_id: x.violation_id ?? x.violationId } : null;
const violationToApi   = (x) => x ? { type: x.type, timestamp: x.timestamp, confidence: x.confidence, hall_id: x.hall_id ?? x.hallId, student_id: x.student_id ?? x.studentId, status: x.status, evidence_path: x.evidence_path ?? x.evidencePath, camera_id: x.camera_id ?? x.cameraId, mic_id: x.mic_id ?? x.micId } : {};

const alertFromApi = (x) => x ? { id: String(x.id), eventId: x.event_id ?? x.eventId, type: x.type, violationType: x.violation_type ?? x.violationType ?? x.type, confidence: x.confidence, severity: x.severity, sentTo: x.sent_to ?? x.sentTo, hallId: x.hall_id ?? x.hallId, studentId: x.student_id ?? x.studentId, examId: x.exam_id ?? x.examId, status: x.status ?? "pending", timestamp: x.timestamp,violation_id: x.violation_id ?? x.violationId } : null;
const alertToApi   = (x) => x ? { event_id: x.event_id ?? x.eventId, type: x.type ?? x.violationType, confidence: x.confidence, timestamp: x.timestamp, hall_id: x.hall_id ?? x.hallId, exam_id: x.exam_id ?? x.examId, student_id: x.student_id ?? x.studentId, violation_id: x.violation_id ?? x.violationId } : {};

const studentFromApi = (x) => x ? {
  id: String(x.id),
  name: x.name,
  studentId: x.roll_number ?? x.registration_number ?? String(x.id),
  rollNumber: x.roll_number ?? x.registration_number ?? "",
  registrationNumber: x.registration_number ?? "",
  hallId: x.hall_id ?? null,
  faceId: x.face_id ?? null,
  rowNumber: x.row_number ?? null,
  columnNumber: x.column_number ?? null,
  hallNumber: x.hall_number ?? null,
  programName: x.program_name ?? "",
  classLevel: x.class_level ?? "",
  email: x.email ?? ""
} : null;

const reportFromApi = (x) => x ? {
  id: String(x.id),
  date: x.date ? String(x.date).slice(0, 10) : "",
  examHall: x.exam_hall ?? x.examHall ?? x.hall_number ?? "Unknown Hall",
  examName: x.exam_name ?? x.examName ?? "Exam Report",
  totalAlerts: Number(x.total_alerts ?? x.totalAlerts ?? 0),
  reviewedAlerts: Number(x.reviewed_alerts ?? x.reviewedAlerts ?? 0),
  studentsMonitored: Number(x.students_monitored ?? x.studentsMonitored ?? 0),
  duration: x.duration ?? ""
} : null;



function examPayloadToApi(x) {
  if (!x) return {};

  return {
    name: x.name,
    subject: x.subject,
    class_level: x.class_level ?? x.classLevel,
    program_name: x.program_name ?? x.programName,
    date: x.date,

    start_time: x.start_time ?? x.startTime,
    end_time: x.end_time ?? x.endTime,

    hall_id: x.hall_id ?? x.hallId,
  };
}
// ───────────────────────────────────────────────────────────────────────────────
// API Builder Helpers (reduce duplication)
// ───────────────────────────────────────────────────────────────────────────────

function makeCrudApi(_localCrud, realFactory) {
  return realFactory();
}

/**
 * Factory for creating hardware CRUD APIs (cameras, speakers, microphones)
 * Abstracts the common pattern of transform functions + CRUD operations
 */
function makeHardwareApi(store, prefix, fromApi, toApi) {
  return {
    list:      async ()      => (await request(`/${prefix}s`)).map(fromApi),
    get:       async (id)    => fromApi(await request(`/${prefix}s/${id}`)),
    create:    async (p)     => fromApi(await request(`/${prefix}s`, { method: "POST", body: toApi(p) })),
    update:    async (id, p) => fromApi(await request(`/${prefix}s/${id}`, { method: "PUT", body: toApi(p) })),
    remove:    async (id)    => { await request(`/${prefix}s/${id}`, { method: "DELETE" }); return { success: true }; },
    uploadCsv: async (file)  => { const fd = new FormData(); fd.append("file", file); return request(`/${prefix}s/upload/csv`, { method: "POST", formData: fd }); },
    setActive: async (id)    => { const d = await request(`/${prefix}s/${id}/status`, { method: "PATCH" }); return fromApi(d?.[prefix]); },
    setStatus: async (id, status) => { const d = await request(`/${prefix}s/${id}/status`, { method: "PATCH", body: { status } }); return fromApi(d?.[prefix]); },
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Authentication
// ───────────────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  try {
    const data    = await request("/auth/login", { method: "POST", auth: false, body: { email, password } });
    const token   = data?.token;
    const payload = token ? parseJwt(token) : null;
    const role    = payload?.isAdmin ? "admin" : "invigilator";
    const user    = { ...(data?.user || {}), email, role };
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(ROLE_KEY, role);
    return { user };
  } catch (e) { return { error: e?.message || "Login failed" }; }
}

export function logout()        { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); sessionStorage.removeItem(ROLE_KEY); }
export function getCurrentUser(){ const s = sessionStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; }
export function getToken()      { return sessionStorage.getItem(TOKEN_KEY); }

// ───────────────────────────────────────────────────────────────────────────────
// Invigilators
// ───────────────────────────────────────────────────────────────────────────────

const invCrud = crud(invigilatorsStore, "inv");
export const getInvigilators      = makeCrudApi(invCrud.list, () => async () => { const d = await request("/invigilators"); return (d?.invigilators || []).map(invigilatorFromApi); });
export const getInvigilatorById   = makeCrudApi(invCrud.get, () => async (id) => { const d = await request(`/invigilators/${id}`); return invigilatorFromApi(d?.invigilator); });
export const createInvigilator    = makeCrudApi(invCrud.create, () => async (p) => { const d = await request("/invigilators", { method: "POST", body: invigilatorToApi(p) }); return invigilatorFromApi(d?.invigilator); });
export const updateInvigilator    = makeCrudApi(invCrud.update, () => async (id, p) => { const d = await request(`/invigilators/${id}`, { method: "PUT", body: invigilatorToApi(p) }); return invigilatorFromApi(d?.invigilator); });
export const deleteInvigilator    = makeCrudApi(invCrud.remove, () => async (id) => { await request(`/invigilators/${id}`, { method: "DELETE" }); return { success: true }; });
export const uploadInvigilatorsCsv = makeCrudApi(invCrud.uploadCsv, () => async (file) => { const fd = new FormData(); fd.append("file", file); return request("/invigilators/upload/csv", { method: "POST", formData: fd }); });

// ───────────────────────────────────────────────────────────────────────────────
// Exam Halls
// ───────────────────────────────────────────────────────────────────────────────

const hallsCrud = crud(examHallsStore, "hall");
export const getExamHalls      = makeCrudApi(hallsCrud.list, () => async () => { const d = await request("/examhalls"); return (d?.exam_halls || []).map(hallFromApi); });
export const getExamHallById   = makeCrudApi(hallsCrud.get, () => async (id) => { const d = await request(`/examhalls/${id}`); return hallFromApi(d?.exam_hall); });
export const createAdminExamHall = makeCrudApi(hallsCrud.create, () => async (p) => { const d = await request("/examhalls", { method: "POST", body: hallToApi(p) }); return hallFromApi(d?.exam_hall); });
export const uploadExamHallsCsv = makeCrudApi(hallsCrud.uploadCsv, () => async (file) => { const fd = new FormData(); fd.append("file", file); return request("/examhalls/upload/csv", { method: "POST", formData: fd }); });

export async function updateAdminExamHallStatus(id, status) {
  const d = await request(`/examhalls/${id}/status`, { method: "PATCH", body: { status } }); 
  return hallFromApi(d?.exam_hall);
}

export async function deleteAdminExamHall(id) {
  await request(`/examhalls/${id}`, { method: "DELETE" }); 
  return { success: true };
}

export async function updateAdminExamHall(id, data) {
  if (data?.status) return updateAdminExamHallStatus(id, data.status);
  throw new Error("Backend does not support updating exam hall fields (only status).");
}

// ───────────────────────────────────────────────────────────────────────────────
// Exams
// ───────────────────────────────────────────────────────────────────────────────

const examsCrud = crud(examsStore, "exam");
export const getExams     = makeCrudApi(examsCrud.list, () => async () => { const d = await request("/exams"); return (d?.exams || []).map(examFromApi); });
export const getExamById  = makeCrudApi(examsCrud.get, () => async (id) => { const d = await request(`/exams/${id}`); return examFromApi(d?.exam); });
export const createExam   = makeCrudApi(examsCrud.create, () => async (p) => { const d = await request("/exams", { method: "POST", body: examPayloadToApi(p) }); return examFromApi(d?.exam); });
export const updateExam   = makeCrudApi(examsCrud.update, () => async (id, p) => { const d = await request(`/exams/${id}`, { method: "PUT", body: examPayloadToApi(p) }); return examFromApi(d?.exam); });
export const deleteExam   = makeCrudApi(examsCrud.remove, () => async (id) => { await request(`/exams/${id}`, { method: "DELETE" }); return { success: true }; });
export const uploadExamsCsv = makeCrudApi(examsCrud.uploadCsv, () => async (file) => { const fd = new FormData(); fd.append("file", file); return request("/exams/upload/csv", { method: "POST", formData: fd }); });

export async function refreshExamStatuses() {
  return request("/exams/status/update");
}

// ───────────────────────────────────────────────────────────────────────────────
// Hardware: Cameras, Speakers, Microphones
// ───────────────────────────────────────────────────────────────────────────────

export const cameras = makeHardwareApi(camerasStore, "camera", cameraFromApi, cameraToApi);
export const speakers = makeHardwareApi(speakersStore, "speaker", speakerFromApi, speakerToApi);
export const microphones = makeHardwareApi(microphonesStore, "microphone", microphoneFromApi, microphoneToApi);

// ───────────────────────────────────────────────────────────────────────────────
// Violations
// ───────────────────────────────────────────────────────────────────────────────

const vioCrud = crud(violationsStore, "vio");
export const getViolations    = makeCrudApi(vioCrud.list, () => async () => (await request("/violations")).map(violationFromApi));
export const getViolationById = makeCrudApi(vioCrud.get, () => async (id) => violationFromApi(await request(`/violations/${id}`)));
export const createViolation  = makeCrudApi(vioCrud.create, () => async (p) => violationFromApi(await request("/violations", { method: "POST", body: violationToApi(p) })));
export const deleteViolation  = makeCrudApi(vioCrud.remove, () => async (id) => { await request(`/violations/${id}`, { method: "DELETE" }); return { success: true }; });

export async function updateViolationStatus(id, status) {
  return violationFromApi(await request(`/violations/${id}/status`, { method: "PATCH", body: { status } }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Alerts
// ───────────────────────────────────────────────────────────────────────────────

const alertCrud = crud(alertsStore, "alert");


export async function updateAlertStatus(id, status) {
  return alertFromApi(await request(`/ai-alerts/${id}/status`, {
    method: "PATCH",
    body: { status }
  }));
}
export const getAlertById   = makeCrudApi(alertCrud.get, () => async (id) => alertFromApi(await request(`/ai-alerts/${id}`)));
export const createAlert    = makeCrudApi(alertCrud.create, () => async (p) => alertFromApi(await request("/ai-alerts", { method: "POST", body: alertToApi(p) })));
export const deleteAlert    = makeCrudApi(alertCrud.remove, () => async (id) => { await request(`/ai-alerts/${id}`, { method: "DELETE" }); return { success: true }; });



// ───────────────────────────────────────────────────────────────────────────────
// AI & Attendance Integration
// ───────────────────────────────────────────────────────────────────────────────

export async function getAiAlerts()         { return (await request("/ai-alerts")).map(alertFromApi); }
export async function getAttendanceRecords(){ return request("/attendance"); }

function getAiKey() {
  return import.meta?.env?.VITE_AI_KEY || import.meta?.env?.VITE_X_AI_KEY ||
    sessionStorage.getItem("ai_key") || sessionStorage.getItem("x-ai-key") || "";
}

export async function createStudentEmbedding(payload, { aiKey } = {}) {
  const key = aiKey ?? getAiKey();
  return request("/student-embeddings", { method: "POST", body: payload, headers: key ? { "x-ai-key": key } : {} });
}

export async function createAttendance(payload, { aiKey } = {}) {
  const key = aiKey ?? getAiKey();
  return request("/attendance", { method: "POST", body: payload, headers: key ? { "x-ai-key": key } : {} });
}

export async function createAiAlert(payload, { aiKey } = {}) {
  const key = aiKey ?? getAiKey();
  return request("/ai-alert", { method: "POST", body: payload, headers: key ? { "x-ai-key": key } : {} });
}

// ───────────────────────────────────────────────────────────────────────────────
// Options / Dropdowns
// ───────────────────────────────────────────────────────────────────────────────

export async function getCameraOptions() {
  const list = await cameras.list();
  return list.map((c) => ({ id: c.id, name: `${c.position} (${c.ipAddress})` }));
}

export async function getExamHallOptions() {
  const list = await getExamHalls();
  return list.map((h) => ({ id: h.id, name: h.hallNumber }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Students
// ───────────────────────────────────────────────────────────────────────────────

export async function getStudentList() {
  const data = await request("/students");
  return (Array.isArray(data) ? data : []).map(studentFromApi);
}

// ───────────────────────────────────────────────────────────────────────────────
// Dashboard Statistics
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Helper to extract array length from various backend response formats
 */
function getArrayLength(result) {
  if (result.status !== "fulfilled") return 0;
  const d = result.value;
  if (Array.isArray(d)) return d.length;
  // Backend may wrap in envelope keys
  const arr = d?.invigilators || d?.exams || d?.exam_halls || d?.cameras ||
              d?.speakers || d?.microphones || d?.violations || d?.alerts || d;
  return Array.isArray(arr) ? arr.length : 0;
}

export async function getAdminDashboardStats() {
  const [invigs, exams, halls, cams, spks, mics, viols, alerts, students] = await Promise.all([
    request("/invigilators"),
    request("/exams"),
    request("/examhalls"),
    request("/cameras"),
    request("/speakers"),
    request("/microphones"),
    request("/violations"),
    request("/ai-alerts"),
    request("/students"),
  ]);

  return {
    totalInvigilators: getArrayLength({ status: "fulfilled", value: invigs }),
    totalExams:        getArrayLength({ status: "fulfilled", value: exams }),
    totalExamHalls:    getArrayLength({ status: "fulfilled", value: halls }),
    totalCameras:      getArrayLength({ status: "fulfilled", value: cams }),
    totalSpeakers:     getArrayLength({ status: "fulfilled", value: spks }),
    totalMicrophones:  getArrayLength({ status: "fulfilled", value: mics }),
    totalViolations:   getArrayLength({ status: "fulfilled", value: viols }),
    totalAlerts:       getArrayLength({ status: "fulfilled", value: alerts }),
    totalStudents:     Array.isArray(students) ? students.length : 0,
  };
}

export async function getInvigilatorDashboardStats() {
  const [alerts, exams, halls, students] = await Promise.all([
    request("/ai-alerts"),
    request("/exams"),
    request("/examhalls"),
    request("/students"),
  ]);

  const alertList = ((alerts?.alerts || alerts) ?? []).map(alertFromApi);
  const examList  = ((exams?.exams || exams) ?? []).map(examFromApi);
  const hallList  = ((halls?.exam_halls || halls) ?? []).map(hallFromApi);
  const studentList = Array.isArray(students) ? students : [];

  return {
    totalStudents:        studentList.length,
    activeAlerts:         alertList.filter((a) => a.status === "pending").length,
    examHalls:            hallList.length,
    activeExamsInMyHalls: examList.filter((e)  => e.status === "active").length,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Session Management
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Finds the first active exam and returns formatted session information
 * Used by invigilator dashboard to display live exam details
 */
export async function getCurrentSession() {
  const fmtMins = (ms) => {
    if (ms <= 0) return "0m";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isValid = (d) => d instanceof Date && !isNaN(d);

  const data = await request("/exams");
  const examList = ((data?.exams || data) ?? []).map(examFromApi);
  const active = examList.find((e) => e.status === "active");

  if (!active) {
    return {
      examName: "No active exam",
      duration: "—",
      timeLeft: "—",
      students: "—"
    };
  }

  const start = active.startTime && active.date
    ? new Date(`${active.date}T${String(active.startTime).slice(0, 8)}`)
    : null;

  const end = active.endTime && active.date
    ? new Date(`${active.date}T${String(active.endTime).slice(0, 8)}`)
    : null;

  const now = new Date();

  const duration =
    start && end && isValid(start) && isValid(end)
      ? fmtMins(end - start)
      : "—";

  const timeLeft =
    end && isValid(end)
      ? end > now
        ? fmtMins(end - now)
        : "Ended"
      : "—";

  return {
    examName: `${active.name} — ${active.subject}`,
    duration,
    timeLeft,
    students: "—"
  };
}

// Reports
export async function getReports() {
  try {
    const data = await request("/reports");

    const list =
      Array.isArray(data) ? data :
      Array.isArray(data?.reports) ? data.reports :
      [];

    return list.map(reportFromApi);
  } catch (err) {
    return [];
  }
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reportsToCsv(reports) {
  const headers = ["id", "date", "examHall", "examName", "totalAlerts", "reviewedAlerts", "studentsMonitored", "duration"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...reports.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

export async function exportReport(format = "csv") {
  const reports = await getReports();
  const normalizedFormat = String(format).toLowerCase();

  if (normalizedFormat === "txt" || normalizedFormat === "text") {
    const content = reports.map((r) =>
      `${r.id} | ${r.date} | ${r.examHall} | ${r.examName} | Alerts: ${r.reviewedAlerts}/${r.totalAlerts}`
    ).join("\n");
    downloadTextFile("reports.txt", content || "No reports found", "text/plain;charset=utf-8");
    return { success: true };
  }

  downloadTextFile("reports.csv", reportsToCsv(reports), "text/csv;charset=utf-8");
  return { success: true };
}

// ───────────────────────────────────────────────────────────────────────────────
// Invigilator Hall Details
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get comprehensive hall details for invigilators including seating layout and cameras
 * Returns enriched hall data with students, seats, and camera status
 */
export async function getInvigilatorHallDetails() {
  const [hallsRes, camerasRes, alertsRes, studentsRes] = await Promise.allSettled([
    request("/examhalls"),
    request("/cameras"),
    request("/ai-alerts"),
    request("/students"),
  ]);

  const halls = (hallsRes.status === "fulfilled" ? (hallsRes.value?.exam_halls || hallsRes.value || []) : []);
  const cameras = (camerasRes.status === "fulfilled" ? (camerasRes.value?.cameras || camerasRes.value || []) : []);
  const alerts = (alertsRes.status === "fulfilled" ? (alertsRes.value?.alerts || alertsRes.value || []) : []);
  const students = (studentsRes.status === "fulfilled" ? (studentsRes.value || []) : []);
  return halls.map((hall) => {
const hallCameras = cameras.filter(
  c => String(c.hall_id ?? c.hallId) === String(hall.id)
);
    const hallAlerts = alerts.filter(a => String(a.hallId) === String(hall.id));

    const hallStudents = students.filter(s =>
      String(s.hall_id ?? s.hallId) === String(hall.id)
    );

    const rows = Number(hall.rows || hall.rowCount || 0);
    const cols = Number(hall.cols || hall.colCount || 0);

    const maxRow = rows || Math.max(0, ...hallStudents.map(s => Number(s.row_number || s.rowNumber || 0)));
    const maxCol = cols || Math.max(0, ...hallStudents.map(s => Number(s.column_number || s.columnNumber || 0)));

    const seating = Array.from({ length: maxRow }, () =>
      Array.from({ length: maxCol }, () => ({
        status: "empty",
        student: null,
        alert: null,
      }))
    );

    hallStudents.forEach((student) => {
      const rowIndex = Number(student.row_number ?? student.rowNumber) - 1;
      const colIndex = Number(student.column_number ?? student.columnNumber) - 1;

      if (rowIndex < 0 || colIndex < 0) return;
      if (!seating[rowIndex]?.[colIndex]) return;

      const studentAlerts = hallAlerts.filter(a =>
        String(a.student_id ?? a.studentId) === String(student.id)
      );

      const pending = studentAlerts.find(a => a.status === "pending") || null;

      seating[rowIndex][colIndex] = {
        status: pending ? "flagged" : "occupied",
        student: {
          id: student.id,
          name: student.name || "",
          rollNumber: student.roll_number || student.registration_number || "",
          department: student.program_name || "",
          email: student.email || "",
        },
        alert: pending
          ? {
              id: pending.id,
              alertType: pending.violation_type || pending.alertType,
              time: pending.timestamp,
              status: pending.status,
            }
          : null,
      };
    });

    return {
      id: hall.id,
      name: hall.name || `${hall.hall_number || ""} - ${hall.location || ""}`,
      totalStudents: hallStudents.length,
      capacity: hall.capacity || 0,
      activeCameras: hallCameras.filter(
  c => c.is_active ?? c.isActive
).length,
      currentAlerts: hallAlerts.filter(a => a.status === "pending").length,
      seating,
      cameras: hallCameras.map(c => ({
        id: c.id,
        name: c.position || "Camera",
        status: (c.is_active ?? c.isActive)
  ? "active"
  : "inactive",
      })),
    };
  });
}
// ───────────────────────────────────────────────────────────────────────────────
// Admin Exam Halls
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Get exam halls for admin view (returns raw hall data with all fields for editing)
 */
export async function getAdminExamHalls() {
  try {
    const data = await request("/examhalls");
    return (data?.exam_halls || data || []).map(hallFromApi);
  } catch (error) {
    throw error;
  }
}

// Seating plan
const seatLabel = (rowIndex, colIndex) => `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;

function createSeatGrid(rows, cols) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: cols }, (_, colIndex) => ({
      id: seatLabel(rowIndex, colIndex),
      studentId: null,
      studentName: null,
    }))
  );
}

function seatingHallFromApi(hall, students = []) {
  const hallId = String(hall.id);
  const hallStudents = students.filter((student) => String(student.hallId ?? "") === hallId);
  const maxAssignedRow = Math.max(0, ...hallStudents.map((student) => Number(student.rowNumber) || 0));
  const maxAssignedCol = Math.max(0, ...hallStudents.map((student) => Number(student.columnNumber) || 0));
  const cols = Math.max(6, maxAssignedCol);
  const rows = Math.max(Math.ceil((Number(hall.capacity) || 0) / cols), maxAssignedRow, 1);
  const seats = createSeatGrid(rows, cols);

  hallStudents.forEach((student) => {
    const rowIndex = Number(student.rowNumber) - 1;
    const colIndex = Number(student.columnNumber) - 1;
    if (rowIndex >= 0 && colIndex >= 0 && seats[rowIndex]?.[colIndex]) {
      seats[rowIndex][colIndex] = {
        ...seats[rowIndex][colIndex],
        studentId: student.id,
        studentName: student.name,
      };
    }
  });

  return {
    id: hallId,
    name: hall.hallNumber || hall.name || `Hall ${hallId}`,
    rows,
    cols,
    seats,
  };
}

export async function getSeatingStudents() {
  const data = await request("/students");
  return (Array.isArray(data) ? data : []).map(studentFromApi);
}

export async function getSeatingHalls() {
  const [halls, students] = await Promise.all([getExamHalls(), getSeatingStudents()]);
  return halls.map((hall) => seatingHallFromApi(hall, students));
}

export async function uploadSeatingPlan(file) {
  await uploadExamHallsCsv(file);
  return getSeatingHalls();
}

export async function uploadStudentsList(file) {
  if (!file) return getSeatingStudents();
  const fd = new FormData();
  fd.append("file", file);
  await request("/students/upload/csv", { method: "POST", formData: fd });
  return getSeatingStudents();
}

export async function saveSeatingPlan(halls) {
  return request("/seating", { method: "POST", body: { halls } });
}
// ─────────────────────────────────────────────────────
// Student Management
// ─────────────────────────────────────────────────────

export async function createStudent(student) {
  const cleanString = (value) => {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
  };

  const cleanInteger = (value) => {
    const text = cleanString(value);
    return text === null ? null : Number(text);
  };

  const registrationNumber = cleanString(student.registrationNumber);

  return request("/students", {
    method: "POST",
    body: {
      name: cleanString(student.name),
      gender: cleanString(student.gender),
      registration_number: registrationNumber,
      program_name: cleanString(student.programName),
      class_level: cleanInteger(student.classLevel),
      hall_id: cleanInteger(student.hallId)
    }
  });
}

export async function uploadStudentsCsv(file) {
  const fd = new FormData();

  fd.append("file", file);

  return request(
    "/students/upload/csv",
    {
      method:"POST",
      formData:fd
    }
  );
}

export async function deleteStudent(id) {
  return request(
    `/students/${id}`,
    {
      method:"DELETE"
    }
  );
}



export async function uploadSeatAllocationsCsv(file) {
  const fd = new FormData();

  fd.append("file", file);

  return request(
    "/seat-allocation/upload/csv",
    {
      method: "POST",
      formData: fd
    }
  );
}