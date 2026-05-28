const db = require("../db"); // your PostgreSQL connection
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

function normalizeReportHallId(row) {
  if (!row || typeof row !== "object") return null;
  return row.hall_id ?? row.exam_hall_id ?? row.hallId ?? null;
}

function formatDuration(seconds) {
  const totalMinutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function mapReport(row) {
  return {
    id: String(row.exam_id),
    exam_id: row.exam_id,
    hall_id: row.hall_id,
    date: row.date,
    exam_hall: row.hall_number || "Unknown Hall",
    exam_name: row.exam_name || "Exam Report",
    total_alerts: Number(row.total_alerts || 0),
    reviewed_alerts: Number(row.reviewed_alerts || 0),
    total_violations: Number(row.total_violations || 0),
    attendance_count: Number(row.attendance_count || 0),
    students_monitored: Number(row.students_monitored || 0),
    duration: formatDuration(row.duration_seconds),
  };
}

async function queryComputedReports(params = []) {
  const whereExam = params.length ? "WHERE e.id = $1" : "";
  const result = await db.query(
    `
    SELECT
      e.id AS exam_id,
      e.name AS exam_name,
      e.date,
      e.hall_id,
      eh.hall_number,
      EXTRACT(EPOCH FROM ((e.date + e.end_time) - (e.date + e.start_time))) AS duration_seconds,
      COUNT(DISTINCT v.id) AS total_violations,
      COUNT(DISTINCT a.id) AS total_alerts,
      COUNT(DISTINCT a.id) AS reviewed_alerts,
      COUNT(DISTINCT att.student_id) AS attendance_count,
      COALESCE(
        NULLIF(COUNT(DISTINCT sa.student_id), 0),
        NULLIF(COUNT(DISTINCT att.student_id), 0),
        0
      ) AS students_monitored
    FROM exams e
    LEFT JOIN exam_halls eh ON eh.id = e.hall_id
    LEFT JOIN seat_allocations sa
      ON sa.exam_id = e.id
      OR (sa.exam_id IS NULL AND sa.hall_id = e.hall_id)
    LEFT JOIN violations v
      ON v.hall_id = e.hall_id
      AND v.timestamp >= (e.date + e.start_time)
      AND v.timestamp <= (e.date + e.end_time)
LEFT JOIN ai_alerts a ON a.violation_id = v.id
    LEFT JOIN attendance att
      ON att.student_id IS NOT NULL
      AND (
        att.exam_id = e.id::text
        OR (att.exam_id IS NULL AND att.hall_id = e.hall_id AND DATE(att."timestamp") = e.date)
      )
    ${whereExam}
    GROUP BY e.id, e.name, e.date, e.start_time, e.end_time, e.hall_id, eh.hall_number
    ORDER BY e.date DESC, e.start_time DESC
    `,
    params
  );

  return result.rows.map(mapReport);
}

async function getReports(req, res) {
  try {
    console.log("[scope] reports", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const reports = await queryComputedReports();
    const before = reports.length;
    const filtered = filterByHallScope(reports, req.user);
    console.log("[scope] reports results", { before, after: filtered.length });
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getReportById(req, res) {
  try {
    const { id } = req.params;
    const reports = await queryComputedReports([id]);
    const row = reports[0];
    if (!row) return res.status(404).json({ error: "Report not found" });
    const hallId = normalizeReportHallId(row);
    if (hallId !== null && !canAccessHall(req.user, hallId)) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createReport(req, res) {
  res.status(405).json({ error: "Reports are generated dynamically and cannot be created manually" });
}

module.exports = { getReports, getReportById, createReport };
