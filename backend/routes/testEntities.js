const express = require('express');
const router = express.Router();
const {
  getTestEntities,
  getTestEntityById,
  createTestEntity,
  updateTestEntity,
  deleteTestEntity,
} = require('../controllers/testEntitiesController');

// GET /api/apps/test-entities - список с query params
router.get('/', getTestEntities);

// GET /api/apps/test-entities/:id
router.get('/:id', getTestEntityById);

// POST /api/apps/test-entities
router.post('/', createTestEntity);

// PUT /api/apps/test-entities/:id
router.put('/:id', updateTestEntity);

// DELETE /api/apps/test-entities/:id
router.delete('/:id', deleteTestEntity);

module.exports = router;
