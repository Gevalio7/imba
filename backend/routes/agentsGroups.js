const express = require('express');
const router = express.Router();
const {
  getAgentsGroups,
  getAgentsGroupById,
  createAgentsGroups,
  updateAgentsGroups,
  deleteAgentsGroups,
} = require('../controllers/agentsGroupsController');

// GET /agentsGroups - список с query params
router.get('/', getAgentsGroups);

// GET /agentsGroups/:id
router.get('/:id', getAgentsGroupById);

// POST /agentsGroups
router.post('/', createAgentsGroups);

// PUT /agentsGroups/:id
router.put('/:id', updateAgentsGroups);

// DELETE /agentsGroups/:id
router.delete('/:id', deleteAgentsGroups);

module.exports = router;
