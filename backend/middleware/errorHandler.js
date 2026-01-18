/**
 * Middleware для обработки ошибок
 */

// Класс для кастомных ошибок API
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Обработчик ошибок
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Если ошибка не является ApiError, устанавливаем статус 500
  if (!statusCode) {
    statusCode = 500;
  }

  // Логирование ошибки
  console.error('❌ Error:', {
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Формирование ответа
  const response = {
    success: false,
    message: message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

// Обработчик для несуществующих роутов
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

// Обработчик для async функций
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errorHandler,
  notFound,
  asyncHandler,
};
