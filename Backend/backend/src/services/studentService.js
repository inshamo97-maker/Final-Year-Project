const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");

const STUDENTS_WITH_SEATING_SQL = `
  WITH current_allocations AS (
    SELECT DISTINCT ON (sa.student_id)
      sa.student_id, sa.hall_id, sa.row_number, sa.column_number, sa.exam_id
    FROM seat_allocations sa
    LEFT JOIN exams e ON e.id = sa.exam_id
    ORDER BY sa.student_id,
      CASE WHEN sa.exam_id IS NULL THEN 0 WHEN e.status = 'active' THEN 1 WHEN e.status = 'scheduled' THEN 2 ELSE 3 END,
      e.start_time DESC NULLS LAST, sa.id DESC
  )
  SELECT s.id, s.name, s.gender, s.registration_number, s.class_level, s.program_name,
    COALESCE(ca.hall_id, s.hall_id) AS hall_id,
    ca.row_number, ca.column_number, ca.exam_id, eh.hall_number
  FROM students s
  LEFT JOIN current_allocations ca ON ca.student_id = s.id
  LEFT JOIN exam_halls eh ON eh.id = COALESCE(ca.hall_id, s.hall_id)
`;

async function getStudentsForInvigilator(user) {
  if (user?.role === "invigilator") {
    const hallIds = (user.hallIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!hallIds.length) return [];
    const result = await pool.query(
      `${STUDENTS_WITH_SEATING_SQL}
       WHERE COALESCE(ca.hall_id, s.hall_id) = ANY($1::int[])
       ORDER BY s.id ASC`,
      [hallIds]
    );
    return result.rows;
  }
  const result = await pool.query(`${STUDENTS_WITH_SEATING_SQL} ORDER BY s.id ASC`);
  return result.rows;
}

let studentColumnsCache = null;
async function getStudentColumns() {
  if (studentColumnsCache) return studentColumnsCache;
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'students'`
  );
  studentColumnsCache = new Set(result.rows.map((r) => r.column_name));
  return studentColumnsCache;
}

function toNullableString(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toNullableInteger(value, fieldName) {
  const text = toNullableString(value);
  if (text === null) return null;
  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    const error = new Error(`${fieldName} must be a whole number`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
}

function readField(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return null;
}

function buildStudentPayload(source) {
  return {
    name:                toNullableString(readField(source, "name", "student_name", "full_name")),
    gender:              toNullableString(readField(source, "gender")),
    registration_number: toNullableString(readField(source, "registration_number", "registeration_number", "registration_no", "reg_number", "reg_no", "registration")),
    class_level:         toNullableInteger(readField(source, "class_level", "class"), "class_level"),
    program_name:        toNullableString(readField(source, "program_name", "program", "department")),
    hall_id:             toNullableInteger(readField(source, "hall_id", "hall"), "hall_id"),
  };
}

function buildStudentInsert(payload, availableColumns) {
  const ordered = ["name", "gender", "registration_number", "class_level", "program_name", "hall_id"];
  const columns = ordered.filter((c) => availableColumns.has(c));
  const values  = columns.map((c) => payload[c]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(",");
  return { columns, values, placeholders };
}

async function addStudent(body) {
  const { name, gender, registration_number, class_level, program_name, hall_id } = body;
  const normalizedName = toNullableString(name);
  if (!normalizedName) throw new AppError("Name is required", 400);

  const availableColumns = await getStudentColumns();
  const payload = {
    name:                normalizedName,
    gender:              toNullableString(gender),
    registration_number: toNullableString(registration_number),
    class_level:         toNullableInteger(class_level, "class_level"),
    program_name:        toNullableString(program_name),
    hall_id:             toNullableInteger(hall_id, "hall_id"),
  };

  const { columns, values, placeholders } = buildStudentInsert(payload, availableColumns);
  const result = await pool.query(
    `INSERT INTO students (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
}

async function deleteStudent(id) {
  // Remove dependent rows first to avoid FK constraint errors
  await pool.query("DELETE FROM seat_allocations WHERE student_id = $1", [id]);
  await pool.query("DELETE FROM attendance WHERE student_id = $1", [id]);

  const result = await pool.query("DELETE FROM students WHERE id = $1 RETURNING *", [id]);
  if (!result.rowCount) throw new AppError("Student not found", 404);
  return result.rows[0];
}

async function uploadStudentsCSV(fileBuffer) {
  const rows = [];
  const fileText  = fileBuffer.toString();
  const firstLine = fileText.split(/\r?\n/, 1)[0] || "";
  const separator = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";

  await new Promise((resolve, reject) => {
    Readable.from(fileText)
      .pipe(csv({ separator, mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!rows.length) throw new AppError("CSV is empty or invalid", 400);

  const availableColumns = await getStudentColumns();
  const created = [];
  const errors  = [];

  for (const [index, row] of rows.entries()) {
    let payload;
    try {
      payload = buildStudentPayload(row);
    } catch (err) {
      errors.push({ row: index + 2, reason: err.message });
      continue;
    }
    if (!payload.name) { errors.push({ row, reason: "Missing name" }); continue; }

    const { columns, values, placeholders } = buildStudentInsert(payload, availableColumns);
    try {
      const result = await pool.query(
        `INSERT INTO students (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return { created, errors };
}

module.exports = {
  getStudentsForInvigilator,
  addStudent,
  deleteStudent,
  uploadStudentsCSV,
};