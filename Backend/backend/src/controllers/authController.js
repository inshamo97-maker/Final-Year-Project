// controllers/authController.js
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { verifyPassword } = require("../utils/password");

async function getUserRoleFromRow(userRow) {
  if (!userRow) return null;
  if (typeof userRow.role === "string") return userRow.role.toLowerCase();
  if (userRow.is_admin === true || userRow.is_admin === "true" || userRow.is_admin === 1) return "admin";
  return "invigilator";
}

async function login(req, res) {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Supports bcrypt hashes and legacy plaintext values.
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const role = await getUserRoleFromRow(user);
    const isAdmin = role === "admin";
    let hallIds = [];

    if (!isAdmin) {
      const hallResult = await pool.query(
        "SELECT hall_id FROM invigilator_halls WHERE invigilator_id = $1 ORDER BY hall_id ASC",
        [user.id]
      );
      hallIds = hallResult.rows.map((r) => r.hall_id);
    }

    const token = jwt.sign({ id: user.id, role, isAdmin, hallIds }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role, hallIds },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { login };