const express = require('express');
const router = express.Router();
const {
  getPgpKeys,
  getPgpKeyById,
  createPgpKeys,
  updatePgpKeys,
  deletePgpKeys,
} = require('../controllers/pgpKeysController');

// GET /pgpKeys - список с query params
router.get('/', getPgpKeys);

// GET /pgpKeys/:id
router.get('/:id', getPgpKeyById);

// POST /pgpKeys
router.post('/', createPgpKeys);

// PUT /pgpKeys/:id
router.put('/:id', updatePgpKeys);

// DELETE /pgpKeys/:id
router.delete('/:id', deletePgpKeys);

module.exports = router;
