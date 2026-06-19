const pool = require("../db");
const jwt = require("jsonwebtoken");
const { verifyPassword } = require("../utils/password");
const AppError = require("../utils/AppError");

async function login({ email, password }) {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  const user = result.rows[0];
  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const role = typeof user.role === "string"
    ? user.role.toLowerCase()
    : (user.is_admin === true || user.is_admin === "true" || user.is_admin === 1)
      ? "admin"
      : "invigilator";

  const isAdmin = role === "admin";
  let hallIds = [];

  if (!isAdmin) {
    const hallResult = await pool.query(
      "SELECT hall_id FROM invigilator_halls WHERE invigilator_id = $1 ORDER BY hall_id ASC",
      [user.id]
    );
    hallIds = hallResult.rows.map((r) => r.hall_id);
  }

  const token = jwt.sign(
    { id: user.id, role, isAdmin, hallIds },
    "your_jwt_secret",
    { expiresIn: "1h" }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role, hallIds },
  };
}

module.exports = { login };