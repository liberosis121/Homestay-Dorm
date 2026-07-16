import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success', status: number = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res: Response, error: any, defaultMessage: string = 'Internal Server Error', status: number = 500) => {
  console.error('[API Error]:', error);
  const finalStatus = error?.status || status || 500;
  const message = error?.message || defaultMessage;
  return res.status(finalStatus).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};