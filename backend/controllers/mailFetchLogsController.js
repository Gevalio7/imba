const MailFetchLogs = require('../models/mailFetchLogs')
const { asyncHandler } = require('../middleware/errorHandler')

const getAll = asyncHandler(async (req, res) => {
  const { q, page, itemsPerPage, sortBy, orderBy, mailAccountId, fromDate, toDate } = req.query

  const pageNum = page ? Number.parseInt(page, 10) : 1
  const perPage = itemsPerPage ? Number.parseInt(itemsPerPage, 10) : 10

  const result = await MailFetchLogs.getAll({
    q: typeof q === 'string' ? q : undefined,
    page: pageNum,
    itemsPerPage: perPage,
    sortBy: typeof sortBy === 'string' ? sortBy : 'started_at',
    orderBy: typeof orderBy === 'string' ? orderBy : 'desc',
    mailAccountId: mailAccountId ? Number.parseInt(mailAccountId, 10) : undefined,
    fromDate: typeof fromDate === 'string' ? fromDate : undefined,
    toDate: typeof toDate === 'string' ? toDate : undefined,
  })

  res.json(result)
})

const getById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const logId = Number.parseInt(id, 10)

  if (isNaN(logId))
    return res.status(400).json({ message: 'Invalid ID' })

  const log = await MailFetchLogs.getById(logId)

  if (!log)
    return res.status(404).json({ message: 'Log not found' })

  // Parse errors JSON if it's a string
  if (log.errors && typeof log.errors === 'string') {
    try {
      log.errors = JSON.parse(log.errors)
    } catch (e) {
      // keep as string if not valid JSON
    }
  }

  res.json(log)
})

const getStats = asyncHandler(async (req, res) => {
  const { mailAccountId, fromDate, toDate } = req.query

  const stats = await MailFetchLogs.getStats({
    mailAccountId: mailAccountId ? Number.parseInt(mailAccountId, 10) : undefined,
    fromDate: typeof fromDate === 'string' ? fromDate : undefined,
    toDate: typeof toDate === 'string' ? toDate : undefined,
  })

  res.json(stats)
})

module.exports = {
  getAll,
  getById,
  getStats,
}