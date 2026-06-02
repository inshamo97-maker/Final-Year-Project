// controllers/invigilatorController.js
const pool = require("../db");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { hashPassword } = require("../utils/password");

let userRoleColumnsCache = null;
async function getUserRoleColumns() {
  if (userRoleColumnsCache) return userRoleColumnsCache;
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'users'`
  );
  userRoleColumnsCache = new Set(result.rows.map((r) => r.column_name));
  return userRoleColumnsCache;
}

async function getInvigilatorFilterSql(startParam = 1) {
  const cols = await getUserRoleColumns();
  const clauses = [];
  if (cols.has("role")) clauses.push("COALESCE(LOWER(role), 'invigilator') != 'admin'");
  if (cols.has("is_admin")) clauses.push("COALESCE(is_admin, false) = false");
  return clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
}

// ─────────────────────────────────────────────
// GET ALL INVIGILATORS
// ─────────────────────────────────────────────
async function getAllInvigilators(req, res) {
  try {
    const where = await getInvigilatorFilterSql();
    const result = await pool.query(
      `SELECT id, name, email, phone_number, department, hall_id, last_login
       FROM users
       ${where}
       ORDER BY id ASC`
    );
    res.json({ invigilators: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// GET SINGLE INVIGILATOR
// ─────────────────────────────────────────────
async function getInvigilatorById(req, res) {
  const { id } = req.params;
  try {
    const where = await getInvigilatorFilterSql();
    const andFilter = where ? `${where} AND id = $1` : " WHERE id = $1";
    const result = await pool.query(
      `SELECT id, name, email, phone_number, department, hall_id, last_login
       FROM users
       ${andFilter}`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Invigilator not found" });
    res.json({ invigilator: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// CREATE INVIGILATOR (MANUAL)
// ─────────────────────────────────────────────
async function createInvigilator(req, res) {
 const {
  name,
  email,
  password,
  phone_number,
  department,
  hall_id
} = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows[0]) return res.status(409).json({ error: "Email already exists" });

    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (name,email,password,phone_number,department,hall_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone_number, department, hall_id`,
      [name, email, hashedPassword, phone_number || null, department || null, hall_id || null]
    );

    res.status(201).json({ message: "Invigilator created", invigilator: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPDATE INVIGILATOR
// Only updates fields that are actually sent
// ─────────────────────────────────────────────
async function updateInvigilator(req, res) {
  const { id } = req.params;
  const { name, email, password, phone_number, department ,hall_id} = req.body;

  try {
    const existing = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Invigilator not found" });

    // Check email not taken by someone else
    if (email && email !== existing.rows[0].email) {
      const emailTaken = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (emailTaken.rows[0]) return res.status(409).json({ error: "Email already in use by another user" });
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let counter = 1;

    if (name)         { fields.push(`name = $${counter++}`);         values.push(name); }
    if (email)        { fields.push(`email = $${counter++}`);        values.push(email); }
    if (phone_number) { fields.push(`phone_number = $${counter++}`); values.push(phone_number); }
    if (department)   { fields.push(`department = $${counter++}`);   values.push(department); }
    if (hall_id)      { fields.push(`hall_id = $${counter++}`);      values.push(hall_id); }

    if (password) {
      const hashed = await hashPassword(password);
      fields.push(`password = $${counter++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${counter} RETURNING id, name, email, phone_number, department, hall_id`;

    const result = await pool.query(query, values);
    res.json({ message: "Invigilator updated", invigilator: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// DELETE INVIGILATOR
// ─────────────────────────────────────────────
async function deleteInvigilator(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Invigilator not found" });
    res.json({ message: `Invigilator '${result.rows[0].name}' deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─────────────────────────────────────────────
// UPLOAD CSV
// CSV format: name,email,password
// ─────────────────────────────────────────────
async function uploadCSV(req, res) {
  if (!req.file) return res.status(400).json({ error: "No CSV file uploaded" });

  const results = [];
  const errors = [];

  const stream = Readable.from(req.file.buffer.toString());

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  if (results.length === 0) {
    return res.status(400).json({ error: "CSV is empty or invalid" });
  }

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
      if (exists.rows[0]) {
        errors.push({ row, reason: "Email already exists" });
        continue;
      }

      const hashedPassword = await hashPassword(password);
      const result = await pool.query(
        `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
        [name, email, hashedPassword]
      );
      created.push(result.rows[0]);
    } catch (err) {
      errors.push({ row, reason: err.message });
    }
  }

  res.status(201).json({
    message: `${created.length} invigilator(s) created, ${errors.length} skipped`,
    created,
    errors,
  });
}

module.exports = {
  getAllInvigilators,
  getInvigilatorById,
  createInvigilator,
  updateInvigilator,
  deleteInvigilator,
  uploadCSV,
};