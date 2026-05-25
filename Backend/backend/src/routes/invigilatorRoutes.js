// routes/invigilatorRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
  getAllInvigilators,
  getInvigilatorById,
  createInvigilator,
  updateInvigilator,
  deleteInvigilator,
  uploadCSV,
} = require("../controllers/invigilatorController");

// multer — store CSV in memory (no disk)
const upload = multer({ storage: multer.memoryStorage() });

// All routes below require: valid JWT + admin
router.use(authenticate, isAdmin);

// ─── CRUD ────────────────────────────────────
router.get("/", getAllInvigilators);                        // GET    /api/invigilators
router.get("/:id", getInvigilatorById);                    // GET    /api/invigilators/:id
router.post("/", createInvigilator);                       // POST   /api/invigilators
router.put("/:id", updateInvigilator);                     // PUT    /api/invigilators/:id
router.delete("/:id", deleteInvigilator);                  // DELETE /api/invigilators/:id

// ─── CSV UPLOAD ──────────────────────────────
router.post("/upload/csv", upload.single("file"), uploadCSV); // POST /api/invigilators/upload/csv

module.exports = router;