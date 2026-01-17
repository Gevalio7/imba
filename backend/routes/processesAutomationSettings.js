const express = require('express');
const router = express.Router();
const {
  getProcessesAutomationSettings,
  getProcessesAutomationSettingById,
  createProcessesAutomationSettings,
  updateProcessesAutomationSettings,
  deleteProcessesAutomationSettings,
} = require('../controllers/processesAutomationSettingsController');

// GET /processesAutomationSettings - список с query params
router.get('/', getProcessesAutomationSettings);

// GET /processesAutomationSettings/:id
router.get('/:id', getProcessesAutomationSettingById);

// POST /processesAutomationSettings
router.post('/', createProcessesAutomationSettings);

// PUT /processesAutomationSettings/:id
router.put('/:id', updateProcessesAutomationSettings);

// DELETE /processesAutomationSettings/:id
router.delete('/:id', deleteProcessesAutomationSettings);

module.exports = router;
