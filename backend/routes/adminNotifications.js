const express = require('express');
const router = express.Router();
const {
  getAdminNotifications,
  getAdminNotificationById,
  createAdminNotifications,
  updateAdminNotifications,
  deleteAdminNotifications,
} = require('../controllers/adminNotificationsController');

// GET /adminNotifications - список с query params
router.get('/', getAdminNotifications);

// GET /adminNotifications/:id
router.get('/:id', getAdminNotificationById);

// POST /adminNotifications
router.post('/', createAdminNotifications);

// PUT /adminNotifications/:id
router.put('/:id', updateAdminNotifications);

// DELETE /adminNotifications/:id
router.delete('/:id', deleteAdminNotifications);

module.exports = router;
