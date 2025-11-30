/**
 * Tests unitarios para el sistema de caché de preferencias de usuario
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserPreferences,
  setUserPreferences,
  deleteUserPreferences,
  mergePreferences,
  listUserPreferences,
} from '../../../src/facilitator/accessibility/preference-cache';
import type { AccessibilityPreferencesV2 } from '../../../src/facilitator/types';

// Mock KV Namespace
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

  async put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    this.store.set(key, {
      value,
      expiration: options?.expirationTtl,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
  }): Promise<{ keys: { name: string }[] }> {
    const keys = Array.from(this.store.keys())
      .filter(key => !options?.prefix || key.startsWith(options.prefix))
      .slice(0, options?.limit || 100)
      .map(name => ({ name }));

    return { keys };
  }

  // Helper for tests
  clear(): void {
    this.store.clear();
  }
}

describe('preference-cache', () => {
  let mockKV: MockKVNamespace;
  let env: { USER_PREFERENCES: any };

  beforeEach(() => {
    mockKV = new MockKVNamespace();
    env = { USER_PREFERENCES: mockKV };
  });

  describe('getUserPreferences', () => {
    it('should return null when no preferences are cached', async () => {
      const result = await getUserPreferences('user-123', env);
      expect(result).toBeNull();
    });

    it('should return cached preferences for valid userId', async () => {
      const prefs: AccessibilityPreferencesV2 = {
        language: 'en',
        cognitiveLevel: 'advanced',
        darkMode: true,
        fontSize: 'large',
        contrastMode: 'high',
        audioFriendly: false,
        screenReaderOptimized: true,
        outputFormat: 'json',
        wcagLevel: 'AAA',
        colorBlindType: 'deuteranopia',
        dialect: 'en-GB',
        abstractionLevel: 'abstract',
        includeExamples: false,
        includeGlossary: true,
        includeCheckpoints: true,
        includeKeyboardHints: true,
        includeVoiceHints: true,
        brailleOptimized: false,
        includeSemanticMarkup: true,
        adaptiveComplexity: true,
      };

      await setUserPreferences('user-123', prefs, env);
      const result = await getUserPreferences('user-123', env);

      expect(result).toEqual(prefs);
    });

    it('should return null for empty userId', async () => {
      const result = await getUserPreferences('', env);
      expect(result).toBeNull();
    });

    it('should return null for whitespace userId', async () => {
      const result = await getUserPreferences('   ', env);
      expect(result).toBeNull();
    });

    it('should return null when USER_PREFERENCES is not bound', async () => {
      const result = await getUserPreferences('user-123', {});
      expect(result).toBeNull();
    });

    it('should delete and return null for invalid cached data', async () => {
      // Manually insert invalid data (invalid enum value that can't have defaults)
      await mockKV.put(
        'user-pref-v2:user-123',
        JSON.stringify({
          language: 'invalid-language-code', // Invalid enum
          cognitiveLevel: 'invalid-level', // Invalid enum
        })
      );

      const result = await getUserPreferences('user-123', env);
      expect(result).toBeNull();

      // Verify it was deleted
      const cached = await mockKV.get('user-pref-v2:user-123');
      expect(cached).toBeNull();
    });

    it('should handle KV read errors gracefully', async () => {
      const errorEnv = {
        USER_PREFERENCES: {
          get: vi.fn().mockRejectedValue(new Error('KV error')),
        },
      };

      const result = await getUserPreferences('user-123', errorEnv as any);
      expect(result).toBeNull();
    });
  });

  describe('setUserPreferences', () => {
    it('should store valid preferences with 30-day TTL', async () => {
      const prefs: AccessibilityPreferencesV2 = {
        language: 'es',
        cognitiveLevel: 'simple',
        darkMode: false,
        fontSize: 'medium',
        contrastMode: 'normal',
        audioFriendly: true,
        screenReaderOptimized: true,
        outputFormat: 'json',
        wcagLevel: 'AAA',
        colorBlindType: 'none',
        abstractionLevel: 'concrete',
        includeExamples: true,
        includeGlossary: true,
        includeCheckpoints: false,
        includeKeyboardHints: true,
        includeVoiceHints: false,
        brailleOptimized: false,
        includeSemanticMarkup: false,
        adaptiveComplexity: false,
      };

      await setUserPreferences('user-456', prefs, env);
      const result = await getUserPreferences('user-456', env);

      expect(result).toEqual(prefs);
    });

    it('should apply default values for missing fields', async () => {
      const partialPrefs: any = {
        language: 'fr',
        // Missing all other fields
      };

      await setUserPreferences('user-789', partialPrefs, env);
      const result = await getUserPreferences('user-789', env);

      expect(result).not.toBeNull();
      expect(result?.language).toBe('fr');
      expect(result?.cognitiveLevel).toBe('simple'); // default
      expect(result?.darkMode).toBe(false); // default
    });

    it('should throw error for empty userId', async () => {
      const prefs: AccessibilityPreferencesV2 = {
        language: 'es',
        cognitiveLevel: 'simple',
        darkMode: false,
        fontSize: 'medium',
        contrastMode: 'normal',
        audioFriendly: true,
        screenReaderOptimized: true,
        outputFormat: 'json',
        wcagLevel: 'AAA',
        colorBlindType: 'none',
        abstractionLevel: 'concrete',
        includeExamples: true,
        includeGlossary: true,
        includeCheckpoints: false,
        includeKeyboardHints: true,
        includeVoiceHints: false,
        brailleOptimized: false,
        includeSemanticMarkup: false,
        adaptiveComplexity: false,
      };

      await expect(setUserPreferences('', prefs, env)).rejects.toThrow(
        'Invalid userId: cannot be empty'
      );
    });

    it('should throw error when USER_PREFERENCES is not bound', async () => {
      const prefs: any = { language: 'es' };

      await expect(setUserPreferences('user-123', prefs, {})).rejects.toThrow(
        'USER_PREFERENCES KV namespace not bound'
      );
    });

    it('should throw error for invalid preferences', async () => {
      const invalidPrefs: any = {
        language: 'invalid-lang', // Invalid enum value
        cognitiveLevel: 'simple',
      };

      await expect(setUserPreferences('user-123', invalidPrefs, env)).rejects.toThrow();
    });

    it('should handle KV write errors', async () => {
      const errorEnv = {
        USER_PREFERENCES: {
          put: vi.fn().mockRejectedValue(new Error('KV write error')),
        },
      };

      const prefs: any = { language: 'es' };

      await expect(setUserPreferences('user-123', prefs, errorEnv as any)).rejects.toThrow(
        'Failed to store preferences'
      );
    });
  });

  describe('deleteUserPreferences', () => {
    it('should delete existing preferences', async () => {
      const prefs: any = { language: 'pt' };
      await setUserPreferences('user-delete', prefs, env);

      const deleted = await deleteUserPreferences('user-delete', env);
      expect(deleted).toBe(true);

      const result = await getUserPreferences('user-delete', env);
      expect(result).toBeNull();
    });

    it('should return true even if preferences do not exist', async () => {
      const deleted = await deleteUserPreferences('nonexistent-user', env);
      expect(deleted).toBe(true);
    });

    it('should return false for empty userId', async () => {
      const deleted = await deleteUserPreferences('', env);
      expect(deleted).toBe(false);
    });

    it('should return false when USER_PREFERENCES is not bound', async () => {
      const deleted = await deleteUserPreferences('user-123', {});
      expect(deleted).toBe(false);
    });

    it('should handle KV delete errors gracefully', async () => {
      const errorEnv = {
        USER_PREFERENCES: {
          delete: vi.fn().mockRejectedValue(new Error('KV delete error')),
        },
      };

      const deleted = await deleteUserPreferences('user-123', errorEnv as any);
      expect(deleted).toBe(false);
    });
  });

  describe('mergePreferences', () => {
    it('should use defaults when both request and cache are empty', () => {
      const merged = mergePreferences(undefined, null);

      expect(merged.language).toBe('es'); // default
      expect(merged.cognitiveLevel).toBe('simple'); // default
      expect(merged.darkMode).toBe(false); // default
    });

    it('should use cached preferences when request is empty', () => {
      const cached: AccessibilityPreferencesV2 = {
        language: 'en',
        cognitiveLevel: 'advanced',
        darkMode: true,
        fontSize: 'large',
        contrastMode: 'high',
        audioFriendly: false,
        screenReaderOptimized: true,
        outputFormat: 'markdown',
        wcagLevel: 'AAA',
        colorBlindType: 'protanopia',
        abstractionLevel: 'abstract',
        includeExamples: false,
        includeGlossary: true,
        includeCheckpoints: true,
        includeKeyboardHints: true,
        includeVoiceHints: true,
        brailleOptimized: false,
        includeSemanticMarkup: true,
        adaptiveComplexity: true,
      };

      const merged = mergePreferences(undefined, cached);

      expect(merged).toEqual(cached);
    });

    it('should override cached preferences with request preferences', () => {
      const cached: AccessibilityPreferencesV2 = {
        language: 'es',
        cognitiveLevel: 'simple',
        darkMode: false,
        fontSize: 'medium',
        contrastMode: 'normal',
        audioFriendly: true,
        screenReaderOptimized: true,
        outputFormat: 'json',
        wcagLevel: 'AAA',
        colorBlindType: 'none',
        abstractionLevel: 'concrete',
        includeExamples: true,
        includeGlossary: true,
        includeCheckpoints: false,
        includeKeyboardHints: true,
        includeVoiceHints: false,
        brailleOptimized: false,
        includeSemanticMarkup: false,
        adaptiveComplexity: false,
      };

      const request: Partial<AccessibilityPreferencesV2> = {
        language: 'pt',
        darkMode: true,
      };

      const merged = mergePreferences(request, cached);

      expect(merged.language).toBe('pt'); // overridden
      expect(merged.darkMode).toBe(true); // overridden
      expect(merged.cognitiveLevel).toBe('simple'); // from cache
      expect(merged.fontSize).toBe('medium'); // from cache
    });

    it('should use request preferences when cache is null', () => {
      const request: Partial<AccessibilityPreferencesV2> = {
        language: 'de',
        cognitiveLevel: 'expert',
      };

      const merged = mergePreferences(request, null);

      expect(merged.language).toBe('de');
      expect(merged.cognitiveLevel).toBe('expert');
      expect(merged.darkMode).toBe(false); // default
    });

    it('should handle userId in request preferences', () => {
      const request: Partial<AccessibilityPreferencesV2> = {
        userId: 'user-123',
        language: 'en',
      };

      const merged = mergePreferences(request, null);

      expect(merged.userId).toBe('user-123');
      expect(merged.language).toBe('en');
    });

    it('should validate final merged preferences', () => {
      const request: any = {
        language: 'invalid', // Invalid enum
      };

      expect(() => mergePreferences(request, null)).toThrow();
    });
  });

  describe('listUserPreferences', () => {
    it('should return empty array when no preferences exist', async () => {
      const userIds = await listUserPreferences(env);
      expect(userIds).toEqual([]);
    });

    it('should return list of userIds with preferences', async () => {
      const prefs1: any = { language: 'es' };
      const prefs2: any = { language: 'en' };
      const prefs3: any = { language: 'pt' };

      await setUserPreferences('user-1', prefs1, env);
      await setUserPreferences('user-2', prefs2, env);
      await setUserPreferences('user-3', prefs3, env);

      const userIds = await listUserPreferences(env);

      expect(userIds).toHaveLength(3);
      expect(userIds).toContain('user-1');
      expect(userIds).toContain('user-2');
      expect(userIds).toContain('user-3');
    });

    it('should respect limit parameter', async () => {
      const prefs: any = { language: 'es' };

      for (let i = 0; i < 10; i++) {
        await setUserPreferences(`user-${i}`, prefs, env);
      }

      const userIds = await listUserPreferences(env, 5);
      expect(userIds).toHaveLength(5);
    });

    it('should return empty array when USER_PREFERENCES is not bound', async () => {
      const userIds = await listUserPreferences({});
      expect(userIds).toEqual([]);
    });

    it('should handle KV list errors gracefully', async () => {
      const errorEnv = {
        USER_PREFERENCES: {
          list: vi.fn().mockRejectedValue(new Error('KV list error')),
        },
      };

      const userIds = await listUserPreferences(errorEnv as any);
      expect(userIds).toEqual([]);
    });

    it('should only return keys with correct prefix', async () => {
      const prefs: any = { language: 'es' };

      await setUserPreferences('user-123', prefs, env);

      // Manually insert a key with different prefix
      await mockKV.put('other-prefix:user-456', JSON.stringify(prefs));

      const userIds = await listUserPreferences(env);

      expect(userIds).toHaveLength(1);
      expect(userIds).toContain('user-123');
      expect(userIds).not.toContain('user-456');
    });
  });

  describe('integration scenarios', () => {
    it('should handle full user preference lifecycle', async () => {
      const userId = 'lifecycle-user';

      // 1. Initially no preferences
      let prefs = await getUserPreferences(userId, env);
      expect(prefs).toBeNull();

      // 2. Set preferences
      const newPrefs: AccessibilityPreferencesV2 = {
        language: 'fr',
        cognitiveLevel: 'medium',
        darkMode: true,
        fontSize: 'large',
        contrastMode: 'high',
        audioFriendly: true,
        screenReaderOptimized: true,
        outputFormat: 'html',
        wcagLevel: 'AAA',
        colorBlindType: 'tritanopia',
        abstractionLevel: 'mixed',
        includeExamples: true,
        includeGlossary: true,
        includeCheckpoints: true,
        includeKeyboardHints: true,
        includeVoiceHints: false,
        brailleOptimized: true,
        includeSemanticMarkup: true,
        adaptiveComplexity: false,
      };

      await setUserPreferences(userId, newPrefs, env);

      // 3. Get preferences
      prefs = await getUserPreferences(userId, env);
      expect(prefs).toEqual(newPrefs);

      // 4. Update preferences (partial)
      const updatedPrefs: Partial<AccessibilityPreferencesV2> = {
        language: 'de',
        fontSize: 'x-large',
      };

      const merged = mergePreferences(updatedPrefs, prefs);
      await setUserPreferences(userId, merged, env);

      // 5. Verify updates
      prefs = await getUserPreferences(userId, env);
      expect(prefs?.language).toBe('de');
      expect(prefs?.fontSize).toBe('x-large');
      expect(prefs?.cognitiveLevel).toBe('medium'); // unchanged

      // 6. Delete preferences
      const deleted = await deleteUserPreferences(userId, env);
      expect(deleted).toBe(true);

      // 7. Verify deletion
      prefs = await getUserPreferences(userId, env);
      expect(prefs).toBeNull();
    });

    it('should handle concurrent user preferences', async () => {
      const user1Prefs: any = { language: 'es', userId: 'user-1' };
      const user2Prefs: any = { language: 'en', userId: 'user-2' };
      const user3Prefs: any = { language: 'pt', userId: 'user-3' };

      // Set preferences for multiple users
      await Promise.all([
        setUserPreferences('user-1', user1Prefs, env),
        setUserPreferences('user-2', user2Prefs, env),
        setUserPreferences('user-3', user3Prefs, env),
      ]);

      // Get preferences concurrently
      const [prefs1, prefs2, prefs3] = await Promise.all([
        getUserPreferences('user-1', env),
        getUserPreferences('user-2', env),
        getUserPreferences('user-3', env),
      ]);

      expect(prefs1?.language).toBe('es');
      expect(prefs2?.language).toBe('en');
      expect(prefs3?.language).toBe('pt');
    });
  });
});
