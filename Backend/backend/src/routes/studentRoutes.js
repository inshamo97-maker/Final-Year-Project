const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
   getStudentsForInvigilator,
   uploadStudentsCSV,
   addStudent,
   deleteStudent
} = require("../controllers/studentController");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authenticate, getStudentsForInvigilator);
router.post("/upload/csv", authenticate, isAdmin, upload.single("file"), uploadStudentsCSV);
router.post( "/",authenticate,isAdmin, addStudent
);
router.delete("/:id", authenticate, isAdmin, deleteStudent);

module.exports = router;
