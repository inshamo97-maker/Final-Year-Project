const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");

const STUDENTS_WITH_SEATING_SQL = `
  WITH current_allocations AS (
    SELECT DISTINCT ON (sa.student_id)
      sa.student_id,
      sa.hall_id,
      sa.row_number,
      sa.column_number,
      sa.exam_id
    FROM seat_allocations sa
    LEFT JOIN exams e ON e.id = sa.exam_id
    ORDER BY
      sa.student_id,
      CASE
        WHEN sa.exam_id IS NULL THEN 0
        WHEN e.status = 'active' THEN 1
        WHEN e.status = 'scheduled' THEN 2
        ELSE 3
      END,
      e.start_time DESC NULLS LAST,
      sa.id DESC
  )
  SELECT
    s.id,
    s.name,
    s.gender,
  
    s.registration_number,
    s.class_level,
    s.program_name,
    COALESCE(ca.hall_id, s.hall_id) AS hall_id,
    ca.row_number,
    ca.column_number,
    ca.exam_id,
    eh.hall_number
  FROM students s
  LEFT JOIN current_allocations ca ON ca.student_id = s.id
  LEFT JOIN exam_halls eh ON eh.id = COALESCE(ca.hall_id, s.hall_id)
`;

async function getStudentsForInvigilator(req, res) {
  try {
    console.log("[scope] students", {
      role: req.user?.role,
      hallIds: req.user?.hallIds || []
    });

    if (req.user?.role === "invigilator") {
      const hallIds = (req.user.hallIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));

      if (!hallIds.length) return res.json([]);

     const result = await pool.query(
  `
  ${STUDENTS_WITH_SEATING_SQL}
  WHERE COALESCE(ca.hall_id, s.hall_id) = ANY($1::int[])
    AND (
      ca.exam_id IN (
        SELECT id
        FROM exams
        WHERE status IN ('active','scheduled')
      )
    )
  ORDER BY s.id ASC
  `,
  [hallIds]
);

      return res.json(result.rows);
    }

    // Admin
    const result = await pool.query(
      `
      ${STUDENTS_WITH_SEATING_SQL}
      ORDER BY s.id ASC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

let studentColumnsCache = null;
async function getStudentColumns() {
  if (studentColumnsCache) return studentColumnsCache;
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'students'`
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
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readField(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function buildStudentPayload(source) {
  const normalizedName = toNullableString(readField(source, "name", "student_name", "full_name"));
  
  const normalizedRegistrationNumber =
    toNullableString(readField(source, "registration_number", "registeration_number", "registration_no", "reg_number", "reg_no", "registration")) ||
    normalizedRollNumber;

  return {
    name: normalizedName,
    gender: toNullableString(readField(source, "gender")),
    registration_number: normalizedRegistrationNumber,
    class_level: toNullableInteger(readField(source, "class_level", "class"), "class_level"),
    program_name: toNullableString(readField(source, "program_name", "program", "department")),
    hall_id: toNullableInteger(readField(source, "hall_id", "hall"), "hall_id"),
  };
}

function buildStudentInsert(payload, availableColumns) {
  const orderedColumns = [
    "name",
    "gender",
    "registration_number",
    "class_level",
    "program_name",
    "hall_id",
  ];

  const columns = orderedColumns.filter((column) => availableColumns.has(column));
  const values = columns.map((column) => payload[column]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");

  return { columns, values, placeholders };
}

async function uploadStudentsCSV(req, res) {
  if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });

  const rows = [];
  const fileText = req.file.buffer.toString();
  const firstLine = fileText.split(/\r?\n/, 1)[0] || "";
  const separator = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
  const stream = Readable.from(fileText);

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv({ separator, mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!rows.length) {
    return res.status(400).json({ error: "CSV is empty or invalid" });
  }

  const availableColumns = await getStudentColumns();

  const created = [];
  const errors = [];

  for (const [index, row] of rows.entries()) {
    let payload;

    try {
      payload = buildStudentPayload(row);
    } catch (err) {
      errors.push({ row: index + 2, reason: err.message });
      continue;
    }

    if (!payload.name) {
      errors.push({ row, reason: "Missing name" });
      continue;
    }

    const { columns, values, placeholders } = buildStudentInsert(payload, availableColumns);

    try {
      const result = await pool.query(
        `INSERT INTO students (${columns.join(",")})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  const status = created.length ? 201 : 400;
  res.status(status).json({
    message: `${created.length} student(s) created, ${errors.length} skipped`,
    created,
    errors,
  });
}
async function addStudent(req, res) {
  try {
    const {
      name,
      gender,

      registration_number,
      class_level,
      program_name,
      hall_id,

    } = req.body;

    const normalizedName = toNullableString(name);
   
    const normalizedRegistrationNumber = toNullableString(registration_number) || normalizedRollNumber;

    if (!normalizedName) {
      return res.status(400).json({
        error: "Name is required"
      });
    }

    const availableColumns = await getStudentColumns();
    const payloadByColumn = {
      name: normalizedName,
      gender: toNullableString(gender),
      registration_number: normalizedRegistrationNumber,
      class_level: toNullableInteger(class_level, "class_level"),
      program_name: toNullableString(program_name),
      hall_id: toNullableInteger(hall_id, "hall_id"),
    };

    const { columns, values, placeholders } = buildStudentInsert(payloadByColumn, availableColumns);

    const result = await pool.query(
      `INSERT INTO students (${columns.join(",")})
      VALUES(${placeholders})
      RETURNING *`,
      values
    );

    res.status(201).json({
      message: "Student added successfully",
      student: result.rows[0]
    });

  } catch(err){
    console.error(err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message
      });
    }

    res.status(500).json({
      error:"Failed to add student"
    });
  }
}
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM students WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student deleted successfully",
      deleted: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
}
module.exports = {
    getStudentsForInvigilator,
    uploadStudentsCSV,
    addStudent,
    deleteStudent
};
