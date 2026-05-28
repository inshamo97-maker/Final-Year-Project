const pool = require("../db");

function computeSeverity(type, confidence) {
  const normalized = String(type || "").toLowerCase();
  const base =
    normalized.includes("imperson") || normalized.includes("phone") || normalized.includes("multiple")
      ? "high"
      : normalized.includes("head") || normalized.includes("look") || normalized.includes("gaze")
        ? "medium"
        : "low";

  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return base === "high" ? "high" : "medium";
  return base === "high" ? "medium" : "low";
}

function computeInitialStatus(severity, confidence) {
  if (severity === "high" && confidence >= 0.9) return "confirmed";
  return "pending";
}

let cachedViolationColumns = null;
async function getViolationColumns() {
  if (cachedViolationColumns) return cachedViolationColumns;
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'violations'
    `
  );
  cachedViolationColumns = new Set(result.rows.map((r) => r.column_name));
  return cachedViolationColumns;
}

async function createViolationAndAlertFromAiEvent({
  type,
  confidence,
  timestamp,
  hall_id,
  student_id,
  exam_id,
  event_id,
}) {
  const severity = computeSeverity(type, confidence);
  const status = computeInitialStatus(severity, confidence);

  const cols = await getViolationColumns();

  const fields = ["type", "confidence", "hall_id", "student_id", "status", "timestamp"];
  const values = [type, confidence, hall_id, student_id ?? null, status, timestamp];

  if (cols.has("severity")) {
    fields.push("severity");
    values.push(severity);
  }
  if (cols.has("exam_id") && exam_id != null) {
    fields.push("exam_id");
    values.push(exam_id);
  }
  if (cols.has("event_id") && event_id) {
    fields.push("event_id");
    values.push(event_id);
  }

  const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");

  const violationResult = await pool.query(
    `INSERT INTO violations (${fields.join(", ")})
     VALUES (${placeholders})
     RETURNING *`,
    values
  );

  const violation = violationResult.rows[0];

  return { violation, severity, status };
}

module.exports = { createViolationAndAlertFromAiEvent };

