/**
 * A/B Testing and Feature Flag System
 * 
 * Comprehensive experimentation framework for DeelRx CRM including:
 * - Feature flags for gradual rollouts
 * - A/B testing for conversion optimization
 * - Multivariate testing capabilities
 * - Statistical significance tracking
 * - User segmentation and targeting
 * - Real-time experiment monitoring
 * 
 * Created: September 2025
 */

import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { analytics } from './product-analytics';

// Experiment configuration
export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  type: 'ab' | 'multivariate' | 'feature_flag';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  variants: ExperimentVariant[];
  targeting: TargetingRules;
  metrics: ExperimentMetric[];
  trafficAllocation: number; // 0-100 percentage
  startDate?: Date;
  endDate?: Date;
  hypothesis?: string;
  minSampleSize?: number;
  confidenceLevel?: number; // e.g., 95
  createdBy: string;
  createdAt: Date;
}

// Experiment variant
export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  allocation: number; // 0-100 percentage within experiment
  config: Record<string, any>; // Variant-specific configuration
  isControl?: boolean;
}

// Targeting rules
export interface TargetingRules {
  userAttributes?: Record<string, string | number | boolean>;
  customAttributes?: Record<string, string | number | boolean>;
  segments?: string[];
  geolocation?: string[];
  platform?: ('web' | 'mobile' | 'api')[];
  userAgent?: string[];
  percentage?: number; // Overall traffic percentage
}

// Experiment metrics
export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'retention' | 'custom';
  eventName?: string;
  aggregation: 'count' | 'sum' | 'average' | 'unique';
  isPrimary?: boolean;
}

// Experiment result
export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId: string;
  sessionId?: string;
  assignedAt: Date;
  exposedAt?: Date;
  convertedAt?: Date;
  metrics: Record<string, number>;
  userAttributes: Record<string, any>;
}

// Feature flag configuration
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'boolean' | 'string' | 'number' | 'json';
  value: any;
  targeting: TargetingRules;
  rolloutPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

class ExperimentationEngine {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  private initialized = false;

  // Initialize experimentation engine
  async initialize(userId?: string) {
    if (this.initialized) return;

    await this.loadExperiments();
    await this.loadFeatureFlags();
    
    if (userId) {
      await this.loadUserAssignments(userId);
    }

    this.initialized = true;
    console.log('✅ Experimentation engine initialized');
  }

  // Load active experiments from backend
  private async loadExperiments() {
    try {
      const response = await fetch('/api/experiments/active');
      const experiments: ExperimentConfig[] = await response.json();
      
      experiments.forEach(exp => {
        this.experiments.set(exp.id, exp);
      });
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  // Load feature flags from backend
  private async loadFeatureFlags() {
    try {
      const response = await fetch('/api/feature-flags');
      const flags: FeatureFlag[] = await response.json();
      
      flags.forEach(flag => {
        this.featureFlags.set(flag.id, flag);
      });
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  // Load user's experiment assignments
  private async loadUserAssignments(userId: string) {
    try {
      const response = await fetch(`/api/experiments/assignments/${userId}`);
      const assignments: Record<string, string> = await response.json();
      
      const userMap = new Map();
      Object.entries(assignments).forEach(([expId, variantId]) => {
        userMap.set(expId, variantId);
      });
      
      this.userAssignments.set(userId, userMap);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  // Check if user is in experiment and get variant
  getVariant(experimentId: string, userId: string, userAttributes?: Record<string, any>): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user already has assignment
    const userMap = this.userAssignments.get(userId);
    if (userMap?.has(experimentId)) {
      const variantId = userMap.get(experimentId)!;
      this.trackExperimentExposure(experimentId, variantId, userId);
      return variantId;
    }

    // Check if user meets targeting criteria
    if (!this.meetsTargeting(experiment.targeting, userId, userAttributes)) {
      return null;
    }

    // Check traffic allocation
    if (!this.isInTrafficAllocation(experiment.trafficAllocation, userId, experimentId)) {
      return null;
    }

    // Assign variant
    const variantId = this.assignVariant(experiment, userId);
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(experimentId, variantId);

    // Save assignment to backend
    this.saveAssignment(experimentId, variantId, userId, userAttributes);

    // Track assignment
    analytics.trackExperiment(experiment.name, variantId, {
      experiment_id: experimentId,
      user_id: userId,
      ...userAttributes,
    });

    this.trackExperimentExposure(experimentId, variantId, userId);

    return variantId;
  }

  // Get feature flag value
  getFeatureFlag(flagId: string, userId: string, userAttributes?: Record<string, any>): any {
    const flag = this.featureFlags.get(flagId);
    if (!flag || !flag.enabled) {
      return null;
    }

    // Check targeting
    if (!this.meetsTargeting(flag.targeting, userId, userAttributes)) {
      return null;
    }

    // Check rollout percentage
    if (!this.isInRollout(flag.rolloutPercentage, userId, flagId)) {
      return null;
    }

    // Track flag usage
    analytics.trackEvent('feature_flag_accessed', {
      flag_id: flagId,
      flag_name: flag.name,
      flag_value: flag.value,
      user_id: userId,
    });

    return flag.value;
  }

  // Check if feature flag is enabled
  isFeatureEnabled(flagId: string, userId: string, userAttributes?: Record<string, any>): boolean {
    const value = this.getFeatureFlag(flagId, userId, userAttributes);
    return value === true || value === 'true' || value === 1;
  }

  // Track experiment conversion
  trackConversion(experimentId: string, userId: string, metricId: string, value: number = 1) {
    const userMap = this.userAssignments.get(userId);
    const variantId = userMap?.get(experimentId);
    
    if (!variantId) {
      return; // User not in experiment
    }

    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return;
    }

    // Track conversion event
    analytics.trackEvent('experiment_conversion', {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_id: variantId,
      metric_id: metricId,
      metric_value: value,
      user_id: userId,
    });

    // Save conversion to backend
    this.saveConversion(experimentId, variantId, userId, metricId, value);
  }

  // Check if user meets targeting criteria
  private meetsTargeting(targeting: TargetingRules, userId: string, userAttributes?: Record<string, any>): boolean {
    // Check user attributes
    if (targeting.userAttributes && userAttributes) {
      for (const [key, value] of Object.entries(targeting.userAttributes)) {
        if (userAttributes[key] !== value) {
          return false;
        }
      }
    }

    // Check custom attributes
    if (targeting.customAttributes && userAttributes) {
      for (const [key, value] of Object.entries(targeting.customAttributes)) {
        if (userAttributes[key] !== value) {
          return false;
        }
      }
    }

    // Check segments (if implemented)
    if (targeting.segments && userAttributes?.segments) {
      const userSegments = Array.isArray(userAttributes.segments) ? userAttributes.segments : [userAttributes.segments];
      const hasMatchingSegment = targeting.segments.some(segment => userSegments.includes(segment));
      if (!hasMatchingSegment) {
        return false;
      }
    }

    // Check platform
    if (targeting.platform) {
      const currentPlatform = this.getCurrentPlatform();
      if (!targeting.platform.includes(currentPlatform)) {
        return false;
      }
    }

    return true;
  }

  // Check if user is in traffic allocation
  private isInTrafficAllocation(percentage: number, userId: string, experimentId: string): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    const hash = this.hashUserId(userId + experimentId);
    return (hash % 100) < percentage;
  }

  // Check if user is in feature flag rollout
  private isInRollout(percentage: number, userId: string, flagId: string): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    const hash = this.hashUserId(userId + flagId);
    return (hash % 100) < percentage;
  }

  // Assign variant to user
  private assignVariant(experiment: ExperimentConfig, userId: string): string {
    const hash = this.hashUserId(userId + experiment.id);
    let cumulativeWeight = 0;
    
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.allocation;
      if (hash % 100 < cumulativeWeight) {
        return variant.id;
      }
    }
    
    // Fallback to control variant
    return experiment.variants.find(v => v.isControl)?.id || experiment.variants[0].id;
  }

  // Simple hash function for consistent user bucketing
  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get current platform
  private getCurrentPlatform(): 'web' | 'mobile' | 'api' {
    if (typeof window === 'undefined') return 'api';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile';
    }
    
    return 'web';
  }

  // Track experiment exposure
  private trackExperimentExposure(experimentId: string, variantId: string, userId: string) {
    analytics.trackEvent('experiment_exposed', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId,
      timestamp: Date.now(),
    });
  }

  // Save assignment to backend
  private async saveAssignment(experimentId: string, variantId: string, userId: string, userAttributes?: Record<string, any>) {
    try {
      await fetch('/api/experiments/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimentId,
          variantId,
          userId,
          userAttributes,
          assignedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to save assignment:', error);
    }
  }

  // Save conversion to backend
  private async saveConversion(experimentId: string, variantId: string, userId: string, metricId: string, value: number) {
    try {
      await fetch('/api/experiments/conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experimentId,
          variantId,
          userId,
          metricId,
          value,
          convertedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to save conversion:', error);
    }
  }

  // Get experiment results
  async getExperimentResults(experimentId: string): Promise<any> {
    try {
      const response = await fetch(`/api/experiments/${experimentId}/results`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get experiment results:', error);
      return null;
    }
  }

  // Create new experiment
  async createExperiment(experiment: Omit<ExperimentConfig, 'id' | 'createdAt'>): Promise<string> {
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...experiment,
          createdAt: new Date().toISOString(),
        }),
      });
      
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  }

  // Update feature flag
  async updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<void> {
    try {
      await fetch(`/api/feature-flags/${flagId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date().toISOString(),
        }),
      });
      
      // Update local cache
      const flag = this.featureFlags.get(flagId);
      if (flag) {
        this.featureFlags.set(flagId, { ...flag, ...updates });
      }
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      throw error;
    }
  }
}

// Singleton instance
export const experimentationEngine = new ExperimentationEngine();

// React Context for experiments
const ExperimentContext = createContext<{
  getVariant: (experimentId: string) => string | null;
  getFeatureFlag: (flagId: string) => any;
  isFeatureEnabled: (flagId: string) => boolean;
  trackConversion: (experimentId: string, metricId: string, value?: number) => void;
}>({
  getVariant: () => null,
  getFeatureFlag: () => null,
  isFeatureEnabled: () => false,
  trackConversion: () => {},
});

// Experiment Provider Component
export const ExperimentProvider: React.FC<{
  children: React.ReactNode;
  userId: string;
  userAttributes?: Record<string, any>;
}> = ({ children, userId, userAttributes }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    experimentationEngine.initialize(userId).then(() => {
      setInitialized(true);
    });
  }, [userId]);

  const getVariant = useCallback((experimentId: string) => {
    if (!initialized) return null;
    return experimentationEngine.getVariant(experimentId, userId, userAttributes);
  }, [initialized, userId, userAttributes]);

  const getFeatureFlag = useCallback((flagId: string) => {
    if (!initialized) return null;
    return experimentationEngine.getFeatureFlag(flagId, userId, userAttributes);
  }, [initialized, userId, userAttributes]);

  const isFeatureEnabled = useCallback((flagId: string) => {
    if (!initialized) return false;
    return experimentationEngine.isFeatureEnabled(flagId, userId, userAttributes);
  }, [initialized, userId, userAttributes]);

  const trackConversion = useCallback((experimentId: string, metricId: string, value: number = 1) => {
    if (!initialized) return;
    experimentationEngine.trackConversion(experimentId, userId, metricId, value);
  }, [initialized, userId]);

  const contextValue = {
    getVariant,
    getFeatureFlag,
    isFeatureEnabled,
    trackConversion,
  };

  return React.createElement(ExperimentContext.Provider, { value: contextValue }, children);
};

// React hook for experiments
export const useExperiments = () => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiments must be used within ExperimentProvider');
  }
  return context;
};

// React hook for A/B testing
export const useABTest = (experimentId: string) => {
  const { getVariant, trackConversion } = useExperiments();
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    const assignedVariant = getVariant(experimentId);
    setVariant(assignedVariant);
  }, [experimentId, getVariant]);

  const convert = useCallback((metricId: string = 'primary', value: number = 1) => {
    trackConversion(experimentId, metricId, value);
  }, [experimentId, trackConversion]);

  return { variant, convert };
};

// React hook for feature flags
export const useFeatureFlag = (flagId: string) => {
  const { getFeatureFlag, isFeatureEnabled } = useExperiments();
  const [value, setValue] = useState<any>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const flagValue = getFeatureFlag(flagId);
    const flagEnabled = isFeatureEnabled(flagId);
    setValue(flagValue);
    setEnabled(flagEnabled);
  }, [flagId, getFeatureFlag, isFeatureEnabled]);

  return { value, enabled };
};

// Higher-order component for A/B testing
export const withABTest = <P extends object>(
  Component: React.ComponentType<P>,
  experimentId: string,
  variants: Record<string, React.ComponentType<P>>
) => {
  return function ABTestWrapper(props: P) {
    const { variant } = useABTest(experimentId);
    
    if (!variant || !variants[variant]) {
      return React.createElement(Component, props);
    }
    
    const VariantComponent = variants[variant];
    return React.createElement(VariantComponent, props);
  };
};

// Higher-order component for feature flags
export const withFeatureFlag = <P extends object>(
  Component: React.ComponentType<P>,
  flagId: string,
  fallback?: React.ComponentType<P>
) => {
  return function FeatureFlagWrapper(props: P) {
    const { enabled } = useFeatureFlag(flagId);
    
    if (!enabled) {
      if (fallback) {
        return React.createElement(fallback, props);
      }
      return null;
    }
    
    return React.createElement(Component, props);
  };
};

// Utility component for conditional rendering
export const FeatureGate: React.FC<{
  flagId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ flagId, children, fallback = null }) => {
  const { enabled } = useFeatureFlag(flagId);
  
  return enabled ? <>{children}</> : <>{fallback}</>;
};

// Utility component for A/B test variants
export const ABTestVariant: React.FC<{
  experimentId: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}> = ({ experimentId, variants, fallback = null }) => {
  const { variant } = useABTest(experimentId);
  
  if (!variant || !variants[variant]) {
    return <>{fallback}</>;
  }
  
  return <>{variants[variant]}</>;
};

// Utility functions for server-side experiments
export const getServerSideVariant = async (experimentId: string, userId: string, userAttributes?: Record<string, any>): Promise<string | null> => {
  await experimentationEngine.initialize(userId);
  return experimentationEngine.getVariant(experimentId, userId, userAttributes);
};

export const getServerSideFeatureFlag = async (flagId: string, userId: string, userAttributes?: Record<string, any>): Promise<any> => {
  await experimentationEngine.initialize(userId);
  return experimentationEngine.getFeatureFlag(flagId, userId, userAttributes);
};

export default experimentationEngine;