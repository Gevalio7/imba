const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getAgentsGroups,
  getAgentsGroupById,
  createAgentsGroups,
  updateAgentsGroups,
  deleteAgentsGroups,
  getAgentsInGroup,
  addAgentToGroup,
  removeAgentFromGroup,
} = require('../controllers/agentsGroupsController')

// GET /agentsGroups - список с query params
router.get('/', getAgentsGroups)

// GET /agentsGroups/:id
router.get('/:id', getAgentsGroupById)

// POST /agentsGroups
router.post('/', protect, createAgentsGroups)

// PUT /agentsGroups/:id
router.put('/:id', protect, updateAgentsGroups)

// DELETE /agentsGroups/:id
router.delete('/:id', protect, deleteAgentsGroups)

// GET /agentsGroups/:id/agents
router.get('/:id/agents', getAgentsInGroup)

// POST /agentsGroups/:id/agents
router.post('/:id/agents', protect, addAgentToGroup)

// DELETE /agentsGroups/:id/agents/:agentId
router.delete('/:id/agents/:agentId', protect, removeAgentFromGroup)

module.exports = router
