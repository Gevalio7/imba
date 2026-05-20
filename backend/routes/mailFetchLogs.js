const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')
const MailFetchLogs = require('../models/mailFetchLogs')

// GET /api/mailFetchLogs - list with pagination/search/sort
router.get('/', protect, async (req, res) => {
  try {
    const { q, page, itemsPerPage, sortBy, orderBy } = req.query
    const pageNum = page ? Number.parseInt(page, 10) : 1
    const perPage = itemsPerPage ? Number.parseInt(itemsPerPage, 10) : 10
    const result = await MailFetchLogs.getAll({ q, page: pageNum, itemsPerPage: perPage, sortBy, orderBy })

    res.json(result)
  }
  catch (err) {
    console.error('Error fetching mailFetchLogs', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/mailFetchLogs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10)
    if (isNaN(id))
      return res.status(400).json({ error: 'Invalid id' })
    const entry = await MailFetchLogs.getById(id)
    if (!entry)
      return res.status(404).json({ error: 'Not found' })
    res.json(entry)
  }
  catch (err) {
    console.error('Error fetching mailFetchLog by id', err)
    res.status(500).json({ error: err.message })
  }
})

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
