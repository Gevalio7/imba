const express = require('express');
const router = express.Router();
const {
  getEmailAddresses,
  getEmailAddresseById,
  createEmailAddresses,
  updateEmailAddresses,
  deleteEmailAddresses,
} = require('../controllers/emailAddressesController');

// GET /emailAddresses - список с query params
router.get('/', getEmailAddresses);

// GET /emailAddresses/:id
router.get('/:id', getEmailAddresseById);

// POST /emailAddresses
router.post('/', createEmailAddresses);

// PUT /emailAddresses/:id
router.put('/:id', updateEmailAddresses);

// DELETE /emailAddresses/:id
router.delete('/:id', deleteEmailAddresses);

module.exports = router;
