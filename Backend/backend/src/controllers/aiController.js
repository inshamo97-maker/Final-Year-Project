const pool = require("../db");
const { randomUUID } = require("crypto");
const { ok } = require("../utils/response");
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

  const { event_id, type, confidence, timestamp, hall_id, student_id, exam_id } = payload;

  // Python already wrote the row — just avoid crashing on duplicate
  const insert = await pool.query(
    `
    INSERT INTO ai_alerts (event_id, type, confidence, "timestamp", hall_id, exam_id, student_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING *
    `,
    [event_id, type, confidence, timestamp, hall_id, exam_id ?? null, student_id ?? null]
  );

  const aiAlert = insert.rows.length > 0
    ? insert.rows[0]
    : (await pool.query(`SELECT * FROM ai_alerts WHERE event_id = $1`, [event_id])).rows[0];

  // Fire socket event → frontend alert panel updates live
  const io = req.app.get("io");
  if (io) {
    io.to(`hall:${hall_id}`).emit("ai-alert", {
      event_id,
      type,
      confidence,
      timestamp,
      hall_id,
      exam_id:    exam_id ?? null,
      student_id: student_id ?? null,
      status:     "pending",
      alert_id:   aiAlert?.id,
    });
  }

  return ok(res, { ai_alert: aiAlert }, 201);
}

async function listAiAlerts(req, res) {
  const result = await pool.query(`SELECT * FROM ai_alerts ORDER BY created_at DESC`);
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

  /*
   * Python (attendance.py) already wrote the correct row to the attendance table.
   * This endpoint's only job is to receive that notification and fire the
   * socket event so the frontend student list updates in real time.
   * We do NOT write to DB here — that would be a duplicate with wrong columns.
   */
  const io = req.app.get("io");
  if (io) {
    io.to(`hall:${hall_id}`).emit("attendance", {
      student_id: normalizedStudentId,
      exam_id:    exam_id ?? null,
      hall_id,
      confidence,
      status: "present",
    });
  }

  return ok(res, { notified: true, student_id: normalizedStudentId }, 200);
}

async function listAttendance(req, res) {
  const result = await pool.query(`SELECT * FROM attendance ORDER BY created_at DESC`);
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
    INSERT INTO student_embeddings (event_id, student_id, embedding, created_at, updated_at)
    VALUES ($1, $2, $3::jsonb, NOW(), NOW())
    ON CONFLICT (student_id)
    DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
    RETURNING student_id, embedding, updated_at
    `,
    [randomUUID(), normalizedId, JSON.stringify(embedding)]
  );

  return ok(res, result.rows[0], 201);
}

async function listStudentEmbeddings(req, res) {
  const result = await pool.query(
    `SELECT student_id, embedding, updated_at FROM student_embeddings ORDER BY updated_at DESC`
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