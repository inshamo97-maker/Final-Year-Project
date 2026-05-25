const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  toggleCameraStatus,
  deleteCamera,
  uploadCamerasCSV
} = require('../controllers/cameraController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/',              getAllCameras);
router.get('/:id',           getCameraById);
router.post('/',             isAdmin, createCamera);
router.put('/:id',           isAdmin, updateCamera);
router.patch('/:id/status',  isAdmin, toggleCameraStatus);
router.delete('/:id',        isAdmin, deleteCamera);
router.post('/upload/csv',   isAdmin, upload.single('file'), uploadCamerasCSV);

module.exports = router;
