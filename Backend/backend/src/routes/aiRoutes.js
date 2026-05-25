const express = require("express");
const router = express.Router();

const { aiAuth } = require("../middleware/aiAuth");
const { authenticate } = require("../middleware/authMiddleware");
const { eitherAuth } = require("../middleware/eitherAuth");
const { asyncHandler } = require("../middleware/asyncHandler");
const {
  ingestAiAlert,
  listAiAlerts,
  ingestAttendance,
  listAttendance,
  upsertStudentEmbedding,
  listStudentEmbeddings,
} = require("../controllers/aiController");

// UI writes use JWT auth; AI pipeline writes use x-ai-key auth.
function jwtOrAiAuth(req, res, next) {
  const hasBearer = Boolean(req.headers.authorization);
  if (hasBearer) return authenticate(req, res, next);
  return aiAuth(req, res, next);
}

// Writes: AI-only (API key)
router.post("/ai-alert", jwtOrAiAuth, asyncHandler(ingestAiAlert));
router.post("/attendance", jwtOrAiAuth, asyncHandler(ingestAttendance));
router.post("/student-embeddings", jwtOrAiAuth, asyncHandler(upsertStudentEmbedding));

// Reads: UI (JWT) or AI (API key) depending on endpoint.
router.get("/ai-alerts", authenticate, asyncHandler(listAiAlerts));
router.get("/attendance", authenticate, asyncHandler(listAttendance));
router.get("/student-embeddings", eitherAuth(aiAuth, authenticate), asyncHandler(listStudentEmbeddings));

module.exports = router;

