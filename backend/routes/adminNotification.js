const express = require('express');
const router = express.Router();
const {
  getAdminNotification,
  getAdminNotificationById,
  createAdminNotification,
  updateAdminNotification,
  deleteAdminNotification,
} = require('../controllers/adminNotificationController');

// GET /adminNotification - список с query params
router.get('/', getAdminNotification);

// GET /adminNotification/:id
router.get('/:id', getAdminNotificationById);

// POST /adminNotification
router.post('/', createAdminNotification);

// PUT /adminNotification/:id
router.put('/:id', updateAdminNotification);

// DELETE /adminNotification/:id
router.delete('/:id', deleteAdminNotification);

module.exports = router;
