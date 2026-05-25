const pool = require("../db");

async function getAllExamHalls() {
  const result = await pool.query("SELECT * FROM exam_halls");
  return result.rows;
}

module.exports = { getAllExamHalls };