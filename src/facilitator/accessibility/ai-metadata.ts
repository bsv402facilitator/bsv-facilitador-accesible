/**
 * AI-powered metadata generation for accessibility
 *
 * This module integrates OpenAI GPT to dynamically generate accessibility metadata
 * with KV caching for cost optimization and template fallback for reliability.
 */

import type {
  AccessibleMetadata,
  AccessibilityPreferences,
  MetadataContext,
  Env,
} from '../types';
import { messages, messagesEN, createMetadataFromTemplate } from './i18n';
import { logger } from '../logger';
import { AccessibleMetadataSchema } from '../types';

// ============================================================================
// Constants
// ============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT = 5000; // 5 seconds
const DEFAULT_CACHE_TTL_GENERIC = 604800; // 7 days
const DEFAULT_CACHE_TTL_SPECIFIC = 86400; // 24 hours

// ============================================================================
// Types
// ============================================================================

/**
 * Scenario descriptions for OpenAI prompts
 */
const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  'success.verifyValid': 'Payment verification succeeded - transaction meets all requirements',
  'success.settleSuccess': 'Payment settlement succeeded - transaction broadcast to blockchain',
  'success.supportedNetworks': 'Information about supported blockchain networks',
  'errors.verify.invalidAmount': 'Payment verification failed - incorrect amount sent',
  'errors.verify.invalidAddress': 'Payment verification failed - wrong destination address',
  'errors.verify.invalidFormat': 'Payment verification failed - malformed transaction',
  'errors.settle.alreadyBroadcast': 'Settlement skipped - transaction already on blockchain',
  'errors.settle.networkError': 'Settlement failed - temporary network connectivity issue',
  'errors.settle.broadcastFailed': 'Settlement failed - blockchain rejected transaction',
};

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate accessible metadata with AI (or fallback to templates)
 *
 * Flow:
 * 1. Check feature flags (AI_ENABLED, rollout percentage)
 * 2. Check KV cache
 * 3. If cache miss, call OpenAI API with timeout
 * 4. Validate and cache response
 * 5. If any error, fallback to static templates
 */
export async function createMetadataWithAI(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences,
  env: Env
): Promise<AccessibleMetadata> {
  // 1. Check if AI is enabled and should be used for this request
  if (!shouldUseAI(env)) {
    return fallbackToTemplate(messageType, context, preferences);
  }

  // 2. Check cache
  try {
    const cached = await getCachedMetadata(messageType, context, preferences, env);
    if (cached) {
      return cached;
    }
  } catch (error) {
    logger.warn('Cache lookup failed, continuing without cache', { error });
  }

  // 3. Try to generate with OpenAI
  try {
    const metadata = await generateFromOpenAI(messageType, context, preferences, env);
    if (metadata) {
      // 4. Cache the successful result
      try {
        await setCachedMetadata(messageType, context, preferences, metadata, env);
      } catch (cacheError) {
        logger.warn('Failed to cache AI metadata', { cacheError });
        // Continue anyway - caching is optional optimization
      }
      return metadata;
    }
  } catch (error) {
    logger.warn('OpenAI generation failed, falling back to template', {
      error: error instanceof Error ? error.message : String(error),
      messageType,
    });
  }

  // 5. Fallback to templates
  return fallbackToTemplate(messageType, context, preferences);
}

// ============================================================================
// Feature Flag Logic
// ============================================================================

/**
 * Determine if AI should be used based on feature flags
 */
function shouldUseAI(env: Env): boolean {
  // Check if AI is enabled
  const aiEnabled = env.AI_ENABLED === 'true';
  if (!aiEnabled) {
    return false;
  }

  // Check rollout percentage (0-100)
  const rolloutPercentage = parseInt(env.AI_ROLLOUT_PERCENTAGE || '0', 10);
  if (rolloutPercentage <= 0) {
    return false;
  }

  if (rolloutPercentage >= 100) {
    return true;
  }

  // Random rollout based on percentage
  const random = Math.random() * 100;
  return random < rolloutPercentage;
}

// ============================================================================
// Cache Logic
// ============================================================================

/**
 * Generate cache key for metadata
 */
function getCacheKey(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences
): string {
  const { language, cognitiveLevel } = preferences;
  const contextHash = hashContext(context);
  return `ai-meta:${language}:${cognitiveLevel}:${messageType}:${contextHash}`;
}

/**
 * Hash context to create a stable key
 * Uses simple FNV-1a hash algorithm
 */
function hashContext(context: MetadataContext): string {
  // For generic messages (no specific context), use 'generic'
  const relevantKeys = Object.keys(context).filter((k) => context[k] !== undefined);
  if (relevantKeys.length === 0) {
    return 'generic';
  }

  // Create stable string from context
  const contextString = relevantKeys
    .sort()
    .map((k) => `${k}:${context[k]}`)
    .join('|');

  // Simple FNV-1a hash
  let hash = 2166136261;
  for (let i = 0; i < contextString.length; i++) {
    hash ^= contextString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Convert to hex string
  return (hash >>> 0).toString(16);
}

/**
 * Get cached metadata from KV
 */
async function getCachedMetadata(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences,
  env: Env
): Promise<AccessibleMetadata | null> {
  if (!env.METADATA_CACHE) {
    return null;
  }

  const cacheKey = getCacheKey(messageType, context, preferences);

  try {
    const cached = await env.METADATA_CACHE.get(cacheKey, 'json');
    if (!cached) {
      return null;
    }

    // Validate cached data
    const parseResult = AccessibleMetadataSchema.safeParse(cached);
    if (!parseResult.success) {
      logger.warn('Invalid cached metadata, ignoring', {
        cacheKey,
        error: parseResult.error,
      });
      return null;
    }

    return parseResult.data;
  } catch (error) {
    logger.error('Error reading from cache', { error, cacheKey });
    return null;
  }
}

/**
 * Store metadata in KV cache
 */
async function setCachedMetadata(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences,
  metadata: AccessibleMetadata,
  env: Env
): Promise<void> {
  if (!env.METADATA_CACHE) {
    return;
  }

  const cacheKey = getCacheKey(messageType, context, preferences);

  // Determine TTL based on context
  const isGeneric = hashContext(context) === 'generic';
  const defaultTTL = isGeneric ? DEFAULT_CACHE_TTL_GENERIC : DEFAULT_CACHE_TTL_SPECIFIC;
  const ttl = isGeneric
    ? parseInt(env.CACHE_TTL_GENERIC || String(defaultTTL), 10)
    : parseInt(env.CACHE_TTL_SPECIFIC || String(defaultTTL), 10);

  try {
    await env.METADATA_CACHE.put(cacheKey, JSON.stringify(metadata), {
      expirationTtl: ttl,
    });
  } catch (error) {
    logger.error('Error writing to cache', { error, cacheKey });
    throw error;
  }
}

// ============================================================================
// OpenAI Integration
// ============================================================================

/**
 * Select appropriate OpenAI model based on message complexity
 */
function selectModel(
  messageType: string,
  preferences: AccessibilityPreferences,
  env: Env
): string {
  const { language, cognitiveLevel } = preferences;

  // Use cheaper model for simple English success messages
  if (
    messageType.startsWith('success.') &&
    cognitiveLevel === 'simple' &&
    language === 'en'
  ) {
    return 'gpt-3.5-turbo';
  }

  // Use complex model for advanced cognitive level errors
  if (messageType.startsWith('errors.') && cognitiveLevel === 'advanced') {
    return env.OPENAI_MODEL_COMPLEX || 'gpt-4o-mini';
  }

  // Use default model for everything else
  if (language === 'en') {
    return 'gpt-3.5-turbo';
  }

  return env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
}

/**
 * Build system prompt for OpenAI
 */
function buildSystemPrompt(preferences: AccessibilityPreferences): string {
  const { language, cognitiveLevel, audioFriendly } = preferences;

  const cognitiveMapping = {
    simple: '6th grade level - very simple language',
    medium: 'high school level - moderate complexity',
    advanced: 'college level - technical details allowed',
  };

  return `You are an accessibility expert for blockchain payments.
Language: ${language === 'es' ? 'Spanish' : 'English'}
Cognitive Level: ${cognitiveMapping[cognitiveLevel]}
Audio Friendly: ${audioFriendly ? 'yes - optimize for screen readers' : 'no'}

CONSTRAINTS:
- plainLanguage: ≤100 characters, executive summary
- explanation: ≤300 characters, detailed description
- stepByStep: ≤5 items, each ≤80 characters
- hints.ifError: ≤150 characters (optional)
- hints.nextSteps: ≤150 characters (optional)
- hints.commonMistakes: ≤3 items, each ≤100 characters (optional)

OUTPUT: Valid JSON only, no markdown, no code blocks, no comments.
{
  "plainLanguage": "...",
  "explanation": "...",
  "stepByStep": ["...", "..."],
  "hints": {
    "ifError": "...",
    "commonMistakes": ["...", "..."],
    "nextSteps": "..."
  }
}`;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences
): string {
  const scenario = SCENARIO_DESCRIPTIONS[messageType] || 'Unknown scenario';
  const { language, cognitiveLevel } = preferences;

  // Filter out undefined values from context
  const cleanContext = Object.fromEntries(
    Object.entries(context).filter(([_, v]) => v !== undefined)
  );

  return `Message Type: ${messageType}
Scenario: ${scenario}
Context: ${JSON.stringify(cleanContext)}

Generate accessibility metadata in ${language === 'es' ? 'Spanish' : 'English'} at ${cognitiveLevel} complexity level.`;
}

/**
 * Call OpenAI API to generate metadata
 */
async function generateFromOpenAI(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences,
  env: Env
): Promise<AccessibleMetadata | null> {
  const model = selectModel(messageType, preferences, env);
  const systemPrompt = buildSystemPrompt(preferences);
  const userPrompt = buildUserPrompt(messageType, context, preferences);

  logger.info('Calling OpenAI API', { messageType, model, preferences });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI API error', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.error('OpenAI returned empty content', { data });
      return null;
    }

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI JSON response', {
        content,
        parseError,
      });
      return null;
    }

    // Add metadata fields that OpenAI doesn't generate
    const metadata = {
      ...parsedContent,
      language: preferences.language,
      audioFriendly: preferences.audioFriendly,
      cognitiveLevel: preferences.cognitiveLevel,
    };

    // Validate against schema
    const validationResult = AccessibleMetadataSchema.safeParse(metadata);
    if (!validationResult.success) {
      logger.error('OpenAI generated invalid metadata', {
        metadata,
        error: validationResult.error,
      });
      return null;
    }

    logger.info('Successfully generated AI metadata', {
      messageType,
      model,
      tokens: data.usage?.total_tokens,
    });

    return validationResult.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('OpenAI request timeout', { messageType, timeout: OPENAI_TIMEOUT });
    } else {
      logger.error('OpenAI request failed', {
        error: error instanceof Error ? error.message : String(error),
        messageType,
      });
    }

    return null;
  }
}

// ============================================================================
// Template Fallback
// ============================================================================

/**
 * Fallback to static templates when AI fails or is disabled
 */
function fallbackToTemplate(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences
): AccessibleMetadata {
  const { language, cognitiveLevel, audioFriendly } = preferences;
  const msgs = language === 'en' ? messagesEN : messages;

  // Parse messageType to get template path (e.g., "errors.verify.invalidAmount")
  const parts = messageType.split('.');
  let template: any = msgs;

  for (const part of parts) {
    template = template?.[part];
    if (!template) {
      logger.error('Template not found for messageType', { messageType });
      // Return a generic error template
      return {
        plainLanguage: language === 'es' ? 'Error desconocido' : 'Unknown error',
        explanation:
          language === 'es'
            ? 'Ocurrió un error al procesar tu solicitud'
            : 'An error occurred while processing your request',
        stepByStep: [
          language === 'es' ? 'Verifica tu solicitud' : 'Check your request',
          language === 'es' ? 'Reintenta la operación' : 'Retry the operation',
        ],
        hints: {},
        language,
        audioFriendly,
        cognitiveLevel,
      };
    }
  }

  return createMetadataFromTemplate(template, context, cognitiveLevel, audioFriendly, language);
}
