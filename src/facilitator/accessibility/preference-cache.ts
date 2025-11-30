/**
 * User Preferences Cache System
 *
 * Manages accessibility preferences for users using Cloudflare KV storage.
 * Provides persistent storage with 30-day TTL for personalization across requests.
 *
 * Features:
 * - Get/Set user preferences with automatic validation
 * - 30-day TTL for long-term personalization
 * - Fallback to defaults if cache miss
 * - Type-safe with Zod validation
 *
 * @module preference-cache
 */

import type { AccessibilityPreferencesV2 } from '../types';
import { AccessibilityPreferencesSchemaV2 } from '../types';

/**
 * KV Key prefix for user preferences
 */
const PREFERENCE_KEY_PREFIX = 'user-pref-v2:';

/**
 * TTL for user preferences: 30 days in seconds
 */
const USER_PREFERENCES_TTL = 30 * 24 * 60 * 60; // 2,592,000 seconds

/**
 * Retrieves user accessibility preferences from KV cache
 *
 * @param userId - Unique identifier for the user
 * @param env - Cloudflare Workers environment with KV bindings
 * @returns Cached preferences or null if not found
 *
 * @example
 * ```typescript
 * const prefs = await getUserPreferences('user-123', env);
 * if (prefs) {
 *   console.log(`User language: ${prefs.language}`);
 * }
 * ```
 */
export async function getUserPreferences(
  userId: string,
  env: { USER_PREFERENCES?: KVNamespace }
): Promise<AccessibilityPreferencesV2 | null> {
  if (!env.USER_PREFERENCES) {
    console.warn('USER_PREFERENCES KV namespace not bound - returning null');
    return null;
  }

  if (!userId || userId.trim().length === 0) {
    console.warn('getUserPreferences: invalid userId provided');
    return null;
  }

  const key = `${PREFERENCE_KEY_PREFIX}${userId}`;

  try {
    const cached = await env.USER_PREFERENCES.get(key, { type: 'json' });

    if (!cached) {
      return null;
    }

    // Validate cached data against schema
    const parseResult = AccessibilityPreferencesSchemaV2.safeParse(cached);

    if (!parseResult.success) {
      console.error('getUserPreferences: cached data invalid, removing from cache', {
        userId,
        error: parseResult.error.message
      });
      // Remove invalid cache entry
      await env.USER_PREFERENCES.delete(key);
      return null;
    }

    return parseResult.data;
  } catch (error) {
    console.error('getUserPreferences: KV read error', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Stores user accessibility preferences in KV cache
 *
 * @param userId - Unique identifier for the user
 * @param preferences - Validated accessibility preferences to store
 * @param env - Cloudflare Workers environment with KV bindings
 * @throws Error if preferences are invalid or KV write fails
 *
 * @example
 * ```typescript
 * const prefs: AccessibilityPreferencesV2 = {
 *   language: 'es',
 *   cognitiveLevel: 'simple',
 *   darkMode: true,
 *   // ... other preferences
 * };
 * await setUserPreferences('user-123', prefs, env);
 * ```
 */
export async function setUserPreferences(
  userId: string,
  preferences: AccessibilityPreferencesV2,
  env: { USER_PREFERENCES?: KVNamespace }
): Promise<void> {
  if (!env.USER_PREFERENCES) {
    throw new Error('USER_PREFERENCES KV namespace not bound');
  }

  if (!userId || userId.trim().length === 0) {
    throw new Error('Invalid userId: cannot be empty');
  }

  // Validate preferences before storing
  const parseResult = AccessibilityPreferencesSchemaV2.safeParse(preferences);

  if (!parseResult.success) {
    throw new Error(`Invalid preferences: ${parseResult.error.message}`);
  }

  const key = `${PREFERENCE_KEY_PREFIX}${userId}`;

  try {
    // Store with 30-day TTL
    await env.USER_PREFERENCES.put(
      key,
      JSON.stringify(parseResult.data),
      {
        expirationTtl: USER_PREFERENCES_TTL
      }
    );
  } catch (error) {
    throw new Error(
      `Failed to store preferences: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deletes user preferences from KV cache
 *
 * Useful for:
 * - User account deletion
 * - Privacy compliance (GDPR, etc.)
 * - Resetting to defaults
 *
 * @param userId - Unique identifier for the user
 * @param env - Cloudflare Workers environment with KV bindings
 * @returns true if deleted successfully, false if not found or error
 *
 * @example
 * ```typescript
 * const deleted = await deleteUserPreferences('user-123', env);
 * if (deleted) {
 *   console.log('User preferences deleted');
 * }
 * ```
 */
export async function deleteUserPreferences(
  userId: string,
  env: { USER_PREFERENCES?: KVNamespace }
): Promise<boolean> {
  if (!env.USER_PREFERENCES) {
    console.warn('USER_PREFERENCES KV namespace not bound');
    return false;
  }

  if (!userId || userId.trim().length === 0) {
    console.warn('deleteUserPreferences: invalid userId provided');
    return false;
  }

  const key = `${PREFERENCE_KEY_PREFIX}${userId}`;

  try {
    await env.USER_PREFERENCES.delete(key);
    return true;
  } catch (error) {
    console.error('deleteUserPreferences: KV delete error', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Merges user preferences with defaults and request overrides
 *
 * Priority order (highest to lowest):
 * 1. Request-level preferences (explicit overrides)
 * 2. Cached user preferences
 * 3. Default preferences (from schema defaults)
 *
 * @param requestPreferences - Preferences from the current request
 * @param cachedPreferences - Preferences from KV cache (if any)
 * @returns Merged preferences with all defaults filled
 *
 * @example
 * ```typescript
 * const merged = mergePreferences(
 *   { language: 'en' },  // Request override
 *   { language: 'es', darkMode: true }  // Cached
 * );
 * // Result: { language: 'en', darkMode: true, ...defaults }
 * ```
 */
export function mergePreferences(
  requestPreferences: Partial<AccessibilityPreferencesV2> | undefined,
  cachedPreferences: AccessibilityPreferencesV2 | null
): AccessibilityPreferencesV2 {
  // Start with defaults from schema
  const defaults = AccessibilityPreferencesSchemaV2.parse({});

  // Apply cached preferences (if any)
  const withCache = cachedPreferences
    ? { ...defaults, ...cachedPreferences }
    : defaults;

  // Apply request overrides
  const merged = requestPreferences
    ? { ...withCache, ...requestPreferences }
    : withCache;

  // Validate final result
  return AccessibilityPreferencesSchemaV2.parse(merged);
}

/**
 * Lists all user preference keys (for admin/debugging)
 *
 * WARNING: This can be expensive for large datasets.
 * Use pagination in production.
 *
 * @param env - Cloudflare Workers environment with KV bindings
 * @param limit - Maximum number of keys to return (default: 100)
 * @returns Array of userId strings
 *
 * @example
 * ```typescript
 * const userIds = await listUserPreferences(env, 50);
 * console.log(`Found ${userIds.length} users with preferences`);
 * ```
 */
export async function listUserPreferences(
  env: { USER_PREFERENCES?: KVNamespace },
  limit: number = 100
): Promise<string[]> {
  if (!env.USER_PREFERENCES) {
    return [];
  }

  try {
    const result = await env.USER_PREFERENCES.list({
      prefix: PREFERENCE_KEY_PREFIX,
      limit
    });

    return result.keys.map(key =>
      key.name.replace(PREFERENCE_KEY_PREFIX, '')
    );
  } catch (error) {
    console.error('listUserPreferences: KV list error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}
