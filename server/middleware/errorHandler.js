/**
 * Error Handling Middleware
 * Centralized error handling for Express application
 */

import Logger from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and returns appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let isOperational = err.isOperational || false;

  // Log the error
  Logger.error('Error occurred', err, {
    path: req.path,
    method: req.method,
    statusCode,
    userId: req.user?.userId,
    ip: req.ip
  });

  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    const errors = Object.values(err.errors).map(e => e.message);
    
    return res.status(statusCode).json({
      error: {
        message,
        details: errors,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Build error response
  const errorResponse = {
    error: {
      message,
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details || undefined;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    true
  );
  
  Logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });

  next(error);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request logger middleware
 * Logs all incoming requests
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  Logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    Logger.request(req.method, req.path, res.statusCode, duration, {
      userId: req.user?.userId
    });
  });

  next();
};

export default {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger
};
