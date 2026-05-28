const express = require("express");
const router = express.Router();
const { getSeatAllocationsByExam } = require("../controllers/seatAllocationController");

router.get("/", getSeatAllocationsByExam);

module.exports = router;