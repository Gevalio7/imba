const nodemailer = require('nodemailer')
const PostMasterMailAccounts = require('../models/postMasterMailAccounts')
const { asyncHandler } = require('../middleware/errorHandler')
const { encrypt } = require('../utils/crypto')

const getPostMasterMailAccounts = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query

  const searchQuery = typeof q === 'string' ? q : undefined
  const sortByLocal = typeof sortBy === 'string' ? sortBy : ''
  const orderByLocal = typeof orderBy === 'string' ? orderBy : ''
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? Number.parseInt(itemsPerPage, 10) : 1000
  const pageLocal = typeof page === 'string' ? Number.parseInt(page, 10) : 1

  const result = await PostMasterMailAccounts.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  })

  res.json(result)
})

const getPostMasterMailAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const postMasterMailAccountId = Number.parseInt(id, 10)

  if (isNaN(postMasterMailAccountId))
    return res.status(400).json({ message: 'Invalid ID' })

  const postMasterMailAccount = await PostMasterMailAccounts.getById(postMasterMailAccountId)

  if (!postMasterMailAccount)
    return res.status(404).json({ message: 'PostMasterMailAccount not found' })

  res.json(postMasterMailAccount)
})

const createPostMasterMailAccount = asyncHandler(async (req, res) => {
  const data = {}

  // Обязательные поля
  data.name = req.body.name
  data.type = req.body.type
  data.authenticationType = req.body.authenticationType
  data.login = req.body.login
  data.host = req.body.host

  // Опциональные поля
  if (req.body.password !== undefined)
    data.password = req.body.password
  if (req.body.imapFolder !== undefined)
    data.imapFolder = req.body.imapFolder
  if (req.body.trusted !== undefined)
    data.trusted = req.body.trusted
  if (req.body.dispatchingBy !== undefined)
    data.dispatchingBy = req.body.dispatchingBy
  if (req.body.queueId !== undefined)
    data.queueId = req.body.queueId
  if (req.body.comment !== undefined)
    data.comment = req.body.comment
  if (req.body.oauth2TokenConfigID !== undefined)
    data.oauth2TokenConfigID = req.body.oauth2TokenConfigID
  if (req.body.isActive !== undefined)
    data.isActive = req.body.isActive

  // Новые SMTP-поля для отправки уведомлений (2026-05)
  if (req.body.smtpHost !== undefined)
    data.smtpHost = req.body.smtpHost
  if (req.body.smtpPort !== undefined)
    data.smtpPort = req.body.smtpPort
  if (req.body.smtpSecure !== undefined)
    data.smtpSecure = req.body.smtpSecure
  if (req.body.smtpUser !== undefined)
    data.smtpUser = req.body.smtpUser
  if (req.body.smtpPassword !== undefined)
    data.smtpPassword = req.body.smtpPassword
  if (req.body.smtpAuthType !== undefined)
    data.smtpAuthType = req.body.smtpAuthType
  if (req.body.smtpFromEmail !== undefined)
    data.smtpFromEmail = req.body.smtpFromEmail
  if (req.body.smtpFromName !== undefined)
    data.smtpFromName = req.body.smtpFromName
  if (req.body.useForOutgoing !== undefined)
    data.useForOutgoing = req.body.useForOutgoing

  // Шифруем чувствительные пароли (если crypto доступен)
  if (data.password) data.password = encrypt(data.password)
  if (data.smtpPassword) data.smtpPassword = encrypt(data.smtpPassword)

  // Валидация обязательных полей
  if (!data.name)
    return res.status(400).json({ message: 'name is required' })

  if (!data.type)
    return res.status(400).json({ message: 'type is required' })

  if (!data.authenticationType)
    return res.status(400).json({ message: 'authenticationType is required' })

  if (!data.login)
    return res.status(400).json({ message: 'login is required' })

  if (!data.host)
    return res.status(400).json({ message: 'host is required' })

  // Для password - требуется если authenticationType = 'password'
  if (data.authenticationType === 'password' && !data.password)
    return res.status(400).json({ message: 'password is required when authenticationType is password' })

  const newPostMasterMailAccount = await PostMasterMailAccounts.create(data)

  res.status(201).json(newPostMasterMailAccount)
})

const updatePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params
  const postMasterMailAccountId = Number.parseInt(id, 10)

  if (isNaN(postMasterMailAccountId))
    return res.status(400).json({ message: 'Invalid ID' })

  const data = {}

  // Опциональные поля
  if (req.body.name !== undefined)
    data.name = req.body.name
  if (req.body.type !== undefined)
    data.type = req.body.type
  if (req.body.authenticationType !== undefined)
    data.authenticationType = req.body.authenticationType
  if (req.body.login !== undefined)
    data.login = req.body.login
  if (req.body.password !== undefined)
    data.password = req.body.password
  if (req.body.host !== undefined)
    data.host = req.body.host
  if (req.body.imapFolder !== undefined)
    data.imapFolder = req.body.imapFolder
  if (req.body.trusted !== undefined)
    data.trusted = req.body.trusted
  if (req.body.dispatchingBy !== undefined)
    data.dispatchingBy = req.body.dispatchingBy
  if (req.body.queueId !== undefined)
    data.queueId = req.body.queueId
  if (req.body.comment !== undefined)
    data.comment = req.body.comment
  if (req.body.oauth2TokenConfigID !== undefined)
    data.oauth2TokenConfigID = req.body.oauth2TokenConfigID
  if (req.body.isActive !== undefined)
    data.isActive = req.body.isActive

  // Новые SMTP-поля (2026-05)
  if (req.body.smtpHost !== undefined)
    data.smtpHost = req.body.smtpHost
  if (req.body.smtpPort !== undefined)
    data.smtpPort = req.body.smtpPort
  if (req.body.smtpSecure !== undefined)
    data.smtpSecure = req.body.smtpSecure
  if (req.body.smtpUser !== undefined)
    data.smtpUser = req.body.smtpUser
  if (req.body.smtpPassword !== undefined)
    data.smtpPassword = req.body.smtpPassword
  if (req.body.smtpAuthType !== undefined)
    data.smtpAuthType = req.body.smtpAuthType
  if (req.body.smtpFromEmail !== undefined)
    data.smtpFromEmail = req.body.smtpFromEmail
  if (req.body.smtpFromName !== undefined)
    data.smtpFromName = req.body.smtpFromName
  if (req.body.useForOutgoing !== undefined)
    data.useForOutgoing = req.body.useForOutgoing

  // Шифруем чувствительные пароли при обновлении
  if (data.password) data.password = encrypt(data.password)
  if (data.smtpPassword) data.smtpPassword = encrypt(data.smtpPassword)

  const updatedPostMasterMailAccount = await PostMasterMailAccounts.update(postMasterMailAccountId, data)

  if (!updatedPostMasterMailAccount)
    return res.status(404).json({ message: 'PostMasterMailAccount not found' })

  res.json(updatedPostMasterMailAccount)
})

const deletePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params
  const postMasterMailAccountId = Number.parseInt(id, 10)

  if (isNaN(postMasterMailAccountId))
    return res.status(400).json({ message: 'Invalid ID' })

  const deleted = await PostMasterMailAccounts.delete(postMasterMailAccountId)

  if (!deleted)
    return res.status(404).json({ message: 'PostMasterMailAccount not found' })

  res.status(204).send()
})

const net = require('node:net')
const tls = require('node:tls')

// Helper: attempt IMAP connection and optional LOGIN
async function imapTestConnection({ host, port = 993, username, password, useTLS = true, timeout = 10000 }) {
  return new Promise(resolve => {
    const onError = err => {
      try { socket.destroy() }
      catch (e) {}
      resolve({ success: false, message: err.message || String(err) })
    }

    let socket
    let finished = false

    const handleSuccess = msg => {
      if (finished)
        return
      finished = true
      try { socket.end() }
      catch (e) {}
      resolve({ success: true, message: msg || 'OK' })
    }

    const cleanup = () => {
      if (socket) {
        socket.removeAllListeners()
        try { socket.destroy() }
        catch (e) {}
      }
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve({ success: false, message: 'Timeout' })
    }, timeout)

    const onData = data => {
      const text = data.toString()

      // Received server greeting or response
      if (/^\* OK/i.test(text)) {
        if (username && password) {
          // Send LOGIN command
          try {
            socket.write(`A001 LOGIN "${username.replace(/"/g, '')}" "${password.replace(/"/g, '')}"\r\n`)
          }
          catch (e) {
            clearTimeout(timer)
            cleanup()
            resolve({ success: false, message: 'Failed to send LOGIN' })
          }
        }
        else {
          clearTimeout(timer)
          cleanup()
          handleSuccess('Connected')
        }
      }
      else if (/A001 OK/i.test(text)) {
        clearTimeout(timer)
        cleanup()
        handleSuccess('Authenticated')
      }
      else if (/A001 NO|A001 BAD|LOGIN failed|Authentication failed/i.test(text)) {
        clearTimeout(timer)
        cleanup()
        resolve({ success: false, message: text.trim() })
      }
    }

    try {
      if (useTLS) {
        socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {
          // connected
        })
      }
      else {
        socket = net.connect(port, host, () => {
          // connected
        })
      }

      socket.setEncoding('utf8')
      socket.once('data', onData)

      // further data in case LOGIN response arrives later
      socket.on('data', onData)
      socket.on('error', err => {
        clearTimeout(timer)
        cleanup()
        resolve({ success: false, message: err.message || String(err) })
      })
      socket.on('end', () => {
        clearTimeout(timer)
        cleanup()
      })
    }
    catch (err) {
      clearTimeout(timer)
      cleanup()
      resolve({ success: false, message: err.message || String(err) })
    }
  })
}

const testConnection = asyncHandler(async (req, res) => {
  console.log('=== TEST CONNECTION DEBUG ===')
  console.log('req.body:', JSON.stringify(req.body, null, 2))
  console.log('req.headers.authorization:', req.headers.authorization)
  console.log('req.headers["content-type"]:', req.headers['content-type'])

  try {
    let { host, port, protocol, username, password, type, authenticationType } = req.body || {}

    console.log('Extracted fields ->', { host, port, protocol, username, password: password ? '***' : 'empty', type, authenticationType })

    // Нормализация
    host = host?.toString().trim() || ''
    username = username?.toString().trim().replace(/,/g, '.') || ''
    password = password?.toString().trim() || ''

    console.log('Normalized fields ->', { host, port, protocol, username, password: password || 'empty', type, authenticationType })

    // Валидация
    if (!host) {
      console.log('VALIDATION FAILED: host is empty')

      return res.status(400).json({ success: false, message: 'Хост обязателен' })
    }
    if (!username) {
      console.log('VALIDATION FAILED: username is empty')

      return res.status(400).json({ success: false, message: 'Логин обязателен' })
    }
    if (!username.includes('@')) {
      console.log('VALIDATION FAILED: username has no @')

      return res.status(400).json({ success: false, message: 'Неверный формат email' })
    }
    if (authenticationType === 'password' && !password) {
      console.log('VALIDATION FAILED: authenticationType=password but password is empty')

      return res.status(400).json({ success: false, message: 'Пароль обязателен' })
    }
    console.log('VALIDATION PASSED')

    const portNum = port ? Number.parseInt(String(port), 10) : (protocol === 'imap' || protocol === 'imapssl' ? 993 : 143)
    const useTLS = portNum === 993

    console.log('Port resolved:', { rawPort: port, portNum, useTLS })

    const result = await imapTestConnection({ host, port: portNum, username, password, useTLS })

    console.log('IMAP result:', result)
    if (result.success) {
      console.log('TEST CONNECTION RESULT: success')
      res.json({ success: true, message: result.message })
    }
    else {
      console.log('TEST CONNECTION RESULT: failed ->', result.message)
      res.status(400).json({ success: false, message: result.message })
    }
  }
  catch (err) {
    console.error('Error in testConnection:', err)
    res.status(500).json({ success: false, message: (err && err.message) ? err.message : 'Internal error' })
  }
  console.log('=== END TEST CONNECTION DEBUG ===')
})

const testConnectionById = asyncHandler(async (req, res) => {
  console.log('=== TEST CONNECTION BY ID DEBUG ===')
  console.log('params.id:', req.params.id)
  console.log('req.headers.authorization:', req.headers.authorization)

  const { id } = req.params
  const postMasterMailAccountId = Number.parseInt(id, 10)
  if (isNaN(postMasterMailAccountId)) {
    console.log('Invalid ID:', id)

    return res.status(400).json({ success: false, message: 'Invalid ID' })
  }

  console.log('Fetching account from DB, id:', postMasterMailAccountId)

  const account = await PostMasterMailAccounts.getById(postMasterMailAccountId)

  console.log('Account from DB:', account ? { id: account.id, host: account.host, login: account.login, authType: account.authenticationType, hasPassword: !!account.password } : 'NOT FOUND')

  if (!account) {
    console.log('Account NOT found')

    return res.status(404).json({ success: false, message: 'PostMasterMailAccount not found' })
  }

  const host = account.host
  const username = account.login
  const accountPassword = account.password
  const authType = (account.authenticationType || '').toString().toLowerCase()
  const isPasswordAuth = authType === 'password'

  console.log('Auth check:', { authType, isPasswordAuth, hasPassword: !!accountPassword })

  if (isPasswordAuth && !accountPassword) {
    console.log('VALIDATION FAILED: password required but missing')

    return res.status(400).json({ success: false, message: 'Пароль обязателен для аккаунтов с аутентификацией по паролю' })
  }

  // По умолчанию: SSL + порт 993 для IMAP/IMAPS, POP3S=995, POP3=110
  let port = 993
  let useTLS = true

  if (account.type && typeof account.type === 'string') {
    const t = account.type.toLowerCase()
    if (t.includes('pop3')) {
      // POP3S=995+SSL, POP3=110+noSSL
      if (t.includes('s')) { port = 995 }
      else { port = 110; useTLS = false }
    }

    // IMAP/IMAPS: по умолчанию 993+SSL (type 'imap' без 's' всё равно идёт по 993)
    // Если в БД явно указан порт — фронтенд сам передаст его и переопределит defaults
  }

  console.log('Connecting:', { host, port, username, useTLS, passwordProvided: isPasswordAuth })

  const result = await imapTestConnection({ host, port, username, password: isPasswordAuth ? accountPassword : undefined, useTLS })

  console.log('IMAP result:', result)
  if (result.success) {
    console.log('TEST BY ID RESULT: success')
    res.json({ success: true, message: result.message })
  }
  else {
    console.log('TEST BY ID RESULT: failed ->', result.message)
    res.status(400).json({ success: false, message: result.message })
  }
  console.log('=== END TEST BY ID DEBUG ===')
})

// =====================================================
// ТЕСТ SMTP ПОДКЛЮЧЕНИЯ
// POST /api/postMasterMailAccounts/:id/test-smtp
// =====================================================
const testSmtpConnection = asyncHandler(async (req, res) => {
  const { id } = req.params
  const account = await PostMasterMailAccounts.getById(Number.parseInt(id, 10))

  if (!account)
    return res.status(404).json({ success: false, message: 'Account not found' })

  const smtpHost = account.smtpHost || account.host
  const smtpPort = account.smtpPort || (account.smtpSecure ? 465 : 587)
  const smtpUser = account.smtpUser || account.login
  const smtpPass = account.smtpPassword || account.password

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({ success: false, message: 'SMTP credentials incomplete on account' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: !!account.smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    })

    await transporter.verify()

    res.json({ success: true, message: 'SMTP connection successful' })
  }
  catch (err) {
    console.error('[SMTP-TEST] Error:', err.message)
    res.status(400).json({ success: false, message: err.message })
  }
})

// =====================================================
// ТЕСТ SMTP ПОДКЛЮЧЕНИЯ ИЗ BODY (для формы)
// POST /api/postMasterMailAccounts/test-smtp
// =====================================================
const testSmtpConnectionFromBody = asyncHandler(async (req, res) => {
  const { host, port, secure, username, password } = req.body

  if (!host || !username || !password) {
    return res.status(400).json({ success: false, message: 'SMTP credentials required' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: port || (secure ? 465 : 587),
      secure: !!secure,
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
    })

    await transporter.verify()

    res.json({ success: true, message: 'SMTP connection successful' })
  }
  catch (err) {
    console.error('[SMTP-TEST] Error:', err.message)
    res.status(400).json({ success: false, message: err.message })
  }
})

module.exports = {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccount,
  updatePostMasterMailAccount,
  deletePostMasterMailAccount,
  testConnection,
  testConnectionById,
  testSmtpConnection,
  testSmtpConnectionFromBody,
}
