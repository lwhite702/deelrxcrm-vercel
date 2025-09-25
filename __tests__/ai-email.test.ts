// @ts-nocheck
import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { 
  generateEmailSubject, 
  generateEmailBody, 
  optimizeEmailTemplate,
  generatePersonalizedEmail,
  emailAiUtils
} from '../lib/ai/email';
import { FEATURE_GATES } from '../lib/feature-gates';
import Statsig from 'statsig-node';

// Mock dependencies
jest.mock('statsig-node');
jest.mock('@ai-sdk/openai');
jest.mock('@/lib/db/drizzle');
jest.mock('@/lib/feature-gates');

const mockStatsig = Statsig as jest.Mocked<typeof Statsig>;

const mockOptions = {
  teamId: 1,
  userId: 123,
  temperature: 0.3,
  maxTokens: 100,
};

describe('Email AI Helpers', () => {

  const mockStatsigUser = {
    userID: '123',
    custom: { teamId: 1, feature: 'email_ai' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful feature gate checks by default
    mockStatsig.checkGate.mockResolvedValue(true);
    
    // Mock environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.STATSIG_SERVER_SECRET_KEY = 'secret-test-key';
    process.env.VERCEL_AI_EMAIL_MODEL = 'gpt-4o-mini';
  });

  describe('Content Safety', () => {
    describe('checkContentSafety', () => {
      it('should pass safe content', () => {
        const safeContent = 'Welcome to our professional service. We are excited to help you succeed.';
        const result = emailAiUtils.checkContentSafety(safeContent);
        
        expect(result.safe).toBe(true);
        expect(result.score).toBeGreaterThan(0.8);
        expect(result.issues).toHaveLength(0);
      });

      it('should detect prohibited spam patterns', () => {
        const spamContent = 'URGENT! Click here now to claim your FREE money! Act fast!';
        const result = emailAiUtils.checkContentSafety(spamContent);
        
        expect(result.safe).toBe(false);
        expect(result.score).toBeLessThan(0.8);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some((issue: string) => issue.includes('Prohibited pattern'))).toBe(true);
      });

      it('should detect excessive capitalization', () => {
        const capsContent = 'THIS IS AN EXTREMELY URGENT MESSAGE WITH TOO MUCH CAPS';
        const result = emailAiUtils.checkContentSafety(capsContent);
        
        expect(result.safe).toBe(false);
        expect(result.issues.some((issue: string) => issue.includes('capitalization'))).toBe(true);
      });

      it('should detect excessive exclamation marks', () => {
        const exclamationContent = 'Amazing offer!!!! Don\'t miss out!!!! Buy now!!!!';
        const result = emailAiUtils.checkContentSafety(exclamationContent);
        
        expect(result.safe).toBe(false);
        expect(result.issues.some((issue: string) => issue.includes('exclamation'))).toBe(true);
      });

      it('should handle edge cases gracefully', () => {
        expect(() => emailAiUtils.checkContentSafety('')).not.toThrow();
        expect(() => emailAiUtils.checkContentSafety(' ')).not.toThrow();
        expect(() => emailAiUtils.checkContentSafety('a')).not.toThrow();
      });
    });
  });

  describe('Feature Gate Enforcement', () => {
    it('should enforce AI_EMAIL_ENABLED gate', async () => {
      mockStatsig.checkGate
        .mockResolvedValueOnce(false) // kill switch
        .mockResolvedValueOnce(false); // main gate

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow('AI email functionality is not enabled');
    });

    it('should respect kill switch', async () => {
      mockStatsig.checkGate
        .mockResolvedValueOnce(true) // kill switch active
        .mockResolvedValueOnce(true); // main gate

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow('AI email system is temporarily disabled');
    });

    it('should check specific feature gates', async () => {
      mockStatsig.checkGate
        .mockResolvedValueOnce(false) // kill switch
        .mockResolvedValueOnce(true)  // main gate
        .mockResolvedValueOnce(false); // specific gate

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow('Specific AI email feature');
    });
  });

  describe('generateEmailSubject', () => {
    const mockGenerateObject = jest.fn();

    beforeEach(() => {
      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));
    });

    it('should generate valid subject with alternatives', async () => {
      const mockResponse = {
        object: {
          subject: 'Welcome to Our Professional Service',
          confidence: 0.9,
          reasoning: 'Clear and professional tone',
          alternatives: [
            'Your Professional Service Awaits',
            'Get Started with Our Service Today',
          ],
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      const result = await generateEmailSubject({
        purpose: 'Welcome new users',
        audience: 'new signups',
        tone: 'professional',
      }, mockOptions);

      expect(result).toEqual(mockResponse.object);
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Welcome new users'),
          temperature: 0.3,
          maxTokens: 100,
        })
      );
    });

    it('should filter unsafe alternative subjects', async () => {
      const mockResponse = {
        object: {
          subject: 'Welcome to Our Service',
          confidence: 0.9,
          reasoning: 'Professional tone',
          alternatives: [
            'URGENT! Click here NOW!!!',
            'Professional Alternative Subject',
            'Buy now or miss out forever!',
          ],
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      const result = await generateEmailSubject({
        purpose: 'Welcome new users',
        audience: 'new signups',
      }, mockOptions);

      expect(result.alternatives).toEqual(['Professional Alternative Subject']);
      expect(result.alternatives).not.toContain('URGENT! Click here NOW!!!');
      expect(result.alternatives).not.toContain('Buy now or miss out forever!');
    });

    it('should handle AI generation errors gracefully', async () => {
      mockGenerateObject.mockRejectedValue(new Error('API Error'));

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow('Email subject generation failed');
    });

    it('should validate subject length limits', async () => {
      const longSubject = 'a'.repeat(emailAiUtils.MAX_SUBJECT_LENGTH + 1);
      const mockResponse = {
        object: {
          subject: longSubject,
          confidence: 0.9,
          reasoning: 'Test',
          alternatives: [],
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow('safety check');
    });
  });

  describe('generateEmailBody', () => {
    const mockGenerateObject = jest.fn();

    beforeEach(() => {
      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));
    });

    it('should generate valid email body', async () => {
      const mockResponse = {
        object: {
          body: 'Dear valued customer,\n\nWelcome to our professional service. We are committed to helping you achieve your goals.\n\nBest regards,\nThe Team',
          tone: 'professional',
          confidence: 0.85,
          reasoning: 'Professional tone with clear structure',
          safetyScore: 0.95,
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      const result = await generateEmailBody({
        subject: 'Welcome to Our Service',
        purpose: 'Welcome new users',
        audience: 'new customers',
        tone: 'professional',
        keyPoints: ['welcome', 'professional service', 'support'],
      }, mockOptions);

      expect(result).toEqual(mockResponse.object);
      expect(result.safetyScore).toBeGreaterThan(0.8);
    });

    it('should enforce must-include constraints', async () => {
      const mockResponse = {
        object: {
          body: 'Welcome to our service. We provide excellent support.',
          tone: 'professional',
          confidence: 0.8,
          reasoning: 'Professional welcome message',
          safetyScore: 0.9,
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      await expect(
        generateEmailBody({
          subject: 'Welcome',
          purpose: 'Welcome users',
          audience: 'customers',
          tone: 'professional',
          keyPoints: ['welcome'],
          constraints: {
            mustInclude: ['required phrase not in body'],
          },
        }, mockOptions)
      ).rejects.toThrow('missing required content');
    });

    it('should enforce must-avoid constraints', async () => {
      const mockResponse = {
        object: {
          body: 'Welcome! This contains technical jargon that should be avoided.',
          tone: 'professional',
          confidence: 0.8,
          reasoning: 'Welcome message',
          safetyScore: 0.9,
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      await expect(
        generateEmailBody({
          subject: 'Welcome',
          purpose: 'Welcome users',
          audience: 'customers',
          tone: 'professional',
          keyPoints: ['welcome'],
          constraints: {
            mustAvoid: ['technical jargon'],
          },
        }, mockOptions)
      ).rejects.toThrow('prohibited content');
    });
  });

  describe('optimizeEmailTemplate', () => {
    const mockGenerateObject = jest.fn();

    beforeEach(() => {
      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));
    });

    it('should optimize email template successfully', async () => {
      const mockResponse = {
        object: {
          template: '<html><body><h1>{{header}}</h1><p>{{body}}</p></body></html>',
          variables: ['header', 'body', 'cta'],
          structure: {
            header: 'Professional Header',
            body: 'Optimized body content',
            footer: 'Contact information',
            cta: 'Clear call to action',
          },
          confidence: 0.88,
          recommendations: [
            'Add mobile-responsive CSS',
            'Improve CTA visibility',
            'Include alt text for images',
          ],
        },
      };

      mockGenerateObject.mockResolvedValue(mockResponse);

      const result = await optimizeEmailTemplate({
        html: '<html><body>Original template</body></html>',
        purpose: 'Product announcement',
        targetMetrics: {
          openRate: 25,
          clickRate: 5,
        },
      }, mockOptions);

      expect(result).toEqual(mockResponse.object);
      expect(result.recommendations).toBeDefined();
      expect(result.variables).toContain('header');
    });
  });

  describe('generatePersonalizedEmail', () => {
    const mockGenerateText = jest.fn();

    beforeEach(() => {
      jest.doMock('ai', () => ({
        generateText: mockGenerateText,
      }));
    });

    it('should personalize email content', async () => {
      const mockResponse = {
        text: 'Subject: Welcome to DeelRx, John!\n\nDear John,\n\nWelcome to DeelRx! As a leader in the technology industry, we know you\'ll appreciate our innovative CRM solutions.\n\nBest regards,\nThe DeelRx Team',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generatePersonalizedEmail({
        name: 'John',
        email: 'john@techcompany.com',
        company: 'Tech Company Inc',
        industry: 'technology',
        interests: ['CRM', 'automation'],
      }, {
        subject: 'Welcome to DeelRx',
        bodyTemplate: 'Welcome to our service!',
        purpose: 'Welcome new user',
      }, mockOptions);

      expect(result.subject).toContain('John');
      expect(result.body).toContain('technology');
      expect(result.personalizationScore).toBeGreaterThan(0);
    });

    it('should calculate personalization score correctly', async () => {
      const mockResponse = {
        text: 'Subject: Welcome John from Tech Company!\n\nDear John,\n\nAs a technology industry professional, welcome to our CRM platform.\n\nBest regards,\nTeam',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generatePersonalizedEmail({
        name: 'John',
        email: 'john@techcompany.com',
        company: 'Tech Company',
        industry: 'technology',
        interests: ['CRM'],
      }, {
        subject: 'Welcome',
        bodyTemplate: 'Welcome message',
        purpose: 'Welcome',
      }, mockOptions);

      // Should score high for including name, company, industry, and interests
      expect(result.personalizationScore).toBeCloseTo(1.0, 1);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should implement retry logic with exponential backoff', async () => {
      const mockGenerateObject = jest.fn();
      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));

      // Fail twice, then succeed
      mockGenerateObject
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({
          object: {
            subject: 'Success after retries',
            confidence: 0.9,
            reasoning: 'Finally worked',
            alternatives: [],
          },
        });

      const startTime = Date.now();
      const result = await generateEmailSubject({
        purpose: 'test',
        audience: 'test audience',
      }, { ...mockOptions, retries: 3 });

      const duration = Date.now() - startTime;
      
      expect(result.subject).toBe('Success after retries');
      expect(mockGenerateObject).toHaveBeenCalledTimes(3);
      // Should have some delay due to retries
      expect(duration).toBeGreaterThan(1000);
    });

    it('should fail after max retries exceeded', async () => {
      const mockGenerateObject = jest.fn();
      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));

      mockGenerateObject.mockRejectedValue(new Error('Persistent error'));

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, { ...mockOptions, retries: 2 })
      ).rejects.toThrow('Email subject generation failed');

      expect(mockGenerateObject).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Request Logging', () => {
    it('should log successful AI requests', async () => {
      const mockInsert = jest.fn().mockResolvedValue(undefined);
      const mockDb = {
        insert: () => ({
          values: mockInsert,
        }),
      };

      jest.doMock('@/lib/db/drizzle', () => ({
        db: mockDb,
      }));

      const mockGenerateObject = jest.fn().mockResolvedValue({
        object: {
          subject: 'Test Subject',
          confidence: 0.9,
          reasoning: 'Test reasoning',
          alternatives: [],
        },
      });

      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));

      await generateEmailSubject({
        purpose: 'test',
        audience: 'test audience',
      }, mockOptions);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          userId: 123,
          feature: 'email_subject_generation',
          success: true,
        })
      );
    });

    it('should log failed AI requests with error details', async () => {
      const mockInsert = jest.fn().mockResolvedValue(undefined);
      const mockDb = {
        insert: () => ({
          values: mockInsert,
        }),
      };

      jest.doMock('@/lib/db/drizzle', () => ({
        db: mockDb,
      }));

      const mockGenerateObject = jest.fn().mockRejectedValue(
        new Error('API Error')
      );

      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow();

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 1,
          userId: 123,
          feature: 'email_subject_generation',
          success: false,
          error: expect.stringContaining('API Error'),
        })
      );
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing environment variables gracefully', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(
        generateEmailSubject({
          purpose: 'test',
          audience: 'test audience',
        }, mockOptions)
      ).rejects.toThrow();
    });

    it('should use model configuration from environment', async () => {
      process.env.VERCEL_AI_EMAIL_SUBJECT_MODEL = 'custom-model';

      const mockGenerateObject = jest.fn().mockResolvedValue({
        object: {
          subject: 'Test',
          confidence: 0.9,
          reasoning: 'Test',
          alternatives: [],
        },
      });

      jest.doMock('ai', () => ({
        generateObject: mockGenerateObject,
      }));

      await generateEmailSubject({
        purpose: 'test',
        audience: 'test audience',
      }, mockOptions);

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            modelId: 'custom-model',
          }),
        })
      );
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-End Email AI Workflow', () => {
    it('should complete full email generation workflow', async () => {
      // Mock all dependencies for integration test
      const mockStatsig = {
        initialize: jest.fn().mockResolvedValue(undefined),
        checkGate: jest.fn().mockResolvedValue(true),
      };

      const mockAI = {
        generateObject: jest.fn().mockResolvedValue({
          object: {
            subject: 'Professional Welcome Email',
            confidence: 0.9,
            reasoning: 'Clear and professional',
            alternatives: ['Welcome to Our Platform', 'Get Started Today'],
          },
        }),
      };

      jest.doMock('statsig-node', () => mockStatsig);
      jest.doMock('ai', () => mockAI);

      // Test subject generation
      const subjectResult = await generateEmailSubject({
        purpose: 'Welcome new users',
        audience: 'new signups',
        tone: 'professional',
      }, mockOptions);

      expect(subjectResult.subject).toBeTruthy();
      expect(subjectResult.confidence).toBeGreaterThan(0.8);

      // Test body generation using the generated subject
      mockAI.generateObject.mockResolvedValueOnce({
        object: {
          body: 'Dear valued customer,\n\nWelcome to our platform...',
          tone: 'professional',
          confidence: 0.85,
          reasoning: 'Professional welcome message',
          safetyScore: 0.95,
        },
      });

      const bodyResult = await generateEmailBody({
        subject: subjectResult.subject,
        purpose: 'Welcome new users',
        audience: 'new signups',
        tone: 'professional',
        keyPoints: ['welcome', 'getting started', 'support'],
      }, mockOptions);

      expect(bodyResult.body).toBeTruthy();
      expect(bodyResult.safetyScore).toBeGreaterThan(0.8);
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  it('should complete AI generation within reasonable time limits', async () => {
    const mockGenerateObject = jest.fn().mockImplementation(
      () => new Promise(resolve => {
        setTimeout(() => resolve({
          object: {
            subject: 'Fast Generation',
            confidence: 0.9,
            reasoning: 'Quick test',
            alternatives: [],
          },
        }), 100); // Simulate 100ms AI response
      })
    );

    jest.doMock('ai', () => ({
      generateObject: mockGenerateObject,
    }));

    const startTime = Date.now();
    
    await generateEmailSubject({
      purpose: 'performance test',
      audience: 'test audience',
    }, mockOptions);

    const duration = Date.now() - startTime;
    
    // Should complete within 5 seconds including retries and processing
    expect(duration).toBeLessThan(5000);
  });

  it('should handle concurrent requests efficiently', async () => {
    const mockGenerateObject = jest.fn().mockResolvedValue({
      object: {
        subject: 'Concurrent Test',
        confidence: 0.9,
        reasoning: 'Concurrent generation',
        alternatives: [],
      },
    });

    jest.doMock('ai', () => ({
      generateObject: mockGenerateObject,
    }));

    const promises = Array.from({ length: 5 }, (_, i) =>
      generateEmailSubject({
        purpose: `concurrent test ${i}`,
        audience: 'test audience',
      }, { ...mockOptions, userId: 100 + i })
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(5);
    expect(duration).toBeLessThan(10000); // All should complete within 10 seconds
    expect(mockGenerateObject).toHaveBeenCalledTimes(5);
  });
});