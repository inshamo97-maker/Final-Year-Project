const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllMicrophones,
  getMicrophoneById,
  createMicrophone,
  updateMicrophone,
  toggleMicrophoneStatus,
  deleteMicrophone,
  uploadMicrophonesCSV
} = require('../controllers/microphoneController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/',             getAllMicrophones);
router.get('/:id',          getMicrophoneById);
router.post('/',            isAdmin, createMicrophone);
router.put('/:id',          isAdmin, updateMicrophone);
router.patch('/:id/status', isAdmin, toggleMicrophoneStatus);
router.delete('/:id',       isAdmin, deleteMicrophone);
router.post('/upload/csv',  isAdmin, upload.single('file'), uploadMicrophonesCSV);

module.exports = router;
