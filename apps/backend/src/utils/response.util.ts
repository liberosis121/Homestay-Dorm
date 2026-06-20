import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res: Response, error: any, defaultMessage: string = 'Internal Server Error') => {
  console.error('[API Error]:', error);
  const status = error.status || 500;
  const message = error.message || defaultMessage;
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};