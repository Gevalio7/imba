const SessionManagement = require('../models/sessionManagement')
const { asyncHandler } = require('../middleware/errorHandler')

const getSessionManagement = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query

  const searchQuery = typeof q === 'string' ? q : undefined
  const sortByLocal = typeof sortBy === 'string' ? sortBy : ''
  const orderByLocal = typeof orderBy === 'string' ? orderBy : ''
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? Number.parseInt(itemsPerPage, 10) : 1000
  const pageLocal = typeof page === 'string' ? Number.parseInt(page, 10) : 1

  const result = await SessionManagement.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  })

  res.json(result)
})

const getSessionManagementById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const sessionmanagementId = Number.parseInt(id, 10)

  if (isNaN(sessionmanagementId))
    return res.status(400).json({ message: 'Invalid ID' })

  const sessionmanagement = await SessionManagement.getById(sessionmanagementId)

  if (!sessionmanagement)
    return res.status(404).json({ message: 'SessionManagement not found' })

  res.json(sessionmanagement)
})

const createSessionManagement = asyncHandler(async (req, res) => {
  const data = {}

  data.username = req.body.username
  data.ipAddress = req.body.ipAddress
  data.userAgent = req.body.userAgent
  data.loginTime = req.body.loginTime
  data.lastActivity = req.body.lastActivity
  data.userId = req.body.userId

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined)
    data.isActive = req.body.isActive

  // Валидация обязательных полей
  if (!data.username || !data.userId)
    return res.status(400).json({ message: 'username and userId are required' })

  // Автоматически завершаем все активные сессии для этого пользователя
  await SessionManagement.terminateAllForUser(data.userId)

  const newSessionManagement = await SessionManagement.create(data)

  res.status(201).json(newSessionManagement)
})

const terminateSession = asyncHandler(async (req, res) => {
  const { id } = req.params
  const sessionId = Number.parseInt(id, 10)

  console.log(`Terminating session ID: ${sessionId} by user ID: ${req.user.id}`)

  if (isNaN(sessionId)) {
    console.log('Invalid session ID')

    return res.status(400).json({ message: 'Invalid ID' })
  }

  const updated = await SessionManagement.update(sessionId, { isActive: false })

  if (!updated) {
    console.log('Session not found')

    return res.status(404).json({ message: 'Session not found' })
  }

  console.log(`Session ${sessionId} terminated successfully. Username: ${updated.username}, UserID: ${updated.userId}`)
  res.json(updated)
})

const terminateAllSessions = asyncHandler(async (req, res) => {
  const count = await SessionManagement.terminateAllActive()

  res.json({ message: `${count} sessions terminated` })
})

const terminateCurrentSession = asyncHandler(async (req, res) => {
  // Найти активную сессию для текущего пользователя
  const sessions = await SessionManagement.getAll({ q: req.user.id.toString() })
  const activeSession = sessions.sessionManagement.find(s => s.isActive && s.userId === req.user.id)

  if (!activeSession)
    return res.status(404).json({ message: 'Active session not found' })

  const updated = await SessionManagement.update(activeSession.id, { isActive: false })

  if (!updated)
    return res.status(404).json({ message: 'Session not found' })

  res.json({ message: 'Session terminated successfully' })
})

module.exports = {
  getSessionManagement,
  getSessionManagementById,
  createSessionManagement,
  terminateSession,
  terminateAllSessions,
  terminateCurrentSession,
}
