const express = require("express");
const router = express.Router();

const {
  getSeatAllocationsByExam,
  uploadSeatAllocationsCSV,
} = require("../controllers/seatAllocationController");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getSeatAllocationsByExam);

router.post(
  "/upload/csv",
  upload.single("file"),
  uploadSeatAllocationsCSV
);

module.exports = router;