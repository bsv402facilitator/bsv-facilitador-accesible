/**
 * Unit tests for feedback-system.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFeedbackId,
  validateFeedback,
  storeFeedback,
  getFeedback,
  getFeedbackStats,
  updateFeedbackStats,
  createFeedbackPrompt,
  analyzeFeedbackPatterns,
} from '../../../src/facilitator/accessibility/feedback-system';
import type { UserFeedback } from '../../../src/facilitator/accessibility/feedback-system';

describe('feedback-system', () => {
  describe('generateFeedbackId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateFeedbackId();
      const id2 = generateFeedbackId();

      expect(id1).toMatch(/^feedback-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^feedback-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp', () => {
      const id = generateFeedbackId();
      const parts = id.split('-');

      expect(parts[0]).toBe('feedback');
      expect(parts[1]).toBeTruthy();
      expect(Number.isNaN(Number(parts[1]))).toBe(false);
    });
  });

  describe('validateFeedback', () => {
    it('should validate complete feedback successfully', () => {
      const feedback: Partial<UserFeedback> = {
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 4,
      };

      const result = validateFeedback(feedback);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject feedback without required fields', () => {
      const feedback: Partial<UserFeedback> = {
        messageType: 'success.verifyValid',
      };

      const result = validateFeedback(feedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cognitiveLevel is required');
      expect(result.errors).toContain('language is required');
      expect(result.errors).toContain('overallRating is required');
    });

    it('should reject invalid overall rating', () => {
      const feedback: Partial<UserFeedback> = {
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 6 as unknown as 5, // Invalid rating
      };

      const result = validateFeedback(feedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('overallRating must be between 1 and 5');
    });

    it('should reject invalid category ratings', () => {
      const feedback: Partial<UserFeedback> = {
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 4,
        categoryRatings: {
          clarity: 0 as unknown as 5, // Invalid
          helpfulness: 6 as unknown as 5, // Invalid
        },
      };

      const result = validateFeedback(feedback);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('clarity'))).toBe(true);
      expect(result.errors.some((e) => e.includes('helpfulness'))).toBe(true);
    });

    it('should reject invalid cognitive level', () => {
      const feedback: Partial<UserFeedback> = {
        messageType: 'success.verifyValid',
        cognitiveLevel: 'invalid' as unknown as 'simple',
        language: 'es',
        overallRating: 4,
      };

      const result = validateFeedback(feedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid cognitiveLevel');
    });
  });

  describe('storeFeedback', () => {
    it('should return false when KV is undefined', async () => {
      const feedback: UserFeedback = {
        feedbackId: 'test-123',
        timestamp: new Date().toISOString(),
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 5,
      };

      const result = await storeFeedback(feedback, undefined);

      expect(result).toBe(false);
    });

    it('should store feedback successfully when KV is available', async () => {
      const mockKV = {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const feedback: UserFeedback = {
        feedbackId: 'test-123',
        timestamp: new Date().toISOString(),
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 5,
      };

      const result = await storeFeedback(feedback, mockKV);

      expect(result).toBe(true);
      expect(mockKV.put).toHaveBeenCalledWith(
        'feedback:test-123',
        JSON.stringify(feedback),
        { expirationTtl: 86400 * 90 }
      );
    });

    it('should return false when KV put fails', async () => {
      const mockKV = {
        put: vi.fn().mockRejectedValue(new Error('KV Error')),
        get: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const feedback: UserFeedback = {
        feedbackId: 'test-123',
        timestamp: new Date().toISOString(),
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 5,
      };

      const result = await storeFeedback(feedback, mockKV);

      expect(result).toBe(false);
    });
  });

  describe('getFeedback', () => {
    it('should return null when KV is undefined', async () => {
      const result = await getFeedback('test-123', undefined);

      expect(result).toBeNull();
    });

    it('should retrieve feedback successfully', async () => {
      const storedFeedback: UserFeedback = {
        feedbackId: 'test-123',
        timestamp: new Date().toISOString(),
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple',
        language: 'es',
        overallRating: 5,
      };

      const mockKV = {
        get: vi.fn().mockResolvedValue(storedFeedback),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const result = await getFeedback('test-123', mockKV);

      expect(result).toEqual(storedFeedback);
      expect(mockKV.get).toHaveBeenCalledWith('feedback:test-123', 'json');
    });

    it('should return null when feedback not found', async () => {
      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const result = await getFeedback('nonexistent', mockKV);

      expect(result).toBeNull();
    });

    it('should return null when KV get fails', async () => {
      const mockKV = {
        get: vi.fn().mockRejectedValue(new Error('KV Error')),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const result = await getFeedback('test-123', mockKV);

      expect(result).toBeNull();
    });
  });

  describe('getFeedbackStats', () => {
    it('should return null when KV is undefined', async () => {
      const result = await getFeedbackStats('success.verifyValid', 'simple', undefined);

      expect(result).toBeNull();
    });

    it('should retrieve stats successfully', async () => {
      const mockStats = {
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple' as const,
        totalFeedbacks: 10,
        averageOverallRating: 4.5,
        averageCategoryRatings: {},
        commonIssues: [],
        suggestedImprovements: [],
        lastUpdated: new Date().toISOString(),
      };

      const mockKV = {
        get: vi.fn().mockResolvedValue(mockStats),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const result = await getFeedbackStats('success.verifyValid', 'simple', mockKV);

      expect(result).toEqual(mockStats);
      expect(mockKV.get).toHaveBeenCalledWith(
        'feedback-stats:success.verifyValid:simple',
        'json'
      );
    });
  });

  describe('updateFeedbackStats', () => {
    it('should return false when KV is undefined', async () => {
      const result = await updateFeedbackStats('success.verifyValid', 'simple', undefined);

      expect(result).toBe(false);
    });

    it('should return true when KV is available', async () => {
      const mockKV = {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as unknown as KVNamespace;

      const result = await updateFeedbackStats('success.verifyValid', 'simple', mockKV);

      expect(result).toBe(true);
    });
  });

  describe('createFeedbackPrompt', () => {
    it('should create beginner-level prompt in Spanish', () => {
      const result = createFeedbackPrompt('beginner', 'es');

      expect(result.prompt).toContain('útil');
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0]?.id).toBe('overallRating');
      expect(result.questions[0]?.type).toBe('rating');
    });

    it('should create beginner-level prompt in English', () => {
      const result = createFeedbackPrompt('beginner', 'en');

      expect(result.prompt).toContain('helpful');
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions[0]?.id).toBe('overallRating');
    });

    it('should create simple-level prompt', () => {
      const result = createFeedbackPrompt('simple', 'es');

      expect(result.prompt).toBeTruthy();
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.questions.some((q) => q.id === 'whatWasHelpful')).toBe(true);
      expect(result.questions.some((q) => q.id === 'whatWasMissing')).toBe(true);
    });

    it('should create advanced-level prompt with detailed categories', () => {
      const result = createFeedbackPrompt('advanced', 'es');

      expect(result.prompt).toContain('accesibilidad');
      expect(result.questions.length).toBeGreaterThan(3);
      expect(result.questions.some((q) => q.id === 'clarity')).toBe(true);
      expect(result.questions.some((q) => q.id === 'completeness')).toBe(true);
      expect(result.questions.some((q) => q.id === 'helpfulness')).toBe(true);
    });

    it('should create medium-level prompt', () => {
      const result = createFeedbackPrompt('medium', 'es');

      expect(result.prompt).toBeTruthy();
      expect(result.questions.length).toBeGreaterThan(3);
    });

    it('should create expert-level prompt', () => {
      const result = createFeedbackPrompt('expert', 'en');

      expect(result.prompt).toBeTruthy();
      expect(result.questions.length).toBeGreaterThan(3);
    });
  });

  describe('analyzeFeedbackPatterns', () => {
    it('should return empty results for empty feedbacks', () => {
      const result = analyzeFeedbackPatterns([]);

      expect(result.averageRating).toBe(0);
      expect(result.commonIssues).toHaveLength(0);
      expect(result.topSuggestions).toHaveLength(0);
      expect(result.satisfactionRate).toBe(0);
    });

    it('should calculate average rating correctly', () => {
      const feedbacks: UserFeedback[] = [
        {
          feedbackId: 'f1',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 5,
        },
        {
          feedbackId: 'f2',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 3,
        },
        {
          feedbackId: 'f3',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 4,
        },
      ];

      const result = analyzeFeedbackPatterns(feedbacks);

      expect(result.averageRating).toBe(4); // (5+3+4)/3 = 4
    });

    it('should calculate satisfaction rate correctly', () => {
      const feedbacks: UserFeedback[] = [
        {
          feedbackId: 'f1',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 5,
        },
        {
          feedbackId: 'f2',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 4,
        },
        {
          feedbackId: 'f3',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 2,
        },
        {
          feedbackId: 'f4',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 3,
        },
      ];

      const result = analyzeFeedbackPatterns(feedbacks);

      expect(result.satisfactionRate).toBe(50); // 2/4 = 50%
    });

    it('should extract common issues', () => {
      const feedbacks: UserFeedback[] = [
        {
          feedbackId: 'f1',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 3,
          whatWasMissing: 'Faltaron ejemplos',
        },
        {
          feedbackId: 'f2',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 3,
          whatWasMissing: 'Explicación muy técnica',
        },
      ];

      const result = analyzeFeedbackPatterns(feedbacks);

      expect(result.commonIssues).toContain('Faltaron ejemplos');
      expect(result.commonIssues).toContain('Explicación muy técnica');
    });

    it('should extract top suggestions', () => {
      const feedbacks: UserFeedback[] = [
        {
          feedbackId: 'f1',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 4,
          suggestedImprovements: 'Agregar más ejemplos visuales',
        },
        {
          feedbackId: 'f2',
          timestamp: new Date().toISOString(),
          messageType: 'success.verifyValid',
          cognitiveLevel: 'simple',
          language: 'es',
          overallRating: 4,
          suggestedImprovements: 'Simplificar el lenguaje técnico',
        },
      ];

      const result = analyzeFeedbackPatterns(feedbacks);

      expect(result.topSuggestions).toContain('Agregar más ejemplos visuales');
      expect(result.topSuggestions).toContain('Simplificar el lenguaje técnico');
    });

    it('should limit common issues to 5', () => {
      const feedbacks: UserFeedback[] = Array.from({ length: 10 }, (_, i) => ({
        feedbackId: `f${i}`,
        timestamp: new Date().toISOString(),
        messageType: 'success.verifyValid',
        cognitiveLevel: 'simple' as const,
        language: 'es',
        overallRating: 3 as const,
        whatWasMissing: `Issue ${i}`,
      }));

      const result = analyzeFeedbackPatterns(feedbacks);

      expect(result.commonIssues.length).toBeLessThanOrEqual(5);
    });
  });
});
