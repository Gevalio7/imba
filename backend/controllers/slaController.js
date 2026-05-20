const Sla = require('../models/sla')
const { asyncHandler } = require('../middleware/errorHandler')

const getSla = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query

  const searchQuery = typeof q === 'string' ? q : undefined
  const sortByLocal = typeof sortBy === 'string' ? sortBy : ''
  const orderByLocal = typeof orderBy === 'string' ? orderBy : ''
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? Number.parseInt(itemsPerPage, 10) : 1000
  const pageLocal = typeof page === 'string' ? Number.parseInt(page, 10) : 1

  const result = await Sla.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  })

  res.json(result)
})

const getSlaById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const slaId = Number.parseInt(id, 10)

  if (isNaN(slaId))
    return res.status(400).json({ message: 'Invalid ID' })

  const sla = await Sla.getById(slaId)

  if (!sla)
    return res.status(404).json({ message: 'Sla not found' })

  res.json(sla)
})

const createSla = asyncHandler(async (req, res) => {
  const data = {}

  data.name = req.body.name
  data.description = req.body.description
  data.responseTime = Number.parseFloat(req.body.responseTime) || 0
  data.resolutionTime = Number.parseFloat(req.body.resolutionTime) || 0
  data.notificationPercentage = Number.parseInt(req.body.notificationPercentage) || 0
  data.type = req.body.type
  data.solutionTime = Number.parseInt(req.body.solutionTime) || 0
  data.minIncidentTime = Number.parseInt(req.body.minIncidentTime) || 10
  data.responseNotification = Number.parseInt(req.body.responseNotification) || 20
  data.updateNotification = Number.parseInt(req.body.updateNotification) || 80
  data.solutionNotification = Number.parseInt(req.body.solutionNotification) || 80
  data.calendarId = req.body.calendarId ? Number.parseInt(req.body.calendarId, 10) : null

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined)
    data.isActive = Boolean(req.body.isActive)

  // Добавляем services если переданы
  if (req.body.services && Array.isArray(req.body.services))
    data.services = req.body.services.map(id => Number.parseInt(id, 10)).filter(id => !isNaN(id))

  // Валидация обязательных полей
  if (!data.name)
    return res.status(400).json({ message: 'name is required' })

  const newSla = await Sla.create(data)

  res.status(201).json(newSla)
})

const updateSla = asyncHandler(async (req, res) => {
  const { id } = req.params
  const slaId = Number.parseInt(id, 10)

  if (isNaN(slaId))
    return res.status(400).json({ message: 'Invalid ID' })

  const data = {}
  if (req.body.name !== undefined)
    data.name = req.body.name
  if (req.body.description !== undefined)
    data.description = req.body.description
  if (req.body.responseTime !== undefined)
    data.responseTime = Number.parseFloat(req.body.responseTime) || 0
  if (req.body.resolutionTime !== undefined)
    data.resolutionTime = Number.parseFloat(req.body.resolutionTime) || 0
  if (req.body.notificationPercentage !== undefined)
    data.notificationPercentage = Number.parseInt(req.body.notificationPercentage) || 0
  if (req.body.type !== undefined)
    data.type = req.body.type
  if (req.body.solutionTime !== undefined)
    data.solutionTime = Number.parseInt(req.body.solutionTime) || 0
  if (req.body.minIncidentTime !== undefined)
    data.minIncidentTime = Number.parseInt(req.body.minIncidentTime) || 10
  if (req.body.responseNotification !== undefined)
    data.responseNotification = Number.parseInt(req.body.responseNotification) || 20
  if (req.body.updateNotification !== undefined)
    data.updateNotification = Number.parseInt(req.body.updateNotification) || 80
  if (req.body.solutionNotification !== undefined)
    data.solutionNotification = Number.parseInt(req.body.solutionNotification) || 80
  if (req.body.calendarId !== undefined)
    data.calendarId = req.body.calendarId ? Number.parseInt(req.body.calendarId, 10) : null

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined)
    data.isActive = Boolean(req.body.isActive)

  // Добавляем services если переданы
  if (req.body.services !== undefined)
    data.services = req.body.services.map(id => Number.parseInt(id, 10)).filter(id => !isNaN(id))

  const updatedSla = await Sla.update(slaId, data)

  if (!updatedSla)
    return res.status(404).json({ message: 'Sla not found' })

  res.json(updatedSla)
})

const deleteSla = asyncHandler(async (req, res) => {
  const { id } = req.params
  const slaId = Number.parseInt(id, 10)

  if (isNaN(slaId))
    return res.status(400).json({ message: 'Invalid ID' })

  const deleted = await Sla.delete(slaId)

  if (!deleted)
    return res.status(404).json({ message: 'Sla not found' })

  res.status(204).send()
})

module.exports = {
  getSla,
  getSlaById,
  createSla,
  updateSla,
  deleteSla,
}
