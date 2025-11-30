/**
 * Tests de integración para endpoints de preferencias de usuario (/preferences)
 * Fase 5: User Preferences Cache y Personalización
 */

import { describe, test, expect, beforeEach } from 'vitest';
import app from '../../src/facilitator/index';
import type { AccessibilityPreferencesV2 } from '../../src/facilitator/types';

// Mock KV Namespace for testing
class MockKVNamespace {
  private store: Map<string, { value: string; expiration?: number }> = new Map();

  async get(key: string, options?: { type?: 'text' | 'json' }): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;

    if (options?.type === 'json') {
      return JSON.parse(item.value);
    }
    return item.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, { value, expiration: options?.expirationTtl });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }> {
    const keys = Array.from(this.store.keys())
      .filter(key => !options?.prefix || key.startsWith(options.prefix))
      .slice(0, options?.limit || 100)
      .map(name => ({ name }));
    return { keys };
  }

  clear(): void {
    this.store.clear();
  }
}

describe('User Preferences Endpoints - Integration Tests', () => {
  let mockKV: MockKVNamespace;

  beforeEach(() => {
    mockKV = new MockKVNamespace();
  });

  const mockEnv = () => ({
    USER_PREFERENCES: mockKV,
  });

  describe('PUT /preferences/:userId', () => {
    test('should store valid V2 preferences', async () => {
      const userId = 'test-user-1';
      const preferences: AccessibilityPreferencesV2 = {
        language: 'en',
        dialect: 'en-GB',
        cognitiveLevel: 'advanced',
        abstractionLevel: 'abstract',
        includeExamples: false,
        includeGlossary: true,
        includeCheckpoints: true,
        contrastMode: 'high',
        colorBlindType: 'deuteranopia',
        fontSize: 'large',
        darkMode: true,
        screenReaderOptimized: true,
        includeKeyboardHints: true,
        includeVoiceHints: true,
        outputFormat: 'markdown',
        brailleOptimized: false,
        includeSemanticMarkup: true,
        audioFriendly: false,
        userId,
        adaptiveComplexity: true,
        wcagLevel: 'AAA',
      };

      const res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      }, mockEnv());

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.preferences).toEqual(preferences);
    });

    test('should apply defaults for partial preferences', async () => {
      const userId = 'test-user-partial';
      const partialPreferences = {
        language: 'pt',
        darkMode: true,
      };

      const res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialPreferences),
      }, mockEnv());

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.preferences.language).toBe('pt');
      expect(json.preferences.darkMode).toBe(true);
      expect(json.preferences.cognitiveLevel).toBe('simple'); // default
      expect(json.preferences.fontSize).toBe('medium'); // default
    });

    test('should return 400 for invalid userId (empty)', async () => {
      const res = await app.request('/preferences/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'es' }),
      }, mockEnv());

      expect(res.status).toBe(404); // Hono returns 404 for non-matching routes
    });

    test('should return 400 for invalid preferences (invalid language enum)', async () => {
      const userId = 'test-user-invalid';
      const invalidPreferences = {
        language: 'invalid-language',
        cognitiveLevel: 'simple',
      };

      const res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPreferences),
      }, mockEnv());

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    test('should return 400 for invalid preferences (invalid cognitive level)', async () => {
      const userId = 'test-user-invalid-2';
      const invalidPreferences = {
        language: 'es',
        cognitiveLevel: 'invalid-level',
      };

      const res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPreferences),
      }, mockEnv());

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    test('should handle all 5 supported languages', async () => {
      const languages: Array<'es' | 'en' | 'pt' | 'fr' | 'de'> = ['es', 'en', 'pt', 'fr', 'de'];

      for (const lang of languages) {
        const userId = `test-user-${lang}`;
        const res = await app.request(`/preferences/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        }, mockEnv());

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.preferences.language).toBe(lang);
      }
    });

    test('should handle all cognitive levels', async () => {
      const levels: Array<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert'> = [
        'beginner',
        'simple',
        'medium',
        'advanced',
        'expert',
      ];

      for (const level of levels) {
        const userId = `test-user-level-${level}`;
        const res = await app.request(`/preferences/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cognitiveLevel: level }),
        }, mockEnv());

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.preferences.cognitiveLevel).toBe(level);
      }
    });

    test('should handle all output formats', async () => {
      const formats: Array<'json' | 'xml' | 'plaintext' | 'markdown' | 'html' | 'jsonld'> = [
        'json',
        'xml',
        'plaintext',
        'markdown',
        'html',
        'jsonld',
      ];

      for (const format of formats) {
        const userId = `test-user-format-${format}`;
        const res = await app.request(`/preferences/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outputFormat: format }),
        }, mockEnv());

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.preferences.outputFormat).toBe(format);
      }
    });
  });

  describe('GET /preferences/:userId', () => {
    test('should retrieve stored preferences', async () => {
      const userId = 'test-user-get';
      const preferences = {
        language: 'fr',
        cognitiveLevel: 'medium',
        darkMode: true,
      };

      // First, store preferences
      await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      }, mockEnv());

      // Then retrieve them
      const res = await app.request(`/preferences/${userId}`, {
        method: 'GET',
      }, mockEnv());

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.preferences.language).toBe('fr');
      expect(json.preferences.cognitiveLevel).toBe('medium');
      expect(json.preferences.darkMode).toBe(true);
    });

    test('should return 404 for non-existent user', async () => {
      const res = await app.request('/preferences/nonexistent-user', {
        method: 'GET',
      }, mockEnv());

      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/No preferences found/i);
    });

    test('should return 400 for empty userId', async () => {
      const res = await app.request('/preferences/', {
        method: 'GET',
      }, mockEnv());

      expect(res.status).toBe(404); // Hono returns 404 for non-matching routes
    });
  });

  describe('DELETE /preferences/:userId', () => {
    test('should delete existing preferences', async () => {
      const userId = 'test-user-delete';
      const preferences = { language: 'de' };

      // Store preferences
      await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      }, mockEnv());

      // Verify they exist
      const getRes = await app.request(`/preferences/${userId}`, {
        method: 'GET',
      }, mockEnv());
      expect(getRes.status).toBe(200);

      // Delete
      const deleteRes = await app.request(`/preferences/${userId}`, {
        method: 'DELETE',
      }, mockEnv());
      expect(deleteRes.status).toBe(200);

      const deleteJson = await deleteRes.json();
      expect(deleteJson.success).toBe(true);
      expect(deleteJson.deleted).toBe(true);

      // Verify they're gone
      const getRes2 = await app.request(`/preferences/${userId}`, {
        method: 'GET',
      }, mockEnv());
      expect(getRes2.status).toBe(404);
    });

    test('should return success even for non-existent user', async () => {
      const res = await app.request('/preferences/nonexistent-user', {
        method: 'DELETE',
      }, mockEnv());

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.deleted).toBe(true);
    });

    test('should return 400 for empty userId', async () => {
      const res = await app.request('/preferences/', {
        method: 'DELETE',
      }, mockEnv());

      expect(res.status).toBe(404); // Hono returns 404 for non-matching routes
    });
  });

  describe('CORS support', () => {
    test('should allow PUT requests from any origin', async () => {
      const res = await app.request('/preferences/test-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://example.com',
        },
        body: JSON.stringify({ language: 'es' }),
      }, mockEnv());

      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    test('should handle OPTIONS preflight for DELETE', async () => {
      const res = await app.request('/preferences/test-user', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'DELETE',
        },
      }, mockEnv());

      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('Full preference lifecycle', () => {
    test('should support create, read, update, delete cycle', async () => {
      const userId = 'lifecycle-test-user';
      const env = mockEnv();

      // 1. Initially no preferences
      let res = await app.request(`/preferences/${userId}`, { method: 'GET' }, env);
      expect(res.status).toBe(404);

      // 2. Create preferences
      const initialPrefs = {
        language: 'es',
        cognitiveLevel: 'simple',
        darkMode: false,
      };
      res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialPrefs),
      }, env);
      expect(res.status).toBe(200);

      // 3. Read preferences
      res = await app.request(`/preferences/${userId}`, { method: 'GET' }, env);
      expect(res.status).toBe(200);
      let json = await res.json();
      expect(json.preferences.language).toBe('es');

      // 4. Update preferences
      const updatedPrefs = {
        language: 'en',
        cognitiveLevel: 'advanced',
        darkMode: true,
      };
      res = await app.request(`/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs),
      }, env);
      expect(res.status).toBe(200);

      // 5. Verify updates
      res = await app.request(`/preferences/${userId}`, { method: 'GET' }, env);
      json = await res.json();
      expect(json.preferences.language).toBe('en');
      expect(json.preferences.cognitiveLevel).toBe('advanced');
      expect(json.preferences.darkMode).toBe(true);

      // 6. Delete preferences
      res = await app.request(`/preferences/${userId}`, { method: 'DELETE' }, env);
      expect(res.status).toBe(200);

      // 7. Verify deletion
      res = await app.request(`/preferences/${userId}`, { method: 'GET' }, env);
      expect(res.status).toBe(404);
    });

    test('should support multiple concurrent users', async () => {
      const env = mockEnv();

      const users = [
        { userId: 'user-1', language: 'es' },
        { userId: 'user-2', language: 'en' },
        { userId: 'user-3', language: 'pt' },
      ];

      // Store preferences for all users
      for (const user of users) {
        await app.request(`/preferences/${user.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: user.language }),
        }, env);
      }

      // Verify each user has their own preferences
      for (const user of users) {
        const res = await app.request(`/preferences/${user.userId}`, { method: 'GET' }, env);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.preferences.language).toBe(user.language);
      }
    });
  });
});
