/**
 * Logging Utility
 * Provides structured logging for all operations
 */

import { config } from '../config/env.js';

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Colors for console output (optional)
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  // In production, return JSON for log aggregation
  if (config.nodeEnv === 'production') {
    return JSON.stringify(logEntry);
  }

  // In development, return formatted string with colors
  const color = COLORS[level] || '';
  const reset = COLORS.RESET;
  const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${color}[${timestamp}] ${level}: ${message}${reset}${metaStr}`;
};

/**
 * Logger class
 */
class Logger {
  /**
   * Log error message
   */
  static error(message, error = null, meta = {}) {
    const logMeta = { ...meta };
    
    if (error) {
      logMeta.error = {
        message: error.message,
        stack: error.stack,
        ...(error.code && { code: error.code }),
        ...(error.status && { status: error.status })
      };
    }

    console.error(formatMessage(LOG_LEVELS.ERROR, message, logMeta));
  }

  /**
   * Log warning message
   */
  static warn(message, meta = {}) {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  /**
   * Log info message
   */
  static info(message, meta = {}) {
    console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
  }

  /**
   * Log debug message (only in development)
   */
  static debug(message, meta = {}) {
    if (config.nodeEnv === 'development') {
      console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log authentication attempt
   */
  static auth(action, email, success, meta = {}) {
    const message = `Authentication ${action}: ${email}`;
    const logMeta = {
      action,
      email,
      success,
      ...meta
    };

    if (success) {
      this.info(message, logMeta);
    } else {
      this.warn(message, logMeta);
    }
  }

  /**
   * Log database operation
   */
  static db(operation, collection, success, meta = {}) {
    const message = `Database ${operation} on ${collection}`;
    const logMeta = {
      operation,
      collection,
      success,
      ...meta
    };

    if (success) {
      this.debug(message, logMeta);
    } else {
      this.error(message, null, logMeta);
    }
  }

  /**
   * Log API request
   */
  static request(method, path, statusCode, duration, meta = {}) {
    const message = `${method} ${path} - ${statusCode}`;
    const logMeta = {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      ...meta
    };

    if (statusCode >= 500) {
      this.error(message, null, logMeta);
    } else if (statusCode >= 400) {
      this.warn(message, logMeta);
    } else {
      this.info(message, logMeta);
    }
  }
}

export default Logger;
