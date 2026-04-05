const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  createAgents,
  updateAgents,
  deleteAgents,
  getAgentGroups,
  updateAgentGroups,
  getAgentQueues,
  updateAgentQueues,
  getAgentActivities,
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

// GET /agents/:id/groups - получить группы агента
router.get('/:id/groups', getAgentGroups);

// PUT /agents/:id/groups - обновить группы агента
router.put('/:id/groups', updateAgentGroups);

// GET /agents/:id/queues - получить очереди агента
router.get('/:id/queues', getAgentQueues);

// PUT /agents/:id/queues - обновить очереди агента
router.put('/:id/queues', updateAgentQueues);

// GET /agents/:id/activities - получить активность агента
router.get('/:id/activities', getAgentActivities);

module.exports = router;
