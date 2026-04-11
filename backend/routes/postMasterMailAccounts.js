const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.post('/', protect, createPostMasterMailAccount);

// PUT /postMasterMailAccounts/:id
router.put('/:id', protect, updatePostMasterMailAccount);

// DELETE /postMasterMailAccounts/:id
router.delete('/:id', protect, deletePostMasterMailAccount);

module.exports = router;
