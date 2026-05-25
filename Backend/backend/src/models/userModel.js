const pool = require("../db");

async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

async function getUserById(id) {
  const result = await pool.query(
    "SELECT id, name, email, phone_number, department, last_login FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

module.exports = { getUserByEmail, getUserById };