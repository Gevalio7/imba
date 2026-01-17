const express = require('express');
const router = express.Router();
const {
  getGeneralCatalog,
  getGeneralCatalogById,
  createGeneralCatalog,
  updateGeneralCatalog,
  deleteGeneralCatalog,
} = require('../controllers/generalCatalogController');

// GET /generalCatalog - список с query params
router.get('/', getGeneralCatalog);

// GET /generalCatalog/:id
router.get('/:id', getGeneralCatalogById);

// POST /generalCatalog
router.post('/', createGeneralCatalog);

// PUT /generalCatalog/:id
router.put('/:id', updateGeneralCatalog);

// DELETE /generalCatalog/:id
router.delete('/:id', deleteGeneralCatalog);

module.exports = router;
