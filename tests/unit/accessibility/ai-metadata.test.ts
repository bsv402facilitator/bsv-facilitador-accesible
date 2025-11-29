/**
 * Unit tests for AI metadata generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMetadataWithAI } from '../../../src/facilitator/accessibility/ai-metadata';
import type { AccessibilityPreferences, MetadataContext } from '../../../src/facilitator/types';
import {
  createMockEnv,
  mockOpenAISuccess,
  mockOpenAIError,
  mockOpenAIInvalidJSON,
  mockOpenAIInvalidSchema,
  spyOnFetch,
} from '../../helpers/ai-mocks';

describe('AI Metadata Generation', () => {
  let cleanupFetch: (() => void) | null = null;

  afterEach(() => {
    if (cleanupFetch) {
      cleanupFetch();
      cleanupFetch = null;
    }
  });

  describe('Feature Flags', () => {
    it('should use template fallback when AI_ENABLED is false', async () => {
      const env = createMockEnv({ AI_ENABLED: 'false' });
      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });

    it('should use template fallback when AI_ROLLOUT_PERCENTAGE is 0', async () => {
      const env = createMockEnv({ AI_ROLLOUT_PERCENTAGE: '0' });
      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });

    it('should attempt AI generation when AI_ENABLED is true and rollout is 100', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      expect(metadata.plainLanguage).toBe('Test plain language');
      expect(metadata.language).toBe('es');
    });
  });

  describe('Caching', () => {
    it('should return cached metadata on cache hit', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      // First call - should hit OpenAI
      const metadata1 = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      // Replace fetch with error mock
      cleanupFetch();
      cleanupFetch = spyOnFetch(mockOpenAIError());

      // Second call - should use cache, not hit OpenAI
      const metadata2 = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      expect(metadata1).toEqual(metadata2);
      expect(metadata2.plainLanguage).toBe('Test plain language');
    });

    it('should generate different cache keys for different contexts', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({ plainLanguage: 'Context specific message' })
      );

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      // First call with amount 1000
      const metadata1 = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      // Second call with amount 2000 (different context)
      const metadata2 = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '2000', address: 'test-address' },
        preferences,
        env
      );

      // Both should succeed (different cache keys)
      expect(metadata1.plainLanguage).toBe('Context specific message');
      expect(metadata2.plainLanguage).toBe('Context specific message');
    });

    it('should use generic cache key for empty context', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      // First call
      await createMetadataWithAI('success.supportedNetworks', {}, preferences, env);

      // Verify cache was set
      const cacheKey = 'ai-meta:es:simple:success.supportedNetworks:generic';
      const cached = await env.METADATA_CACHE?.get(cacheKey, 'json');

      expect(cached).toBeDefined();
    });
  });

  describe('OpenAI Integration', () => {
    it('should successfully generate metadata from OpenAI', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'Payment verified',
          explanation: 'Your transaction meets all requirements',
          stepByStep: ['Received transaction', 'Validated amount', 'Ready to process'],
          hints: { nextSteps: 'Call /settle endpoint' },
        })
      );

      const preferences: AccessibilityPreferences = {
        language: 'en',
        cognitiveLevel: 'medium',
        audioFriendly: false,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      expect(metadata.plainLanguage).toBe('Payment verified');
      expect(metadata.explanation).toBe('Your transaction meets all requirements');
      expect(metadata.stepByStep).toHaveLength(3);
      expect(metadata.hints.nextSteps).toBe('Call /settle endpoint');
      expect(metadata.language).toBe('en');
      expect(metadata.cognitiveLevel).toBe('medium');
    });

    it('should fallback to template on OpenAI error', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAIError(500));

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      // Should return template fallback
      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });

    it('should fallback to template on invalid JSON response', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAIInvalidJSON());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      // Should return template fallback
      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });

    it('should fallback to template on invalid schema', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAIInvalidSchema());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000', address: 'test-address' },
        preferences,
        env
      );

      // Should return template fallback
      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });
  });

  describe('Model Selection', () => {
    it('should use appropriate model for different scenarios', async () => {
      const env = createMockEnv({
        OPENAI_MODEL_DEFAULT: 'gpt-4o-mini',
        OPENAI_MODEL_COMPLEX: 'gpt-4',
      });

      let requestModel: string | undefined;

      cleanupFetch = spyOnFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.body) {
          const body = JSON.parse(init.body as string);
          requestModel = body.model;
        }
        return mockOpenAISuccess()(input, init);
      });

      const preferences: AccessibilityPreferences = {
        language: 'en',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      // Simple English success should use gpt-3.5-turbo
      await createMetadataWithAI('success.verifyValid', {}, preferences, env);
      expect(requestModel).toBe('gpt-3.5-turbo');
    });
  });

  describe('Context Hashing', () => {
    it('should generate consistent hash for same context', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const context1: MetadataContext = { amount: '1000', address: 'test' };
      const context2: MetadataContext = { amount: '1000', address: 'test' };

      await createMetadataWithAI('success.verifyValid', context1, preferences, env);
      await createMetadataWithAI('success.verifyValid', context2, preferences, env);

      // Both should use same cache key
      const keys = await env.METADATA_CACHE?.list({ prefix: 'ai-meta:es:simple:success.verifyValid:' });
      expect(keys?.keys.length).toBe(1);
    });

    it('should generate different hash for different context', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const context1: MetadataContext = { amount: '1000', address: 'test1' };
      const context2: MetadataContext = { amount: '2000', address: 'test2' };

      await createMetadataWithAI('success.verifyValid', context1, preferences, env);
      await createMetadataWithAI('success.verifyValid', context2, preferences, env);

      // Should create two different cache entries
      const keys = await env.METADATA_CACHE?.list({ prefix: 'ai-meta:es:simple:success.verifyValid:' });
      expect(keys?.keys.length).toBe(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing METADATA_CACHE gracefully', async () => {
      const env = createMockEnv({ METADATA_CACHE: undefined });
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      // Should still work, just without caching
      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        { amount: '1000' },
        preferences,
        env
      );

      expect(metadata.plainLanguage).toBeDefined();
    });

    it('should fallback to template for unknown message types', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAIError());

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'unknown.message.type',
        {},
        preferences,
        env
      );

      // Should return generic error template
      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.language).toBe('es');
    });
  });

  describe('Language Support', () => {
    it('should generate Spanish metadata', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'Pago verificado correctamente',
          explanation: 'Tu transacción cumple con todos los requisitos',
        })
      );

      const preferences: AccessibilityPreferences = {
        language: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        {},
        preferences,
        env
      );

      expect(metadata.language).toBe('es');
      expect(metadata.plainLanguage).toContain('Pago');
    });

    it('should generate English metadata', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'Payment verified successfully',
          explanation: 'Your transaction meets all requirements',
        })
      );

      const preferences: AccessibilityPreferences = {
        language: 'en',
        cognitiveLevel: 'simple',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAI(
        'success.verifyValid',
        {},
        preferences,
        env
      );

      expect(metadata.language).toBe('en');
      expect(metadata.plainLanguage).toContain('Payment');
    });
  });

  describe('Cognitive Levels', () => {
    it('should preserve cognitive level in generated metadata', async () => {
      const env = createMockEnv();
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const levels: Array<'simple' | 'medium' | 'advanced'> = ['simple', 'medium', 'advanced'];

      for (const level of levels) {
        const preferences: AccessibilityPreferences = {
          language: 'es',
          cognitiveLevel: level,
          audioFriendly: true,
        };

        const metadata = await createMetadataWithAI(
          'success.verifyValid',
          {},
          preferences,
          env
        );

        expect(metadata.cognitiveLevel).toBe(level);
      }
    });
  });
});
