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