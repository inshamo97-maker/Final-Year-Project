const express = require('express');
const router = express.Router();
const {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  deleteAlert
} = require('../controllers/alertController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/',             getAllAlerts);
router.get('/:id',          getAlertById);
router.post('/',            createAlert);
router.patch('/:id/status', updateAlertStatus);
router.delete('/:id',       isAdmin, deleteAlert);

module.exports = router;