const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const controller = require('../controllers/mailFetchLogsController')

// GET /api/mailFetchLogs - list with pagination/search/sort
router.get('/', protect, controller.getAll)

// GET /api/mailFetchLogs/stats - statistics
router.get('/stats', protect, controller.getStats)

// GET /api/mailFetchLogs/:id
router.get('/:id', protect, controller.getById)

// POST /api/mailFetchLogs - create (used by service)
router.post('/', protect, async (req, res) => {
  try {
    const payload = req.body
    const created = await MailFetchLogs.create(payload)

    res.status(201).json(created)
  }
  catch (err) {
    console.error('Error creating mailFetchLog', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
