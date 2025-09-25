/**
 * User Feedback Collection System
 * 
 * Comprehensive feedback collection system for DeelRx CRM including:
 * - In-app feedback widgets
 * - NPS (Net Promoter Score) surveys
 * - Feature request tracking
 * - Bug reports and suggestions
 * - User satisfaction surveys
 * - Contextual feedback collection
 * 
 * Created: September 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analytics } from './product-analytics';

// Feedback types
export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'nps' | 'satisfaction';

// Feedback data structure
export interface FeedbackData {
  id: string;
  type: FeedbackType;
  title?: string;
  description: string;
  rating?: number; // 1-5 for satisfaction, 0-10 for NPS
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  screenshots?: string[];
  userAgent?: string;
  url?: string;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  status?: 'new' | 'in-review' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// NPS Survey data
export interface NPSResponse {
  score: number; // 0-10
  reason?: string;
  category?: 'promoter' | 'passive' | 'detractor';
  followUp?: string;
  userId: string;
  organizationId?: string;
  surveyId: string;
  submittedAt: Date;
}

// Feature request data
export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  votes: number;
  status: 'submitted' | 'under-review' | 'planned' | 'in-development' | 'completed' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  estimatedEffort?: 'small' | 'medium' | 'large' | 'epic';
  businessValue?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

class UserFeedbackSystem {
  private feedbackQueue: FeedbackData[] = [];
  private initialized = false;

  // Initialize feedback system
  initialize() {
    if (this.initialized) return;

    this.setupFeedbackCollection();
    this.setupNPSTracking();
    this.setupContextualFeedback();
    this.startFeedbackProcessing();

    this.initialized = true;
    console.log('✅ User feedback system initialized');
  }

  // Set up general feedback collection
  private setupFeedbackCollection() {
    // Listen for feedback widget interactions
    if (typeof window !== 'undefined') {
      window.addEventListener('feedback-widget-opened', this.trackFeedbackEngagement);
      window.addEventListener('feedback-submitted', this.handleFeedbackSubmission);
    }
  }

  // Set up NPS tracking
  private setupNPSTracking() {
    // NPS survey triggers based on user behavior
    this.scheduleNPSSurveys();
  }

  // Set up contextual feedback triggers
  private setupContextualFeedback() {
    // Show feedback prompts based on user actions
    this.setupActionBasedFeedback();
    this.setupTimeBasedFeedback();
    this.setupErrorBasedFeedback();
  }

  // Track feedback widget engagement
  private trackFeedbackEngagement = (event: CustomEvent) => {
    analytics.trackEvent('feedback_widget_opened', {
      context: event.detail?.context || 'unknown',
      page: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  };

  // Handle feedback submission
  private handleFeedbackSubmission = (event: CustomEvent) => {
    const feedbackData = event.detail as FeedbackData;
    this.submitFeedback(feedbackData);
  };

  // Submit feedback to backend and analytics
  async submitFeedback(feedback: Omit<FeedbackData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const feedbackId = this.generateFeedbackId();
    
    const completeFeedback: FeedbackData = {
      ...feedback,
      id: feedbackId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to processing queue
    this.feedbackQueue.push(completeFeedback);

    // Track in analytics
    analytics.trackEvent('feedback_submitted', {
      feedback_id: feedbackId,
      feedback_type: feedback.type,
      rating: feedback.rating,
      category: feedback.category,
      priority: feedback.priority,
      has_description: !!feedback.description,
      description_length: feedback.description?.length || 0,
    });

    // Send to backend API
    try {
      await this.sendToBackend(completeFeedback);
      
      // Show confirmation to user
      this.showFeedbackConfirmation(feedback.type);
      
      return feedbackId;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Store locally for retry
      this.storeForRetry(completeFeedback);
      throw error;
    }
  }

  // Submit NPS response
  async submitNPSResponse(response: Omit<NPSResponse, 'category' | 'submittedAt'>): Promise<void> {
    const category = this.categorizeNPSScore(response.score);
    
    const completeResponse: NPSResponse = {
      ...response,
      category,
      submittedAt: new Date(),
    };

    // Track in analytics
    analytics.trackEvent('nps_survey_completed', {
      score: response.score,
      category,
      has_reason: !!response.reason,
      has_follow_up: !!response.followUp,
      survey_id: response.surveyId,
    });

    // Send to backend
    try {
      await this.sendNPSToBackend(completeResponse);
    } catch (error) {
      console.error('Failed to submit NPS response:', error);
    }
  }

  // Submit feature request
  async submitFeatureRequest(request: Omit<FeatureRequest, 'id' | 'votes' | 'submittedAt'>): Promise<string> {
    const requestId = this.generateFeedbackId();
    
    const completeRequest: FeatureRequest = {
      ...request,
      id: requestId,
      votes: 1, // Start with submitter's vote
      submittedAt: new Date(),
    };

    // Track in analytics
    analytics.trackEvent('feature_request_submitted', {
      request_id: requestId,
      category: request.category,
      priority: request.priority,
      title_length: request.title.length,
      description_length: request.description.length,
      estimated_effort: request.estimatedEffort,
      business_value: request.businessValue,
    });

    // Send to backend
    try {
      await this.sendFeatureRequestToBackend(completeRequest);
      return requestId;
    } catch (error) {
      console.error('Failed to submit feature request:', error);
      throw error;
    }
  }

  // Schedule NPS surveys based on user behavior
  private scheduleNPSSurveys() {
    // Show NPS survey after significant milestones
    analytics.trackEvent('user_milestone', {
      milestone_name: 'first_deal_created',
    });

    // Schedule periodic NPS surveys
    this.schedulePeriodicNPS();
  }

  // Set up action-based feedback prompts
  private setupActionBasedFeedback() {
    // Show feedback after completing key actions
    const keyActions = [
      'deal_won',
      'contact_imported',
      'report_generated',
      'integration_connected',
    ];

    keyActions.forEach(action => {
      analytics.trackEvent(action, {});
    });
  }

  // Set up time-based feedback prompts
  private setupTimeBasedFeedback() {
    // Show feedback after spending time in app
    let sessionStart = Date.now();
    
    setInterval(() => {
      const sessionDuration = Date.now() - sessionStart;
      
      // Show satisfaction survey after 30 minutes of usage
      if (sessionDuration > 30 * 60 * 1000) {
        this.triggerSatisfactionSurvey();
        sessionStart = Date.now(); // Reset timer
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Set up error-based feedback prompts
  private setupErrorBasedFeedback() {
    // Show feedback widget after errors
    window.addEventListener('error', (event) => {
      setTimeout(() => {
        this.triggerErrorFeedback(event.error?.message || 'Unknown error');
      }, 2000); // Delay to not interrupt error handling
    });
  }

  // Process feedback queue
  private startFeedbackProcessing() {
    setInterval(() => {
      this.processFeedbackQueue();
    }, 10000); // Process every 10 seconds
  }

  // Process queued feedback
  private processFeedbackQueue() {
    if (this.feedbackQueue.length === 0) return;

    const batch = this.feedbackQueue.splice(0, 10); // Process in batches
    
    batch.forEach(async (feedback) => {
      try {
        await this.sendToBackend(feedback);
      } catch (error) {
        // Re-queue failed submissions
        this.feedbackQueue.unshift(feedback);
      }
    });
  }

  // Send feedback to backend API
  private async sendToBackend(feedback: FeedbackData): Promise<void> {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }

  // Send NPS response to backend
  private async sendNPSToBackend(response: NPSResponse): Promise<void> {
    const apiResponse = await fetch('/api/feedback/nps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });

    if (!apiResponse.ok) {
      throw new Error(`Failed to submit NPS: ${apiResponse.statusText}`);
    }
  }

  // Send feature request to backend
  private async sendFeatureRequestToBackend(request: FeatureRequest): Promise<void> {
    const response = await fetch('/api/feedback/feature-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feature request: ${response.statusText}`);
    }
  }

  // Categorize NPS score
  private categorizeNPSScore(score: number): 'promoter' | 'passive' | 'detractor' {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  }

  // Generate unique feedback ID
  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Show feedback confirmation
  private showFeedbackConfirmation(type: FeedbackType) {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('feedback-confirmed', {
      detail: { type }
    }));
  }

  // Store feedback for retry
  private storeForRetry(feedback: FeedbackData) {
    try {
      const stored = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
      stored.push(feedback);
      localStorage.setItem('pendingFeedback', JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store feedback for retry:', error);
    }
  }

  // Trigger satisfaction survey
  private triggerSatisfactionSurvey() {
    window.dispatchEvent(new CustomEvent('show-satisfaction-survey'));
  }

  // Trigger error feedback
  private triggerErrorFeedback(errorMessage: string) {
    window.dispatchEvent(new CustomEvent('show-error-feedback', {
      detail: { error: errorMessage }
    }));
  }

  // Schedule periodic NPS
  private schedulePeriodicNPS() {
    // Show NPS survey every 90 days for active users
    const lastNPSDate = localStorage.getItem('lastNPSDate');
    const now = new Date();
    
    if (!lastNPSDate || (now.getTime() - new Date(lastNPSDate).getTime()) > 90 * 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('show-nps-survey'));
        localStorage.setItem('lastNPSDate', now.toISOString());
      }, 5 * 60 * 1000); // Show after 5 minutes in app
    }
  }

  // Get feedback statistics
  async getFeedbackStats(): Promise<any> {
    try {
      const response = await fetch('/api/feedback/stats');
      return await response.json();
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return null;
    }
  }

  // Vote on feature request
  async voteOnFeatureRequest(requestId: string, userId: string): Promise<void> {
    try {
      await fetch(`/api/feedback/feature-requests/${requestId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      analytics.trackEvent('feature_request_voted', {
        request_id: requestId,
      });
    } catch (error) {
      console.error('Failed to vote on feature request:', error);
      throw error;
    }
  }
}

// Singleton instance
export const feedbackSystem = new UserFeedbackSystem();

// React hook for feedback functionality
export const useFeedback = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    feedbackSystem.initialize();
  }, []);

  const submitFeedback = useCallback(async (feedback: Omit<FeedbackData, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const feedbackId = await feedbackSystem.submitFeedback(feedback);
      return feedbackId;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitNPS = useCallback(async (response: Omit<NPSResponse, 'category' | 'submittedAt'>) => {
    setIsLoading(true);
    try {
      await feedbackSystem.submitNPSResponse(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitFeatureRequest = useCallback(async (request: Omit<FeatureRequest, 'id' | 'votes' | 'submittedAt'>) => {
    setIsLoading(true);
    try {
      const requestId = await feedbackSystem.submitFeatureRequest(request);
      return requestId;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const voteOnFeature = useCallback(async (requestId: string, userId: string) => {
    setIsLoading(true);
    try {
      await feedbackSystem.voteOnFeatureRequest(requestId, userId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    submitFeedback,
    submitNPS,
    submitFeatureRequest,
    voteOnFeature,
    isLoading,
  };
};

// Feedback Widget Component
export const FeedbackWidget: React.FC<{
  trigger?: 'button' | 'fab' | 'automatic';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  types?: FeedbackType[];
}> = ({ 
  trigger = 'fab', 
  position = 'bottom-right',
  types = ['bug', 'feature', 'improvement', 'general']
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>();
  const [title, setTitle] = useState('');
  const { submitFeedback, isLoading } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitFeedback({
        type: feedbackType,
        title: title || undefined,
        description,
        rating,
      });
      
      // Reset form
      setDescription('');
      setRating(undefined);
      setTitle('');
      setIsOpen(false);
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const openWidget = () => {
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent('feedback-widget-opened', {
      detail: { context: 'manual' }
    }));
  };

  // Position styles
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4', 
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  if (trigger === 'fab') {
    return (
      <div className={`fixed ${positionStyles[position]} z-50`}>
        {!isOpen && (
          <button
            onClick={openWidget}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
            aria-label="Open feedback widget"
          >
            💬
          </button>
        )}
        
        {isOpen && (
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Feedback</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                  className="w-full p-2 border rounded-md"
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {(feedbackType === 'feature' || feedbackType === 'improvement') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Brief description"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-md h-24 resize-none"
                  placeholder="Tell us more..."
                  required
                />
              </div>
              
              {feedbackType === 'general' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-xl ${rating && rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading || !description.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// NPS Survey Component
export const NPSSurvey: React.FC<{
  surveyId: string;
  userId: string;
  onComplete?: () => void;
}> = ({ surveyId, userId, onComplete }) => {
  const [score, setScore] = useState<number>();
  const [reason, setReason] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [step, setStep] = useState<'score' | 'reason' | 'complete'>('score');
  const { submitNPS, isLoading } = useFeedback();

  const handleScoreSubmit = () => {
    if (score !== undefined) {
      setStep('reason');
    }
  };

  const handleReasonSubmit = async () => {
    if (score !== undefined) {
      try {
        await submitNPS({
          score,
          reason: reason || undefined,
          followUp: followUp || undefined,
          userId,
          surveyId,
        });
        setStep('complete');
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } catch (error) {
        alert('Failed to submit survey. Please try again.');
      }
    }
  };

  if (step === 'complete') {
    return (
      <div className="text-center p-6">
        <div className="text-4xl mb-2">🙏</div>
        <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
        <p className="text-gray-600">Your feedback helps us improve DeelRx CRM.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
      {step === 'score' && (
        <>
          <h3 className="text-lg font-semibold mb-4">How likely are you to recommend DeelRx CRM?</h3>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-500">Not likely</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setScore(num)}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    score === num 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">Very likely</span>
          </div>
          <button
            onClick={handleScoreSubmit}
            disabled={score === undefined}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        </>
      )}

      {step === 'reason' && (
        <>
          <h3 className="text-lg font-semibold mb-4">
            {score! >= 9 ? "What do you like most?" : score! >= 7 ? "How can we improve?" : "What's missing?"}
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border rounded-md h-24 resize-none mb-4"
            placeholder="Tell us more..."
          />
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            className="w-full p-3 border rounded-md mb-4"
            placeholder="Email for follow-up (optional)"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleReasonSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={() => setStep('score')}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default feedbackSystem;