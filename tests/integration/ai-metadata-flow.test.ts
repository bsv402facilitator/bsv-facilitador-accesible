/**
 * Integration tests for AI metadata in full request flows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockEnv, mockOpenAISuccess, spyOnFetch } from '../helpers/ai-mocks';
import type { Env } from '../../src/facilitator/types';

describe('AI Metadata Integration Tests', () => {
  let cleanupFetch: (() => void) | null = null;

  afterEach(() => {
    if (cleanupFetch) {
      cleanupFetch();
      cleanupFetch = null;
    }
  });

  describe('GET / with AI enabled', () => {
    it('should return AI-generated metadata for supported networks', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'This facilitator supports BSV testnet',
          explanation: 'We process payments on Bitcoin SV test network',
          stepByStep: ['Use testnet addresses', 'Get test funds', 'Create transactions'],
        })
      );

      const response = await app.request('/?language=en', {}, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.networks).toContain('bsv-testnet');
      expect(data.accessibility.plainLanguage).toBe('This facilitator supports BSV testnet');
      expect(data.accessibility.language).toBe('en');
    });

    it('should fallback to templates when AI is disabled', async () => {
      const env = createMockEnv({ AI_ENABLED: 'false' });

      const response = await app.request('/?language=es', {}, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.networks).toContain('bsv-testnet');
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.language).toBe('es');
    });
  });

  describe('POST /verify with AI', () => {
    it('should return AI-generated metadata for successful verification', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'Payment verified successfully',
          explanation: 'Your transaction meets all requirements',
        })
      );

      const validPayload = {
        payload: {
          x402Version: 1,
          scheme: 'exact',
          network: 'bsv-testnet',
          payload: {
            transaction:
              '010000000142696e6172795472616e73616374696f6e48617368000000006a47304402201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef012103abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffffff0140420f00000000001976a914abcdef1234567890abcdef1234567890abcdef1288ac00000000',
          },
        },
        paymentRequirements: {
          scheme: 'exact',
          network: 'bsv-testnet',
          maxAmountRequired: '1000000',
          resource: 'https://example.com/resource',
          payTo: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
          maxTimeoutSeconds: 300,
        },
        accessibilityPreferences: {
          language: 'en',
          cognitiveLevel: 'simple',
          audioFriendly: true,
        },
      };

      const response = await app.request('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }, env);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.language).toBe('en');
    });

    it('should use cache on subsequent identical requests', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });

      let fetchCallCount = 0;
      cleanupFetch = spyOnFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
        fetchCallCount++;
        return mockOpenAISuccess()(input, init);
      });

      const validPayload = {
        payload: {
          x402Version: 1,
          scheme: 'exact',
          network: 'bsv-testnet',
          payload: {
            transaction:
              '010000000142696e6172795472616e73616374696f6e48617368000000006a47304402201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef012103abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffffff0140420f00000000001976a914abcdef1234567890abcdef1234567890abcdef1288ac00000000',
          },
        },
        paymentRequirements: {
          scheme: 'exact',
          network: 'bsv-testnet',
          maxAmountRequired: '1000000',
          resource: 'https://example.com/resource',
          payTo: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
          maxTimeoutSeconds: 300,
        },
        accessibilityPreferences: {
          language: 'en',
          cognitiveLevel: 'simple',
        },
      };

      // First request - should call OpenAI
      const response1 = await app.request('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }, env);

      expect(response1.status).toBe(200);
      const initialFetchCount = fetchCallCount;

      // Second identical request - should use cache
      const response2 = await app.request('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }, env);

      expect(response2.status).toBe(200);

      // Fetch count should not increase (cache hit)
      expect(fetchCallCount).toBe(initialFetchCount);
    });
  });

  describe('POST /settle with AI', () => {
    it('should return AI-generated metadata for settlement errors', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'Transaction already on blockchain',
          explanation: 'This transaction was already processed',
        })
      );

      const settlePayload = {
        payload: {
          x402Version: 1,
          scheme: 'exact',
          network: 'bsv-testnet',
          payload: {
            transaction:
              '010000000142696e6172795472616e73616374696f6e48617368000000006a47304402201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef012103abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ffffffff0140420f00000000001976a914abcdef1234567890abcdef1234567890abcdef1288ac00000000',
          },
        },
        paymentRequirements: {
          scheme: 'exact',
          network: 'bsv-testnet',
          maxAmountRequired: '1000000',
          resource: 'https://example.com/resource',
          payTo: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
          maxTimeoutSeconds: 300,
        },
        accessibilityPreferences: {
          language: 'en',
          cognitiveLevel: 'medium',
        },
      };

      const response = await app.request('/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlePayload),
      }, env);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.cognitiveLevel).toBe('medium');
    });
  });

  describe('Fallback on AI failure', () => {
    it('should fallback to templates when OpenAI fails', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });

      // Mock OpenAI to return error
      cleanupFetch = spyOnFetch(async () => {
        return new Response(JSON.stringify({ error: 'Service unavailable' }), {
          status: 503,
        });
      });

      const response = await app.request('/?language=es', {}, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.language).toBe('es');
      // Should use template fallback
      expect(data.accessibility.plainLanguage).toContain('facilitador');
    });
  });

  describe('Performance under load', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const env = createMockEnv({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          app.request(`/?language=en&cognitiveLevel=simple`, {}, env)
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // After first request, subsequent ones should use cache
      const data = await responses[0].json();
      expect(data.accessibility.plainLanguage).toBeDefined();
    });
  });
});
