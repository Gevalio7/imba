const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const MailFetcherService = require('../services/MailFetcherService')

// POST /admin/mail-fetcher/run - ручной запуск сбора почты
router.post('/run', protect, async (req, res) => {
  try {
    const result = await MailFetcherService.fetchAllAccounts()

    res.json(result)
  }
  catch (err) {
    console.error('Error running mail fetcher:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
