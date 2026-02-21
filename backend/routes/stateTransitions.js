const express = require('express');
const router = express.Router();
const {
  getStateTransitions,
  getStateTransitionById,
  createStateTransition,
  updateStateTransition,
  deleteStateTransition,
  getAvailableTransitions,
} = require('../controllers/stateTransitionsController');

// GET /api/stateTransitions - Получить все переходы
router.get('/', getStateTransitions);

// GET /api/stateTransitions/available - Получить доступные переходы для тикета
router.get('/available', getAvailableTransitions);

// GET /api/stateTransitions/:id - Получить переход по ID
router.get('/:id', getStateTransitionById);

// POST /api/stateTransitions - Создать переход
router.post('/', createStateTransition);

// PUT /api/stateTransitions/:id - Обновить переход
router.put('/:id', updateStateTransition);

// DELETE /api/stateTransitions/:id - Удалить переход
router.delete('/:id', deleteStateTransition);

module.exports = router;
