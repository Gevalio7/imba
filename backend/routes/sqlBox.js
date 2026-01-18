const express = require('express');
const router = express.Router();
const {
  getSqlBox,
  getSqlBoxById,
  createSqlBox,
  updateSqlBox,
  deleteSqlBox,
} = require('../controllers/sqlBoxController');

// GET /sqlBox - список с query params
router.get('/', getSqlBox);

// GET /sqlBox/:id
router.get('/:id', getSqlBoxById);

// POST /sqlBox
router.post('/', createSqlBox);

// PUT /sqlBox/:id
router.put('/:id', updateSqlBox);

// DELETE /sqlBox/:id
router.delete('/:id', deleteSqlBox);

module.exports = router;
