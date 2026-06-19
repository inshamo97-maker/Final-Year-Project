const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");
const { filterByHallScope, canAccessHall } = require("../utils/hallScope");

function timeToMinutes(value) {
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]) + Number(match[3] || 0) / 60;
}



async function getAllExams(user) {
  const result = await pool.query(
    `SELECT e.*, eh.hall_number, eh.location
     FROM exams e
     LEFT JOIN exam_halls eh ON e.hall_id = eh.id
     ORDER BY e.date ASC, e.start_time ASC`
  );
  return filterByHallScope(result.rows, user);
}

async function getExamById(id, user) {
  const result = await pool.query(
    `SELECT e.*, eh.hall_number, eh.location
     FROM exams e
     LEFT JOIN exam_halls eh ON e.hall_id = eh.id
     WHERE e.id = $1`,
    [id]
  );
  if (!result.rows[0]) throw new AppError("Exam not found", 404);
  if (!canAccessHall(user, result.rows[0].hall_id)) throw new AppError("Exam not found", 404);
  return result.rows[0];
}

async function createExam({ name, subject, program_name, class_level, date, start_time, end_time, hall_id }) {
  if (!name || !date || !start_time || !end_time) {
    throw new AppError("name, date, start_time and end_time are required", 400);
  }
  if (!(timeToMinutes(start_time) < timeToMinutes(end_time))) {
    throw new AppError("start_time must be before end_time", 400);
  }

  if (hall_id) {
    const hall = await pool.query("SELECT id FROM exam_halls WHERE id = $1", [hall_id]);
    if (!hall.rows[0]) throw new AppError("Exam hall not found", 404);

    const overlap = await pool.query(
      `SELECT id, name FROM exams
       WHERE hall_id = $1 AND date = $4 AND status != 'ended'
       AND start_time < $3 AND end_time > $2`,
      [hall_id, start_time, end_time, date]
    );
    if (overlap.rows[0]) {
      throw new AppError(`Hall already booked for '${overlap.rows[0].name}' during that time`, 409);
    }
  }

  const result = await pool.query(
    `INSERT INTO exams (name, subject, program_name, class_level, date, start_time, end_time, status, hall_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8) RETURNING *`,
    [name, subject || null, program_name || null, class_level || null, date, start_time, end_time, hall_id || null]
  );
  return result.rows[0];
}

async function updateExam(id, fields) {
  const existing = await pool.query("SELECT * FROM exams WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Exam not found", 404);

  const current = existing.rows[0];
  const newStart = fields.start_time || current.start_time;
  const newEnd   = fields.end_time   || current.end_time;
  const newDate  = fields.date       || current.date;

  if (!(timeToMinutes(newStart) < timeToMinutes(newEnd))) {
    throw new AppError("start_time must be before end_time", 400);
  }

  if (fields.hall_id) {
    const hall = await pool.query("SELECT id FROM exam_halls WHERE id = $1", [fields.hall_id]);
    if (!hall.rows[0]) throw new AppError("Exam hall not found", 404);

    const overlap = await pool.query(
      `SELECT id, name FROM exams
       WHERE hall_id = $1 AND date = $4 AND id != $5 AND status != 'ended'
       AND start_time < $3 AND end_time > $2`,
      [fields.hall_id, newStart, newEnd, newDate, id]
    );
    if (overlap.rows[0]) {
      throw new AppError(`Hall already booked for '${overlap.rows[0].name}' during that time`, 409);
    }
  }

  const cols = [];
  const values = [];
  let i = 1;

  const allowed = ["name", "subject", "program_name", "class_level", "date", "start_time", "end_time", "hall_id"];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      cols.push(`${key} = $${i++}`);
      values.push(fields[key]);
    }
  }

  if (!cols.length) throw new AppError("No fields provided to update", 400);

  values.push(id);
  const result = await pool.query(
    `UPDATE exams SET ${cols.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function deleteExam(id) {
  const { rows: violationRows } = await pool.query(
    "SELECT COUNT(*) FROM violations WHERE exam_id = $1", [id]
  );
  const { rows: attendanceRows } = await pool.query(
    "SELECT COUNT(*) FROM attendance WHERE exam_id = $1", [id]
  );

  if (Number(violationRows[0].count) > 0 || Number(attendanceRows[0].count) > 0) {
    throw new AppError(
      "Cannot delete exam with recorded violations or attendance. Resolve or archive these records first.",
      409
    );
  }

  const result = await pool.query("DELETE FROM exams WHERE id = $1 RETURNING id, name", [id]);
  if (!result.rows[0]) throw new AppError("Exam not found", 404);
  return result.rows[0];
}

async function uploadExamCSV(fileBuffer) {
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
    const name         = row.name?.trim();
    const subject      = row.subject?.trim();
    const program_name = row.program_name?.trim() || null;
    const class_level  = row.class_level?.trim() || null;
    const date         = row.date?.trim();
    const start_time   = row.start_time?.trim();
    const end_time     = row.end_time?.trim();
    const hall_id      = row.hall_id?.trim() || null;

    if (!name || !date || !start_time || !end_time || !class_level) {
      errors.push({ row, reason: "Missing name, date, start_time, end_time or class_level" });
      continue;
    }
    if (!(timeToMinutes(start_time) < timeToMinutes(end_time))) {
      errors.push({ row, reason: "start_time must be before end_time" });
      continue;
    }

    try {
      if (hall_id) {
        const overlap = await pool.query(
          `SELECT id, name FROM exams
           WHERE hall_id = $1 AND date = $4 AND status != 'ended'
           AND start_time < $3 AND end_time > $2`,
          [hall_id, start_time, end_time, date]
        );
        if (overlap.rows[0]) {
          errors.push({ row, reason: `Hall already booked for '${overlap.rows[0].name}' during that time` });
          continue;
        }
      }

      const result = await pool.query(
        `INSERT INTO exams (name, subject, program_name, class_level, date, start_time, end_time, status, hall_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8) RETURNING *`,
        [name, subject || null, program_name, class_level, date, start_time, end_time, hall_id]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return { created, errors };
}

module.exports = {

  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  uploadExamCSV,
};