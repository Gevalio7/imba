const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

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
} = require('../controllers/workflowsController')

// =====================================================
// WORKFLOWS
// =====================================================

// GET /api/workflows - Получить все воркфлоу
router.get('/', getWorkflows)

// GET /api/workflows/:id - Получить воркфлоу по ID
router.get('/:id', getWorkflowById)

// GET /api/workflows/:id/full - Получить воркфлоу с переходами
router.get('/:id/full', getWorkflowWithTransitions)

// POST /api/workflows - Создать воркфлоу
router.post('/', protect, createWorkflow)

// PUT /api/workflows/:id - Обновить воркфлоу
router.put('/:id', protect, updateWorkflow)

// DELETE /api/workflows/:id - Удалить воркфлоу
router.delete('/:id', protect, deleteWorkflow)

// =====================================================
// TRANSITIONS (Переходы воркфлоу)
// =====================================================

// GET /api/workflows/:id/transitions - Получить переходы воркфлоу
router.get('/:id/transitions', getTransitions)

// POST /api/workflows/:id/transitions - Создать переход
router.post('/:id/transitions', protect, createTransition)

// POST /api/workflows/:id/transitions/bulk - Массовое создание переходов
router.post('/:id/transitions/bulk', protect, bulkCreateTransitions)

// PUT /api/workflows/:workflowId/transitions/:transitionId - Обновить переход
router.put('/:workflowId/transitions/:transitionId', protect, updateTransition)

// DELETE /api/workflows/:workflowId/transitions/:transitionId - Удалить переход
router.delete('/:workflowId/transitions/:transitionId', protect, deleteTransition)

module.exports = router
