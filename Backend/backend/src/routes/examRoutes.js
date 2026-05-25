// routes/examRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  uploadExamCSV,
  checkAndUpdateExamStatuses,
} = require("../controllers/examController");

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get("/", getAllExams);                                    // GET    /api/exams
router.get("/status/update", checkAndUpdateExamStatuses);       // GET    /api/exams/status/update
router.get("/:id", getExamById);                                // GET    /api/exams/:id
router.post("/", isAdmin, createExam);                                   // POST   /api/exams
router.put("/:id", isAdmin, updateExam);                                 // PUT    /api/exams/:id
router.delete("/:id", isAdmin, deleteExam);                              // DELETE /api/exams/:id
router.post("/upload/csv", isAdmin, upload.single("file"), uploadExamCSV); // POST /api/exams/upload/csv

module.exports = router;