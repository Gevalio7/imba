const express = require('express');
const router = express.Router();
const {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccount,
  updatePostMasterMailAccount,
  deletePostMasterMailAccount,
} = require('../controllers/postMasterMailAccountsController');

// GET /postMasterMailAccounts - список с query params
router.get('/', getPostMasterMailAccounts);

// GET /postMasterMailAccounts/:id
router.get('/:id', getPostMasterMailAccountById);

// POST /postMasterMailAccounts
router.post('/', createPostMasterMailAccount);

// PUT /postMasterMailAccounts/:id
router.put('/:id', updatePostMasterMailAccount);

// DELETE /postMasterMailAccounts/:id
router.delete('/:id', deletePostMasterMailAccount);

module.exports = router;
