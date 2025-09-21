import { AlertTriangle, BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartLoadingProps {
  title: string;
  height?: string;
}

interface ChartEmptyProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ChartErrorProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function ChartLoading({ title, height = "h-80" }: ChartLoadingProps) {
  return (
    <Card className="glass urban-card">
      <CardHeader>
        <CardTitle className="text-heading flex items-center gap-2">
          <div className="animate-pulse">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${height} w-full space-y-3`}>
          {/* Chart skeleton with animated shimmer */}
          <div className="relative overflow-hidden rounded bg-muted/50">
            <div className={`${height} w-full bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50`}>
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
          
          {/* Legend skeleton */}
          <div className="flex justify-center gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartEmpty({ title, message, actionLabel, onAction }: ChartEmptyProps) {
  return (
    <Card className="glass urban-card">
      <CardHeader>
        <CardTitle className="text-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">No Data Available</h3>
          <p className="text-sm text-muted-foreground">
            {message || "There's no data to display in this chart yet."}
          </p>
        </div>
        
        {actionLabel && onAction && (
          <Button variant="outline" onClick={onAction} className="mt-4" data-testid="button-chart-action">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartError({ title, message, onRetry }: ChartErrorProps) {
  return (
    <Card className="glass urban-card border-destructive/50">
      <CardHeader>
        <CardTitle className="text-heading flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Failed to Load Chart</h3>
          <p className="text-sm text-muted-foreground">
            {message || "There was an error loading the chart data. Please try again."}
          </p>
        </div>
        
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-4" data-testid="button-retry-chart">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced skeleton for complex chart layouts
export function ChartSkeleton({ height = "h-80" }: { height?: string }) {
  return (
    <div className={`${height} w-full space-y-4`}>
      {/* Y-axis labels */}
      <div className="flex">
        <div className="w-8 flex flex-col justify-between py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>
        
        {/* Chart area with animated bars/lines */}
        <div className="flex-1 flex items-end gap-2 px-4">
          {[40, 65, 80, 45, 90, 55, 75, 30].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton 
                className="w-full animate-pulse"
                style={{ height: `${height}%` }}
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimistic loading button with state
export function LoadingButton({ 
  children, 
  isLoading = false, 
  loadingText = "Loading...", 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
}) {
  return (
    <Button 
      {...props} 
      disabled={isLoading || props.disabled}
      className="transition-all duration-200"
      aria-busy={isLoading}
    >
      {isLoading && (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      )}
      {isLoading ? loadingText : children}
    </Button>
  );
}