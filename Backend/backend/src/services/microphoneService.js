const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

async function getAllMicrophones(user) {
  const result = await pool.query("SELECT * FROM microphones ORDER BY id ASC");
  return filterByHallScope(result.rows, user);
}

async function getMicrophoneById(id, user) {
  const result = await pool.query("SELECT * FROM microphones WHERE id = $1", [id]);
  if (!result.rows[0]) throw new AppError("Microphone not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Microphone not found", 404);
  return result.rows[0];
}

async function createMicrophone({ is_active, range, sensitivity, hall_id, row_number, column_number, ip_address }) {
  if (!hall_id || !row_number || !column_number) {
    throw new AppError("hall_id, row_number, and column_number are required", 400);
  }
  const result = await pool.query(
    `INSERT INTO microphones (is_active, range, sensitivity, hall_id, row_number, column_number, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [is_active ?? true, range ?? null, sensitivity ?? null, hall_id, row_number, column_number, ip_address ?? null]
  );
  return result.rows[0];
}

async function updateMicrophone(id, fields) {
  const existing = await pool.query("SELECT * FROM microphones WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Microphone not found", 404);
  const m = existing.rows[0];
  const result = await pool.query(
    `UPDATE microphones SET
      is_active     = $1,
      range         = $2,
      sensitivity   = $3,
      hall_id       = $4,
      row_number    = $5,
      column_number = $6,
      ip_address    = $7
     WHERE id = $8 RETURNING *`,
    [
      fields.is_active     ?? m.is_active,
      fields.range         ?? m.range,
      fields.sensitivity   ?? m.sensitivity,
      fields.hall_id       ?? m.hall_id,
      fields.row_number    ?? m.row_number,
      fields.column_number ?? m.column_number,
      fields.ip_address    ?? m.ip_address,
      id,
    ]
  );
  return result.rows[0];
}

async function toggleMicrophoneStatus(id) {
  const existing = await pool.query("SELECT * FROM microphones WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Microphone not found", 404);
  const newStatus = !existing.rows[0].is_active;
  const result = await pool.query(
    "UPDATE microphones SET is_active = $1 WHERE id = $2 RETURNING *",
    [newStatus, id]
  );
  return { message: `Microphone is now ${newStatus ? "active" : "inactive"}`, microphone: result.rows[0] };
}

async function deleteMicrophone(id) {
  const existing = await pool.query("SELECT * FROM microphones WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Microphone not found", 404);
  await pool.query("DELETE FROM microphones WHERE id = $1", [id]);
}

async function uploadMicrophonesCSV(fileBuffer) {
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
    const { is_active, range, sensitivity, hall_id, row_number, column_number, ip_address } = row;
    if (!hall_id || !row_number || !column_number) {
      errors.push({ row, reason: "Missing required fields" });
      continue;
    }
    try {
      await pool.query(
        `INSERT INTO microphones (is_active, range, sensitivity, hall_id, row_number, column_number, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [is_active === "true", range || null, sensitivity || null, parseInt(hall_id), parseInt(row_number), parseInt(column_number), ip_address || null]
      );
      inserted++;
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }
  return { inserted, failed: errors.length, errors };
}

module.exports = {
  getAllMicrophones,
  getMicrophoneById,
  createMicrophone,
  updateMicrophone,
  toggleMicrophoneStatus,
  deleteMicrophone,
  uploadMicrophonesCSV,
};