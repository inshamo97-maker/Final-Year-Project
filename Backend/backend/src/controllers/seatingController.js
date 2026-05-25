const pool = require("../db");

async function saveSeatingPlan(req, res) {
  const halls = Array.isArray(req.body?.halls) ? req.body.halls : [];

  if (!halls.length) {
    return res.status(400).json({ error: "halls array is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const hall of halls) {
      const hallId = Number(hall.id);
      if (!Number.isFinite(hallId) || !Array.isArray(hall.seats)) continue;

      const examId = Number(hall.examId ?? hall.exam_id);
      const targetExamId = Number.isFinite(examId) ? examId : null;
      const assignedStudentIds = new Set();

      if (targetExamId === null) {
        await client.query(
          "DELETE FROM seat_allocations WHERE hall_id = $1 AND exam_id IS NULL",
          [hallId]
        );
      } else {
        await client.query(
          "DELETE FROM seat_allocations WHERE hall_id = $1 AND exam_id = $2",
          [hallId, targetExamId]
        );
      }

      for (let rowIndex = 0; rowIndex < hall.seats.length; rowIndex += 1) {
        const row = hall.seats[rowIndex];
        if (!Array.isArray(row)) continue;

        for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
          const seat = row[colIndex];
          if (!seat?.studentId) continue;

          const studentId = Number(seat.studentId);
          if (!Number.isFinite(studentId) || assignedStudentIds.has(studentId)) continue;

          assignedStudentIds.add(studentId);
          await client.query(
            `
            INSERT INTO seat_allocations
              (hall_id, student_id, row_number, column_number, exam_id)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [hallId, studentId, rowIndex + 1, colIndex + 1, targetExamId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to save seating plan" });
  } finally {
    client.release();
  }
}

module.exports = { saveSeatingPlan };
