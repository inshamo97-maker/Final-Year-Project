const pool = require("../db");

async function getAllStudents() {
  const result = await pool.query("SELECT * FROM students");
  return result.rows;
}

async function getStudentById(id) {
  const result = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
  return result.rows[0];
}

const pool = require("../db");

async function getAllStudents() {
  const result = await pool.query("SELECT * FROM students");
  return result.rows;
}

async function getStudentById(id) {
  const result = await pool.query(
    "SELECT * FROM students WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

// ADD THIS
async function createStudent(student) {
  const result = await pool.query(
    `
    INSERT INTO students
    (
      name,
      roll_number,
      class_level,
      program_name,
      hall_id,
      email
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      student.name,
      student.roll_number,
      student.class_level,
      student.program_name,
      student.hall_id || null,
      student.email || null
    ]
  );

  return result.rows[0];
}

// ADD THIS TOO FOR CSV uploads
async function createStudentsBulk(students) {
  for (const student of students) {
    await createStudent(student);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  createStudentsBulk
};