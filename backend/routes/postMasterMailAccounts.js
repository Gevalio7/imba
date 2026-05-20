const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccount,
  updatePostMasterMailAccount,
  deletePostMasterMailAccount,
} = require('../controllers/postMasterMailAccountsController')

// additionally expose mail fetcher run endpoint under admin
const MailFetcherController = require('../routes/mailFetcher')

// GET /postMasterMailAccounts - список с query params
router.get('/', getPostMasterMailAccounts)

// GET /postMasterMailAccounts/:id
router.get('/:id', getPostMasterMailAccountById)

// POST /postMasterMailAccounts
router.post('/', protect, createPostMasterMailAccount)

// PUT /postMasterMailAccounts/:id
router.put('/:id', protect, updatePostMasterMailAccount)

// DELETE /postMasterMailAccounts/:id
router.delete('/:id', protect, deletePostMasterMailAccount)

// POST /postMasterMailAccounts/test - test with body params
router.post('/test', protect, require('../controllers/postMasterMailAccountsController').testConnection)

// POST /postMasterMailAccounts/:id/test - test saved account
router.post('/:id/test', protect, require('../controllers/postMasterMailAccountsController').testConnectionById)

module.exports = router
