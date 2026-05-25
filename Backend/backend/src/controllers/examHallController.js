// controllers/examHallController.js
const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

// ─────────────────────────────────────────────
// GET ALL EXAM HALLS
// ─────────────────────────────────────────────
async function getAllExamHalls(req, res) {
  try {
    console.log("[scope] exam_halls", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query(
      "SELECT * FROM exam_halls ORDER BY id ASC"
    );
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] exam_halls results", { before: result.rows.length, after: filtered.length });
    res.json({ exam_halls: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// GET SINGLE EXAM HALL
// ─────────────────────────────────────────────
async function getExamHallById(req, res) {
  const { id } = req.params;
  try {
    if (!canAccessHall(req.user, id)) {
      return res.status(404).json({ error: "Exam hall not found" });
    }
    const result = await pool.query(
      "SELECT * FROM exam_halls WHERE id = $1",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Exam hall not found" });
    res.json({ exam_hall: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// CREATE EXAM HALL (MANUAL)
// ─────────────────────────────────────────────
async function createExamHall(req, res) {
  const { hall_number, floor_number, capacity, location } = req.body;

  if (!hall_number || !capacity) {
    return res.status(400).json({ error: "hall_number and capacity are required" });
  }

  try {
    // Check duplicate hall number
    const exists = await pool.query(
      "SELECT id FROM exam_halls WHERE hall_number = $1",
      [hall_number]
    );
    if (exists.rows[0]) return res.status(409).json({ error: "Hall number already exists" });

    const result = await pool.query(
      `INSERT INTO exam_halls (hall_number, floor_number, capacity, location, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [hall_number, floor_number || null, capacity, location || null]
    );

    res.status(201).json({ message: "Exam hall created", exam_hall: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPDATE EXAM HALL STATUS (open / closed)
// ─────────────────────────────────────────────
async function updateExamHallStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "status is required" });
  if (!["open", "closed"].includes(status)) {
    return res.status(400).json({ error: "status must be 'open' or 'closed'" });
  }

  try {
    const result = await pool.query(
      "UPDATE exam_halls SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Exam hall not found" });
    res.json({ message: `Hall status updated to '${status}'`, exam_hall: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// DELETE EXAM HALL
// ─────────────────────────────────────────────
async function deleteExamHall(req, res) {
  const { id } = req.params;
  try {
    // Check if hall has any scheduled/active exams
    const activeExams = await pool.query(
      `SELECT id, name FROM exams
       WHERE hall_id = $1
       AND status IN ('scheduled', 'active')`,
      [id]
    );
    if (activeExams.rows[0]) {
      return res.status(409).json({
        error: `Cannot delete hall — it has an active/scheduled exam: '${activeExams.rows[0].name}'`
      });
    }

    const result = await pool.query(
      "DELETE FROM exam_halls WHERE id = $1 RETURNING id, hall_number",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Exam hall not found" });
    res.json({ message: `Exam hall '${result.rows[0].hall_number}' deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPLOAD CSV
// CSV format: hall_number,floor_number,capacity,location
// ─────────────────────────────────────────────
async function uploadExamHallCSV(req, res) {
  if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });

  const results = [];
  const errors = [];

  const stream = Readable.from(req.file.buffer.toString());

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (results.length === 0) {
    return res.status(400).json({ error: "CSV is empty or invalid" });
  }

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
      // Check duplicate
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
         VALUES ($1, $2, $3, $4, 'open')
         RETURNING *`,
        [hall_number, floor_number, capacity, location]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  res.status(201).json({
    message: `${created.length} hall(s) created, ${errors.length} skipped`,
    created,
    errors,
  });
}

module.exports = {
  getAllExamHalls,
  getExamHallById,
  createExamHall,
  updateExamHallStatus,
  deleteExamHall,
  uploadExamHallCSV,
};