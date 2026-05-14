const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.get('/:id', protect, getAgentById);

// POST /agents
router.post('/', protect, checkPermission('menu_agents_write'), createAgents);

// PUT /agents/:id
router.put('/:id', protect, checkPermission('menu_agents_write'), updateAgents);

// DELETE /agents/:id
router.delete('/:id', protect, checkPermission('menu_agents_delete'), deleteAgents);

// GET /agents/:id/groups - получить группы агента
router.get('/:id/groups', protect, getAgentGroups);

// PUT /agents/:id/groups - обновить группы агента
router.put('/:id/groups', protect, checkPermission('menu_agents_write'), updateAgentGroups);

// GET /agents/:id/queues - получить очереди агента
router.get('/:id/queues', protect, getAgentQueues);

// PUT /agents/:id/queues - обновить очереди агента
router.put('/:id/queues', protect, checkPermission('menu_agents_write'), updateAgentQueues);

// GET /agents/:id/activities - получить активность агента
router.get('/:id/activities', protect, getAgentActivities);

module.exports = router;
