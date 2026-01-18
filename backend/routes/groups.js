const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroupById,
  createGroups,
  updateGroups,
  deleteGroups,
} = require('../controllers/groupsController');

// GET /groups - список с query params
router.get('/', getGroups);

// GET /groups/:id
router.get('/:id', getGroupById);

// POST /groups
router.post('/', createGroups);

// PUT /groups/:id
router.put('/:id', updateGroups);

// DELETE /groups/:id
router.delete('/:id', deleteGroups);

module.exports = router;
