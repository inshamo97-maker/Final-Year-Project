const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

async function getAllExamHalls(user) {
  const result = await pool.query("SELECT * FROM exam_halls ORDER BY id ASC");
  return filterByHallScope(result.rows, user);
}

async function getExamHallById(id, user) {
  if (!canAccessHall(user, id)) throw new AppError("Exam hall not found", 404);
  const result = await pool.query("SELECT * FROM exam_halls WHERE id = $1", [id]);
  if (!result.rows[0]) throw new AppError("Exam hall not found", 404);
  return result.rows[0];
}

async function createExamHall({ hall_number, floor_number, capacity, location }) {
  if (!hall_number || !capacity) {
    throw new AppError("hall_number and capacity are required", 400);
  }
  const exists = await pool.query("SELECT id FROM exam_halls WHERE hall_number = $1", [hall_number]);
  if (exists.rows[0]) throw new AppError("Hall number already exists", 409);

  const result = await pool.query(
    `INSERT INTO exam_halls (hall_number, floor_number, capacity, location, status)
     VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
    [hall_number, floor_number || null, capacity, location || null]
  );
  return result.rows[0];
}

async function updateExamHallStatus(id, status) {
  if (!status) throw new AppError("status is required", 400);
  if (!["open", "closed"].includes(status)) {
    throw new AppError("status must be 'open' or 'closed'", 400);
  }
  const result = await pool.query(
    "UPDATE exam_halls SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  if (!result.rows[0]) throw new AppError("Exam hall not found", 404);
  return result.rows[0];
}

async function deleteExamHall(id) {
  const activeExams = await pool.query(
    `SELECT id, name FROM exams WHERE hall_id = $1 AND status IN ('scheduled', 'active')`,
    [id]
  );
  if (activeExams.rows[0]) {
    throw new AppError(
      `Cannot delete hall — it has an active/scheduled exam: '${activeExams.rows[0].name}'`,
      409
    );
  }
  const result = await pool.query(
    "DELETE FROM exam_halls WHERE id = $1 RETURNING id, hall_number",
    [id]
  );
  if (!result.rows[0]) throw new AppError("Exam hall not found", 404);
  return result.rows[0];
}

async function uploadExamHallCSV(fileBuffer) {
  const results = [];
  const errors  = [];

  await new Promise((resolve, reject) => {
    Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!results.length) throw new AppError("CSV is empty or invalid", 400);

  const created = [];

  for (const row of results) {
    const hall_number  = row.hall_number?.trim();
    const floor_number = row.floor_number?.trim() || null;
    const capacity     = row.capacity?.trim();
    const location     = row.location?.trim() || null;

    if (!hall_number || !capacity) {
      errors.push({ row, reason: "Missing hall_number or capacity" });
      continue;
    }

    try {
      const exists = await pool.query(
        "SELECT id FROM exam_halls WHERE hall_number = $1",
        [hall_number]
      );
      if (exists.rows[0]) {
        errors.push({ row, reason: `Hall number '${hall_number}' already exists` });
        continue;
      }

      const result = await pool.query(
        `INSERT INTO exam_halls (hall_number, floor_number, capacity, location, status)
         VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
        [hall_number, floor_number, capacity, location]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return { created, errors };
}

module.exports = {
  getAllExamHalls,
  getExamHallById,
  createExamHall,
  updateExamHallStatus,
  deleteExamHall,
  uploadExamHallCSV,
};