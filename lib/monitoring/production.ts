/**
 * Production Monitoring and Logging Setup for DeelRx CRM
 * 
 * Provides comprehensive monitoring, logging, and error tracking
 * for production deployment readiness.
 */

import { NextRequest, NextResponse } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Structured logging interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
  teamId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Production logger class
export class ProductionLogger {
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableRemote: boolean;

  constructor(options: {
    logLevel?: LogLevel;
    enableConsole?: boolean;
    enableRemote?: boolean;
  } = {}) {
    this.logLevel = options.logLevel ?? LogLevel.INFO;
    this.enableConsole = options.enableConsole ?? true;
    this.enableRemote = options.enableRemote ?? process.env.NODE_ENV === 'production';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      requestId: metadata?.requestId,
      userId: metadata?.userId,
      teamId: metadata?.teamId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatForConsole(entry: LogEntry): string {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const levelName = levelNames[entry.level];
    const timestamp = entry.timestamp;
    
    let formatted = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.requestId) {
      formatted += ` (req: ${entry.requestId})`;
    }
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    if (entry.error) {
      formatted += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.enableRemote) return;

    // In production, you would send to your logging service
    // Examples: Vercel Analytics, Datadog, LogRocket, etc.
    try {
      // Example implementation for Vercel Analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('track', 'log_entry', {
          level: LogLevel[entry.level],
          message: entry.message,
          metadata: entry.metadata
        });
      }
      
      // For server-side logging, you could use:
      // - Vercel Edge Functions logging
      // - External logging services via HTTP
      // - Database logging for critical events
    } catch (error) {
      console.error('Failed to send log to remote service:', error);
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, metadata, error);

    if (this.enableConsole) {
      const formatted = this.formatForConsole(entry);
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
      }
    }

    // Send to remote logging service
    this.sendToRemote(entry);
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
}

// Global logger instance
export const logger = new ProductionLogger({
  logLevel: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG :
           process.env.LOG_LEVEL === 'info' ? LogLevel.INFO :
           process.env.LOG_LEVEL === 'warn' ? LogLevel.WARN :
           LogLevel.ERROR
});

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      
      logger.debug(`Performance: ${operation} completed in ${duration}ms`);
    };
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Error tracking and reporting
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  captureError(error: Error, context?: {
    userId?: string;
    teamId?: string;
    requestId?: string;
    additional?: Record<string, any>;
  }): void {
    const errorKey = `${error.name}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    logger.error('Application error captured', {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      errorCount: currentCount + 1
    }, error);

    // In production, send to error tracking service
    this.sendToErrorService(error, context);
  }

  private async sendToErrorService(error: Error, context?: any): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      // Example: Send to Sentry, Bugsnag, or other error tracking service
      // await sentryClient.captureException(error, { extra: context });
    } catch (reportingError) {
      logger.error('Failed to report error to tracking service', {
        originalError: error.message,
        reportingError: (reportingError as Error).message
      });
    }
  }

  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

export const errorTracker = ErrorTracker.getInstance();

// Request logging middleware
export function createRequestLogger() {
  return (request: NextRequest): NextResponse | void => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    // Log request start
    logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    // Add timing to response
    const response = NextResponse.next();
    
    response.headers.set('x-request-id', requestId);
    
    // Log request completion (this would need to be handled differently in actual middleware)
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      duration,
      status: response.status
    });

    performanceMonitor.recordMetric('request_duration', duration);

    return response;
  };
}

// Health check endpoint
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: Record<string, any>;
  timestamp: string;
}> {
  const checks: Record<string, boolean> = {};
  
  // Database health check
  try {
    // In actual implementation, test database connection
    checks.database = true;
  } catch (error) {
    checks.database = false;
    errorTracker.captureError(error as Error, { additional: { context: 'health_check' } });
  }

  // External services health check
  checks.external_apis = true; // Implement actual checks

  // Memory usage check
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9;
  } else {
    checks.memory = true;
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    metrics: performanceMonitor.getAllMetrics(),
    timestamp: new Date().toISOString()
  };
}

// Production monitoring utilities
export const monitoring = {
  logger,
  performanceMonitor,
  errorTracker,
  createRequestLogger,
  healthCheck,
  LogLevel
};

export default monitoring;