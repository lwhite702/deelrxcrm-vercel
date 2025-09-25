/**
 * Loading States and Skeletons for DeelRx CRM
 * 
 * Provides consistent loading states across the application
 * with proper mobile responsiveness and accessibility.
 */

import { cn } from '../../lib/utils';

// Base skeleton component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/80',
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}

// Card skeleton for dashboard cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

// Table skeleton for data tables
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border', className)}>
      {/* Table Header */}
      <div className="border-b bg-muted/50">
        <div className="flex h-12 items-center px-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                'h-4',
                i === 0 ? 'w-8' : 'flex-1 max-w-32'
              )} 
            />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b last:border-b-0">
          <div className="flex h-14 items-center px-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  'h-4',
                  colIndex === 0 ? 'w-8' : 'flex-1 max-w-28'
                )} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Customer card skeleton
export function CustomerCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-4 space-y-3',
      'hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// Order list skeleton
export function OrderListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-4">
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          <div className="flex sm:hidden">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard stats skeleton
export function DashboardStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Form skeleton for loading forms
export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  );
}

// Page loading component with mobile optimization
export function PageSkeleton({ 
  title = true,
  stats = false,
  table = false,
  form = false,
  className 
}: {
  title?: boolean;
  stats?: boolean;
  table?: boolean;
  form?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6 p-4 sm:p-6', className)}>
      {/* Page Header */}
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}
      
      {/* Stats Cards */}
      {stats && <DashboardStatsSkeleton />}
      
      {/* Table Content */}
      {table && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <TableSkeleton />
        </div>
      )}
      
      {/* Form Content */}
      {form && <FormSkeleton />}
    </div>
  );
}

// Loading overlay for async operations
export function LoadingOverlay({ 
  isLoading,
  children,
  message = 'Loading...'
}: {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}) {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile-friendly button loading state
export function ButtonLoading({ 
  isLoading,
  children,
  className,
  ...props
}: {
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {children}
    </button>
  );
}

export default {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  CustomerCardSkeleton,
  OrderListSkeleton,
  DashboardStatsSkeleton,
  FormSkeleton,
  PageSkeleton,
  LoadingOverlay,
  ButtonLoading
};