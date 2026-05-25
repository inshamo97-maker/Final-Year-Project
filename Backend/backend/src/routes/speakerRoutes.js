const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  updateSpeakerStatus,
  deleteSpeaker,
  uploadSpeakersCSV
} = require('../controllers/speakerController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/',             getAllSpeakers);
router.get('/:id',          getSpeakerById);
router.post('/',            isAdmin, createSpeaker);
router.put('/:id',          isAdmin, updateSpeaker);
router.patch('/:id/status', isAdmin, updateSpeakerStatus);
router.delete('/:id',       isAdmin, deleteSpeaker);
router.post('/upload/csv',  isAdmin, upload.single('file'), uploadSpeakersCSV);

module.exports = router;
