const express = require('express');
const router = express.Router();
const {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccounts,
  updatePostMasterMailAccounts,
  deletePostMasterMailAccounts,
} = require('../controllers/postMasterMailAccountsController');

// GET /postMasterMailAccounts - список с query params
router.get('/', getPostMasterMailAccounts);

// GET /postMasterMailAccounts/:id
router.get('/:id', getPostMasterMailAccountById);

// POST /postMasterMailAccounts
router.post('/', createPostMasterMailAccounts);

// PUT /postMasterMailAccounts/:id
router.put('/:id', updatePostMasterMailAccounts);

// DELETE /postMasterMailAccounts/:id
router.delete('/:id', deletePostMasterMailAccounts);

module.exports = router;
