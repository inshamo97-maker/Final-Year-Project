const pool = require("../db");
const { randomUUID } = require("crypto");
const { ok } = require("../utils/response");
const { createViolationAndAlertFromAiEvent } = require("../services/violationEngine");
const { aiAlertSchema, attendanceSchema, embeddingSchema } = require("../validation/aiSchemas");

function normalizeZodError(err) {
  if (!err?.issues) return err;
  const message = err.issues
    .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
    .join("; ");
  const e = new Error(message);
  e.status = 422;
  return e;
}

async function ingestAiAlert(req, res) {
  let payload;

  try {
    payload = aiAlertSchema.parse(req.body);
  } catch (e) {
    throw normalizeZodError(e);
  }

  const {
    event_id,
    type,
    confidence,
    timestamp,
    hall_id,
    student_id,
    exam_id
  } = payload;

  const isUnknownFace = !student_id || type === "unknown_face";

  const insert = await pool.query(
    `
    INSERT INTO ai_alerts (event_id, type, confidence, "timestamp", hall_id, exam_id, student_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING *
    `,
    [event_id, type, confidence, timestamp, hall_id, exam_id ?? null, student_id ?? null]
  );

  if (insert.rows.length === 0) {
    const existing = await pool.query(
      `SELECT * FROM ai_alerts WHERE event_id = $1`,
      [event_id]
    );

    return ok(res, {
      duplicate: true,
      ai_alert: existing.rows[0]
    }, 200);
  }

  const aiAlert = insert.rows[0];

  const { violation, severity, status } =
    await createViolationAndAlertFromAiEvent({
      event_id,
      type,
      confidence,
      timestamp,
      hall_id,
      student_id,
      exam_id,
    });

  const updatedAlert = await pool.query(
    `UPDATE ai_alerts SET violation_id = $1 WHERE event_id = $2 RETURNING *`,
    [violation.id, event_id]
  );
  const alert = updatedAlert.rows[0] || aiAlert;

  const io = req.app.get("io");

  if (io) {
    io.to(`hall:${hall_id}`).emit("ai-alert", {
      event_id,
      type,
      confidence,
      timestamp,
      hall_id,
      exam_id: exam_id ?? null,
      student_id: student_id ?? null,
      severity: isUnknownFace ? "high" : severity,
      status: alert.status || "pending",
      violation_id: violation.id,
      alert_id: alert.id,
    });
  }

  return ok(res, {
    ai_alert: alert,
    violation,
    alert,
    severity,
    status
  }, 201);
}

async function listAiAlerts(req, res) {
  const result = await pool.query(
    `
    SELECT *
    FROM ai_alerts
    ORDER BY created_at DESC
    `
  );
  return ok(res, result.rows, 200);
}

async function ingestAttendance(req, res) {
  let payload;

  try {
    payload = attendanceSchema.parse(req.body);
  } catch (e) {
    throw normalizeZodError(e);
  }

  const { confidence, hall_id, student_id, exam_id } = payload;

  const normalizedStudentId = String(student_id);

  const result = await pool.query(
    `
    INSERT INTO attendance (
      event_id,
      type,
      confidence,
      "timestamp",
      hall_id,
      exam_id,
      student_id,
      created_at
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW(),
      $4,
      $5,
      $6,
      NOW()
    )
    ON CONFLICT (event_id) DO NOTHING
    RETURNING *
    `,
    [
      randomUUID(),
      "face_recognition",
      confidence,
      hall_id,
      exam_id ?? null,
      normalizedStudentId
    ]
  );

  const io = req.app.get("io");

  if (result.rows.length > 0 && io) {
    io.to(`hall:${hall_id}`).emit("attendance", {
      student_id: normalizedStudentId,
      exam_id,
      hall_id,
      confidence,
      status: "present",
    });
  }

  return ok(res, {
    inserted: result.rows.length > 0,
    attendance: result.rows[0] || null,
  }, 201);
}
async function listAttendance(req, res) {
  const result = await pool.query(
    `
    SELECT *
    FROM attendance
    ORDER BY created_at DESC
    `
  );
  return ok(res, result.rows, 200);
}

async function upsertStudentEmbedding(req, res) {
  let payload;

  try {
    payload = embeddingSchema.parse(req.body);
  } catch (e) {
    throw normalizeZodError(e);
  }

  const { student_id, embedding } = payload;

  const normalizedId = String(student_id);

  const result = await pool.query(
    `
    INSERT INTO student_embeddings (
      event_id,
      student_id,
      embedding,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (student_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
    RETURNING student_id, embedding, updated_at
    `,
    [
      randomUUID(),
      normalizedId,
      JSON.stringify(embedding)
    ]
  );

  return ok(res, result.rows[0], 201);
}
async function listStudentEmbeddings(req, res) {
  const result = await pool.query(
    `
    SELECT student_id, embedding, updated_at
    FROM student_embeddings
    ORDER BY updated_at DESC
    `
  );
  return ok(res, result.rows, 200);
}

module.exports = {
  ingestAiAlert,
  listAiAlerts,
  ingestAttendance,
  listAttendance,
  upsertStudentEmbedding,
  listStudentEmbeddings,
};
