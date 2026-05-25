const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { getStudentsForInvigilator, uploadStudentsCSV } = require("../controllers/studentController");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authenticate, getStudentsForInvigilator);
router.post("/upload/csv", authenticate, isAdmin, upload.single("file"), uploadStudentsCSV);

module.exports = router;
