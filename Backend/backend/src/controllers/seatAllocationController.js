const csv = require("csv-parser");
const { Readable } = require("stream");
const pool = require("../db"); // adjust if your db file name is different

exports.getSeatAllocationsByExam = async (req, res) => {
  try {
    const { examId } = req.query;

    const result = await pool.query(
      `
      SELECT 
        sa.id,
        sa.exam_id,
        sa.hall_id,
        sa.student_id,
        sa.row_number,
        sa.column_number,
        s.name,
        s.roll_number,
        s.email
      FROM seat_allocations sa
      JOIN students s ON s.id = sa.student_id
      WHERE sa.exam_id = $1
      `,
      [examId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.uploadSeatAllocationsCSV = async (req, res) => {
  try {
    console.log("🚀 CSV UPLOAD HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    // =========================
    // 1. PARSE CSV
    // =========================
    const rawRows = [];

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer.toString())
        .pipe(csv())
        .on("data", (row) => rawRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("📦 RAW ROWS COUNT:", rawRows.length);
    console.log("📦 RAW SAMPLE ROW:", rawRows[0]);

    if (!rawRows.length) {
      return res.status(400).json({ error: "CSV is empty" });
    }

    // =========================
    // 2. CLEAN ROW KEYS
    // =========================
    const rows = rawRows.map((row) => {
      const clean = {};

      for (const key in row) {
        clean[key.trim().toLowerCase()] = row[key];
      }

      return clean;
    });

    console.log("🧼 CLEAN SAMPLE ROW:", rows[0]);

    // =========================
    // 3. DETECT FORMAT
    // =========================
    const headers = Object.keys(rows[0]);

    console.log("📑 HEADERS:", headers);

    const isDetailedFormat =
      headers.includes("row_number") &&
      headers.includes("column_number");

    console.log("⚙️ isDetailedFormat =", isDetailedFormat);

    let inserted = 0;
    const errors = [];

    // =========================
    // 4. FORMAT A
    // =========================
    if (isDetailedFormat) {
      for (const [index, row] of rows.entries()) {
        console.log("\n➡️ Processing row", index + 1);
        console.log("ROW DATA:", row);

        try {
          const examId = parseInt(row.exam_id);
          const hallId = parseInt(row.hall_id);
          const rowNumber = parseInt(row.row_number);
          const columnNumber = parseInt(row.column_number);
          const registrationNumber = row.registration_number;

          console.log("🔍 PARSED VALUES:", {
            examId,
            hallId,
            rowNumber,
            columnNumber,
            registrationNumber
          });

          if (
            !examId ||
            !hallId ||
            !rowNumber ||
            !columnNumber ||
            !registrationNumber
          ) {
            console.log("❌ Missing fields detected");
            errors.push({ row: index + 1, reason: "Missing required fields" });
            continue;
          }

          // =========================
          // STUDENT LOOKUP
          // =========================
          const studentResult = await pool.query(
            `SELECT id FROM students 
             WHERE registration_number = $1 OR roll_number = $1 
             LIMIT 1`,
            [registrationNumber]
          );

          console.log("👤 STUDENT RESULT:", studentResult.rows);

          if (!studentResult.rows.length) {
            errors.push({
              row: index + 1,
              reason: `Student not found: ${registrationNumber}`
            });
            continue;
          }

          const studentId = studentResult.rows[0].id;

          // =========================
          // INSERT
          // =========================
          console.log("💾 INSERTING:", {
            examId,
            hallId,
            studentId,
            rowNumber,
            columnNumber
          });

          await pool.query(
            `INSERT INTO seat_allocations
             (exam_id, hall_id, student_id, row_number, column_number)
             VALUES ($1,$2,$3,$4,$5)`,
            [examId, hallId, studentId, rowNumber, columnNumber]
          );

          inserted++;
        } catch (err) {
          console.log("🔥 ERROR:", err.message);
          errors.push({ row: index + 1, reason: err.message });
        }
      }
    }

    // =========================
    // RESULT
    // =========================
    console.log("\n===== FINAL RESULT =====");
    console.log({ inserted, failed: errors.length, errors });

    return res.status(200).json({
      inserted,
      failed: errors.length,
      errors
    });

  } catch (err) {
    console.log("💥 FATAL ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};