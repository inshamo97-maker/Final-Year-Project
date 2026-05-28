const pool = require("../db");

async function getAiAlerts() {
  const result = await pool.query("SELECT * FROM ai_alerts");
  return result.rows;
}

async function updateAlertStatus(alertId, status) {
  await pool.query("UPDATE ai_alerts SET status = $1 WHERE id = $2", [status, alertId]);
}

module.exports = { getAiAlerts, updateAlertStatus };
