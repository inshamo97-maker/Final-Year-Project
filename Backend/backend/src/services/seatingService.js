const pool = require("../db");
const AppError = require("../utils/AppError");

async function saveSeatingPlan(halls) {
  if (!halls.length) throw new AppError("halls array is required", 400);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const hall of halls) {
      const hallId = Number(hall.id);
      const examId = Number(hall.examId ?? hall.exam_id);

      if (!Number.isFinite(hallId) || !Array.isArray(hall.seats)) {
        throw new AppError("valid hall_id and seats are required", 400);
      }
      if (!Number.isFinite(examId)) {
        throw new AppError("valid exam_id is required", 400);
      }

      const exam = await client.query(
        "SELECT id FROM exams WHERE id = $1 AND hall_id = $2",
        [examId, hallId]
      );
      if (!exam.rows[0]) throw new AppError("exam_id must belong to selected hall_id", 400);

      await client.query(
        "DELETE FROM seat_allocations WHERE hall_id = $1 AND exam_id = $2",
        [hallId, examId]
      );

      const assignedStudentIds = new Set();

      for (let rowIndex = 0; rowIndex < hall.seats.length; rowIndex++) {
        const row = hall.seats[rowIndex];
        if (!Array.isArray(row)) continue;

        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const seat = row[colIndex];
          if (!seat?.studentId) continue;

          const studentId = Number(seat.studentId);
          if (!Number.isFinite(studentId) || assignedStudentIds.has(studentId)) continue;

          assignedStudentIds.add(studentId);
          await client.query(
            `INSERT INTO seat_allocations (hall_id, student_id, row_number, column_number, exam_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [hallId, studentId, rowIndex + 1, colIndex + 1, examId]
          );
        }
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { saveSeatingPlan };