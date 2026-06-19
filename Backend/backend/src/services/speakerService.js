const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

const VALID_STATUSES = ["active", "inactive", "offline"];

async function getAllSpeakers(user) {
  const result = await pool.query("SELECT * FROM speakers ORDER BY id ASC");
  return filterByHallScope(result.rows, user);
}

async function getSpeakerById(id, user) {
  const result = await pool.query("SELECT * FROM speakers WHERE id = $1", [id]);
  if (!result.rows[0]) throw new AppError("Speaker not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Speaker not found", 404);
  return result.rows[0];
}

async function createSpeaker({ label, status, ip_address, volume_level, hall_id, last_active_timestamp }) {
  if (!label || !ip_address || !hall_id) {
    throw new AppError("label, ip_address, and hall_id are required", 400);
  }
  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
  const result = await pool.query(
    `INSERT INTO speakers (label, status, ip_address, volume_level, hall_id, last_active_timestamp)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [label, status ?? "inactive", ip_address, volume_level ?? 50, hall_id, last_active_timestamp ?? null]
  );
  return result.rows[0];
}

async function updateSpeaker(id, fields) {
  const existing = await pool.query("SELECT * FROM speakers WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Speaker not found", 404);
  if (fields.status && !VALID_STATUSES.includes(fields.status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
  const s = existing.rows[0];
  const result = await pool.query(
    `UPDATE speakers SET
      label                 = $1,
      status                = $2,
      ip_address            = $3,
      volume_level          = $4,
      hall_id               = $5,
      last_active_timestamp = $6
     WHERE id = $7 RETURNING *`,
    [
      fields.label                ?? s.label,
      fields.status               ?? s.status,
      fields.ip_address           ?? s.ip_address,
      fields.volume_level         ?? s.volume_level,
      fields.hall_id              ?? s.hall_id,
      fields.last_active_timestamp ?? s.last_active_timestamp,
      id,
    ]
  );
  return result.rows[0];
}

async function updateSpeakerStatus(id, status) {
  if (!status) throw new AppError("status is required", 400);
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }
  const existing = await pool.query("SELECT * FROM speakers WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Speaker not found", 404);
  const result = await pool.query(
    "UPDATE speakers SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
}

async function deleteSpeaker(id) {
  const existing = await pool.query("SELECT * FROM speakers WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Speaker not found", 404);
  await pool.query("DELETE FROM speakers WHERE id = $1", [id]);
}

async function uploadSpeakersCSV(fileBuffer) {
  const results = [];
  const errors  = [];

  await new Promise((resolve, reject) => {
    Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let inserted = 0;
  for (const row of results) {
    const { label, status, ip_address, volume_level, hall_id, last_active_timestamp } = row;
    if (!label || !ip_address || !hall_id) {
      errors.push({ row, reason: "Missing required fields" });
      continue;
    }
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ row, reason: `Invalid status: ${status}` });
      continue;
    }
    try {
      await pool.query(
        `INSERT INTO speakers (label, status, ip_address, volume_level, hall_id, last_active_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [label, status || "inactive", ip_address, parseInt(volume_level) || 50, parseInt(hall_id), last_active_timestamp || null]
      );
      inserted++;
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }
  return { inserted, failed: errors.length, errors };
}

module.exports = {
  getAllSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  updateSpeakerStatus,
  deleteSpeaker,
  uploadSpeakersCSV,
};