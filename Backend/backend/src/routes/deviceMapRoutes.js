const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const { getHallDeviceMap } = require("../controllers/deviceMapController");

router.get("/", authenticate, getHallDeviceMap);

module.exports = router;
