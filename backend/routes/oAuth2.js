const express = require('express');
const router = express.Router();
const {
  getOAuth2,
  getOAuth2ById,
  createOAuth2,
  updateOAuth2,
  deleteOAuth2,
} = require('../controllers/oAuth2Controller');

// GET /oAuth2 - список с query params
router.get('/', getOAuth2);

// GET /oAuth2/:id
router.get('/:id', getOAuth2ById);

// POST /oAuth2
router.post('/', createOAuth2);

// PUT /oAuth2/:id
router.put('/:id', updateOAuth2);

// DELETE /oAuth2/:id
router.delete('/:id', deleteOAuth2);

module.exports = router;
