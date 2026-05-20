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

// referenceData cache control
const ReferenceDataRoute = require('./referenceData')

// GET /postMasterMailAccounts - список с query params
router.get('/', getPostMasterMailAccounts)

// GET /postMasterMailAccounts/:id
router.get('/:id', getPostMasterMailAccountById)

// POST /postMasterMailAccounts
router.post('/', protect, async (req, res, next) => {
  try {
    await createPostMasterMailAccount(req, res, next)
    try { ReferenceDataRoute.clearCache() } catch (e) {}
  } catch (err) {
    next(err)
  }
})

// PUT /postMasterMailAccounts/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    await updatePostMasterMailAccount(req, res, next)
    try { ReferenceDataRoute.clearCache() } catch (e) {}
  } catch (err) {
    next(err)
  }
})

// DELETE /postMasterMailAccounts/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await deletePostMasterMailAccount(req, res, next)
    try { ReferenceDataRoute.clearCache() } catch (e) {}
  } catch (err) {
    next(err)
  }
})

// POST /postMasterMailAccounts/test - test with body params
router.post('/test', protect, require('../controllers/postMasterMailAccountsController').testConnection)

// POST /postMasterMailAccounts/:id/test - test saved account
router.post('/:id/test', protect, require('../controllers/postMasterMailAccountsController').testConnectionById)

module.exports = router
