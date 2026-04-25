import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import logger from "../lib/logger";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // Handle specific error types
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: "Validation failed",
      details: err.flatten()
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: "Unique constraint violation",
      details: err.meta
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: "Resource not found"
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }

  // Default error
  const status = err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
