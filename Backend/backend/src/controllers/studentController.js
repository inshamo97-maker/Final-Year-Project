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
    s.photo_path,
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

function readField(row, ...names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

async function uploadStudentsCSV(req, res) {
  if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });

  const rows = [];
  const stream = Readable.from(req.file.buffer.toString());

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!rows.length) {
    return res.status(400).json({ error: "CSV is empty or invalid" });
  }

  const availableColumns = await getStudentColumns();
  const candidateFields = [
    ["name", readField],
    ["gender", readField],
    ["registration_number", (row) => readField(row, "registration_number", "roll_number", "student_id")],
    ["class_level", (row) => readField(row, "class_level", "class")],
    ["photo_path", readField],
    ["program_name", (row) => readField(row, "program_name", "program", "department")],
    ["hall_id", readField],
  ];

  const created = [];
  const errors = [];

  for (const row of rows) {
    const name = readField(row, "name");
    if (!name) {
      errors.push({ row, reason: "Missing name" });
      continue;
    }

    const columns = [];
    const values = [];

    for (const [column, resolver] of candidateFields) {
      if (!availableColumns.has(column)) continue;
      const value = resolver(row, column);
      if (value === null) continue;
      columns.push(column);
      values.push(column === "hall_id" ? Number(value) : value);
    }

    if (!columns.includes("name")) {
      columns.push("name");
      values.push(name);
    }

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");

    try {
      const result = await pool.query(
        `INSERT INTO students (${columns.join(", ")})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  res.status(201).json({
    message: `${created.length} student(s) created, ${errors.length} skipped`,
    created,
    errors,
  });
}

module.exports = { getStudentsForInvigilator, uploadStudentsCSV };
