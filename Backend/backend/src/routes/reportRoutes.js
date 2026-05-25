const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// Correct way:
router.use(authenticate);
router.get("/", reportController.getReports);
router.get("/:id", reportController.getReportById);
router.post("/", isAdmin, reportController.createReport);

module.exports = router;