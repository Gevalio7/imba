const express = require('express');
const router = express.Router();
const {
  getGenericAgent,
  getGenericAgentById,
  createGenericAgent,
  updateGenericAgent,
  deleteGenericAgent,
} = require('../controllers/genericAgentController');

// GET /genericAgent - список с query params
router.get('/', getGenericAgent);

// GET /genericAgent/:id
router.get('/:id', getGenericAgentById);

// POST /genericAgent
router.post('/', createGenericAgent);

// PUT /genericAgent/:id
router.put('/:id', updateGenericAgent);

// DELETE /genericAgent/:id
router.delete('/:id', deleteGenericAgent);

module.exports = router;
