const express = require('express');
const router = express.Router();
const {
  getTestEntities,
  getTestEntityById,
  createTestEntities,
  updateTestEntities,
  deleteTestEntities,
} = require('../controllers/testEntitiesController');

// GET /testEntities - список с query params
router.get('/', getTestEntities);

// GET /testEntities/:id
router.get('/:id', getTestEntityById);

// POST /testEntities
router.post('/', createTestEntities);

// PUT /testEntities/:id
router.put('/:id', updateTestEntities);

// DELETE /testEntities/:id
router.delete('/:id', deleteTestEntities);

module.exports = router;
