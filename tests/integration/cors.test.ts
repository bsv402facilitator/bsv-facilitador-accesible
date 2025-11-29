import { describe, it, expect } from 'vitest';
import app from '../../src/facilitator/index';

describe('CORS Middleware', () => {
  it('should include CORS headers in responses', async () => {
    const res = await app.request('/', {
      method: 'GET',
    });

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
        network: 'bsv-testnet',
        scheme: 'exact',
        txHex:
          '0100000001a12345678901234567890123456789012345678901234567890123456789000000006b483045022100abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890022012345678901234567890abcdef1234567890abcdef1234567890abcdef123456012102aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccddffffffff0201000000000000001976a914abc123def456789012345678901234567890123488ac10270000000000001976a914123456789012345678901234567890123456789088ac00000000',
      },
      paymentRequirements: {
        payTo: 'mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB',
        maxAmountRequired: '500',
      },
    };

    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://example.com',
      },
      body: JSON.stringify(validRequest),
    });

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
      const res = await app.request('/', {
        method: 'GET',
        headers: {
          Origin: origin,
        },
      });

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
