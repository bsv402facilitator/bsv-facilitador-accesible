import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockEnvV2, spyOnFetch, mockOpenAISuccess } from '../helpers/ai-mocks';

describe('CORS Middleware', () => {
  let cleanupFetch: () => void;
  const mockEnv = createMockEnvV2({
    AI_ENABLED: 'false', // Disable AI for deterministic tests
  });

  beforeAll(() => {
    // Mock OpenAI API
    cleanupFetch = spyOnFetch(mockOpenAISuccess());
  });

  afterAll(() => {
    cleanupFetch();
  });

  it('should include CORS headers in responses', async () => {
    const req = new Request('http://localhost/', {
      method: 'GET',
    });

    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const res = await app.request('/verify', {
      method: 'OPTIONS',
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });

  it('should allow POST requests with CORS headers', async () => {
    const validRequest = {
      payload: {
        x402Version: 1,
        network: 'bsv-testnet',
        scheme: 'exact',
        payload: {
          transaction: '0100000001a12345678901234567890123456789012345678901234567890123456789000000006b483045022100abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890022012345678901234567890abcdef1234567890abcdef1234567890abcdef123456012102aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccddffffffff0201000000000000001976a914abc123def456789012345678901234567890123488ac10270000000000001976a914123456789012345678901234567890123456789088ac00000000',
        },
      },
      paymentRequirements: {
        scheme: 'exact',
        network: 'bsv-testnet',
        payTo: 'mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB',
        maxAmountRequired: '500',
        resource: 'https://api.example.com/resource',
        maxTimeoutSeconds: 300,
      },
    };

    const req = new Request('http://localhost/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://example.com',
      },
      body: JSON.stringify(validRequest),
    });

    const res = await app.fetch(req, mockEnv);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should allow requests from any origin', async () => {
    const origins = [
      'https://claude.ai',
      'https://chatgpt.com',
      'http://localhost:3000',
      'https://example.com',
    ];

    for (const origin of origins) {
      const req = new Request('http://localhost/', {
        method: 'GET',
        headers: {
          Origin: origin,
        },
      });

      const res = await app.fetch(req, mockEnv);

      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    }
  });

  it('should include CORS headers in error responses', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json{',
    });

    expect(res.status).toBe(400);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should support required HTTP methods', async () => {
    const res = await app.request('/', {
      method: 'OPTIONS',
    });

    const allowedMethods = res.headers.get('Access-Control-Allow-Methods');
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');
    expect(allowedMethods).toContain('OPTIONS');
  });

  it('should allow Content-Type header', async () => {
    const res = await app.request('/', {
      method: 'OPTIONS',
    });

    const allowedHeaders = res.headers.get('Access-Control-Allow-Headers');
    expect(allowedHeaders).toContain('Content-Type');
  });
});
