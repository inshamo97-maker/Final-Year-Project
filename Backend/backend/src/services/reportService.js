const db = require("../db");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

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
    id:                 String(row.exam_id),
    exam_id:            row.exam_id,
    hall_id:            row.hall_id,
    date:               row.date,
    exam_hall:          row.hall_number || "Unknown Hall",
    exam_name:          row.exam_name || "Exam Report",
    total_alerts:       Number(row.total_alerts || 0),
    reviewed_alerts:    Number(row.reviewed_alerts || 0),
    total_violations:   Number(row.total_violations || 0),
    attendance_count:   Number(row.attendance_count || 0),
    students_monitored: Number(row.students_monitored || 0),
    duration:           formatDuration(row.duration_seconds),
  };
}

const REPORT_SQL = `
  SELECT
    e.id AS exam_id, e.name AS exam_name, e.date, e.hall_id, eh.hall_number,
    EXTRACT(EPOCH FROM ((e.date + e.end_time) - (e.date + e.start_time))) AS duration_seconds,
    (SELECT COUNT(DISTINCT a.id) FROM ai_alerts a
     WHERE a.hall_id = e.hall_id
       AND a.timestamp BETWEEN (e.date + e.start_time) AND (e.date + e.end_time)
    ) AS total_alerts,
    (SELECT COUNT(DISTINCT a.id) FROM ai_alerts a
     WHERE a.hall_id = e.hall_id
       AND a.status IN ('confirmed','dismissed','reviewed')
       AND a.timestamp BETWEEN (e.date + e.start_time) AND (e.date + e.end_time)
    ) AS reviewed_alerts,
    (SELECT COUNT(DISTINCT v.id) FROM violations v
     WHERE v.hall_id = e.hall_id
       AND v.timestamp BETWEEN (e.date + e.start_time) AND (e.date + e.end_time)
    ) AS total_violations,
    COUNT(DISTINCT att.student_id) AS attendance_count,
    COALESCE(NULLIF(COUNT(DISTINCT sa.student_id), 0), NULLIF(COUNT(DISTINCT att.student_id), 0), 0) AS students_monitored
  FROM exams e
  LEFT JOIN exam_halls eh ON eh.id = e.hall_id
  LEFT JOIN seat_allocations sa ON sa.exam_id = e.id OR (sa.exam_id IS NULL AND sa.hall_id = e.hall_id)
  LEFT JOIN attendance att ON att.student_id IS NOT NULL
    AND (att.exam_id = e.id::text OR (att.exam_id IS NULL AND att.hall_id = e.hall_id AND att.date = e.date))
`;

async function getAllReports(user) {
  const result = await db.query(
    `${REPORT_SQL} GROUP BY e.id, e.name, e.date, e.start_time, e.end_time, e.hall_id, eh.hall_number
     ORDER BY e.date DESC, e.start_time DESC`
  );
  const reports = result.rows.map(mapReport);
  return filterByHallScope(reports, user);
}

async function getReportById(id, user) {
  const result = await db.query(
    `${REPORT_SQL} WHERE e.id = $1
     GROUP BY e.id, e.name, e.date, e.start_time, e.end_time, e.hall_id, eh.hall_number`,
    [id]
  );
  const row = result.rows[0];
  if (!row) throw new AppError("Report not found", 404);
  const report = mapReport(row);
  if (report.hall_id !== null && !canAccessHall(user, report.hall_id)) {
    throw new AppError("Report not found", 404);
  }
  return report;
}

module.exports = { getAllReports, getReportById };