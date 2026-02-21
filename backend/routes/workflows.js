const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  getWorkflowById,
  getWorkflowWithTransitions,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getTransitions,
  createTransition,
  updateTransition,
  deleteTransition,
  bulkCreateTransitions,
} = require('../controllers/workflowsController');

// =====================================================
// WORKFLOWS
// =====================================================

// GET /api/workflows - Получить все воркфлоу
router.get('/', getWorkflows);

// GET /api/workflows/:id - Получить воркфлоу по ID
router.get('/:id', getWorkflowById);

// GET /api/workflows/:id/full - Получить воркфлоу с переходами
router.get('/:id/full', getWorkflowWithTransitions);

// POST /api/workflows - Создать воркфлоу
router.post('/', createWorkflow);

// PUT /api/workflows/:id - Обновить воркфлоу
router.put('/:id', updateWorkflow);

// DELETE /api/workflows/:id - Удалить воркфлоу
router.delete('/:id', deleteWorkflow);

// =====================================================
// TRANSITIONS (Переходы воркфлоу)
// =====================================================

// GET /api/workflows/:id/transitions - Получить переходы воркфлоу
router.get('/:id/transitions', getTransitions);

// POST /api/workflows/:id/transitions - Создать переход
router.post('/:id/transitions', createTransition);

// POST /api/workflows/:id/transitions/bulk - Массовое создание переходов
router.post('/:id/transitions/bulk', bulkCreateTransitions);

// PUT /api/workflows/:workflowId/transitions/:transitionId - Обновить переход
router.put('/:workflowId/transitions/:transitionId', updateTransition);

// DELETE /api/workflows/:workflowId/transitions/:transitionId - Удалить переход
router.delete('/:workflowId/transitions/:transitionId', deleteTransition);

module.exports = router;
