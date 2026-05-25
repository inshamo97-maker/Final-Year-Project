// routes/examHallRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
  getAllExamHalls,
  getExamHallById,
  createExamHall,
  updateExamHallStatus,
  deleteExamHall,
  uploadExamHallCSV,
} = require("../controllers/examHallController");

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get("/", getAllExamHalls);                                      // GET    /api/examhalls
router.get("/:id", getExamHallById);                                  // GET    /api/examhalls/:id
router.post("/", isAdmin, createExamHall);                                     // POST   /api/examhalls
router.patch("/:id/status", isAdmin, updateExamHallStatus);                    // PATCH  /api/examhalls/:id/status
router.delete("/:id", isAdmin, deleteExamHall);                                // DELETE /api/examhalls/:id
router.post("/upload/csv", isAdmin, upload.single("file"), uploadExamHallCSV); // POST   /api/examhalls/upload/csv

module.exports = router;