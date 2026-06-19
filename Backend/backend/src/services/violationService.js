const pool = require("../db");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

const VALID_STATUSES = ["pending", "confirmed", "dismissed"];

async function getAllViolations(user) {
  const result = await pool.query("SELECT * FROM violations ORDER BY timestamp DESC");
  return filterByHallScope(result.rows, user);
}

async function getViolationById(id, user) {
  const result = await pool.query("SELECT * FROM violations WHERE id = $1", [id]);
  if (!result.rows[0]) throw new AppError("Violation not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Violation not found", 404);
  return result.rows[0];
}

async function createViolation({ type, evidence_path, confidence, camera_id, hall_id, student_id, mic_id }) {
  if (!type || !hall_id) throw new AppError("type and hall_id are required", 400);
  const result = await pool.query(
    `INSERT INTO violations (type, evidence_path, confidence, camera_id, hall_id, student_id, mic_id, status, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW()) RETURNING *`,
    [type, evidence_path ?? null, confidence ?? null, camera_id ?? null, hall_id, student_id ?? null, mic_id ?? null]
  );
  return result.rows[0];
}

async function updateViolationStatus(id, status) {
  if (!status) throw new AppError("status is required", 400);
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
  const existing = await pool.query("SELECT * FROM violations WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Violation not found", 404);
  const result = await pool.query(
    "UPDATE violations SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}

async function deleteViolation(id) {
  const existing = await pool.query("SELECT * FROM violations WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Violation not found", 404);
  await pool.query("DELETE FROM violations WHERE id = $1", [id]);
}

module.exports = {
  getAllViolations,
  getViolationById,
  createViolation,
  updateViolationStatus,
  deleteViolation,
};