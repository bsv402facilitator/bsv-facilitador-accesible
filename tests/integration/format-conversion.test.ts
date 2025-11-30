import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockPaymentTransaction } from '../helpers/mockTransaction';
import { createMockEnvV2, spyOnFetch, mockOpenAISuccess } from '../helpers/ai-mocks';
import { parseStringPromise } from 'xml2js';

/**
 * Integration tests for format conversion feature
 * Tests POST /verify and POST /settle with different outputFormat preferences
 */
describe('Format Conversion - Integration Tests', () => {
  let cleanupFetch: () => void;

  beforeAll(() => {
    // Mock OpenAI API
    cleanupFetch = spyOnFetch(mockOpenAISuccess());
  });

  afterAll(() => {
    cleanupFetch();
  });

  const mockEnv = createMockEnvV2({
    AI_ENABLED: 'false', // Disable AI for deterministic tests
  });

  const baseRequest = {
    payload: {
      x402Version: 1,
      scheme: 'exact' as const,
      network: 'bsv-testnet' as const,
      payload: {
        transaction: createMockPaymentTransaction('mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', 500),
      },
    },
    paymentRequirements: {
      scheme: 'exact' as const,
      network: 'bsv-testnet' as const,
      maxAmountRequired: '500',
      resource: 'https://api.example.com/resource',
      payTo: 'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7',
      maxTimeoutSeconds: 300,
    },
  };

  describe('POST /verify - Format Conversion', () => {
    test('returns JSON by default (no outputFormat specified)', async () => {
      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseRequest),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');

      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('accessibility');
    });

    test('returns XML when outputFormat is "xml"', async () => {
      const requestWithXML = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'xml' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithXML),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/xml');

      const xmlText = await res.text();
      expect(xmlText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xmlText).toContain('<AccessibleResponse>');
      expect(xmlText).toContain('<Data>');
      expect(xmlText).toContain('<Accessibility>');

      // Validate XML structure
      const parsed = await parseStringPromise(xmlText);
      expect(parsed).toHaveProperty('AccessibleResponse');
      expect(parsed.AccessibleResponse).toHaveProperty('Data');
      expect(parsed.AccessibleResponse).toHaveProperty('Accessibility');
    });

    test('returns plain text when outputFormat is "plaintext"', async () => {
      const requestWithPlainText = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'plaintext' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithPlainText),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain('RESPUESTA ACCESIBLE');
      expect(text).toContain('EXPLICACIÓN');
      // Should not contain HTML/XML tags
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    test('returns Markdown when outputFormat is "markdown"', async () => {
      const requestWithMarkdown = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'markdown' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithMarkdown),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');

      const markdown = await res.text();
      expect(markdown).toContain('#');
      expect(markdown).toContain('##');
      expect(markdown).toContain('**');
      expect(markdown).toContain('- ');
    });

    test('returns HTML when outputFormat is "html"', async () => {
      const requestWithHTML = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'html' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithHTML),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/html');

      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es"');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<main role="main"');
      expect(html).toContain('aria-label');
      expect(html).toContain('</html>');
    });

    test('returns JSON-LD when outputFormat is "jsonld"', async () => {
      const requestWithJSONLD = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'jsonld' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithJSONLD),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/ld+json');

      const jsonld = await res.json();
      expect(jsonld).toHaveProperty('@context');
      expect(jsonld['@context']).toBe('https://schema.org');
      expect(jsonld).toHaveProperty('@type');
      expect(jsonld['@type']).toBe('Action');
    });

    test('HTML output includes proper ARIA attributes', async () => {
      const requestWithHTML = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'html' as const,
          screenReaderOptimized: true,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithHTML),
      });

      const res = await app.fetch(req, mockEnv);
      const html = await res.text();

      // Check ARIA roles
      expect(html).toContain('role="main"');
      expect(html).toContain('role="list');

      // Check ARIA labels
      expect(html).toContain('aria-label');

      // Check semantic HTML5
      expect(html).toContain('<section');
    });

    test('Plain text output is optimized for screen readers', async () => {
      const requestWithPlainText = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'plaintext' as const,
          screenReaderOptimized: true,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithPlainText),
      });

      const res = await app.fetch(req, mockEnv);
      const text = await res.text();

      // Should use consistent separators for TTS
      expect(text).toMatch(/={3,}/); // Section separators

      // Should avoid symbols that confuse TTS
      expect(text).not.toContain('*');
      expect(text).not.toContain('#');

      // Should have clear section headers
      expect(text).toContain('RESPUESTA ACCESIBLE');
      expect(text).toContain('EXPLICACIÓN');
    });
  });

  describe('POST /settle - Format Conversion', () => {
    test('returns JSON by default (no outputFormat specified)', async () => {
      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseRequest),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');

      const json = await res.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('accessibility');
    });

    test('returns XML when outputFormat is "xml"', async () => {
      const requestWithXML = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'xml' as const,
        },
      };

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithXML),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/xml');

      const xmlText = await res.text();
      expect(xmlText).toContain('<?xml version="1.0" encoding="UTF-8"?>');

      // Validate XML structure
      const parsed = await parseStringPromise(xmlText);
      expect(parsed).toHaveProperty('AccessibleResponse');
    });

    test('returns HTML when outputFormat is "html"', async () => {
      const requestWithHTML = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'html' as const,
        },
      };

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithHTML),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/html');

      const html = await res.text();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es"');
    });

    test('returns Markdown when outputFormat is "markdown"', async () => {
      const requestWithMarkdown = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'markdown' as const,
        },
      };

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithMarkdown),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');

      const markdown = await res.text();
      expect(markdown).toContain('#');
      expect(markdown).toContain('**');
    });

    test('returns Plain Text when outputFormat is "plaintext"', async () => {
      const requestWithPlainText = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'plaintext' as const,
        },
      };

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithPlainText),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('<');
    });

    test('returns JSON-LD when outputFormat is "jsonld"', async () => {
      const requestWithJSONLD = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'jsonld' as const,
        },
      };

      const req = new Request('http://localhost/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithJSONLD),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/ld+json');

      const jsonld = await res.json();
      expect(jsonld).toHaveProperty('@context');
      expect(jsonld['@context']).toBe('https://schema.org');
    });
  });

  describe('Format Conversion - Language Integration', () => {
    test('HTML includes correct lang attribute for Spanish', async () => {
      const requestES = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'html' as const,
          language: 'es' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestES),
      });

      const res = await app.fetch(req, mockEnv);
      const html = await res.text();
      expect(html).toContain('<html lang="es"');
    });

    test('HTML includes correct lang attribute for English', async () => {
      const requestEN = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'html' as const,
          language: 'en' as const,
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestEN),
      });

      const res = await app.fetch(req, mockEnv);
      const html = await res.text();
      expect(html).toContain('<html lang="en"');
    });
  });

  describe('Format Conversion - Error Cases', () => {
    test('invalid transactions return errors in correct format', async () => {
      const invalidRequest = {
        ...baseRequest,
        accessibilityPreferences: {
          outputFormat: 'xml' as const,
        },
        payload: {
          ...baseRequest.payload,
          payload: {
            transaction: createMockPaymentTransaction('mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', 100), // Wrong amount
          },
        },
      };

      const req = new Request('http://localhost/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      const res = await app.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/xml');

      const xmlText = await res.text();
      // Data is serialized as JSON inside <Data> tag
      expect(xmlText).toContain('<Data>');
      // JSON is XML-escaped, so quotes become &quot;
      expect(xmlText).toContain('&quot;isValid&quot;');

      // Validate XML structure
      const parsed = await parseStringPromise(xmlText);
      expect(parsed.AccessibleResponse).toHaveProperty('Data');
    });
  });
});
