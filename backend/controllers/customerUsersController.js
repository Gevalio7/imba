const CustomerUsers = require('../models/customerUsers')
const { asyncHandler } = require('../middleware/errorHandler')

const getCustomerUsers = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page, isActive } = req.query

  const searchQuery = typeof q === 'string' ? q : undefined
  const sortByLocal = typeof sortBy === 'string' ? sortBy : ''
  const orderByLocal = typeof orderBy === 'string' ? orderBy : ''
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? Number.parseInt(itemsPerPage, 10) : 100000
  const pageLocal = typeof page === 'string' ? Number.parseInt(page, 10) : 1
  const isActiveFilter = isActive !== undefined ? isActive === 'true' : undefined

  const result = await CustomerUsers.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
    isActive: isActiveFilter,
  })

  res.json(result)
})

const getCustomerUserById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const customeruserId = Number.parseInt(id, 10)

  if (isNaN(customeruserId))
    return res.status(400).json({ message: 'Invalid ID' })

  const customeruser = await CustomerUsers.getById(customeruserId)

  if (!customeruser)
    return res.status(404).json({ message: 'Клиент не найден' })

  res.json(customeruser)
})

const createCustomerUsers = asyncHandler(async (req, res) => {
  const data = {}

  data.firstName = req.body.firstName
  data.lastName = req.body.lastName
  data.login = req.body.login
  data.email = req.body.email
  data.mobilePhone = req.body.mobilePhone
  data.telegramAccount = req.body.telegramAccount
  data.customerId = req.body.customerId
  data.customersGroupId = req.body.customersGroupId

  const isQuickCreate = req.body.sendWelcomeEmail === true || req.body.queueId

  // === Правильная версия "создания на лету" ===
  // Генерируем пароль на бэкенде, если не пришёл (для безопасности)
  if (!data.password && isQuickCreate) {
    // Простая генерация (в проде лучше crypto.randomBytes)
    data.password = require('crypto').randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'A1!'
  }

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined)
    data.isActive = req.body.isActive

  // Валидация обязательных полей
  if (!data.firstName)
    return res.status(400).json({ message: 'Имя обязательно для заполнения' })

  if (!data.lastName)
    return res.status(400).json({ message: 'Фамилия обязательна для заполнения' })

  try {
    // Хешируем пароль, если он есть (как для агентов)
    if (data.password) {
      const bcrypt = require('bcryptjs')
      data.password = await bcrypt.hash(data.password, 10)
    }

    const newCustomerUser = await CustomerUsers.create(data)

    // Если это quick create из тикета — отправляем письмо со ссылкой на сброс пароля
    // с почтового ящика очереди (если настроен)
    if (isQuickCreate && req.body.queueId && newCustomerUser) {
      // TODO: Здесь должна быть отправка письма через email_config очереди
      // с ссылкой на сброс пароля (password reset token)
      console.log(`[customerUsers] Quick create for queue ${req.body.queueId}. Should send welcome/reset email from queue mailbox. User: ${newCustomerUser.email}`)
      
      // В будущем здесь:
      // - Создать passwordResetToken
      // - Взять email_config из очереди
      // - Отправить письмо через PostMasterMailAccount связанный с очередью
    }

    // Не возвращаем пароль клиенту
    const { password, ...safeUser } = newCustomerUser
    res.status(201).json(safeUser)
  }
  catch (error) {
    if (error.statusCode === 409)
      return res.status(409).json({ message: error.message })

    throw error
  }
})

const updateCustomerUsers = asyncHandler(async (req, res) => {
  const { id } = req.params
  const customeruserId = Number.parseInt(id, 10)

  if (isNaN(customeruserId))
    return res.status(400).json({ message: 'Invalid ID' })

  const data = {}
  if (req.body.firstName !== undefined)
    data.firstName = req.body.firstName
  if (req.body.lastName !== undefined)
    data.lastName = req.body.lastName
  if (req.body.login !== undefined)
    data.login = req.body.login
  if (req.body.password !== undefined)
    data.password = req.body.password
  if (req.body.email !== undefined)
    data.email = req.body.email
  if (req.body.mobilePhone !== undefined)
    data.mobilePhone = req.body.mobilePhone
  if (req.body.telegramAccount !== undefined)
    data.telegramAccount = req.body.telegramAccount
  if (req.body.customerId !== undefined)
    data.customerId = req.body.customerId
  if (req.body.customersGroupId !== undefined)
    data.customersGroupId = req.body.customersGroupId

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined)
    data.isActive = req.body.isActive

  try {
    const updatedCustomerUser = await CustomerUsers.update(customeruserId, data)

    if (!updatedCustomerUser)
      return res.status(404).json({ message: 'Клиент не найден' })

    res.json(updatedCustomerUser)
  }
  catch (error) {
    if (error.statusCode === 409)
      return res.status(409).json({ message: error.message })

    throw error
  }
})

const deleteCustomerUsers = asyncHandler(async (req, res) => {
  const { id } = req.params
  const customeruserId = Number.parseInt(id, 10)

  if (isNaN(customeruserId))
    return res.status(400).json({ message: 'Invalid ID' })

  const deleted = await CustomerUsers.delete(customeruserId)

  if (!deleted)
    return res.status(404).json({ message: 'Клиент не найден' })

  res.status(204).send()
})

module.exports = {
  getCustomerUsers,
  getCustomerUserById,
  createCustomerUsers,
  updateCustomerUsers,
  deleteCustomerUsers,
}
