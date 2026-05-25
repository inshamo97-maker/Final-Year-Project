const pool = require("../db");

async function getAllStudents() {
  const result = await pool.query("SELECT * FROM students");
  return result.rows;
}

async function getStudentById(id) {
  const result = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
  return result.rows[0];
}

module.exports = { getAllStudents, getStudentById };