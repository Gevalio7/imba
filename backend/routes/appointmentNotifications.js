const express = require('express');
const router = express.Router();
const {
  getAppointmentNotifications,
  getAppointmentNotificationById,
  createAppointmentNotifications,
  updateAppointmentNotifications,
  deleteAppointmentNotifications,
} = require('../controllers/appointmentNotificationsController');

// GET /appointmentNotifications - список с query params
router.get('/', getAppointmentNotifications);

// GET /appointmentNotifications/:id
router.get('/:id', getAppointmentNotificationById);

// POST /appointmentNotifications
router.post('/', createAppointmentNotifications);

// PUT /appointmentNotifications/:id
router.put('/:id', updateAppointmentNotifications);

// DELETE /appointmentNotifications/:id
router.delete('/:id', deleteAppointmentNotifications);

module.exports = router;
