const jwt = require('jsonwebtoken')
const User = require('../models/users')
const Agents = require('../models/agents')
const SessionManagement = require('../models/sessionManagement')

// Middleware для проверки JWT токена
const protect = async (req, res, next) => {
  let token

  // Проверяем наличие токена в заголовке Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1]
      console.log('Token received:', token)

      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')

      console.log('Decoded token:', decoded)

      // Добавляем user в request
      req.user = { id: decoded.userId }
      console.log('Set req.user.id:', req.user.id)

      // Проверяем активную сессию
      try {
        let entity = await User.getById(decoded.userId)
        let login = null
        if (!entity) {
          // Проверяем в agents
          entity = await Agents.getById(decoded.userId)
          if (!entity)
            return res.status(401).json({ message: 'Пользователь не найден' })

          login = entity.login
        }
        else {
          login = entity.login
        }

        const sessions = await SessionManagement.getAll({ q: decoded.userId.toString() })
        const activeSession = sessions.sessionManagement.find(s => s.isActive && s.userId === decoded.userId)

        if (!activeSession)
          return res.status(401).json({ message: 'Сессия истекла или была завершена' })

        // Обновляем время последней активности сессии
        await SessionManagement.update(activeSession.id, { lastActivity: new Date().toISOString() })

        // Добавляем сессию в req для возможного использования
        req.session = activeSession
      }
      catch (error) {
        console.error('Ошибка проверки сессии:', error)

        return res.status(500).json({ message: 'Ошибка сервера при проверке сессии' })
      }

      next()
    }
    catch (error) {
      console.error('Ошибка проверки токена:', error)

      return res.status(401).json({ message: 'Не авторизован, токен недействителен' })
    }
  }

  if (!token)
    return res.status(401).json({ message: 'Не авторизован, токен отсутствует' })
}

module.exports = { protect }
