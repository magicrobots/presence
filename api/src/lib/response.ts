import type { Response } from 'express';
import type { ApiResponse } from '@presence/types';

export function sendSuccess<T>(res: Response, data: T): void {
  const body: ApiResponse<T> = { success: true, data };
  res.json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number,
  code?: string
): void {
  const body: ApiResponse<never> = { success: false, error: message, ...(code !== undefined ? { code } : {}) };
  res.status(statusCode).json(body);
}
