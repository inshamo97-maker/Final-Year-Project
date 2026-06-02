const jwt = require("jsonwebtoken");
const pool = require("../db");

function getUserRoleFromRow(userRow) {
  if (!userRow) return null;
  if (typeof userRow.role === "string") return userRow.role.toLowerCase();
  if (userRow.is_admin === true || userRow.is_admin === "true" || userRow.is_admin === 1) return "admin";
  return "invigilator";
}

async function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Malformed token" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    // DB remains source of truth for user identity/role.
    const result = await pool.query(
      "SELECT id, name, email, phone_number, department, is_admin FROM users WHERE id = $1 LIMIT 1",
      [decoded.id]
    );
    if (!result.rows[0]) return res.status(401).json({ error: "User not found" });

    const role = getUserRoleFromRow(result.rows[0]);
    const isAdmin = role === "admin";

    let hallIds = [];
    if (!isAdmin) {
     const hallResult = await pool.query(
  "SELECT hall_id FROM users WHERE id = $1",
  [decoded.id]
);

hallIds = hallResult.rows[0]?.hall_id
  ? [hallResult.rows[0].hall_id]
  : [];
    }

    req.user = {
      ...result.rows[0],
      isAdmin,
      role,
      hallIds,
    };
    console.log("[scope] auth", { role: req.user.role, hallIds: req.user.hallIds });
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };