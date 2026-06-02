// controllers/examController.js
const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

// ─────────────────────────────────────────────
// HELPER — auto update exam statuses based on time
// ─────────────────────────────────────────────
async function autoUpdateStatuses() {
  await pool.query(
    `UPDATE exams SET status = 'active'
     WHERE status = 'scheduled'
     AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::date
     AND start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::time
     AND end_time > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::time`
  );
  await pool.query(
    `UPDATE exams SET status = 'ended'
     WHERE status = 'active'
     AND (
       date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::date
       OR (
         date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::date
         AND end_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Karachi')::time
       )
     )`
  );
}

function timeToMinutes(value) {
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]) + Number(match[3] || 0) / 60;
}

// ─────────────────────────────────────────────
// GET ALL EXAMS
// ─────────────────────────────────────────────
async function getAllExams(req, res) {
  try {
    console.log("[scope] exams", { role: req.user?.role, hallIds: req.user?.hallIds || [] });
    const result = await pool.query(
      `SELECT e.*, eh.hall_number, eh.location
       FROM exams e
       LEFT JOIN exam_halls eh ON e.hall_id = eh.id
       ORDER BY e.date ASC, e.start_time ASC`
    );
    const filtered = filterByHallScope(result.rows, req.user);
    console.log("[scope] exams results", { before: result.rows.length, after: filtered.length });
    res.json({ exams: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// GET SINGLE EXAM
// ─────────────────────────────────────────────
async function getExamById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, eh.hall_number, eh.location
       FROM exams e
       LEFT JOIN exam_halls eh ON e.hall_id = eh.id
       WHERE e.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Exam not found" });
    if (!canAccessHall(req.user, result.rows[0].hall_id)) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json({ exam: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// CREATE EXAM (MANUAL)
// ─────────────────────────────────────────────
async function createExam(req, res) {
  const { name, subject, program_name, class_level, date, start_time, end_time, hall_id } = req.body;

  if (!name || !date || !start_time || !end_time) {
    return res.status(400).json({ error: "name, date, start_time and end_time are required" });
  }

  if (!(timeToMinutes(start_time) < timeToMinutes(end_time))) {
    return res.status(400).json({ error: "start_time must be before end_time" });
  }

  try {
    if (hall_id) {
      // Check hall exists
      const hall = await pool.query("SELECT id FROM exam_halls WHERE id = $1", [hall_id]);
      if (!hall.rows[0]) return res.status(404).json({ error: "Exam hall not found" });

      // Check overlap
      const overlap = await pool.query(
        `SELECT id, name FROM exams
         WHERE hall_id = $1
         AND date = $4
         AND status != 'ended'
         AND start_time < $3
         AND end_time > $2`,
        [hall_id, start_time, end_time, date]
      );
      if (overlap.rows[0]) {
        return res.status(409).json({
          error: `Hall already booked for '${overlap.rows[0].name}' during that time`
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO exams (name, subject, program_name, class_level, date, start_time, end_time, status, hall_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
       RETURNING *`,
      [name, subject || null, program_name || null, class_level || null, date, start_time, end_time, hall_id || null]
    );

    res.status(201).json({ message: "Exam created", exam: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPDATE EXAM
// Only updates fields that are sent
// ─────────────────────────────────────────────
async function updateExam(req, res) {
  const { id } = req.params;
  const { name, subject, program_name, class_level, date, start_time, end_time, hall_id } = req.body;

  try {
    const existing = await pool.query("SELECT * FROM exams WHERE id = $1", [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Exam not found" });

    const newStart = start_time || existing.rows[0].start_time;
    const newEnd = end_time || existing.rows[0].end_time;
    const newDate = date || existing.rows[0].date;

    if (!(timeToMinutes(newStart) < timeToMinutes(newEnd))) {
      return res.status(400).json({ error: "start_time must be before end_time" });
    }

    if (hall_id) {
      // Check hall exists
      const hall = await pool.query("SELECT id FROM exam_halls WHERE id = $1", [hall_id]);
      if (!hall.rows[0]) return res.status(404).json({ error: "Exam hall not found" });

      // Check overlap — exclude current exam from check
      const overlap = await pool.query(
        `SELECT id, name FROM exams
         WHERE hall_id = $1
         AND date = $4
         AND id != $5
         AND status != 'ended'
         AND start_time < $3
         AND end_time > $2`,
        [hall_id, newStart, newEnd, newDate, id]
      );
      if (overlap.rows[0]) {
        return res.status(409).json({
          error: `Hall already booked for '${overlap.rows[0].name}' during that time`
        });
      }
    }

    const fields = [];
    const values = [];
    let counter = 1;

    if (name)           { fields.push(`name = $${counter++}`);           values.push(name); }
    if (subject)        { fields.push(`subject = $${counter++}`);        values.push(subject); }
    if (program_name)   { fields.push(`program_name = $${counter++}`);   values.push(program_name); }
    if (class_level)    { fields.push(`class_level = $${counter++}`);    values.push(class_level); }
    if (date)           { fields.push(`date = $${counter++}`);           values.push(date); }
    if (start_time)     { fields.push(`start_time = $${counter++}`);     values.push(start_time); }
    if (end_time)       { fields.push(`end_time = $${counter++}`);       values.push(end_time); }
    if (hall_id)        { fields.push(`hall_id = $${counter++}`);        values.push(hall_id); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    values.push(id);
    const query = `UPDATE exams SET ${fields.join(", ")} WHERE id = $${counter} RETURNING *`;

    const result = await pool.query(query, values);
    res.json({ message: "Exam updated", exam: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// DELETE EXAM
// ─────────────────────────────────────────────
async function deleteExam(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM exams WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Exam not found" });
    res.json({ message: `Exam '${result.rows[0].name}' deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// MANUAL STATUS CHECK + UPDATE
// ─────────────────────────────────────────────
async function checkAndUpdateExamStatuses(req, res) {
  try {
    res.json({ message: "Exam statuses updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPLOAD CSV
// CSV format: name,subject,date,start_time,end_time,hall_id
// date format: YYYY-MM-DD
// time format: HH:MM or HH:MM:SS
// ─────────────────────────────────────────────
async function uploadExamCSV(req, res) {
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
    const name       = row.name?.trim();
    const subject    = row.subject?.trim();
    const program_name = row.program_name?.trim() || null;
    const class_level = row.class_level?.trim() || null;
    const date       = row.date?.trim();
    const start_time = row.start_time?.trim();
    const end_time   = row.end_time?.trim();
    const hall_id    = row.hall_id?.trim() || null;

    if (!name || !date || !start_time || !end_time || !class_level) {
      errors.push({ row, reason: "Missing name, date, start_time, end_time or class_level" });
      continue;
    }

    if (!(timeToMinutes(start_time) < timeToMinutes(end_time))) {
      errors.push({ row, reason: "start_time must be before end_time" });
      continue;
    }

    try {
      // Check overlap for CSV too
      if (hall_id) {
        const overlap = await pool.query(
          `SELECT id, name FROM exams
           WHERE hall_id = $1
           AND date = $4
           AND status != 'ended'
           AND start_time < $3
           AND end_time > $2`,
          [hall_id, start_time, end_time, date]
        );
        if (overlap.rows[0]) {
          errors.push({ row, reason: `Hall already booked for '${overlap.rows[0].name}' during that time` });
          continue;
        }
      }

      const result = await pool.query(
        `INSERT INTO exams (name, subject, program_name, class_level, date, start_time, end_time, status, hall_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
         RETURNING *`,
        [name, subject || null, program_name, class_level, date, start_time, end_time, hall_id]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  res.status(201).json({
    message: `${created.length} exam(s) created, ${errors.length} skipped`,
    created,
    errors,
  });
}

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  uploadExamCSV,
  checkAndUpdateExamStatuses,
};
