const express = require('express');
const router = express.Router();
const {
  getAllViolations,
  getViolationById,
  createViolation,
  updateViolationStatus,
  deleteViolation
} = require('../controllers/violationController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/',              getAllViolations);
router.get('/:id',           getViolationById);
router.post('/',             createViolation);
router.patch('/:id/status',  updateViolationStatus);
router.delete('/:id',        isAdmin, deleteViolation);

module.exports = router;