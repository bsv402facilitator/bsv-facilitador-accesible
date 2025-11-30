/**
 * Integration tests for AI metadata in full request flows
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockEnvV2, mockOpenAISuccess, spyOnFetch } from '../helpers/ai-mocks';
import type { EnvV2 } from '../../src/facilitator/types';

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
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(
        mockOpenAISuccess({
          plainLanguage: 'This facilitator supports BSV testnet',
          explanation: 'We process payments on Bitcoin SV test network',
          stepByStep: ['Use testnet addresses', 'Get test funds', 'Create transactions'],
        })
      );

      const req = new Request('http://localhost/?language=en', {
        method: 'GET',
      });

      const response = await app.fetch(req, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.networks).toContain('bsv-testnet');
      // GET / uses V1 structure (AccessibleResponse)
      expect(data.accessibility.plainLanguage).toBe('This facilitator supports BSV testnet');
      expect(data.accessibility.language).toBe('en');
    });

    it('should fallback to templates when AI is disabled', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'false' });

      const req = new Request('http://localhost/?language=es', {
        method: 'GET',
      });

      const response = await app.fetch(req, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.networks).toContain('bsv-testnet');
      // GET / uses V1 structure (AccessibleResponse)
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.language).toBe('es');
    });
  });

  describe('POST /verify with AI', () => {
    it('should return AI-generated metadata for successful verification', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
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

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await app.fetch(req, env);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessibility.content.plainLanguage).toBeDefined();
      expect(data.accessibility.language.code).toBe('en');
    });

    it('should use cache on subsequent identical requests', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });

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
      const req1 = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response1 = await app.fetch(req1, env);

      expect(response1.status).toBe(200);
      const initialFetchCount = fetchCallCount;

      // Second identical request - should use cache
      const req2 = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response2 = await app.fetch(req2, env);

      expect(response2.status).toBe(200);

      // Fetch count should not increase (cache hit)
      expect(fetchCallCount).toBe(initialFetchCount);
    });
  });

  describe('POST /settle with AI', () => {
    it('should return AI-generated metadata for settlement errors', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
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

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlePayload),
      });

      const response = await app.fetch(req, env);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.accessibility.content.plainLanguage).toBeDefined();
      expect(data.accessibility.cognitive.level).toBe('medium');
    });
  });

  describe('Fallback on AI failure', () => {
    it('should fallback to templates when OpenAI fails', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });

      // Mock OpenAI to return error
      cleanupFetch = spyOnFetch(async () => {
        return new Response(JSON.stringify({ error: 'Service unavailable' }), {
          status: 503,
        });
      });

      const req = new Request('http://localhost/?language=es', {
        method: 'GET',
      });

      const response = await app.fetch(req, env);
      const data = await response.json();

      expect(response.status).toBe(200);
      // GET / uses V1 structure (AccessibleResponse)
      expect(data.accessibility.plainLanguage).toBeDefined();
      expect(data.accessibility.language).toBe('es');
      // Should use template fallback
      expect(data.accessibility.plainLanguage).toContain('facilitador');
    });
  });

  describe('Performance under load', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const env = createMockEnvV2({ AI_ENABLED: 'true', AI_ROLLOUT_PERCENTAGE: '100' });
      cleanupFetch = spyOnFetch(mockOpenAISuccess());

      const promises = [];
      for (let i = 0; i < 10; i++) {
        const req = new Request('http://localhost/?language=en&cognitiveLevel=simple', {
          method: 'GET',
        });
        promises.push(app.fetch(req, env));
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // After first request, subsequent ones should use cache
      const data = await responses[0].json();
      // GET / uses V1 structure (AccessibleResponse)
      expect(data.accessibility.plainLanguage).toBeDefined();
    });
  });
});
