const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
const protect = (req, res, next) => {
  let token;

  // Проверяем наличие токена в заголовке Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];

      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Добавляем userId в request
      req.userId = decoded.userId;

      next();
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return res.status(401).json({ message: 'Не авторизован, токен недействителен' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Не авторизован, токен отсутствует' });
  }
};

module.exports = { protect };
