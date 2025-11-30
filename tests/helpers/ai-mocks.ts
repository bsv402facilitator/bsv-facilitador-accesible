/**
 * Mock helpers for AI metadata testing
 *
 * Provides mock implementations of:
 * - Cloudflare Env bindings
 * - KV Namespace
 * - OpenAI API responses
 */

import type { Env, EnvV2, AccessibleMetadata } from '../../src/facilitator/types';

// ============================================================================
// Mock Env
// ============================================================================

/**
 * Create a mock Env object for testing
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    OPENAI_API_KEY: 'sk-test-mock-api-key',
    AI_ENABLED: 'true',
    AI_ROLLOUT_PERCENTAGE: '100',
    OPENAI_MODEL_DEFAULT: 'gpt-4o-mini',
    OPENAI_MODEL_COMPLEX: 'gpt-4o-mini',
    CACHE_TTL_GENERIC: '604800',
    CACHE_TTL_SPECIFIC: '86400',
    METADATA_CACHE: createMockKV(),
    WALLET_ADDRESS: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
    NETWORK: 'testnet',
    ...overrides,
  };
}

/**
 * Create a mock EnvV2 object for testing
 */
export function createMockEnvV2(overrides: Partial<EnvV2> = {}): EnvV2 {
  return {
    OPENAI_API_KEY: 'sk-test-mock-api-key',
    AI_ENABLED: 'true',
    AI_ROLLOUT_PERCENTAGE: '100',
    OPENAI_MODEL_DEFAULT: 'gpt-4o-mini',
    OPENAI_MODEL_COMPLEX: 'gpt-4o-mini',
    CACHE_TTL_GENERIC: '604800',
    CACHE_TTL_SPECIFIC: '86400',
    METADATA_CACHE: createMockKV(),
    USER_PREFERENCES: createMockKV(),
    WALLET_ADDRESS: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
    NETWORK: 'testnet',
    FORMAT_CONVERSION_ENABLED: 'true',
    MULTILANG_ENABLED: 'true',
    READING_LEVEL_ANALYSIS: 'true',
    ADAPTIVE_COMPLEXITY_ENABLED: 'false',
    ...overrides,
  };
}

// ============================================================================
// Mock KV Namespace
// ============================================================================

/**
 * In-memory mock implementation of KVNamespace
 */
export function createMockKV(): KVNamespace {
  const store = new Map<string, string>();

  return {
    get: async (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => {
      const value = store.get(key);
      if (!value) return null;

      if (type === 'json') {
        return JSON.parse(value);
      }
      return value;
    },

    put: async (
      key: string,
      value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
      options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }
    ) => {
      if (typeof value === 'string') {
        store.set(key, value);
      } else {
        store.set(key, JSON.stringify(value));
      }
    },

    delete: async (key: string) => {
      store.delete(key);
    },

    list: async (options?: { prefix?: string; limit?: number; cursor?: string }) => {
      const keys = Array.from(store.keys())
        .filter((k) => !options?.prefix || k.startsWith(options.prefix))
        .slice(0, options?.limit || 1000);

      return {
        keys: keys.map((name) => ({ name, expiration: undefined, metadata: undefined })),
        list_complete: true,
        cursor: '',
      };
    },

    getWithMetadata: async (
      key: string,
      type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
    ) => {
      const value = store.get(key);
      if (!value) return { value: null, metadata: null };

      const parsedValue = type === 'json' ? JSON.parse(value) : value;
      return { value: parsedValue, metadata: null };
    },
  } as KVNamespace;
}

// ============================================================================
// Mock Fetch for OpenAI
// ============================================================================

/**
 * Mock successful OpenAI API response
 */
export function mockOpenAISuccess(metadata: Partial<AccessibleMetadata> = {}): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('api.openai.com')) {
      const responseContent = {
        plainLanguage: metadata.plainLanguage || 'Test plain language',
        explanation: metadata.explanation || 'Test explanation',
        stepByStep: metadata.stepByStep || ['Step 1', 'Step 2'],
        hints: metadata.hints || {
          nextSteps: 'Test next steps',
        },
      };

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(responseContent),
              },
            },
          ],
          usage: {
            total_tokens: 150,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  };
}

/**
 * Mock OpenAI API error response
 */
export function mockOpenAIError(status: number = 500, message: string = 'Internal Server Error'): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('api.openai.com')) {
      return new Response(
        JSON.stringify({
          error: {
            message,
            type: 'server_error',
          },
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  };
}

/**
 * Mock OpenAI API timeout (abort signal)
 */
export function mockOpenAITimeout(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('api.openai.com')) {
      // Simulate a timeout by waiting longer than the timeout threshold
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return new Response('Timeout', { status: 408 });
    }

    return new Response('Not found', { status: 404 });
  };
}

/**
 * Mock OpenAI API with invalid JSON response
 */
export function mockOpenAIInvalidJSON(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('api.openai.com')) {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'This is not valid JSON',
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  };
}

/**
 * Mock OpenAI API with invalid schema response
 */
export function mockOpenAIInvalidSchema(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('api.openai.com')) {
      const invalidContent = {
        plainLanguage: 'x'.repeat(200), // Exceeds 100 char limit
        explanation: 'short',
        stepByStep: [],
        hints: {},
      };

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(invalidContent),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  };
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Spy on global fetch and replace with mock
 */
export function spyOnFetch(mockFetch: typeof fetch): () => void {
  const originalFetch = global.fetch;
  global.fetch = mockFetch as any;

  // Return cleanup function
  return () => {
    global.fetch = originalFetch;
  };
}
