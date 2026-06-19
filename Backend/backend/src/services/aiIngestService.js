const pool = require("../db");
const { randomUUID } = require("crypto");
const AppError = require("../utils/AppError");

async function ingestAiAlert(payload, io) {
  const { event_id, type, confidence, timestamp, hall_id, exam_id, student_id } = payload;

  const insert = await pool.query(
    `INSERT INTO ai_alerts (event_id, type, confidence, "timestamp", hall_id, exam_id, student_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING *`,
    [event_id, type, confidence, timestamp, hall_id, exam_id ?? null, student_id ?? null]
  );

  const aiAlert =
    insert.rows.length > 0
      ? insert.rows[0]
      : (await pool.query("SELECT * FROM ai_alerts WHERE event_id = $1", [event_id])).rows[0];

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

  return aiAlert;
}

async function listAiAlerts() {
  const result = await pool.query("SELECT * FROM ai_alerts ORDER BY created_at DESC");
  return result.rows;
}

async function ingestAttendance(payload, io) {
  const { confidence, hall_id, student_id, exam_id } = payload;
  const normalizedStudentId = String(student_id);

  if (io) {
    io.to(`hall:${hall_id}`).emit("attendance", {
      student_id: normalizedStudentId,
      exam_id:    exam_id ?? null,
      hall_id,
      confidence,
      status: "present",
    });
  }

  return { notified: true, student_id: normalizedStudentId };
}

async function listAttendance(examId) {
  if (examId) {
    const result = await pool.query(
      "SELECT * FROM attendance WHERE exam_id = $1 ORDER BY created_at DESC",
      [String(examId)]
    );
    return result.rows;
  }
  const result = await pool.query("SELECT * FROM attendance ORDER BY created_at DESC");
  return result.rows;
}

async function upsertStudentEmbedding(payload) {
  const { student_id, embedding } = payload;
  const normalizedId = String(student_id);

  const result = await pool.query(
    `INSERT INTO student_embeddings (event_id, student_id, embedding, created_at, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW(), NOW())
     ON CONFLICT (student_id)
     DO UPDATE SET embedding = EXCLUDED.embedding, updated_at = NOW()
     RETURNING student_id, embedding, updated_at`,
    [randomUUID(), normalizedId, JSON.stringify(embedding)]
  );
  return result.rows[0];
}

async function listStudentEmbeddings() {
  const result = await pool.query(
    "SELECT student_id, embedding, updated_at FROM student_embeddings ORDER BY updated_at DESC"
  );
  return result.rows;
}

module.exports = {
  ingestAiAlert,
  listAiAlerts,
  ingestAttendance,
  listAttendance,
  upsertStudentEmbedding,
  listStudentEmbeddings,
};
