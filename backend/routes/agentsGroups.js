const express = require('express');
const router = express.Router();
const {
  getAgentsGroups,
  getAgentsGroupById,
  createAgentsGroups,
  updateAgentsGroups,
  deleteAgentsGroups,
  getAgentsInGroup,
  addAgentToGroup,
  removeAgentFromGroup,
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

// GET /agentsGroups/:id/agents
router.get('/:id/agents', getAgentsInGroup);

// POST /agentsGroups/:id/agents
router.post('/:id/agents', addAgentToGroup);

// DELETE /agentsGroups/:id/agents/:agentId
router.delete('/:id/agents/:agentId', removeAgentFromGroup);

module.exports = router;
