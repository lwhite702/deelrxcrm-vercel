/**
 * Advanced Error Tracking and Monitoring System
 * 
 * Comprehensive error handling and monitoring for DeelRx CRM including:
 * - Real-time error capture and reporting
 * - User context and session tracking
 * - Performance impact analysis
 * - Automated alerting and notifications
 * - Error grouping and deduplication
 * - Stack trace analysis
 * - User session replay integration
 * - Error recovery suggestions
 * 
 * Created: September 2025
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { analytics } from './product-analytics';
import { performanceMonitor } from './performance-monitoring';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 
  | 'javascript' 
  | 'network' 
  | 'authentication' 
  | 'validation' 
  | 'business_logic' 
  | 'ui_rendering' 
  | 'api_error' 
  | 'performance' 
  | 'security' 
  | 'data_integrity';

// Error details
export interface ErrorDetails {
  id: string;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  
  // Context information
  userContext?: {
    id?: string;
    email?: string;
    role?: string;
    subscription?: string;
    lastAction?: string;
    currentPage?: string;
  };
  
  // Technical context
  technicalContext: {
    component?: string;
    function?: string;
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
    buildVersion?: string;
    environment: 'development' | 'staging' | 'production';
  };
  
  // Performance impact
  performanceImpact?: {
    renderTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    affectedUsers?: number;
  };
  
  // Additional metadata
  metadata: Record<string, any>;
  tags: string[];
  fingerprint: string; // For grouping similar errors
  
  // Resolution tracking
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

// Error boundary props
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

// Alert configuration
export interface AlertConfig {
  id: string;
  name: string;
  conditions: AlertCondition[];
  recipients: string[];
  channels: ('email' | 'slack' | 'webhook')[];
  throttle: number; // Minutes between alerts
  enabled: boolean;
}

export interface AlertCondition {
  type: 'error_count' | 'error_rate' | 'severity' | 'new_error' | 'performance_impact';
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
  timeWindow: number; // Minutes
}

class ErrorTracker {
  private errors: Map<string, ErrorDetails> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private sessionId: string;
  private userId?: string;
  private initialized = false;
  private errorQueue: ErrorDetails[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  // Initialize error tracker
  async initialize(userId?: string) {
    if (this.initialized) return;

    this.userId = userId;
    await this.loadAlertConfigs();
    this.setupPerformanceObserver();
    this.setupNetworkMonitoring();
    this.startErrorReporting();
    
    this.initialized = true;
    console.log('✅ Error tracker initialized');
  }

  // Set up global error event listeners
  private setupEventListeners() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        category: 'javascript',
        severity: 'medium',
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        category: 'javascript',
        severity: 'high',
        metadata: { reason: event.reason },
      });
    });

    // Network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility changes (for session tracking)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        analytics.trackEvent('session_hidden', { session_id: this.sessionId });
      } else {
        analytics.trackEvent('session_visible', { session_id: this.sessionId });
      }
    });
  }

  // Capture and process error
  captureError(errorInput: {
    message: string;
    stack?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    component?: string;
    function?: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
    metadata?: Record<string, any>;
    tags?: string[];
  }) {
    const error: ErrorDetails = {
      id: this.generateErrorId(),
      message: errorInput.message,
      stack: errorInput.stack,
      category: errorInput.category || 'javascript',
      severity: errorInput.severity || 'medium',
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      
      userContext: this.getUserContext(),
      
      technicalContext: {
        component: errorInput.component,
        function: errorInput.function,
        fileName: errorInput.fileName,
        lineNumber: errorInput.lineNumber,
        columnNumber: errorInput.columnNumber,
        buildVersion: process.env.REACT_APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
      },
      
      performanceImpact: this.getPerformanceImpact(),
      
      metadata: {
        ...errorInput.metadata,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: Date.now(),
      },
      
      tags: errorInput.tags || [],
      fingerprint: this.generateFingerprint(errorInput.message, errorInput.stack),
    };

    // Store error
    this.errors.set(error.id, error);

    // Queue for reporting
    this.errorQueue.push(error);

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }

    // Track in analytics
    analytics.trackEvent('error_captured', {
      error_id: error.id,
      error_message: error.message,
      error_category: error.category,
      error_severity: error.severity,
      session_id: this.sessionId,
      user_id: this.userId,
    });

    // Check alert conditions
    this.checkAlertConditions(error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error captured:', error);
    }

    return error.id;
  }

  // Capture network errors
  captureNetworkError(url: string, status: number, statusText: string, responseTime?: number) {
    this.captureError({
      message: `Network Error: ${status} ${statusText} - ${url}`,
      category: 'network',
      severity: status >= 500 ? 'high' : 'medium',
      metadata: {
        url,
        status,
        statusText,
        responseTime,
        method: 'unknown',
      },
      tags: ['network', 'api'],
    });
  }

  // Capture API errors
  captureAPIError(url: string, method: string, status: number, error: any, responseTime?: number) {
    this.captureError({
      message: `API Error: ${method} ${url} - ${status}`,
      category: 'api_error',
      severity: status >= 500 ? 'high' : 'medium',
      metadata: {
        url,
        method,
        status,
        error: typeof error === 'string' ? error : JSON.stringify(error),
        responseTime,
      },
      tags: ['api', 'network'],
    });
  }

  // Capture validation errors
  captureValidationError(field: string, value: any, rule: string, component?: string) {
    this.captureError({
      message: `Validation Error: ${field} failed ${rule} validation`,
      category: 'validation',
      severity: 'low',
      component,
      metadata: {
        field,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        rule,
      },
      tags: ['validation', 'form'],
    });
  }

  // Capture business logic errors
  captureBusinessError(message: string, context: Record<string, any>, component?: string) {
    this.captureError({
      message: `Business Logic Error: ${message}`,
      category: 'business_logic',
      severity: 'medium',
      component,
      metadata: context,
      tags: ['business', 'logic'],
    });
  }

  // Get user context information
  private getUserContext() {
    if (!this.userId) return undefined;

    return {
      id: this.userId,
      // These would be populated from your user management system
      email: analytics.getUserProperty('email'),
      role: analytics.getUserProperty('role'),
      subscription: analytics.getUserProperty('subscription'),
      lastAction: analytics.getUserProperty('last_action'),
      currentPage: window.location.pathname,
    };
  }

  // Get performance impact information
  private getPerformanceImpact() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      renderTime: navigation?.loadEventEnd - navigation?.navigationStart,
      memoryUsage: memory?.usedJSHeapSize,
      networkLatency: navigation?.responseEnd - navigation?.requestStart,
      affectedUsers: 1, // This would be calculated based on similar errors
    };
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(message: string, stack?: string): string {
    const key = stack ? `${message}:${stack.split('\n')[0]}` : message;
    return btoa(key).substr(0, 16);
  }

  // Flush error queue to backend
  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      // Re-queue errors if failed to send
      this.errorQueue.push(...errors);
      console.error('Failed to send errors:', error);
    }
  }

  // Load alert configurations
  private async loadAlertConfigs() {
    try {
      const response = await fetch('/api/alerts/configs');
      const configs: AlertConfig[] = await response.json();
      
      configs.forEach(config => {
        this.alerts.set(config.id, config);
      });
    } catch (error) {
      console.error('Failed to load alert configs:', error);
    }
  }

  // Check if error meets alert conditions
  private checkAlertConditions(error: ErrorDetails) {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return;

      const meetsConditions = alert.conditions.every(condition => {
        switch (condition.type) {
          case 'severity':
            return this.compareSeverity(error.severity, condition.operator, condition.value as ErrorSeverity);
          case 'new_error':
            return !this.errors.has(error.fingerprint);
          case 'error_count':
            return this.checkErrorCount(condition);
          case 'error_rate':
            return this.checkErrorRate(condition);
          default:
            return false;
        }
      });

      if (meetsConditions) {
        this.triggerAlert(alert, error);
      }
    });
  }

  // Compare error severity
  private compareSeverity(severity: ErrorSeverity, operator: string, target: ErrorSeverity): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentLevel = severityLevels[severity];
    const targetLevel = severityLevels[target];

    switch (operator) {
      case '>': return currentLevel > targetLevel;
      case '<': return currentLevel < targetLevel;
      case '=': return currentLevel === targetLevel;
      case '>=': return currentLevel >= targetLevel;
      case '<=': return currentLevel <= targetLevel;
      default: return false;
    }
  }

  // Check error count condition
  private checkErrorCount(condition: AlertCondition): boolean {
    const timeWindow = condition.timeWindow * 60 * 1000; // Convert to milliseconds
    const cutoff = Date.now() - timeWindow;
    
    const recentErrors = Array.from(this.errors.values()).filter(
      error => error.timestamp.getTime() > cutoff
    );

    return this.compareValue(recentErrors.length, condition.operator, condition.value as number);
  }

  // Check error rate condition
  private checkErrorRate(condition: AlertCondition): boolean {
    // This would calculate errors per minute or similar
    const timeWindow = condition.timeWindow * 60 * 1000;
    const cutoff = Date.now() - timeWindow;
    
    const recentErrors = Array.from(this.errors.values()).filter(
      error => error.timestamp.getTime() > cutoff
    );
    
    const rate = recentErrors.length / (timeWindow / 60000); // Errors per minute
    return this.compareValue(rate, condition.operator, condition.value as number);
  }

  // Compare numeric values
  private compareValue(current: number, operator: string, target: number): boolean {
    switch (operator) {
      case '>': return current > target;
      case '<': return current < target;
      case '=': return current === target;
      case '>=': return current >= target;
      case '<=': return current <= target;
      default: return false;
    }
  }

  // Trigger alert
  private async triggerAlert(alert: AlertConfig, error: ErrorDetails) {
    try {
      await fetch('/api/alerts/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alert.id,
          alertName: alert.name,
          error,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to trigger alert:', err);
    }
  }

  // Set up performance observer
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 1000) { // Long tasks > 1 second
            this.captureError({
              message: `Performance Issue: Long task detected (${entry.duration}ms)`,
              category: 'performance',
              severity: 'medium',
              metadata: {
                entryType: entry.entryType,
                duration: entry.duration,
                startTime: entry.startTime,
              },
              tags: ['performance', 'long-task'],
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Set up network monitoring
  private setupNetworkMonitoring() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        if (!response.ok) {
          this.captureNetworkError(url, response.status, response.statusText, duration);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.captureError({
          message: `Network Request Failed: ${url}`,
          category: 'network',
          severity: 'high',
          metadata: {
            url,
            duration,
            error: error.message,
          },
          tags: ['network', 'fetch'],
        });
        throw error;
      }
    };
  }

  // Start periodic error reporting
  private startErrorReporting() {
    setInterval(() => {
      if (this.isOnline && this.errorQueue.length > 0) {
        this.flushErrorQueue();
      }
    }, 10000); // Every 10 seconds
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentCount: number;
  } {
    const errors = Array.from(this.errors.values());
    const recentCutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    
    const byCategory = {} as Record<ErrorCategory, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;
    
    errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });
    
    const recentCount = errors.filter(error => error.timestamp.getTime() > recentCutoff).length;
    
    return {
      total: errors.length,
      byCategory,
      bySeverity,
      recentCount,
    };
  }

  // Get error by ID
  getError(errorId: string): ErrorDetails | undefined {
    return this.errors.get(errorId);
  }

  // Mark error as resolved
  async resolveError(errorId: string, resolution: string, resolvedBy: string): Promise<void> {
    const error = this.errors.get(errorId);
    if (!error) return;

    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolvedBy = resolvedBy;
    error.resolution = resolution;

    try {
      await fetch(`/api/errors/${errorId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution,
          resolvedBy,
          resolvedAt: error.resolvedAt.toISOString(),
        }),
      });
    } catch (err) {
      console.error('Failed to mark error as resolved:', err);
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// React Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; errorId: string; reset: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = errorTracker.captureError({
      message: error.message,
      stack: error.stack,
      category: 'ui_rendering',
      severity: 'high',
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      metadata: {
        errorInfo: errorInfo.componentStack,
        errorBoundary: true,
      },
      tags: ['react', 'error-boundary'],
    });

    this.setState({ error, errorInfo, errorId });
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          errorId: this.state.errorId,
          reset: () => this.setState({ hasError: false, error: undefined, errorId: undefined }),
        });
      }

      return React.createElement('div', {
        style: {
          padding: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#c92a2a',
          margin: '20px',
        },
      }, [
        React.createElement('h3', { key: 'title' }, 'Something went wrong'),
        React.createElement('p', { key: 'message' }, this.state.error.message),
        React.createElement('p', { key: 'error-id', style: { fontSize: '12px', color: '#868e96' } }, 
          `Error ID: ${this.state.errorId}`
        ),
        React.createElement('button', {
          key: 'retry',
          onClick: () => this.setState({ hasError: false, error: undefined, errorId: undefined }),
          style: {
            padding: '8px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
          },
        }, 'Try Again'),
      ]);
    }

    return this.props.children;
  }
}

// React Context for error tracking
const ErrorTrackingContext = createContext<{
  captureError: (error: any) => string;
  captureNetworkError: (url: string, status: number, statusText: string, responseTime?: number) => void;
  captureAPIError: (url: string, method: string, status: number, error: any, responseTime?: number) => void;
  getErrorStats: () => any;
}>({
  captureError: () => '',
  captureNetworkError: () => {},
  captureAPIError: () => {},
  getErrorStats: () => ({}),
});

// Error Tracking Provider
export const ErrorTrackingProvider: React.FC<{
  children: React.ReactNode;
  userId?: string;
}> = ({ children, userId }) => {
  useEffect(() => {
    errorTracker.initialize(userId);
  }, [userId]);

  const contextValue = {
    captureError: errorTracker.captureError.bind(errorTracker),
    captureNetworkError: errorTracker.captureNetworkError.bind(errorTracker),
    captureAPIError: errorTracker.captureAPIError.bind(errorTracker),
    getErrorStats: errorTracker.getErrorStats.bind(errorTracker),
  };

  return React.createElement(ErrorTrackingContext.Provider, { value: contextValue }, children);
};

// React hook for error tracking
export const useErrorTracking = () => {
  const context = useContext(ErrorTrackingContext);
  if (!context) {
    throw new Error('useErrorTracking must be used within ErrorTrackingProvider');
  }
  return context;
};

// Hook for error handling with automatic capture
export const useErrorHandler = () => {
  const { captureError } = useErrorTracking();

  return {
    handleError: (error: Error | string, context?: Record<string, any>) => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;
      
      return captureError({
        message: errorMessage,
        stack: errorStack,
        metadata: context,
      });
    },
    
    handleAsyncError: async (asyncFn: () => Promise<any>, context?: Record<string, any>) => {
      try {
        return await asyncFn();
      } catch (error) {
        captureError({
          message: error.message,
          stack: error.stack,
          metadata: context,
          tags: ['async'],
        });
        throw error;
      }
    },
  };
};

// Utility function to wrap functions with error handling
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Record<string, any>
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.catch === 'function') {
        return result.catch((error: Error) => {
          errorTracker.captureError({
            message: error.message,
            stack: error.stack,
            metadata: { ...context, args },
            tags: ['wrapped-function', 'async'],
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorTracker.captureError({
        message: error.message,
        stack: error.stack,
        metadata: { ...context, args },
        tags: ['wrapped-function'],
      });
      throw error;
    }
  }) as T;
};

export default errorTracker;