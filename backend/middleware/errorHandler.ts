import type { NextFunction, Request, Response } from 'express'

// Обработчик для несуществующих маршрутов
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)

  res.status(404)
  next(error)
}

// Общий обработчик ошибок
export const errorHandler = (
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Если ошибка имеет statusCode (например, 409 для конфликта), используем его
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode)
  let message = err.message

  // Обработка ошибок уникальности PostgreSQL (код 23505)
  if (err.code === '23505') {
    statusCode = 409

    // Извлекаем понятное сообщение из ошибки PostgreSQL
    if (message.includes('agents_login_key'))
      message = 'Агент с таким логином уже существует'
    else if (message.includes('agents_email_key'))
      message = 'Агент с таким email уже существует'
    else
      message = 'Запись с такими данными уже существует'
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  })
}

// Async handler для обработки асинхронных ошибок
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
