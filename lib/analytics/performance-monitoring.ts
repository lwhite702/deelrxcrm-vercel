/**
 * Performance Monitoring System
 * 
 * Comprehensive real-time performance monitoring for DeelRx CRM including:
 * - Core Web Vitals tracking
 * - API response time monitoring
 * - User experience metrics
 * - Resource utilization tracking
 * - Real-time alerts and dashboards
 * 
 * Created: September 2025
 */

import { analytics } from './product-analytics';

// Core Web Vitals metrics
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

// API Performance metrics
export interface APIPerformanceMetric {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  duration: number;
  status: number;
  success: boolean;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
}

// Resource Performance metrics
export interface ResourceMetric {
  name: string;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
  startTime: number;
  duration: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

// User Experience metrics
export interface UserExperienceMetric {
  metric: string;
  value: number;
  context: {
    page: string;
    userAgent: string;
    connectionType?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  timestamp: Date;
}

class PerformanceMonitor {
  private metricsBuffer: Array<WebVitalsMetric | APIPerformanceMetric | ResourceMetric> = [];
  private isInitialized = false;
  private observer?: PerformanceObserver;

  // Initialize performance monitoring
  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupWebVitalsTracking();
    this.setupResourceTracking();
    this.setupAPITracking();
    this.setupUserExperienceTracking();
    this.startMetricsReporting();

    this.isInitialized = true;
    console.log('✅ Performance monitoring initialized');
  }

  // Track Core Web Vitals
  private setupWebVitalsTracking() {
    if (typeof window === 'undefined') return;

    // Import and setup web-vitals
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: WebVitalsMetric) => {
        // Report to analytics
        analytics.trackPerformanceMetric(`web_vital_${metric.name.toLowerCase()}`, metric.value, {
          metric_rating: metric.rating,
          navigation_type: metric.navigationType,
          metric_id: metric.id,
        });

        // Buffer for batch reporting
        this.metricsBuffer.push(metric);

        // Alert on poor metrics
        if (metric.rating === 'poor') {
          this.alertPoorPerformance('web_vital', metric.name, metric.value);
        }
      };

      onCLS(handleMetric);
      onFID(handleMetric);
      onFCP(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    });
  }

  // Track resource loading performance
  private setupResourceTracking() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const metric: ResourceMetric = {
          name: entry.name,
          type: entry.entryType as any,
          startTime: entry.startTime,
          duration: entry.duration,
        };

        // Add additional data for resource entries
        if ('transferSize' in entry) {
          metric.transferSize = (entry as PerformanceResourceTiming).transferSize;
          metric.encodedBodySize = (entry as PerformanceResourceTiming).encodedBodySize;
          metric.decodedBodySize = (entry as PerformanceResourceTiming).decodedBodySize;
        }

        // Track slow resources
        if (entry.duration > 1000) {
          analytics.trackEvent('slow_resource_detected', {
            resource_name: entry.name,
            duration: entry.duration,
            resource_type: entry.entryType,
          });
        }

        this.metricsBuffer.push(metric);
      });
    });

    this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] });
  }

  // Track API performance
  private setupAPITracking() {
    if (typeof window === 'undefined') return;

    // Monkey patch fetch to track API calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Only track API calls to our backend
        if (url.includes('/api/')) {
          const metric: APIPerformanceMetric = {
            endpoint: url,
            method: method as any,
            duration,
            status: response.status,
            success: response.ok,
            timestamp: new Date(),
            cacheHit: response.headers.get('x-cache') === 'HIT',
          };

          // Track in analytics
          analytics.trackPerformanceMetric('api_response_time', duration, {
            endpoint: url,
            method,
            status: response.status,
            success: response.ok,
          });

          // Alert on slow API calls
          if (duration > 5000) {
            this.alertPoorPerformance('api', url, duration);
          }

          this.metricsBuffer.push(metric);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Track failed API calls
        if (url.includes('/api/')) {
          analytics.trackEvent('api_error', {
            endpoint: url,
            method,
            duration,
            error: (error as Error).message,
          });
        }

        throw error;
      }
    };
  }

  // Track user experience metrics
  private setupUserExperienceTracking() {
    if (typeof window === 'undefined') return;

    // Track connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      analytics.trackEvent('connection_info', {
        effective_type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        save_data: connection.saveData,
      });
    }

    // Track device capabilities
    const deviceInfo = {
      memory: (navigator as any).deviceMemory,
      hardware_concurrency: navigator.hardwareConcurrency,
      max_touch_points: navigator.maxTouchPoints,
      cookie_enabled: navigator.cookieEnabled,
    };

    analytics.trackEvent('device_capabilities', deviceInfo);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      analytics.trackEvent('page_visibility_changed', {
        visibility_state: document.visibilityState,
        hidden: document.hidden,
      });
    });

    // Track user interactions
    this.trackUserInteractions();
  }

  // Track user interaction performance
  private trackUserInteractions() {
    if (typeof window === 'undefined') return;

    // Track click responsiveness
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      // Use requestAnimationFrame to measure time to next paint
      requestAnimationFrame(() => {
        const interactionTime = performance.now() - startTime;
        
        if (interactionTime > 100) {
          analytics.trackEvent('slow_interaction', {
            interaction_type: 'click',
            duration: interactionTime,
            target: (event.target as Element)?.tagName || 'unknown',
          });
        }
      });
    });

    // Track form submission performance
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const startTime = performance.now();
      
      const trackSubmission = () => {
        const duration = performance.now() - startTime;
        analytics.trackEvent('form_submission_performance', {
          form_id: form.id || 'unknown',
          duration,
          field_count: form.elements.length,
        });
      };

      // Track after form processing
      setTimeout(trackSubmission, 100);
    });
  }

  // Start periodic metrics reporting
  private startMetricsReporting() {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.reportMetrics();
      }
    }, 30000); // Report every 30 seconds
  }

  // Report batched metrics
  private reportMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Send to analytics in batch
    analytics.trackEvent('performance_metrics_batch', {
      metrics_count: metrics.length,
      timestamp: new Date().toISOString(),
    });

    // Process specific metric types
    this.processWebVitalsMetrics(metrics.filter(m => 'rating' in m) as WebVitalsMetric[]);
    this.processAPIMetrics(metrics.filter(m => 'endpoint' in m) as APIPerformanceMetric[]);
    this.processResourceMetrics(metrics.filter(m => 'type' in m) as ResourceMetric[]);
  }

  // Process Web Vitals metrics for insights
  private processWebVitalsMetrics(metrics: WebVitalsMetric[]) {
    if (metrics.length === 0) return;

    const summary = metrics.reduce((acc, metric) => {
      acc[metric.name] = acc[metric.name] || { values: [], ratings: { good: 0, 'needs-improvement': 0, poor: 0 } };
      acc[metric.name].values.push(metric.value);
      acc[metric.name].ratings[metric.rating]++;
      return acc;
    }, {} as Record<string, { values: number[]; ratings: Record<string, number> }>);

    // Calculate percentiles and report insights
    Object.entries(summary).forEach(([name, data]) => {
      const values = data.values.sort((a, b) => a - b);
      const p75 = values[Math.floor(values.length * 0.75)];
      const p95 = values[Math.floor(values.length * 0.95)];

      analytics.trackEvent('web_vitals_summary', {
        metric_name: name,
        p75_value: p75,
        p95_value: p95,
        total_samples: values.length,
        good_ratio: data.ratings.good / values.length,
        poor_ratio: data.ratings.poor / values.length,
      });
    });
  }

  // Process API metrics for performance insights
  private processAPIMetrics(metrics: APIPerformanceMetric[]) {
    if (metrics.length === 0) return;

    const endpointSummary = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      acc[key] = acc[key] || { durations: [], errors: 0, total: 0 };
      acc[key].durations.push(metric.duration);
      acc[key].total++;
      if (!metric.success) acc[key].errors++;
      return acc;
    }, {} as Record<string, { durations: number[]; errors: number; total: number }>);

    // Report endpoint performance
    Object.entries(endpointSummary).forEach(([endpoint, data]) => {
      const durations = data.durations.sort((a, b) => a - b);
      const median = durations[Math.floor(durations.length * 0.5)];
      const p95 = durations[Math.floor(durations.length * 0.95)];

      analytics.trackEvent('api_endpoint_summary', {
        endpoint,
        median_duration: median,
        p95_duration: p95,
        error_rate: data.errors / data.total,
        total_requests: data.total,
      });
    });
  }

  // Process resource metrics for loading performance
  private processResourceMetrics(metrics: ResourceMetric[]) {
    if (metrics.length === 0) return;

    const resourceTypes = metrics.reduce((acc, metric) => {
      acc[metric.type] = acc[metric.type] || { durations: [], sizes: [] };
      acc[metric.type].durations.push(metric.duration);
      if (metric.transferSize) acc[metric.type].sizes.push(metric.transferSize);
      return acc;
    }, {} as Record<string, { durations: number[]; sizes: number[] }>);

    // Report resource loading performance
    Object.entries(resourceTypes).forEach(([type, data]) => {
      const avgDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
      const avgSize = data.sizes.length > 0 ? data.sizes.reduce((a, b) => a + b, 0) / data.sizes.length : 0;

      analytics.trackEvent('resource_performance_summary', {
        resource_type: type,
        avg_duration: avgDuration,
        avg_size: avgSize,
        total_resources: data.durations.length,
      });
    });
  }

  // Alert on poor performance
  private alertPoorPerformance(type: string, identifier: string, value: number) {
    analytics.trackEvent('performance_alert', {
      alert_type: type,
      identifier,
      value,
      severity: 'high',
      timestamp: new Date().toISOString(),
    });

    // Could integrate with alerting services here
    console.warn(`⚠️ Poor performance detected: ${type} - ${identifier} (${value})`);
  }

  // Get current performance summary
  getPerformanceSummary() {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: this.getFirstPaint(),
      memoryUsage: this.getMemoryUsage(),
      connectionInfo: this.getConnectionInfo(),
    };
  }

  // Get First Paint metric
  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // Get memory usage information
  private getMemoryUsage() {
    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }

  // Get connection information
  private getConnectionInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  // Track custom performance metric
  trackCustomMetric(name: string, value: number, context?: Record<string, any>) {
    analytics.trackPerformanceMetric(name, value, context);
  }

  // Mark performance milestone
  markMilestone(name: string) {
    if (typeof window !== 'undefined') {
      performance.mark(name);
      analytics.trackEvent('performance_milestone', {
        milestone: name,
        timestamp: performance.now(),
      });
    }
  }

  // Measure between milestones
  measureBetween(startMark: string, endMark: string, measureName: string) {
    if (typeof window !== 'undefined') {
      try {
        performance.measure(measureName, startMark, endMark);
        const measure = performance.getEntriesByName(measureName)[0];
        
        analytics.trackPerformanceMetric(measureName, measure.duration, {
          start_mark: startMark,
          end_mark: endMark,
        });

        return measure.duration;
      } catch (error) {
        console.warn('Failed to measure performance:', error);
        return null;
      }
    }
    return null;
  }

  // Clean up
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isInitialized = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance tracking in components
export const usePerformanceTracking = () => {
  React.useEffect(() => {
    performanceMonitor.initialize();
    
    return () => {
      performanceMonitor.cleanup();
    };
  }, []);

  const trackCustomMetric = (name: string, value: number, context?: Record<string, any>) => {
    performanceMonitor.trackCustomMetric(name, value, context);
  };

  const markMilestone = (name: string) => {
    performanceMonitor.markMilestone(name);
  };

  const measureBetween = (startMark: string, endMark: string, measureName: string) => {
    return performanceMonitor.measureBetween(startMark, endMark, measureName);
  };

  const getPerformanceSummary = () => {
    return performanceMonitor.getPerformanceSummary();
  };

  return {
    trackCustomMetric,
    markMilestone,
    measureBetween,
    getPerformanceSummary,
  };
};

// Higher-order component for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return function PerformanceTrackedComponent(props: P) {
    const mountTime = React.useRef<number>();
    
    React.useEffect(() => {
      mountTime.current = performance.now();
      performanceMonitor.markMilestone(`${componentName}_mount_start`);
      
      return () => {
        if (mountTime.current) {
          const duration = performance.now() - mountTime.current;
          performanceMonitor.trackCustomMetric(`component_lifetime_${componentName}`, duration);
        }
      };
    }, []);

    React.useLayoutEffect(() => {
      performanceMonitor.markMilestone(`${componentName}_mount_complete`);
      performanceMonitor.measureBetween(
        `${componentName}_mount_start`,
        `${componentName}_mount_complete`,
        `${componentName}_mount_duration`
      );
    });

    return React.createElement(Component, props);
  };
};

// Utility functions for common performance tracking patterns
export const trackPageLoad = (pageName: string) => {
  performanceMonitor.markMilestone(`page_${pageName}_start`);
  
  // Track when page is fully loaded
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      performanceMonitor.markMilestone(`page_${pageName}_complete`);
      performanceMonitor.measureBetween(
        `page_${pageName}_start`,
        `page_${pageName}_complete`,
        `page_${pageName}_load_time`
      );
    }, { once: true });
  }
};

export const trackFormSubmission = (formName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackCustomMetric(`form_submission_${formName}`, duration);
  };
};

export const trackAPICall = (endpoint: string) => {
  const startTime = performance.now();
  
  return (success: boolean, status?: number) => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackCustomMetric(`api_call_${endpoint}`, duration, {
      success,
      status,
    });
  };
};

export default performanceMonitor;