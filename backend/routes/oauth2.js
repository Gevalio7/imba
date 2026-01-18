const express = require('express');
const router = express.Router();
const {
  getOauth2,
  getOauth2ById,
  createOauth2,
  updateOauth2,
  deleteOauth2,
} = require('../controllers/oauth2Controller');

// GET /oauth2 - список с query params
router.get('/', getOauth2);

// GET /oauth2/:id
router.get('/:id', getOauth2ById);

// POST /oauth2
router.post('/', createOauth2);

// PUT /oauth2/:id
router.put('/:id', updateOauth2);

// DELETE /oauth2/:id
router.delete('/:id', deleteOauth2);

module.exports = router;
