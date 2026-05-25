const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { saveSeatingPlan } = require("../controllers/seatingController");

router.post("/", authenticate, isAdmin, saveSeatingPlan);

module.exports = router;
