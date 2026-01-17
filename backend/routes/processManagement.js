const express = require('express');
const router = express.Router();
const {
  getProcessManagement,
  getProcessManagementById,
  createProcessManagement,
  updateProcessManagement,
  deleteProcessManagement,
} = require('../controllers/processManagementController');

// GET /processManagement - список с query params
router.get('/', getProcessManagement);

// GET /processManagement/:id
router.get('/:id', getProcessManagementById);

// POST /processManagement
router.post('/', createProcessManagement);

// PUT /processManagement/:id
router.put('/:id', updateProcessManagement);

// DELETE /processManagement/:id
router.delete('/:id', deleteProcessManagement);

module.exports = router;
