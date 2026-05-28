const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/halls/:hallId/seating-with-alerts", async (req, res) => {
  const { hallId } = req.params;
  const { exam_id } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT
        sa.id,
        sa.hall_id,
        sa.exam_id,
        sa.student_id,
        sa.row_number,
        sa.column_number,

        a.type,
        a.confidence,
        a.status,
        a.timestamp

      FROM seat_allocations sa
      LEFT JOIN ai_alerts a
        ON sa.hall_id = a.hall_id
        AND sa.exam_id = a.exam_id
        AND sa.student_id = a.student_id

      WHERE sa.hall_id = $1
        AND sa.exam_id = $2
      `,
      [hallId, exam_id]
    );

    const formatted = result.rows.map(r => ({
      id: `${r.row_number}-${r.column_number}`,
      row_number: r.row_number,
      column_number: r.column_number,
      student_id: r.student_id,
      registration_number: r.registration_number || null,
      alert: r.type
        ? {
            type: r.type,
            confidence: r.confidence,
            status: r.status,
            timestamp: r.timestamp
          }
        : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch seating with alerts" });
  }
});

module.exports = router;