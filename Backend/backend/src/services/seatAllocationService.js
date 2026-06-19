const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const AppError = require("../utils/AppError");

async function getSeatAllocationsByExam(examId) {
  const result = await pool.query(
    `SELECT sa.id, sa.exam_id, sa.hall_id, sa.student_id, sa.row_number, sa.column_number,
            s.name, s.roll_number, s.email
     FROM seat_allocations sa
     JOIN students s ON s.id = sa.student_id
     WHERE sa.exam_id = $1`,
    [examId]
  );
  return result.rows;
}

async function uploadSeatAllocationsCSV(fileBuffer) {
  const rawRows = [];

  await new Promise((resolve, reject) => {
    Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", (row) => rawRows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!rawRows.length) throw new AppError("CSV is empty", 400);

  const rows = rawRows.map((row) => {
    const clean = {};
    for (const key in row) clean[key.trim().toLowerCase()] = row[key];
    return clean;
  });

  const headers = Object.keys(rows[0]);
  const isDetailedFormat = headers.includes("row_number") && headers.includes("column_number");
  if (!isDetailedFormat) throw new AppError("CSV must include row_number and column_number columns", 400);

  let inserted = 0;
  const errors = [];

  for (const [index, row] of rows.entries()) {
    const examId             = parseInt(row.exam_id);
    const hallId             = parseInt(row.hall_id);
    const rowNumber          = parseInt(row.row_number);
    const columnNumber       = parseInt(row.column_number);
    const registrationNumber = row.registration_number;

    if (!examId || !hallId || !rowNumber || !columnNumber || !registrationNumber) {
      errors.push({ row: index + 1, reason: "Missing required fields" });
      continue;
    }

    try {
      const studentResult = await pool.query(
        `SELECT id FROM students WHERE registration_number = $1 OR roll_number = $1 LIMIT 1`,
        [registrationNumber]
      );
      if (!studentResult.rows.length) {
        errors.push({ row: index + 1, reason: `Student not found: ${registrationNumber}` });
        continue;
      }

      await pool.query(
        `INSERT INTO seat_allocations (exam_id, hall_id, student_id, row_number, column_number)
         VALUES ($1, $2, $3, $4, $5)`,
        [examId, hallId, studentResult.rows[0].id, rowNumber, columnNumber]
      );
      inserted++;
    } catch (err) {
      errors.push({ row: index + 1, reason: err.message });
    }
  }

  return { inserted, failed: errors.length, errors };
}

module.exports = { getSeatAllocationsByExam, uploadSeatAllocationsCSV };