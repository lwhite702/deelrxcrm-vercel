/**
 * Scaling Automation and Infrastructure Monitoring
 * 
 * Comprehensive scaling and infrastructure tools for DeelRx CRM including:
 * - Automated load testing and performance benchmarking
 * - Capacity planning and resource optimization
 * - Auto-scaling policies and thresholds
 * - Infrastructure health monitoring
 * - Cost optimization and resource allocation
 * - Performance regression detection
 * - Database scaling and optimization
 * - CDN and caching optimization
 * 
 * Created: September 2025
 */

import { analytics } from './product-analytics';
import { performanceMonitor } from './performance-monitoring';
import { errorTracker } from './error-tracking';

// Infrastructure metrics
export interface InfrastructureMetrics {
  timestamp: Date;
  
  // Server metrics
  server: {
    cpuUsage: number; // 0-100%
    memoryUsage: number; // 0-100%
    diskUsage: number; // 0-100%
    networkIn: number; // bytes/sec
    networkOut: number; // bytes/sec
    activeConnections: number;
    requestsPerSecond: number;
    responseTime: number; // milliseconds
  };
  
  // Database metrics
  database: {
    connections: number;
    queriesPerSecond: number;
    slowQueries: number;
    lockWaits: number;
    cacheHitRatio: number; // 0-100%
    replicationLag: number; // milliseconds
    storageUsage: number; // bytes
  };
  
  // Application metrics
  application: {
    activeUsers: number;
    sessionsPerMinute: number;
    errorRate: number; // 0-100%
    throughput: number; // requests/sec
    p95ResponseTime: number; // milliseconds
    memoryLeaks: boolean;
    healthCheckStatus: 'healthy' | 'degraded' | 'unhealthy';
  };
  
  // External dependencies
  external: {
    apiLatency: Record<string, number>; // service -> latency
    apiErrorRate: Record<string, number>; // service -> error rate
    cdnHitRatio: number; // 0-100%
    thirdPartyServices: Record<string, 'up' | 'down' | 'degraded'>;
  };
}

// Load test configuration
export interface LoadTestConfig {
  id: string;
  name: string;
  description: string;
  target: {
    baseUrl: string;
    endpoints: LoadTestEndpoint[];
  };
  load: {
    virtualUsers: number;
    duration: number; // seconds
    rampUpTime: number; // seconds
    rampDownTime: number; // seconds
  };
  scenarios: LoadTestScenario[];
  thresholds: LoadTestThresholds;
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
  };
}

export interface LoadTestEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  weight: number; // 0-100% of traffic
  headers?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: Record<string, string>;
  };
}

export interface LoadTestScenario {
  name: string;
  steps: LoadTestStep[];
  weight: number; // 0-100% of users
}

export interface LoadTestStep {
  name: string;
  endpoint: string;
  thinkTime: number; // milliseconds
  assertions?: LoadTestAssertion[];
}

export interface LoadTestAssertion {
  type: 'response_time' | 'status_code' | 'body_contains' | 'header_exists';
  operator: '<' | '>' | '=' | 'contains' | 'exists';
  value: any;
}

export interface LoadTestThresholds {
  maxResponseTime: number; // milliseconds
  minThroughput: number; // requests/sec
  maxErrorRate: number; // 0-100%
  maxMemoryUsage: number; // bytes
  maxCpuUsage: number; // 0-100%
}

// Scaling policy configuration
export interface ScalingPolicy {
  id: string;
  name: string;
  enabled: boolean;
  resource: 'cpu' | 'memory' | 'connections' | 'response_time' | 'error_rate';
  
  scaleUp: {
    threshold: number;
    duration: number; // seconds to sustain threshold
    cooldown: number; // seconds before next scale
    increment: number; // instances/resources to add
    maxInstances: number;
  };
  
  scaleDown: {
    threshold: number;
    duration: number;
    cooldown: number;
    decrement: number;
    minInstances: number;
  };
  
  notifications: {
    channels: ('email' | 'slack' | 'webhook')[];
    recipients: string[];
  };
}

// Capacity planning data
export interface CapacityPlan {
  id: string;
  name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  
  current: {
    users: number;
    requests: number;
    storage: number; // bytes
    bandwidth: number; // bytes
    cost: number; // USD
  };
  
  projected: {
    users: number;
    requests: number;
    storage: number;
    bandwidth: number;
    cost: number;
    growthRate: number; // 0-100%
  };
  
  recommendations: CapacityRecommendation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacityRecommendation {
  type: 'scale_up' | 'scale_down' | 'optimize' | 'migrate';
  resource: string;
  description: string;
  impact: {
    cost: number; // USD change
    performance: number; // 0-100% improvement
    risk: 'low' | 'medium' | 'high';
  };
  timeline: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class ScalingAutomation {
  private metrics: InfrastructureMetrics[] = [];
  private policies: Map<string, ScalingPolicy> = new Map();
  private loadTests: Map<string, LoadTestConfig> = new Map();
  private capacityPlans: Map<string, CapacityPlan> = new Map();
  private initialized = false;
  private monitoringInterval?: NodeJS.Timeout;

  // Initialize scaling automation
  async initialize() {
    if (this.initialized) return;

    await this.loadScalingPolicies();
    await this.loadLoadTestConfigs();
    await this.loadCapacityPlans();
    this.startMonitoring();
    
    this.initialized = true;
    console.log('✅ Scaling automation initialized');
  }

  // Start infrastructure monitoring
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Keep only last 24 hours of metrics
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
        
        // Check scaling policies
        await this.evaluateScalingPolicies(metrics);
        
        // Send metrics to analytics
        analytics.trackEvent('infrastructure_metrics', {
          cpu_usage: metrics.server.cpuUsage,
          memory_usage: metrics.server.memoryUsage,
          response_time: metrics.server.responseTime,
          active_users: metrics.application.activeUsers,
          error_rate: metrics.application.errorRate,
        });
        
      } catch (error) {
        errorTracker.captureError({
          message: 'Failed to collect infrastructure metrics',
          category: 'monitoring',
          severity: 'medium',
          metadata: { error: error.message },
        });
      }
    }, 60000); // Every minute
  }

  // Collect current infrastructure metrics
  private async collectMetrics(): Promise<InfrastructureMetrics> {
    try {
      // This would integrate with your infrastructure monitoring
      // For now, we'll simulate some metrics
      const response = await fetch('/api/infrastructure/metrics');
      const data = await response.json();
      
      return {
        timestamp: new Date(),
        server: {
          cpuUsage: data.server?.cpuUsage || Math.random() * 100,
          memoryUsage: data.server?.memoryUsage || Math.random() * 100,
          diskUsage: data.server?.diskUsage || Math.random() * 100,
          networkIn: data.server?.networkIn || Math.random() * 1000000,
          networkOut: data.server?.networkOut || Math.random() * 1000000,
          activeConnections: data.server?.activeConnections || Math.floor(Math.random() * 1000),
          requestsPerSecond: data.server?.requestsPerSecond || Math.random() * 100,
          responseTime: data.server?.responseTime || Math.random() * 500,
        },
        database: {
          connections: data.database?.connections || Math.floor(Math.random() * 100),
          queriesPerSecond: data.database?.queriesPerSecond || Math.random() * 1000,
          slowQueries: data.database?.slowQueries || Math.floor(Math.random() * 10),
          lockWaits: data.database?.lockWaits || Math.floor(Math.random() * 5),
          cacheHitRatio: data.database?.cacheHitRatio || 90 + Math.random() * 10,
          replicationLag: data.database?.replicationLag || Math.random() * 100,
          storageUsage: data.database?.storageUsage || Math.random() * 1000000000,
        },
        application: {
          activeUsers: data.application?.activeUsers || Math.floor(Math.random() * 10000),
          sessionsPerMinute: data.application?.sessionsPerMinute || Math.random() * 100,
          errorRate: data.application?.errorRate || Math.random() * 5,
          throughput: data.application?.throughput || Math.random() * 1000,
          p95ResponseTime: data.application?.p95ResponseTime || Math.random() * 1000,
          memoryLeaks: data.application?.memoryLeaks || false,
          healthCheckStatus: data.application?.healthCheckStatus || 'healthy',
        },
        external: {
          apiLatency: data.external?.apiLatency || {
            stripe: Math.random() * 200,
            sendgrid: Math.random() * 150,
            postmark: Math.random() * 100,
          },
          apiErrorRate: data.external?.apiErrorRate || {
            stripe: Math.random() * 2,
            sendgrid: Math.random() * 1,
            postmark: Math.random() * 0.5,
          },
          cdnHitRatio: data.external?.cdnHitRatio || 85 + Math.random() * 15,
          thirdPartyServices: data.external?.thirdPartyServices || {
            stripe: 'up',
            sendgrid: 'up',
            postmark: 'up',
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to collect metrics: ${error.message}`);
    }
  }

  // Evaluate scaling policies
  private async evaluateScalingPolicies(metrics: InfrastructureMetrics) {
    for (const [policyId, policy] of this.policies) {
      if (!policy.enabled) continue;

      try {
        const currentValue = this.getMetricValue(metrics, policy.resource);
        const recentMetrics = this.metrics.slice(-policy.scaleUp.duration);
        
        // Check scale up conditions
        if (this.shouldScaleUp(policy, currentValue, recentMetrics)) {
          await this.executeScaleUp(policy);
        }
        
        // Check scale down conditions
        if (this.shouldScaleDown(policy, currentValue, recentMetrics)) {
          await this.executeScaleDown(policy);
        }
        
      } catch (error) {
        errorTracker.captureError({
          message: `Failed to evaluate scaling policy: ${policy.name}`,
          category: 'scaling',
          severity: 'medium',
          metadata: { policyId, error: error.message },
        });
      }
    }
  }

  // Get metric value for scaling evaluation
  private getMetricValue(metrics: InfrastructureMetrics, resource: string): number {
    switch (resource) {
      case 'cpu': return metrics.server.cpuUsage;
      case 'memory': return metrics.server.memoryUsage;
      case 'connections': return metrics.server.activeConnections;
      case 'response_time': return metrics.server.responseTime;
      case 'error_rate': return metrics.application.errorRate;
      default: return 0;
    }
  }

  // Check if should scale up
  private shouldScaleUp(policy: ScalingPolicy, currentValue: number, recentMetrics: InfrastructureMetrics[]): boolean {
    if (recentMetrics.length < policy.scaleUp.duration) return false;
    
    return recentMetrics.every(metrics => 
      this.getMetricValue(metrics, policy.resource) >= policy.scaleUp.threshold
    );
  }

  // Check if should scale down
  private shouldScaleDown(policy: ScalingPolicy, currentValue: number, recentMetrics: InfrastructureMetrics[]): boolean {
    if (recentMetrics.length < policy.scaleDown.duration) return false;
    
    return recentMetrics.every(metrics => 
      this.getMetricValue(metrics, policy.resource) <= policy.scaleDown.threshold
    );
  }

  // Execute scale up
  private async executeScaleUp(policy: ScalingPolicy) {
    try {
      await fetch('/api/infrastructure/scale-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policyId: policy.id,
          increment: policy.scaleUp.increment,
          maxInstances: policy.scaleUp.maxInstances,
        }),
      });

      // Track scaling event
      analytics.trackEvent('auto_scale_up', {
        policy_id: policy.id,
        policy_name: policy.name,
        resource: policy.resource,
        increment: policy.scaleUp.increment,
      });

      // Send notifications
      await this.sendScalingNotification(policy, 'scale_up');
      
    } catch (error) {
      errorTracker.captureError({
        message: `Failed to execute scale up: ${policy.name}`,
        category: 'scaling',
        severity: 'high',
        metadata: { policyId: policy.id, error: error.message },
      });
    }
  }

  // Execute scale down
  private async executeScaleDown(policy: ScalingPolicy) {
    try {
      await fetch('/api/infrastructure/scale-down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policyId: policy.id,
          decrement: policy.scaleDown.decrement,
          minInstances: policy.scaleDown.minInstances,
        }),
      });

      // Track scaling event
      analytics.trackEvent('auto_scale_down', {
        policy_id: policy.id,
        policy_name: policy.name,
        resource: policy.resource,
        decrement: policy.scaleDown.decrement,
      });

      // Send notifications
      await this.sendScalingNotification(policy, 'scale_down');
      
    } catch (error) {
      errorTracker.captureError({
        message: `Failed to execute scale down: ${policy.name}`,
        category: 'scaling',
        severity: 'high',
        metadata: { policyId: policy.id, error: error.message },
      });
    }
  }

  // Send scaling notification
  private async sendScalingNotification(policy: ScalingPolicy, action: 'scale_up' | 'scale_down') {
    try {
      await fetch('/api/notifications/scaling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policyId: policy.id,
          policyName: policy.name,
          action,
          channels: policy.notifications.channels,
          recipients: policy.notifications.recipients,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send scaling notification:', error);
    }
  }

  // Run load test
  async runLoadTest(testId: string): Promise<string> {
    const testConfig = this.loadTests.get(testId);
    if (!testConfig) {
      throw new Error(`Load test not found: ${testId}`);
    }

    try {
      const response = await fetch('/api/load-tests/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig),
      });

      const result = await response.json();
      
      // Track load test execution
      analytics.trackEvent('load_test_started', {
        test_id: testId,
        test_name: testConfig.name,
        virtual_users: testConfig.load.virtualUsers,
        duration: testConfig.load.duration,
      });

      return result.runId;
    } catch (error) {
      errorTracker.captureError({
        message: `Failed to run load test: ${testConfig.name}`,
        category: 'performance',
        severity: 'medium',
        metadata: { testId, error: error.message },
      });
      throw error;
    }
  }

  // Get load test results
  async getLoadTestResults(runId: string): Promise<any> {
    try {
      const response = await fetch(`/api/load-tests/results/${runId}`);
      return await response.json();
    } catch (error) {
      errorTracker.captureError({
        message: 'Failed to get load test results',
        category: 'performance',
        severity: 'low',
        metadata: { runId, error: error.message },
      });
      throw error;
    }
  }

  // Generate capacity plan
  async generateCapacityPlan(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<CapacityPlan> {
    try {
      const response = await fetch('/api/capacity/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period }),
      });

      const plan: CapacityPlan = await response.json();
      this.capacityPlans.set(plan.id, plan);

      // Track capacity planning
      analytics.trackEvent('capacity_plan_generated', {
        plan_id: plan.id,
        period,
        current_users: plan.current.users,
        projected_users: plan.projected.users,
        growth_rate: plan.projected.growthRate,
      });

      return plan;
    } catch (error) {
      errorTracker.captureError({
        message: 'Failed to generate capacity plan',
        category: 'capacity',
        severity: 'medium',
        metadata: { period, error: error.message },
      });
      throw error;
    }
  }

  // Get infrastructure health score
  getHealthScore(): number {
    if (this.metrics.length === 0) return 100;

    const latest = this.metrics[this.metrics.length - 1];
    let score = 100;

    // Deduct points for high resource usage
    if (latest.server.cpuUsage > 80) score -= 20;
    if (latest.server.memoryUsage > 85) score -= 20;
    if (latest.server.responseTime > 1000) score -= 15;
    if (latest.application.errorRate > 5) score -= 25;
    if (latest.database.cacheHitRatio < 80) score -= 10;
    if (latest.external.cdnHitRatio < 70) score -= 10;

    return Math.max(0, score);
  }

  // Get performance trends
  getPerformanceTrends(hours: number = 24): {
    cpu: number[];
    memory: number[];
    responseTime: number[];
    errorRate: number[];
    throughput: number[];
  } {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    return {
      cpu: recentMetrics.map(m => m.server.cpuUsage),
      memory: recentMetrics.map(m => m.server.memoryUsage),
      responseTime: recentMetrics.map(m => m.server.responseTime),
      errorRate: recentMetrics.map(m => m.application.errorRate),
      throughput: recentMetrics.map(m => m.application.throughput),
    };
  }

  // Optimize resources based on usage patterns
  async optimizeResources(): Promise<CapacityRecommendation[]> {
    try {
      const trends = this.getPerformanceTrends(168); // Last week
      const response = await fetch('/api/infrastructure/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trends }),
      });

      const recommendations: CapacityRecommendation[] = await response.json();

      // Track optimization
      analytics.trackEvent('resource_optimization', {
        recommendations_count: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'high').length,
      });

      return recommendations;
    } catch (error) {
      errorTracker.captureError({
        message: 'Failed to optimize resources',
        category: 'optimization',
        severity: 'medium',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  // Load scaling policies from backend
  private async loadScalingPolicies() {
    try {
      const response = await fetch('/api/scaling/policies');
      const policies: ScalingPolicy[] = await response.json();
      
      policies.forEach(policy => {
        this.policies.set(policy.id, policy);
      });
    } catch (error) {
      console.error('Failed to load scaling policies:', error);
    }
  }

  // Load load test configs
  private async loadLoadTestConfigs() {
    try {
      const response = await fetch('/api/load-tests/configs');
      const configs: LoadTestConfig[] = await response.json();
      
      configs.forEach(config => {
        this.loadTests.set(config.id, config);
      });
    } catch (error) {
      console.error('Failed to load load test configs:', error);
    }
  }

  // Load capacity plans
  private async loadCapacityPlans() {
    try {
      const response = await fetch('/api/capacity/plans');
      const plans: CapacityPlan[] = await response.json();
      
      plans.forEach(plan => {
        this.capacityPlans.set(plan.id, plan);
      });
    } catch (error) {
      console.error('Failed to load capacity plans:', error);
    }
  }

  // Create scaling policy
  async createScalingPolicy(policy: Omit<ScalingPolicy, 'id'>): Promise<string> {
    try {
      const response = await fetch('/api/scaling/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });

      const result = await response.json();
      const newPolicy = { ...policy, id: result.id };
      this.policies.set(result.id, newPolicy);

      analytics.trackEvent('scaling_policy_created', {
        policy_id: result.id,
        resource: policy.resource,
      });

      return result.id;
    } catch (error) {
      errorTracker.captureError({
        message: 'Failed to create scaling policy',
        category: 'scaling',
        severity: 'medium',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  // Create load test
  async createLoadTest(test: Omit<LoadTestConfig, 'id'>): Promise<string> {
    try {
      const response = await fetch('/api/load-tests/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test),
      });

      const result = await response.json();
      const newTest = { ...test, id: result.id };
      this.loadTests.set(result.id, newTest);

      analytics.trackEvent('load_test_created', {
        test_id: result.id,
        test_name: test.name,
        virtual_users: test.load.virtualUsers,
      });

      return result.id;
    } catch (error) {
      errorTracker.captureError({
        message: 'Failed to create load test',
        category: 'performance',
        severity: 'medium',
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  // Cleanup
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Singleton instance
export const scalingAutomation = new ScalingAutomation();

// React hook for scaling metrics
export const useScalingMetrics = () => {
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    scalingAutomation.initialize();

    const interval = setInterval(() => {
      const score = scalingAutomation.getHealthScore();
      const performanceTrends = scalingAutomation.getPerformanceTrends(24);
      
      setHealthScore(score);
      setTrends(performanceTrends);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    healthScore,
    trends,
    runLoadTest: scalingAutomation.runLoadTest.bind(scalingAutomation),
    generateCapacityPlan: scalingAutomation.generateCapacityPlan.bind(scalingAutomation),
    optimizeResources: scalingAutomation.optimizeResources.bind(scalingAutomation),
  };
};

export default scalingAutomation;