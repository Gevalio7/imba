const express = require('express');
const router = express.Router();
const {
  getPostMasterFilters,
  getPostMasterFilterById,
  createPostMasterFilters,
  updatePostMasterFilters,
  deletePostMasterFilters,
} = require('../controllers/postMasterFiltersController');

// GET /postMasterFilters - список с query params
router.get('/', getPostMasterFilters);

// GET /postMasterFilters/:id
router.get('/:id', getPostMasterFilterById);

// POST /postMasterFilters
router.post('/', createPostMasterFilters);

// PUT /postMasterFilters/:id
router.put('/:id', updatePostMasterFilters);

// DELETE /postMasterFilters/:id
router.delete('/:id', deletePostMasterFilters);

module.exports = router;
