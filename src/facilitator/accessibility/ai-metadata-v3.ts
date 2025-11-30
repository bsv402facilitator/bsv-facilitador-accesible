/**
 * AI-powered V3 metadata generation for UNIVERSAL accessibility
 *
 * V3 PRINCIPLE: Server provides EVERYTHING, client chooses what it needs.
 *
 * This module generates:
 * - ALL 5 cognitive levels (beginner → expert)
 * - ALL requested languages (minimum: es, en, + user requested)
 * - ALL 3 abstraction levels (concrete, mixed, abstract)
 * - ALL visual variants (contrast, colorblind, fontSize, theme)
 * - ALL motor guidance (keyboard, voice, switch, eye)
 * - ALL audio variants (TTS optimized/non-optimized, with/without pauses)
 * - ALL 8 formats (JSON, XML, plaintext, markdown, HTML, JSON-LD, Braille, SSML)
 */

import type {
  UniversalAccessibilityMetadataV3,
  AccessibilityPreferencesV3,
  MetadataContext,
  EnvV3,
  CognitiveContentV3,
  CognitiveLevelV3,
  AbstractionLevelV3,
  LanguageContentV3,
  VisualSectionV3,
  MotorSectionV3,
  AudioSectionV3,
  FormatsSectionV3,
  ContentSectionV3,
} from '../types';
import { logger } from '../logger';
import { calculateReadingLevel } from './reading-level';

// ============================================================================
// Constants
// ============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT = 10000; // 10 seconds (increased for V3 complexity)
const DEFAULT_CACHE_TTL_V3 = 86400; // 24 hours for V3 (large responses)

const COGNITIVE_LEVELS: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];

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
 * Generate UNIVERSAL accessibility metadata with AI (V3)
 *
 * Returns ALL levels, ALL languages, ALL variants - client chooses what to use
 */
export async function createMetadataWithAIV3(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV3,
  env: EnvV3
): Promise<UniversalAccessibilityMetadataV3> {
  const startTime = Date.now();

  // Determine which languages to generate
  const languages = determineLanguages(preferences);

  // Check if AI is enabled
  const useAI = shouldUseAI(env);

  // Generate content for all languages
  const languageContent: Record<string, LanguageContentV3> = {};
  let generatedBy: 'ai' | 'template' | 'hybrid' = 'template';
  let cacheHit = false;

  if (useAI) {
    // Try cache first
    try {
      const cached = await getCachedMetadata(messageType, context, languages, env);
      if (cached) {
        logger.info('V3 metadata cache hit', { messageType, languages });
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            userPreferences: preferences,
          },
        };
      }
    } catch (error) {
      logger.warn('V3 cache lookup failed', { error });
    }

    // Generate with AI for all languages
    try {
      for (const lang of languages) {
        const content = await generateLanguageContentWithAI(messageType, context, lang, env);
        if (content) {
          languageContent[lang] = content;
          generatedBy = 'ai';
        } else {
          // Fallback to template for this language
          languageContent[lang] = await generateLanguageContentFromTemplate(messageType, context, lang);
          if (generatedBy !== 'ai') generatedBy = 'hybrid';
        }
      }
    } catch (error) {
      logger.error('V3 AI generation failed', { error, messageType });
      generatedBy = 'template';
    }
  }

  // If AI failed or disabled, use templates for all languages
  if (Object.keys(languageContent).length === 0) {
    for (const lang of languages) {
      languageContent[lang] = await generateLanguageContentFromTemplate(messageType, context, lang);
    }
    generatedBy = 'template';
  }

  // Build complete V3 metadata structure
  const metadata = await buildUniversalMetadataV3(
    languageContent,
    context,
    preferences,
    generatedBy,
    cacheHit,
    env
  );

  // Cache the result if AI was used
  if (useAI && generatedBy !== 'template') {
    try {
      await cacheMetadata(messageType, context, languages, metadata, env);
    } catch (error) {
      logger.warn('Failed to cache V3 metadata', { error });
    }
  }

  const elapsed = Date.now() - startTime;
  logger.info('V3 metadata generated', {
    messageType,
    languages,
    generatedBy,
    cacheHit,
    elapsed,
  });

  return metadata;
}

// ============================================================================
// Language Determination
// ============================================================================

/**
 * Determine which languages to generate based on preferences
 */
function determineLanguages(preferences: AccessibilityPreferencesV3): string[] {
  const requested = new Set(preferences.languages || ['es', 'en']);

  // Always include es and en
  requested.add('es');
  requested.add('en');

  // Add primary language if specified
  if (preferences.primaryLanguage) {
    requested.add(preferences.primaryLanguage);
  }

  return Array.from(requested);
}

// ============================================================================
// AI Generation - Language Content
// ============================================================================

/**
 * Generate complete language content (all levels) with AI for ONE language
 */
async function generateLanguageContentWithAI(
  messageType: string,
  context: MetadataContext,
  language: string,
  env: EnvV3
): Promise<LanguageContentV3 | null> {
  const model = selectModel(env);
  const systemPrompt = buildSystemPromptV3(language);
  const userPrompt = buildUserPromptV3(messageType, context, language);

  logger.info('Calling OpenAI API for V3 language content', { messageType, language, model });

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
        max_tokens: 4000, // Increased significantly for V3 (all levels)
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error('OpenAI V3 API error', { status: response.status });
      return null;
    }

    const data = (await response.json()) as unknown;
    const content = (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
      ?.message?.content;

    if (!content) {
      logger.error('OpenAI V3 returned empty content');
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content) as {
      byLevel: Record<CognitiveLevelV3, CognitiveContentV3>;
      byAbstraction: Record<
        AbstractionLevelV3,
        { description: string; content: CognitiveContentV3 }
      >;
    };

    // Validate structure
    if (!parsed.byLevel || !parsed.byAbstraction) {
      logger.error('Invalid V3 response structure', { parsed });
      return null;
    }

    // Calculate reading levels for each cognitive level
    for (const level of COGNITIVE_LEVELS) {
      const content = parsed.byLevel[level];
      if (content) {
        const allText = `${content.plainLanguage} ${content.explanation} ${content.stepByStep?.map((s) => s.text).join(' ') || ''}`;
        content.readingLevel = calculateReadingLevel(allText);
      }
    }

    // Build LanguageContentV3
    return {
      code: language,
      direction: language === 'ar' || language === 'he' ? 'rtl' : 'ltr',
      locale: getLocale(language),
      byLevel: parsed.byLevel,
      byAbstraction: parsed.byAbstraction,
    };
  } catch (error) {
    logger.error('OpenAI V3 generation error', {
      error: error instanceof Error ? error.message : String(error),
      language,
    });
    return null;
  }
}

// ============================================================================
// Template Fallback
// ============================================================================

/**
 * Generate language content from templates (fallback)
 */
async function generateLanguageContentFromTemplate(
  messageType: string,
  context: MetadataContext,
  language: string
): Promise<LanguageContentV3> {
  // For now, we'll create a simplified template-based version
  // In a real implementation, you'd have templates for all levels
  const baseContent = createTemplateContent(messageType, context, language);

  // Create variants for different cognitive levels
  const byLevel: Record<CognitiveLevelV3, CognitiveContentV3> = {
    beginner: createBeginnerContent(baseContent),
    simple: createSimpleContent(baseContent),
    medium: createMediumContent(baseContent),
    advanced: createAdvancedContent(baseContent),
    expert: createExpertContent(baseContent),
  };

  // Create variants for different abstraction levels
  const byAbstraction = {
    concrete: {
      description: 'Concrete examples with specific details',
      content: byLevel.simple,
    },
    mixed: {
      description: 'Mix of concepts and examples',
      content: byLevel.medium,
    },
    abstract: {
      description: 'Theoretical concepts without examples',
      content: byLevel.advanced,
    },
  };

  return {
    code: language,
    direction: language === 'ar' || language === 'he' ? 'rtl' : 'ltr',
    locale: getLocale(language),
    byLevel,
    byAbstraction,
  };
}

/**
 * Template structure for content generation
 */
interface TemplateContent {
  plainLanguage: string;
  explanation: string;
  stepByStep: string[];
  hints?: {
    ifError?: string;
    commonMistakes?: string[];
    nextSteps?: string;
  };
}

/**
 * Create base template content
 */
function createTemplateContent(
  messageType: string,
  context: MetadataContext,
  language: string
): CognitiveContentV3 {
  // Simplified template - in production, use i18n templates
  const templates = getTemplatesForLanguage(language);
  const template = (templates[messageType] || templates['default']) as TemplateContent;

  return {
    plainLanguage: replaceContext(template.plainLanguage, context),
    explanation: replaceContext(template.explanation, context),
    stepByStep: template.stepByStep.map((step: string) => ({
      text: replaceContext(step, context),
    })),
    hints: {
      ifError: template.hints?.ifError,
      commonMistakes: template.hints?.commonMistakes,
      nextSteps: template.hints?.nextSteps,
    },
  };
}

// ============================================================================
// Content Level Variants
// ============================================================================

function createBeginnerContent(base: CognitiveContentV3): CognitiveContentV3 {
  return {
    ...base,
    plainLanguage: simplifyText(base.plainLanguage, 'beginner'),
    explanation: simplifyText(base.explanation, 'beginner'),
    detailedExplanation: base.explanation,
    glossary: createGlossary(base),
    examples: createExamples(base, 'beginner'),
  };
}

function createSimpleContent(base: CognitiveContentV3): CognitiveContentV3 {
  return {
    ...base,
    detailedExplanation: base.explanation,
    examples: createExamples(base, 'simple'),
  };
}

function createMediumContent(base: CognitiveContentV3): CognitiveContentV3 {
  return {
    ...base,
    detailedExplanation: base.explanation,
  };
}

function createAdvancedContent(base: CognitiveContentV3): CognitiveContentV3 {
  return {
    ...base,
    plainLanguage: technicalizeText(base.plainLanguage),
    explanation: technicalizeText(base.explanation),
  };
}

function createExpertContent(base: CognitiveContentV3): CognitiveContentV3 {
  return {
    ...base,
    plainLanguage: technicalizeText(base.plainLanguage),
    explanation: technicalizeText(base.explanation),
    detailedExplanation: technicalizeText(base.explanation || base.plainLanguage),
  };
}

// ============================================================================
// Universal Metadata Builder
// ============================================================================

/**
 * Build complete V3 metadata structure with ALL variants
 */
async function buildUniversalMetadataV3(
  languageContent: Record<string, LanguageContentV3>,
  _context: MetadataContext,
  preferences: AccessibilityPreferencesV3,
  generatedBy: 'ai' | 'template' | 'hybrid',
  cacheHit: boolean,
  _env: EnvV3
): Promise<UniversalAccessibilityMetadataV3> {
  // Use primary language as base for content section
  const primaryLang = preferences.primaryLanguage || 'es';
  const primaryContent = languageContent[primaryLang] || languageContent['es'];

  if (!primaryContent) {
    throw new Error(`No content found for primary language: ${primaryLang}`);
  }

  // Build content section (cognitive + abstraction levels)
  const content: ContentSectionV3 = {
    byLevel: primaryContent.byLevel,
    byAbstraction: primaryContent.byAbstraction,
  };

  // Build visual section (all variants)
  const visual = buildVisualSection();

  // Build motor section (all input methods)
  const motor = buildMotorSection();

  // Build audio section (all variants)
  const audio = buildAudioSection(content);

  // Build formats section (all formats)
  const formats = await buildFormatsSection(content, languageContent, _env);

  // Build recommendations
  const recommendations = {
    cognitiveLevel: preferences.cognitiveLevel || 'simple',
    language: primaryLang,
    visualMode: determineVisualMode(preferences),
    motorMode: preferences.motorInput || 'keyboard',
    format: preferences.preferredFormats?.[0] || 'json',
    confidence: generatedBy === 'ai' ? 0.85 : 0.6,
  };

  return {
    content,
    languages: languageContent,
    visual,
    motor,
    audio,
    formats,
    recommendations,
    metadata: {
      version: 3,
      generatedBy,
      generatedAt: new Date().toISOString(),
      cacheHit,
      userPreferences: preferences,
      wcagLevel: 'AAA',
    },
  };
}

// ============================================================================
// Section Builders
// ============================================================================

function buildVisualSection(): VisualSectionV3 {
  return {
    contrast: {
      high: {
        description: 'High contrast for low vision',
        colorPalette: ['#000000', '#FFFFFF'],
        cssHints: { 'background-color': '#000', color: '#FFF' },
      },
      normal: {
        description: 'Standard WCAG AA contrast',
        colorPalette: ['#333333', '#EEEEEE'],
        cssHints: { 'background-color': '#EEE', color: '#333' },
      },
      low: {
        description: 'Low contrast for photophobia',
        colorPalette: ['#666666', '#CCCCCC'],
        cssHints: { 'background-color': '#CCC', color: '#666' },
      },
    },
    colorBlind: {
      deuteranopia: {
        description: 'Red-green colorblind (most common)',
        colorPalette: ['#0173B2', '#DE8F05', '#CC78BC'],
      },
      protanopia: {
        description: 'Red-green colorblind (severe)',
        colorPalette: ['#0173B2', '#DE8F05', '#CC78BC'],
      },
      tritanopia: {
        description: 'Blue-yellow colorblind',
        colorPalette: ['#E69F00', '#56B4E9', '#009E73'],
      },
      none: {
        description: 'Normal color vision',
        colorPalette: ['#28a745', '#dc3545', '#ffc107'],
      },
    },
    fontSize: {
      small: { description: 'Small (14px)', cssHints: { 'font-size': '14px' } },
      medium: { description: 'Medium (16px)', cssHints: { 'font-size': '16px' } },
      large: { description: 'Large (20px)', cssHints: { 'font-size': '20px' } },
      'x-large': { description: 'Extra Large (24px)', cssHints: { 'font-size': '24px' } },
    },
    theme: {
      light: {
        description: 'Light theme',
        cssHints: { 'background-color': '#FFF', color: '#000' },
      },
      dark: {
        description: 'Dark theme',
        cssHints: { 'background-color': '#1a1a1a', color: '#e0e0e0' },
      },
    },
  };
}

function buildMotorSection(): MotorSectionV3 {
  return {
    keyboard: {
      instructions: ['Use Tab to navigate', 'Press Enter to confirm', 'Press Esc to cancel'],
      shortcuts: { navigate: 'Tab', confirm: 'Enter', cancel: 'Esc' },
      timing: { estimatedTime: '30 seconds', adjustable: true },
    },
    voice: {
      instructions: ['Say "continue" to proceed', 'Say "help" for assistance', 'Say "cancel" to stop'],
      shortcuts: { proceed: 'continue', help: 'help', cancel: 'cancel' },
      timing: { estimatedTime: '45 seconds', adjustable: true },
    },
    switch: {
      instructions: ['Single press to select', 'Double press to confirm', 'Long press for menu'],
      shortcuts: { select: 'single', confirm: 'double', menu: 'long' },
      timing: { estimatedTime: '60 seconds', adjustable: true },
    },
    eye: {
      instructions: ['Look at option to select', 'Hold gaze for 2 seconds to confirm', 'Look away to cancel'],
      shortcuts: { select: 'gaze', confirm: 'hold-2s', cancel: 'look-away' },
      timing: { estimatedTime: '40 seconds', adjustable: true },
    },
  };
}

function buildAudioSection(content: ContentSectionV3): AudioSectionV3 {
  const baseText = content.byLevel.simple.plainLanguage + '. ' + content.byLevel.simple.explanation;

  return {
    ttsOptimized: {
      text: baseText,
      ssml: `<speak><prosody rate="slow">${baseText}</prosody></speak>`,
      pauses: [500, 1000],
      rate: 'slow',
    },
    ttsNonOptimized: {
      text: baseText,
      rate: 'normal',
    },
    withPauses: {
      text: baseText,
      pauses: [500, 1000, 500],
      rate: 'normal',
    },
    withoutPauses: {
      text: baseText,
      rate: 'fast',
    },
  };
}

async function buildFormatsSection(
  content: ContentSectionV3,
  languages: Record<string, LanguageContentV3>,
  _env: EnvV3
): Promise<FormatsSectionV3> {
  const baseData = {
    content: content.byLevel.simple,
    languages,
  };

  // TODO: Implement format converters for V3
  // For now, provide basic formats
  return {
    json: JSON.stringify(baseData, null, 2),
    xml: '<data>XML conversion for V3 pending</data>',
    plaintext: content.byLevel.simple.plainLanguage,
    markdown: `# ${content.byLevel.simple.plainLanguage}\n\n${content.byLevel.simple.explanation}`,
    html: `<div><h1>${content.byLevel.simple.plainLanguage}</h1><p>${content.byLevel.simple.explanation}</p></div>`,
    jsonld: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Thing' }),
    braille: optimizeForBraille(content.byLevel.simple.plainLanguage),
    ssml: `<speak>${content.byLevel.simple.plainLanguage}</speak>`,
  };
}

/**
 * Basic Braille optimization
 */
function optimizeForBraille(text: string): string {
  // Remove emojis, simplify punctuation
  return text.replace(/[^\w\s.,;:!?-]/g, '').trim();
}

// ============================================================================
// Helpers
// ============================================================================

function shouldUseAI(env: EnvV3): boolean {
  return env.ACCESSIBILITY_V3_ENABLED === 'true' && !!env.OPENAI_API_KEY;
}

function selectModel(env: EnvV3): string {
  return env.OPENAI_MODEL_COMPLEX || env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
}

function getLocale(lang: string): string {
  const locales: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
    fr: 'fr-FR',
    de: 'de-DE',
  };
  return locales[lang] || `${lang}-${lang.toUpperCase()}`;
}

function determineVisualMode(prefs: AccessibilityPreferencesV3): string {
  const parts = [];
  if (prefs.contrastMode) parts.push(prefs.contrastMode);
  if (prefs.darkMode) parts.push('dark');
  return parts.join('-') || 'normal';
}

function replaceContext(template: string, context: MetadataContext): string {
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    if (value) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
  }
  return result;
}

function simplifyText(text: string, _level: 'beginner' | 'simple'): string {
  // Simplified version - in production, use NLP to simplify
  return text.replace(/transacción/gi, 'pago').replace(/verificar/gi, 'revisar');
}

function technicalizeText(text: string): string {
  // Add technical terms
  return text;
}

function createGlossary(_content: CognitiveContentV3): Record<string, string> {
  return {
    pago: 'Transferencia de dinero digital',
    Bitcoin: 'Moneda digital descentralizada',
  };
}

function createExamples(
  _content: CognitiveContentV3,
  _level: 'beginner' | 'simple'
): Array<{ scenario: string; input: string; output: string; explanation: string }> {
  return [
    {
      scenario: 'Pago exitoso',
      input: 'Transacción válida',
      output: 'Confirmación',
      explanation: 'El pago fue procesado correctamente',
    },
  ];
}

function getTemplatesForLanguage(lang: string): Record<string, TemplateContent> {
  // Simplified - in production, import from i18n/v3
  const defaultTemplate: TemplateContent = {
    plainLanguage: lang === 'es' ? 'Operación completada' : 'Operation completed',
    explanation:
      lang === 'es'
        ? 'La operación se completó exitosamente'
        : 'The operation completed successfully',
    stepByStep: [lang === 'es' ? 'Paso 1' : 'Step 1', lang === 'es' ? 'Paso 2' : 'Step 2'],
    hints: {},
  };

  return {
    default: defaultTemplate,
    'success.verifyValid': defaultTemplate,
    'success.settleSuccess': defaultTemplate,
    'errors.verify.invalidAmount': defaultTemplate,
    'errors.verify.invalidAddress': defaultTemplate,
  };
}

// ============================================================================
// Prompt Builders
// ============================================================================

function buildSystemPromptV3(language: string): string {
  return `You are an accessibility expert generating metadata for users with cognitive and visual disabilities.

CRITICAL REQUIREMENTS:
1. Generate content for ALL 5 cognitive levels: beginner, simple, medium, advanced, expert
2. Generate content for ALL 3 abstraction levels: concrete, mixed, abstract
3. Use language: ${language}
4. Follow WCAG 2.2 AAA guidelines
5. Return VALID JSON only

OUTPUT FORMAT:
{
  "byLevel": {
    "beginner": { /* CognitiveContentV3 */ },
    "simple": { /* CognitiveContentV3 */ },
    "medium": { /* CognitiveContentV3 */ },
    "advanced": { /* CognitiveContentV3 */ },
    "expert": { /* CognitiveContentV3 */ }
  },
  "byAbstraction": {
    "concrete": { "description": "...", "content": { /* CognitiveContentV3 */ } },
    "mixed": { "description": "...", "content": { /* CognitiveContentV3 */ } },
    "abstract": { "description": "...", "content": { /* CognitiveContentV3 */ } }
  }
}

CognitiveContentV3 structure:
{
  "plainLanguage": "string (max 100 chars)",
  "explanation": "string (max 300 chars)",
  "detailedExplanation": "string (optional)",
  "stepByStep": [{ "text": "string", "icon": "string", "context": "string" }],
  "hints": {
    "ifError": "string",
    "commonMistakes": ["string"],
    "nextSteps": "string"
  },
  "glossary": { "term": "definition" },
  "examples": [{ "scenario": "...", "input": "...", "output": "...", "explanation": "..." }]
}`;
}

function buildUserPromptV3(messageType: string, context: MetadataContext, language: string): string {
  const scenario = SCENARIO_DESCRIPTIONS[messageType] || 'Generic operation';
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return `Generate accessibility metadata for this scenario: ${scenario}

Context: ${contextStr}

Language: ${language}

Generate for ALL 5 cognitive levels (beginner through expert) and ALL 3 abstraction levels.

Return ONLY valid JSON matching the specified format.`;
}

// ============================================================================
// Caching
// ============================================================================

async function getCachedMetadata(
  messageType: string,
  context: MetadataContext,
  languages: string[],
  env: EnvV3
): Promise<UniversalAccessibilityMetadataV3 | null> {
  if (!env.METADATA_CACHE) return null;

  const key = buildCacheKey(messageType, context, languages);
  const cached = await env.METADATA_CACHE.get(key, 'json');

  if (cached) {
    return cached as UniversalAccessibilityMetadataV3;
  }

  return null;
}

async function cacheMetadata(
  messageType: string,
  context: MetadataContext,
  languages: string[],
  metadata: UniversalAccessibilityMetadataV3,
  env: EnvV3
): Promise<void> {
  if (!env.METADATA_CACHE) return;

  const key = buildCacheKey(messageType, context, languages);
  await env.METADATA_CACHE.put(key, JSON.stringify(metadata), {
    expirationTtl: DEFAULT_CACHE_TTL_V3,
  });
}

function buildCacheKey(messageType: string, context: MetadataContext, languages: string[]): string {
  const contextHash = Object.entries(context)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const langsStr = languages.sort().join(',');
  return `v3:${messageType}:${langsStr}:${contextHash}`;
}
