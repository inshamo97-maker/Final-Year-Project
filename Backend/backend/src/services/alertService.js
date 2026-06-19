const pool = require("../db");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");
const { createViolationAndAlertFromAiEvent } = require("./violationEngine");

const ALERT_JOIN = `
  SELECT
    a.*,
    COALESCE(v.type, a.type)         AS violation_type,
    COALESCE(v.hall_id, a.hall_id)   AS hall_id,
    COALESCE(v.student_id, a.student_id) AS student_id
  FROM ai_alerts a
  LEFT JOIN violations v ON a.violation_id = v.id
`;

async function getAllAlerts(user) {
  const result = await pool.query(`${ALERT_JOIN} ORDER BY a.timestamp DESC`);
  return filterByHallScope(result.rows, user);
}

async function getAlertById(id, user) {
  const result = await pool.query(`${ALERT_JOIN} WHERE a.id = $1`, [id]);
  if (!result.rows[0]) throw new AppError("Alert not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Alert not found", 404);
  return result.rows[0];
}

async function createAlert({ event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id }) {
  if (!type || !timestamp || !hall_id) {
    throw new AppError("type, timestamp, and hall_id are required", 400);
  }
  if (violation_id) {
    const v = await pool.query("SELECT * FROM violations WHERE id = $1", [violation_id]);
    if (!v.rows[0]) throw new AppError("Violation not found", 404);
  }
  const { randomUUID } = require("crypto");
  const result = await pool.query(
    `INSERT INTO ai_alerts (event_id, type, confidence, timestamp, hall_id, exam_id, student_id, violation_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
    [event_id || randomUUID(), type, confidence ?? 0, timestamp, hall_id, exam_id ?? null, student_id ?? null, violation_id ?? null]
  );
  return result.rows[0];
}

async function updateAlertStatus(id, status) {
  const VALID = ["pending", "confirmed", "dismissed"];
  if (!status) throw new AppError("status is required", 400);
  if (!VALID.includes(status)) throw new AppError("status must be pending, confirmed or dismissed", 400);

  const existing = await pool.query("SELECT * FROM ai_alerts WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Alert not found", 404);

  const alert = existing.rows[0];

  // First-time confirmation — create a violation and link it
  if (status === "confirmed" && !alert.violation_id) {
    const { violation } = await createViolationAndAlertFromAiEvent({
      event_id:   alert.event_id,
      type:       alert.type,
      confidence: alert.confidence,
      timestamp:  alert.timestamp,
      hall_id:    alert.hall_id,
      student_id: alert.student_id,
      exam_id:    alert.exam_id,
    });
    const result = await pool.query(
      "UPDATE ai_alerts SET status = $1, violation_id = $2 WHERE id = $3 RETURNING *",
      [status, violation.id, id]
    );
    return result.rows[0];
  }

  // Already has a violation — just update status
  const result = await pool.query(
    "UPDATE ai_alerts SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}

async function deleteAlert(id) {
  const existing = await pool.query("SELECT * FROM ai_alerts WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Alert not found", 404);
  await pool.query("DELETE FROM ai_alerts WHERE id = $1", [id]);
}

module.exports = {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  deleteAlert,
};
