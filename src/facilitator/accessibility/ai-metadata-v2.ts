/**
 * AI-powered V2 metadata generation for universal accessibility
 *
 * This module extends the V1 AI metadata generation with support for:
 * - WCAG 2.2 AAA compliance
 * - 5 cognitive levels (beginner → expert)
 * - Reading level analysis
 * - Multiple output formats
 * - Enhanced content structure
 */

import type {
  UniversalAccessibilityMetadataV2,
  AccessibilityPreferencesV2,
  MetadataContext,
  EnvV2,
  ContentMetadataV2,
  AccessibleStepV2,
  ExtendedHintsV2,
  ReadingLevelV2,
  ConcreteExampleV2,
} from '../types';
import { getMessagesByLanguageV2, createMetadataFromTemplateV2 } from './i18n/index';
import { calculateReadingLevel } from './reading-level';
import { logger } from '../logger';

// ============================================================================
// Constants
// ============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT = 5000; // 5 seconds
const DEFAULT_CACHE_TTL_GENERIC = 604800; // 7 days
const DEFAULT_CACHE_TTL_SPECIFIC = 86400; // 24 hours

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
 * Generate universal accessibility metadata with AI (V2)
 *
 * Flow:
 * 1. Check feature flags
 * 2. Check KV cache
 * 3. Call OpenAI API if needed
 * 4. Calculate reading level
 * 5. Build complete V2 metadata structure
 * 6. Fallback to templates if AI fails
 */
export async function createMetadataWithAIV2(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): Promise<UniversalAccessibilityMetadataV2> {
  // 1. Generate core content (AI or template)
  const content = await generateContent(messageType, context, preferences, env);

  // 2. Calculate reading level
  const allText = `${content.plainLanguage} ${content.explanation} ${content.stepByStep.map((s) => typeof s === 'string' ? s : s.text).join(' ')}`;
  const readingLevel = calculateReadingLevel(allText);

  // 3. Build complete V2 metadata structure
  return buildUniversalMetadata(content, readingLevel, preferences, env);
}

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Generate content metadata (core accessibility content)
 */
async function generateContent(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): Promise<ContentMetadataV2> {
  // Check if AI is enabled
  if (!shouldUseAI(env)) {
    return fallbackToTemplate(messageType, context, preferences);
  }

  // Try cache
  try {
    const cached = await getCachedContent(messageType, context, preferences, env);
    if (cached) {
      return cached;
    }
  } catch (error) {
    logger.warn('Cache lookup failed for V2 content', { error });
  }

  // Try AI generation
  try {
    const generated = await generateFromOpenAI(messageType, context, preferences, env);
    if (generated) {
      // Cache the result
      try {
        await setCachedContent(messageType, context, preferences, generated, env);
      } catch (cacheError) {
        logger.warn('Failed to cache V2 content', { cacheError });
      }
      return generated;
    }
  } catch (error) {
    logger.warn('OpenAI V2 generation failed, falling back to template', {
      error: error instanceof Error ? error.message : String(error),
      messageType,
    });
  }

  // Fallback to templates
  return fallbackToTemplate(messageType, context, preferences);
}

// ============================================================================
// AI Generation
// ============================================================================

/**
 * Generate content from OpenAI API
 */
async function generateFromOpenAI(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): Promise<ContentMetadataV2 | null> {
  const model = selectModel(messageType, preferences, env);
  const systemPrompt = buildSystemPrompt(preferences);
  const userPrompt = buildUserPrompt(messageType, context, preferences);

  logger.info('Calling OpenAI API (V2)', { messageType, model, preferences });

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
        max_tokens: 800, // Increased for V2 (more fields)
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenAI V2 API error', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.error('OpenAI V2 returned empty content', { data });
      return null;
    }

    // Parse JSON response
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI V2 JSON response', {
        content,
        parseError,
      });
      return null;
    }

    // Validate and return
    const validated = validateContentMetadata(parsedContent as any);
    if (!validated) {
      logger.error('OpenAI V2 generated invalid content metadata', {
        parsedContent,
      });
      return null;
    }

    logger.info('Successfully generated AI V2 content', {
      messageType,
      model,
      tokens: data.usage?.total_tokens,
    });

    return validated;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('OpenAI V2 request timeout', { messageType, timeout: OPENAI_TIMEOUT });
    } else {
      logger.error('OpenAI V2 request failed', {
        error: error instanceof Error ? error.message : String(error),
        messageType,
      });
    }

    return null;
  }
}

/**
 * Select OpenAI model based on complexity
 */
function selectModel(
  messageType: string,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): string {
  const { language, cognitiveLevel } = preferences;

  // Use expert model for expert level
  if (cognitiveLevel === 'expert') {
    return env.OPENAI_MODEL_EXPERT || 'gpt-4o';
  }

  // Use simple model for beginner/simple English
  if ((cognitiveLevel === 'beginner' || cognitiveLevel === 'simple') && language === 'en') {
    return env.OPENAI_MODEL_SIMPLE || 'gpt-3.5-turbo';
  }

  // Use complex model for advanced errors
  if (messageType.startsWith('errors.') && cognitiveLevel === 'advanced') {
    return env.OPENAI_MODEL_COMPLEX || 'gpt-4o-mini';
  }

  // Default model
  return env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
}

/**
 * Build system prompt for V2
 */
function buildSystemPrompt(preferences: AccessibilityPreferencesV2): string {
  const { language, cognitiveLevel, audioFriendly, includeExamples, includeGlossary } = preferences;

  const cognitiveMapping = {
    beginner: 'absolute beginner - no prior knowledge assumed, use everyday language and simple analogies',
    simple: '6th grade level - very simple language, short sentences, concrete examples',
    medium: 'high school level - moderate complexity, some technical terms with explanations',
    advanced: 'college level - technical details, industry terminology, complex concepts',
    expert: 'professional level - deep technical analysis, edge cases, optimization strategies',
  };

  return `You are an expert accessibility consultant specializing in blockchain payment systems.

Language: ${getLanguageName(language)}
Cognitive Level: ${cognitiveMapping[cognitiveLevel]}
Audio Friendly: ${audioFriendly ? 'yes - optimize for screen readers and TTS' : 'no'}
Include Examples: ${includeExamples}
Include Glossary: ${includeGlossary}

CONSTRAINTS:
- plainLanguage: ≤100 characters, executive summary
- explanation: ≤300 characters, detailed description
- detailedExplanation: ≤1000 characters (optional, for advanced/expert levels)
- stepByStep: array of strings ≤80 chars each OR objects {text, icon?, context?, estimatedTime?}
- hints.ifError: ≤150 characters (optional)
- hints.nextSteps: ≤150 characters (optional)
- hints.commonMistakes: ≤3 items, each ≤100 characters (optional)
- hints.troubleshooting: ≤200 characters (optional)
- hints.safeguards: ≤3 items, each ≤100 characters (optional)
- glossary: object mapping terms to definitions (optional, only if requested)
- examples: array of {scenario, input, output, explanation} (optional, only if requested)

OUTPUT: Valid JSON only, no markdown, no code blocks.
{
  "plainLanguage": "...",
  "explanation": "...",
  "detailedExplanation": "...",
  "stepByStep": ["step 1", "step 2", ...],
  "hints": {
    "ifError": "...",
    "commonMistakes": ["...", "..."],
    "nextSteps": "...",
    "troubleshooting": "...",
    "safeguards": ["...", "..."]
  },
  "glossary": { "term": "definition", ... },
  "examples": [{ "scenario": "...", "input": "...", "output": "...", "explanation": "..." }]
}`;
}

/**
 * Build user prompt with context
 */
function buildUserPrompt(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2
): string {
  const scenario = SCENARIO_DESCRIPTIONS[messageType] || 'Unknown scenario';
  const { language, cognitiveLevel, includeExamples, includeGlossary } = preferences;

  const cleanContext = Object.fromEntries(
    Object.entries(context).filter(([_, v]) => v !== undefined)
  );

  return `Message Type: ${messageType}
Scenario: ${scenario}
Context: ${JSON.stringify(cleanContext)}

Generate accessibility metadata in ${getLanguageName(language)} at ${cognitiveLevel} complexity.
${includeGlossary ? 'Include a glossary of technical terms.' : 'No glossary needed.'}
${includeExamples ? 'Include 1-2 concrete examples.' : 'No examples needed.'}`;
}

/**
 * Get human-readable language name
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    es: 'Spanish',
    en: 'English',
    pt: 'Portuguese',
    fr: 'French',
    de: 'German',
  };
  return names[code] || 'English';
}

/**
 * Validate content metadata from AI
 */
function validateContentMetadata(data: any): ContentMetadataV2 | null {
  if (!data || typeof data !== 'object') return null;

  // Required fields
  if (!data.plainLanguage || !data.explanation) return null;
  if (!Array.isArray(data.stepByStep)) return null;

  // Validate lengths
  if (data.plainLanguage.length > 100) return null;
  if (data.explanation.length > 300) return null;
  if (data.detailedExplanation && data.detailedExplanation.length > 1000) return null;

  // Convert stepByStep to AccessibleStepV2[]
  const steps: AccessibleStepV2[] = data.stepByStep.map((step: any) => {
    if (typeof step === 'string') {
      return { text: step };
    } else if (step && typeof step === 'object' && step.text) {
      return {
        text: step.text,
        icon: step.icon,
        context: step.context,
        estimatedTime: step.estimatedTime,
      };
    } else {
      return { text: String(step) };
    }
  });

  // Build hints
  const hints: ExtendedHintsV2 = {
    ifError: data.hints?.ifError,
    commonMistakes: data.hints?.commonMistakes,
    nextSteps: data.hints?.nextSteps,
    troubleshooting: data.hints?.troubleshooting,
    relatedResources: data.hints?.relatedResources,
    safeguards: data.hints?.safeguards,
  };

  // Build examples
  const examples: ConcreteExampleV2[] | undefined = data.examples?.map((ex: any) => ({
    scenario: ex.scenario || '',
    input: ex.input || '',
    output: ex.output || '',
    explanation: ex.explanation || '',
  }));

  return {
    plainLanguage: data.plainLanguage,
    explanation: data.explanation,
    detailedExplanation: data.detailedExplanation,
    stepByStep: steps,
    hints,
    glossary: data.glossary,
    examples,
  };
}

// ============================================================================
// Cache Logic
// ============================================================================

/**
 * Get cache key for V2 content
 */
function getCacheKey(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2
): string {
  const { language, cognitiveLevel } = preferences;
  const contextHash = hashContext(context);
  return `ai-meta-v2:${language}:${cognitiveLevel}:${messageType}:${contextHash}`;
}

/**
 * Hash context (same as V1)
 */
function hashContext(context: MetadataContext): string {
  const relevantKeys = Object.keys(context).filter((k) => context[k] !== undefined);
  if (relevantKeys.length === 0) {
    return 'generic';
  }

  const contextString = relevantKeys
    .sort()
    .map((k) => `${k}:${context[k]}`)
    .join('|');

  let hash = 2166136261;
  for (let i = 0; i < contextString.length; i++) {
    hash ^= contextString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

/**
 * Get cached content
 */
async function getCachedContent(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): Promise<ContentMetadataV2 | null> {
  if (!env.METADATA_CACHE) {
    return null;
  }

  const cacheKey = getCacheKey(messageType, context, preferences);

  try {
    const cached = await env.METADATA_CACHE.get(cacheKey, 'json');
    if (!cached) {
      return null;
    }

    const validated = validateContentMetadata(cached);
    if (!validated) {
      logger.warn('Invalid cached V2 content, ignoring', { cacheKey });
      return null;
    }

    return validated;
  } catch (error) {
    logger.error('Error reading V2 content from cache', { error, cacheKey });
    return null;
  }
}

/**
 * Set cached content
 */
async function setCachedContent(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  content: ContentMetadataV2,
  env: EnvV2
): Promise<void> {
  if (!env.METADATA_CACHE) {
    return;
  }

  const cacheKey = getCacheKey(messageType, context, preferences);

  const isGeneric = hashContext(context) === 'generic';
  const defaultTTL = isGeneric ? DEFAULT_CACHE_TTL_GENERIC : DEFAULT_CACHE_TTL_SPECIFIC;
  const ttl = isGeneric
    ? parseInt(env.CACHE_TTL_GENERIC || String(defaultTTL), 10)
    : parseInt(env.CACHE_TTL_SPECIFIC || String(defaultTTL), 10);

  try {
    await env.METADATA_CACHE.put(cacheKey, JSON.stringify(content), {
      expirationTtl: ttl,
    });
  } catch (error) {
    logger.error('Error writing V2 content to cache', { error, cacheKey });
    throw error;
  }
}

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Check if AI should be used
 */
function shouldUseAI(env: EnvV2): boolean {
  const aiEnabled = env.AI_ENABLED === 'true';
  if (!aiEnabled) {
    return false;
  }

  const rolloutPercentage = parseInt(env.AI_ROLLOUT_PERCENTAGE || '0', 10);
  if (rolloutPercentage <= 0) {
    return false;
  }

  if (rolloutPercentage >= 100) {
    return true;
  }

  const random = Math.random() * 100;
  return random < rolloutPercentage;
}

// ============================================================================
// Template Fallback
// ============================================================================

/**
 * Fallback to V2 templates
 */
function fallbackToTemplate(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2
): ContentMetadataV2 {
  const { language, cognitiveLevel, audioFriendly } = preferences;
  const msgs = getMessagesByLanguageV2(language);

  // Parse messageType path
  const parts = messageType.split('.');
  let template: any = msgs;

  for (const part of parts) {
    template = template?.[part];
    if (!template) {
      logger.error('V2 template not found for messageType', { messageType });
      // Return generic error template
      return createGenericErrorContent(language);
    }
  }

  // Get template for cognitive level
  const levelTemplate = template[cognitiveLevel] || template.simple;

  // Convert context to replacements (filter out undefined values)
  const replacements: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) {
      replacements[key] = value;
    }
  }

  // Use V2 template helper
  const v1Metadata = createMetadataFromTemplateV2(
    levelTemplate,
    replacements,
    cognitiveLevel,
    audioFriendly,
    language === 'es' || language === 'en' ? language : 'en'
  );

  // Convert V1 metadata to V2 ContentMetadata
  return {
    plainLanguage: v1Metadata.plainLanguage,
    explanation: v1Metadata.explanation,
    stepByStep: v1Metadata.stepByStep.map((text) => ({ text })),
    hints: v1Metadata.hints as ExtendedHintsV2,
  };
}

/**
 * Create generic error content
 */
function createGenericErrorContent(language: string): ContentMetadataV2 {
  return {
    plainLanguage: language === 'es' ? 'Error desconocido' : 'Unknown error',
    explanation:
      language === 'es'
        ? 'Ocurrió un error al procesar tu solicitud.'
        : 'An error occurred while processing your request.',
    stepByStep: [
      {
        text: language === 'es' ? 'Verifica tu solicitud' : 'Check your request',
      },
      {
        text: language === 'es' ? 'Reintenta la operación' : 'Retry the operation',
      },
    ],
    hints: {},
  };
}

// ============================================================================
// Build Universal Metadata
// ============================================================================

/**
 * Build complete universal accessibility metadata structure
 */
function buildUniversalMetadata(
  content: ContentMetadataV2,
  readingLevel: ReadingLevelV2,
  preferences: AccessibilityPreferencesV2,
  env: EnvV2
): UniversalAccessibilityMetadataV2 {
  return {
    content,
    visual: {
      contrastMode: preferences.contrastMode,
      colorBlindSafe: preferences.colorBlindType === 'none',
      colorBlindType: preferences.colorBlindType,
      fontSize: preferences.fontSize,
      screenReaderOptimized: preferences.screenReaderOptimized,
      darkMode: preferences.darkMode,
      altTextProvided: false, // JSON API - no images
    },
    cognitive: {
      level: preferences.cognitiveLevel,
      readingLevel,
      memoryAids: content.hints.commonMistakes || [],
      checkpoints: [], // Could be populated by AI in future
      abstractionLevel: preferences.abstractionLevel,
      iconSupport: content.stepByStep.some((s) => s.icon !== undefined),
    },
    language: {
      code: preferences.language,
      dialect: preferences.dialect,
      direction: 'ltr',
      locale: preferences.language === 'es' ? 'es-ES' : preferences.language === 'en' ? 'en-US' : 'en-US',
    },
    motor: {
      keyboardNavigationHints: preferences.includeKeyboardHints ? ['Tab to navigate', 'Enter to select'] : [],
      voiceCommandHints: preferences.includeVoiceHints ? ['Say "verify payment"', 'Say "check status"'] : [],
      timingAdjustable: false,
    },
    format: {
      availableFormats: ['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld'],
      currentFormat: preferences.outputFormat,
      brailleOptimized: preferences.brailleOptimized,
      semanticMarkup: preferences.includeSemanticMarkup,
    },
    personalization: {
      userPreferencesApplied: !!preferences.userId,
      adaptiveComplexity: preferences.adaptiveComplexity,
    },
    metadata: {
      audioFriendly: preferences.audioFriendly,
      version: 2,
      generatedBy: shouldUseAI(env) ? 'ai' : 'template',
      generatedAt: new Date().toISOString(),
      cacheHit: false, // Will be set by cache layer if needed
    },
  };
}
