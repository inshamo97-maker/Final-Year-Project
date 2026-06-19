const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

async function getAllCameras(user) {
  const result = await pool.query("SELECT * FROM cameras ORDER BY id ASC");
  return filterByHallScope(result.rows, user);
}

async function getCameraById(id, user) {
  const result = await pool.query("SELECT * FROM cameras WHERE id = $1", [id]);
  if (!result.rows[0]) throw new AppError("Camera not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Camera not found", 404);
  return result.rows[0];
}

async function createCamera({ position, ip_address, model, hall_id, is_active }) {
  if (!position || !ip_address || !model || !hall_id) {
    throw new AppError("position, ip_address, model, and hall_id are required", 400);
  }
  const result = await pool.query(
    "INSERT INTO cameras (position, ip_address, model, hall_id, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [position, ip_address, model, hall_id, is_active ?? true]
  );
  return result.rows[0];
}

async function updateCamera(id, fields) {
  const existing = await pool.query("SELECT * FROM cameras WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Camera not found", 404);

  const cam = existing.rows[0];
  const result = await pool.query(
    `UPDATE cameras SET
      position   = $1,
      ip_address = $2,
      model      = $3,
      hall_id    = $4,
      is_active  = $5
     WHERE id = $6 RETURNING *`,
    [
      fields.position   ?? cam.position,
      fields.ip_address ?? cam.ip_address,
      fields.model      ?? cam.model,
      fields.hall_id    ?? cam.hall_id,
      fields.is_active  ?? cam.is_active,
      id,
    ]
  );
  return result.rows[0];
}

async function toggleCameraStatus(id) {
  const existing = await pool.query("SELECT * FROM cameras WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Camera not found", 404);

  const newStatus = !existing.rows[0].is_active;
  const result = await pool.query(
    "UPDATE cameras SET is_active = $1 WHERE id = $2 RETURNING *",
    [newStatus, id]
  );
  return { message: `Camera is now ${newStatus ? "active" : "inactive"}`, camera: result.rows[0] };
}

async function deleteCamera(id) {
  const existing = await pool.query("SELECT * FROM cameras WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Camera not found", 404);
  await pool.query("DELETE FROM cameras WHERE id = $1", [id]);
}

async function uploadCamerasCSV(fileBuffer) {
  const results = [];
  const errors = [];

  await new Promise((resolve, reject) => {
    Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let inserted = 0;

  for (const row of results) {
    const { position, ip_address, model, hall_id, is_active } = row;
    if (!position || !ip_address || !model || !hall_id) {
      errors.push({ row, reason: "Missing required fields" });
      continue;
    }
    try {
      await pool.query(
        "INSERT INTO cameras (position, ip_address, model, hall_id, is_active) VALUES ($1, $2, $3, $4, $5)",
        [position, ip_address, model, parseInt(hall_id), is_active === "true"]
      );
      inserted++;
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return { inserted, failed: errors.length, errors };
}

module.exports = {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  toggleCameraStatus,
  deleteCamera,
  uploadCamerasCSV,
};
