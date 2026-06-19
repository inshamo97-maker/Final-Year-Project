const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { hashPassword } = require("../utils/password");
const AppError = require("../utils/AppError");

let userRoleColumnsCache = null;
async function getUserRoleColumns() {
  if (userRoleColumnsCache) return userRoleColumnsCache;
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`
  );
  userRoleColumnsCache = new Set(result.rows.map((r) => r.column_name));
  return userRoleColumnsCache;
}

async function getInvigilatorWhere() {
  const cols = await getUserRoleColumns();
  const clauses = [];
  if (cols.has("role"))     clauses.push("COALESCE(LOWER(role), 'invigilator') != 'admin'");
  if (cols.has("is_admin")) clauses.push("COALESCE(is_admin, false) = false");
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

async function getAllInvigilators() {
  const where = await getInvigilatorWhere();
  const result = await pool.query(
    `SELECT id, name, email, phone_number, department, hall_id, last_login
     FROM users ${where} ORDER BY id ASC`
  );
  return result.rows;
}

async function getInvigilatorById(id) {
  const where = await getInvigilatorWhere();
  const condition = where ? `${where} AND id = $1` : "WHERE id = $1";
  const result = await pool.query(
    `SELECT id, name, email, phone_number, department, hall_id, last_login
     FROM users ${condition}`,
    [id]
  );
  if (!result.rows[0]) throw new AppError("Invigilator not found", 404);
  return result.rows[0];
}

async function createInvigilator({ name, email, password, phone_number, department, hall_id }) {
  if (!name || !email || !password) {
    throw new AppError("name, email, and password are required", 400);
  }
  const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (exists.rows[0]) throw new AppError("Email already exists", 409);

  const hashedPassword = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone_number, department, hall_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, phone_number, department, hall_id`,
    [name, email, hashedPassword, phone_number || null, department || null, hall_id || null]
  );
  return result.rows[0];
}

async function updateInvigilator(id, fields) {
  const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (!existing.rows[0]) throw new AppError("Invigilator not found", 404);

  if (fields.email && fields.email !== existing.rows[0].email) {
    const taken = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [fields.email, id]
    );
    if (taken.rows[0]) throw new AppError("Email already in use by another user", 409);
  }

  const cols = [];
  const values = [];
  let i = 1;

  for (const key of ["name", "email", "phone_number", "department", "hall_id"]) {
    if (fields[key]) { cols.push(`${key} = $${i++}`); values.push(fields[key]); }
  }
  if (fields.password) {
    cols.push(`password = $${i++}`);
    values.push(await hashPassword(fields.password));
  }

  if (!cols.length) throw new AppError("No fields provided to update", 400);

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${cols.join(", ")} WHERE id = $${i}
     RETURNING id, name, email, phone_number, department, hall_id`,
    values
  );
  return result.rows[0];
}

async function deleteInvigilator(id) {
  const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, name", [id]);
  if (!result.rows[0]) throw new AppError("Invigilator not found", 404);
  return result.rows[0];
}

async function uploadCSV(fileBuffer) {
  const results = [];
  const errors  = [];

  await new Promise((resolve, reject) => {
    Readable.from(fileBuffer.toString())
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (!results.length) throw new AppError("CSV is empty or invalid", 400);

  const created = [];

  for (const row of results) {
    const name     = row.name?.trim();
    const email    = row.email?.trim();
    const password = row.password?.trim();

    if (!name || !email || !password) {
      errors.push({ row, reason: "Missing name, email, or password" });
      continue;
    }
    try {
      const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (exists.rows[0]) { errors.push({ row, reason: "Email already exists" }); continue; }

      const hashedPassword = await hashPassword(password);
      const result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
        [name, email, hashedPassword]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  return { created, errors };
}

module.exports = {
  getAllInvigilators,
  getInvigilatorById,
  createInvigilator,
  updateInvigilator,
  deleteInvigilator,
  uploadCSV,
};