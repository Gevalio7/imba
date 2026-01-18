import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  constructor(statusCode: number, message: string, isOperational?: boolean, stack?: string);
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
export function notFound(req: Request, res: Response, next: NextFunction): void;
export function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>): (req: Request, res: Response, next: NextFunction) => void;
