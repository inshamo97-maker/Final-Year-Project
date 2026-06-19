const { ok } = require("../utils/response");
const { aiAlertSchema, attendanceSchema, embeddingSchema } = require("../validation/aiSchemas");
const aiIngestService = require("../services/aiIngestService");

function normalizeZodError(err) {
  if (!err?.issues) return err;
  const message = err.issues
    .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
    .join("; ");
  const e = new Error(message);
  e.status = 422;
  return e;
}

async function ingestAiAlert(req, res, next) {
  try {
    let payload;
    try { payload = aiAlertSchema.parse(req.body); }
    catch (e) { throw normalizeZodError(e); }

    const io = req.app.get("io");
    const aiAlert = await aiIngestService.ingestAiAlert(payload, io);
    return ok(res, { ai_alert: aiAlert }, 201);
  } catch (err) { next(err); }
}

async function listAiAlerts(req, res, next) {
  try {
    const alerts = await aiIngestService.listAiAlerts();
    return ok(res, alerts, 200);
  } catch (err) { next(err); }
}

async function ingestAttendance(req, res, next) {
  try {
    let payload;
    try { payload = attendanceSchema.parse(req.body); }
    catch (e) { throw normalizeZodError(e); }

    const io = req.app.get("io");
    const result = await aiIngestService.ingestAttendance(payload, io);
    return ok(res, result, 200);
  } catch (err) { next(err); }
}

async function listAttendance(req, res, next) {
  try {
    const { exam_id } = req.query;
    const rows = await aiIngestService.listAttendance(exam_id);
    return ok(res, rows, 200);
  } catch (err) { next(err); }
}

async function upsertStudentEmbedding(req, res, next) {
  try {
    let payload;
    try { payload = embeddingSchema.parse(req.body); }
    catch (e) { throw normalizeZodError(e); }

    const result = await aiIngestService.upsertStudentEmbedding(payload);
    return ok(res, result, 201);
  } catch (err) { next(err); }
}

async function listStudentEmbeddings(req, res, next) {
  try {
    const rows = await aiIngestService.listStudentEmbeddings();
    return ok(res, rows, 200);
  } catch (err) { next(err); }
}

module.exports = {
  ingestAiAlert,
  listAiAlerts,
  ingestAttendance,
  listAttendance,
  upsertStudentEmbedding,
  listStudentEmbeddings,
};
