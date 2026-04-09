const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
const protect = (req, res, next) => {
  let token;

  // Проверяем наличие токена в заголовке Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token);

      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Decoded token:', decoded);

      // Добавляем user в request
      req.user = { id: decoded.userId };
      console.log('Set req.user.id:', req.user.id);

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
