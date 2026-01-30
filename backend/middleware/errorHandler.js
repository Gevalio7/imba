// Обработчик для несуществующих маршрутов
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Общий обработчик ошибок
const errorHandler = (err, req, res, next) => {
  // Если ошибка имеет statusCode (например, 409 для конфликта), используем его
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Обработка ошибок уникальности PostgreSQL
  if (err.code === '23505') {
    statusCode = 409;
    // Извлекаем понятное сообщение из ошибки PostgreSQL
    if (err.message.includes('agents_login_key')) {
      err.message = 'Агент с таким логином уже существует';
    } else if (err.message.includes('agents_email_key')) {
      err.message = 'Агент с таким email уже существует';
    } else {
      err.message = 'Запись с такими данными уже существует';
    }
  }
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

// Async handler для обработки асинхронных ошибок
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
};
