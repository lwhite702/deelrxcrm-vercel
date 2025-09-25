/**
 * Error Handling Components for DeelRx CRM
 * 
 * Provides consistent error states and recovery options
 * with mobile-friendly responsive design.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

// Base error boundary component
export function ErrorFallback({
  error,
  resetError,
  className
}: {
  error: Error;
  resetError?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-64 p-6 text-center',
      'bg-card border border-destructive/20 rounded-lg',
      className
    )}>
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2">
        {resetError && (
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}

// Network error component
export function NetworkError({
  onRetry,
  className
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-6 text-center',
      'bg-card border border-orange-200 rounded-lg',
      className
    )}>
      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Connection Problem
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Unable to connect to the server. Please check your internet connection and try again.
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      )}
    </div>
  );
}

// Not found component
export function NotFound({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  showBackButton = true,
  className
}: {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-64 p-6 text-center',
      className
    )}>
      <div className="text-6xl font-bold text-muted-foreground/30 mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showBackButton && (
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>
    </div>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  action,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      'bg-card border-2 border-dashed border-muted rounded-lg',
      className
    )}>
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Form validation error
export function FormError({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-start gap-2 p-3 text-sm bg-destructive/10 border border-destructive/20 rounded-md',
      className
    )}>
      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
      <span className="text-destructive">{message}</span>
    </div>
  );
}

// Toast-style error notification
export function ErrorToast({
  message,
  onDismiss,
  className
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-sm w-full',
      'bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg',
      'animate-in slide-in-from-top-2 duration-300',
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-destructive-foreground/70 hover:text-destructive-foreground"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Permission denied component
export function PermissionDenied({
  className
}: {
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-64 p-6 text-center',
      'bg-card border border-orange-200 rounded-lg',
      className
    )}>
      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Access Denied
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
      </p>
      
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </button>
    </div>
  );
}

// Maintenance mode component
export function MaintenanceMode({
  className
}: {
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background',
      className
    )}>
      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Maintenance Mode
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        We're performing scheduled maintenance to improve your experience. 
        We'll be back shortly!
      </p>
      
      <p className="text-sm text-muted-foreground">
        Expected completion: <span className="font-medium">30 minutes</span>
      </p>
    </div>
  );
}

// Error boundary wrapper component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error || new Error('Unknown error occurred')}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export default {
  ErrorFallback,
  NetworkError,
  NotFound,
  EmptyState,
  FormError,
  ErrorToast,
  PermissionDenied,
  MaintenanceMode,
  ErrorBoundary
};