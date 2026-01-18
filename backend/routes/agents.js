const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
} = require('../controllers/agentsController');

// GET /agents - список с query params
router.get('/', getAgents);

// GET /agents/:id
router.get('/:id', getAgentById);

// POST /agents
router.post('/', createAgents);

// PUT /agents/:id
router.put('/:id', updateAgents);

// DELETE /agents/:id
router.delete('/:id', deleteAgents);

module.exports = router;
