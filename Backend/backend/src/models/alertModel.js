const pool = require("../db");

async function getAlerts() {
  const result = await pool.query("SELECT * FROM alerts");
  return result.rows;
}

async function updateAlertStatus(alertId, status) {
  await pool.query("UPDATE alerts SET status = $1 WHERE id = $2", [status, alertId]);
}

module.exports = { getAlerts, updateAlertStatus };