const express = require('express');
const router = express.Router();
const {
  getCommunicationNotificationsSettings,
  getCommunicationNotificationsSettingById,
  createCommunicationNotificationsSettings,
  updateCommunicationNotificationsSettings,
  deleteCommunicationNotificationsSettings,
} = require('../controllers/communicationNotificationsSettingsController');

// GET /communicationNotificationsSettings - список с query params
router.get('/', getCommunicationNotificationsSettings);

// GET /communicationNotificationsSettings/:id
router.get('/:id', getCommunicationNotificationsSettingById);

// POST /communicationNotificationsSettings
router.post('/', createCommunicationNotificationsSettings);

// PUT /communicationNotificationsSettings/:id
router.put('/:id', updateCommunicationNotificationsSettings);

// DELETE /communicationNotificationsSettings/:id
router.delete('/:id', deleteCommunicationNotificationsSettings);

module.exports = router;
