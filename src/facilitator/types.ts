import { z } from 'zod';

/**
 * Custom error map para mensajes en español claro
 */
export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: `Tipo inválido: esperado ${issue.expected}, recibido ${issue.received}` };
    case z.ZodIssueCode.invalid_literal:
      return { message: `Valor inválido: esperado "${issue.expected}"` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Texto demasiado corto: mínimo ${issue.minimum} caracteres` };
      }
      return { message: `Valor demasiado pequeño: mínimo ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Texto demasiado largo: máximo ${issue.maximum} caracteres` };
      }
      return { message: `Valor demasiado grande: máximo ${issue.maximum}` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'url') {
        return { message: 'URL inválida' };
      }
      if (issue.validation === 'regex') {
        return { message: 'Formato inválido' };
      }
      return { message: ctx.defaultError };
    default:
      return { message: ctx.defaultError };
  }
};

// Aplicar el error map globalmente
z.setErrorMap(customErrorMap);

// ============================================================================
// Core X402 Entities
// ============================================================================

/**
 * Schema para PaymentRequirements según protocolo X402
 */
export const PaymentRequirementsSchema = z.object({
  scheme: z.literal('exact'),
  network: z.enum(['bsv-mainnet', 'bsv-testnet']).default('bsv-mainnet'),
  maxAmountRequired: z.string().regex(/^\d+$/, 'Debe ser string numérico (satoshis)'),
  resource: z.string().url(),
  description: z.string().optional(),
  payTo: z.string().min(25).max(35),
  maxTimeoutSeconds: z.number().positive(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

/**
 * Schema para PaymentPayload según protocolo X402
 */
export const PaymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal('exact'),
  network: z.enum(['bsv-mainnet', 'bsv-testnet']).default('bsv-mainnet'),
  payload: z.object({
    transaction: z.string().min(1, 'Transaction is required'),
  }),
});

export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;

// ============================================================================
// Accessibility Preferences
// ============================================================================

/**
 * Schema para preferencias de accesibilidad del usuario
 * language: Acepta cualquier código ISO 639-1 (2 letras) para traducción AI ilimitada
 */
export const AccessibilityPreferencesSchema = z.object({
  language: z.string().length(2).toLowerCase().optional().default('es'),
  cognitiveLevel: z.enum(['simple', 'medium', 'advanced']).optional().default('simple'),
  audioFriendly: z.boolean().optional().default(true),
});

export type AccessibilityPreferences = z.infer<typeof AccessibilityPreferencesSchema>;

// ============================================================================
// Verify Endpoint
// ============================================================================

export const VerifyRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchema.optional(),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  invalidReason: z.string().optional(),
  payer: z.string().optional(),
});

export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;

/**
 * Error codes para endpoint /verify
 */
export const VerifyErrorCodes = {
  INVALID_FORMAT: 'invalid_format',
  INVALID_AMOUNT: 'invalid_amount',
  INVALID_ADDRESS: 'invalid_address',
} as const;

export type VerifyErrorCode = (typeof VerifyErrorCodes)[keyof typeof VerifyErrorCodes];

// ============================================================================
// Settle Endpoint
// ============================================================================

export const SettleRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchema.optional(),
});

export type SettleRequest = z.infer<typeof SettleRequestSchema>;

export const SettleResponseSchema = z.object({
  success: z.boolean(),
  errorReason: z.string().optional(),
  transaction: z.string().optional(),
  payer: z.string().optional(),
  network: z.enum(['bsv-mainnet', 'bsv-testnet']),
});

export type SettleResponse = z.infer<typeof SettleResponseSchema>;

/**
 * Error codes para endpoint /settle
 */
export const SettleErrorCodes = {
  BROADCAST_FAILED: 'broadcast_failed',
  ALREADY_BROADCAST: 'already_broadcast',
  NETWORK_ERROR: 'network_error',
} as const;

export type SettleErrorCode = (typeof SettleErrorCodes)[keyof typeof SettleErrorCodes];

// ============================================================================
// Supported Networks Endpoint
// ============================================================================

export const SupportedNetworksResponseSchema = z.object({
  networks: z.array(z.string()),
});

export type SupportedNetworksResponse = z.infer<typeof SupportedNetworksResponseSchema>;

// ============================================================================
// Accessibility Entities
// ============================================================================

/**
 * Schema para Hints (sugerencias accionables)
 */
export const HintsSchema = z.object({
  ifError: z.string().optional(),
  commonMistakes: z.array(z.string()).optional(),
  nextSteps: z.string().optional(),
});

export type Hints = z.infer<typeof HintsSchema>;

/**
 * Schema para AccessibleMetadata
 * language: Acepta cualquier código ISO 639-1 (2 letras) para traducciones AI ilimitadas
 */
export const AccessibleMetadataSchema = z.object({
  plainLanguage: z.string().max(100, 'Plain language must be ≤100 characters'),
  explanation: z.string().max(300, 'Explanation must be ≤300 characters'),
  stepByStep: z
    .array(z.string().max(80, 'Each step must be ≤80 characters'))
    .max(5, 'Maximum 5 steps allowed'),
  hints: HintsSchema,
  language: z.string().length(2).toLowerCase(),
  audioFriendly: z.boolean(),
  cognitiveLevel: z.enum(['simple', 'medium', 'advanced']),
});

export type AccessibleMetadata = z.infer<typeof AccessibleMetadataSchema>;

/**
 * Generic wrapper para todos los responses con metadata accesible
 */
export interface AccessibleResponse<T> {
  data: T;
  accessibility: AccessibleMetadata;
}

// ============================================================================
// AI Metadata Context
// ============================================================================

/**
 * Context information for generating metadata
 */
export interface MetadataContext {
  amount?: string;
  address?: string;
  txid?: string;
  required?: string;
  actual?: string;
  [key: string]: string | undefined;
}

// ============================================================================
// Cloudflare Workers Environment
// ============================================================================

/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  // Secrets
  OPENAI_API_KEY: string;

  // AI Config
  AI_ENABLED?: string;
  AI_ROLLOUT_PERCENTAGE?: string;
  OPENAI_MODEL_DEFAULT?: string;
  OPENAI_MODEL_COMPLEX?: string;
  CACHE_TTL_GENERIC?: string;
  CACHE_TTL_SPECIFIC?: string;

  // KV Namespace
  METADATA_CACHE?: KVNamespace;

  // Existing BSV Config
  WALLET_ADDRESS?: string;
  NETWORK?: 'mainnet' | 'testnet';
}

// ============================================================================
// V2 Type System - Universal Accessibility (WCAG 2.2 AAA)
// ============================================================================
// NOTE: V2 types coexist with V1 types. V1 types remain unchanged for backward compatibility.

/**
 * V2 Language Support - 5 languages
 */
export type LanguageCodeV2 = 'es' | 'en' | 'pt' | 'fr' | 'de';

/**
 * V2 Cognitive Levels (expanded from V1's 3 levels to 5)
 */
export type CognitiveLevelV2 = 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert';

/**
 * V2 Output Formats
 */
export type OutputFormatV2 = 'json' | 'xml' | 'plaintext' | 'markdown' | 'html' | 'jsonld';

/**
 * V2 Abstraction Levels
 */
export type AbstractionLevelV2 = 'concrete' | 'mixed' | 'abstract';

/**
 * V2 Contrast Modes
 */
export type ContrastModeV2 = 'high' | 'normal' | 'low';

/**
 * V2 Color Blind Types
 */
export type ColorBlindTypeV2 = 'deuteranopia' | 'protanopia' | 'tritanopia' | 'none';

/**
 * V2 Font Sizes
 */
export type FontSizeV2 = 'small' | 'medium' | 'large' | 'x-large';

/**
 * V2 WCAG Levels
 */
export type WCAGLevelV2 = 'A' | 'AA' | 'AAA';

/**
 * V2 Accessibility Preferences Schema
 */
export const AccessibilityPreferencesSchemaV2 = z.object({
  // === Linguistic ===
  language: z.enum(['es', 'en', 'pt', 'fr', 'de']).default('es'),
  dialect: z.string().optional(),

  // === Cognitive ===
  cognitiveLevel: z.enum(['beginner', 'simple', 'medium', 'advanced', 'expert']).default('simple'),
  abstractionLevel: z.enum(['concrete', 'mixed', 'abstract']).default('concrete'),
  includeExamples: z.boolean().default(true),
  includeGlossary: z.boolean().default(true),
  includeCheckpoints: z.boolean().default(false),

  // === Visual ===
  contrastMode: z.enum(['high', 'normal', 'low']).default('normal'),
  colorBlindType: z.enum(['deuteranopia', 'protanopia', 'tritanopia', 'none']).default('none'),
  fontSize: z.enum(['small', 'medium', 'large', 'x-large']).default('medium'),
  darkMode: z.boolean().default(false),
  screenReaderOptimized: z.boolean().default(true),

  // === Motor ===
  includeKeyboardHints: z.boolean().default(true),
  includeVoiceHints: z.boolean().default(false),

  // === Format ===
  outputFormat: z.enum(['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld']).default('json'),
  brailleOptimized: z.boolean().default(false),
  includeSemanticMarkup: z.boolean().default(false),

  // === Audio ===
  audioFriendly: z.boolean().default(true),

  // === Personalization ===
  userId: z.string().optional(),
  adaptiveComplexity: z.boolean().default(false),

  // === WCAG ===
  wcagLevel: z.enum(['A', 'AA', 'AAA']).default('AAA'),
});

export type AccessibilityPreferencesV2 = z.infer<typeof AccessibilityPreferencesSchemaV2>;

/**
 * V2 Enhanced Step with Icons and Context
 */
export interface AccessibleStepV2 {
  text: string;
  icon?: string;
  context?: string;
  estimatedTime?: string;
}

/**
 * V2 Resource Link
 */
export interface ResourceLinkV2 {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'faq' | 'support';
}

/**
 * V2 Extended Hints
 */
export interface ExtendedHintsV2 {
  ifError?: string;
  commonMistakes?: string[];
  nextSteps?: string;
  troubleshooting?: string;
  relatedResources?: ResourceLinkV2[];
  safeguards?: string[];
}

/**
 * V2 Concrete Example
 */
export interface ConcreteExampleV2 {
  scenario: string;
  input: string;
  output: string;
  explanation: string;
}

/**
 * V2 Reading Level Metrics
 */
export interface ReadingLevelV2 {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  estimatedReadingTime: string;
}

/**
 * V2 Comprehension Checkpoint
 */
export interface ComprehensionCheckpointV2 {
  question: string;
  expectedAnswer: string;
  hint?: string;
}

/**
 * V2 Language Configuration
 */
export interface LanguageConfigV2 {
  code: LanguageCodeV2;
  dialect?: string;
  direction: 'ltr' | 'rtl';
  locale: string;
  culturalContext?: string;
}

/**
 * V2 Content Metadata (Enhanced)
 */
export interface ContentMetadataV2 {
  plainLanguage: string;
  explanation: string;
  detailedExplanation?: string;
  stepByStep: AccessibleStepV2[];
  hints: ExtendedHintsV2;
  glossary?: Record<string, string>;
  examples?: ConcreteExampleV2[];
}

/**
 * V2 Visual Accessibility Metadata
 */
export interface VisualAccessibilityV2 {
  contrastMode: ContrastModeV2;
  colorBlindSafe: boolean;
  colorBlindType?: ColorBlindTypeV2;
  fontSize: FontSizeV2;
  screenReaderOptimized: boolean;
  darkMode: boolean;
  altTextProvided: boolean;
}

/**
 * V2 Cognitive Accessibility Metadata
 */
export interface CognitiveAccessibilityV2 {
  level: CognitiveLevelV2;
  readingLevel: ReadingLevelV2;
  memoryAids: string[];
  checkpoints: ComprehensionCheckpointV2[];
  abstractionLevel: AbstractionLevelV2;
  iconSupport: boolean;
}

/**
 * V2 Motor Accessibility Metadata
 */
export interface MotorAccessibilityV2 {
  keyboardNavigationHints: string[];
  voiceCommandHints: string[];
  timingAdjustable: boolean;
  focusOrder?: number[];
}

/**
 * V2 Format Metadata
 */
export interface FormatMetadataV2 {
  availableFormats: OutputFormatV2[];
  currentFormat: OutputFormatV2;
  brailleOptimized: boolean;
  semanticMarkup: boolean;
}

/**
 * V2 Personalization Metadata
 */
export interface PersonalizationMetadataV2 {
  userPreferencesApplied: boolean;
  adaptiveComplexity: boolean;
  previousInteractions?: number;
  recommendedNextLevel?: CognitiveLevelV2;
}

/**
 * V2 Universal Accessibility Metadata
 */
export interface UniversalAccessibilityMetadataV2 {
  content: ContentMetadataV2;
  visual: VisualAccessibilityV2;
  cognitive: CognitiveAccessibilityV2;
  language: LanguageConfigV2;
  motor: MotorAccessibilityV2;
  format: FormatMetadataV2;
  personalization: PersonalizationMetadataV2;
  metadata: {
    audioFriendly: boolean;
    version: 2;
    generatedBy: 'ai' | 'template';
    generatedAt: string;
    cacheHit: boolean;
  };
}

/**
 * V2 WCAG Success Criterion
 */
export interface SuccessCriterionV2 {
  id: string;
  name: string;
  level: WCAGLevelV2;
  status: 'pass' | 'fail' | 'not-applicable';
  notes?: string;
}

/**
 * V2 WCAG Compliance Metadata
 */
export interface WCAGComplianceMetadataV2 {
  version: '2.2';
  level: WCAGLevelV2;
  successCriteria: SuccessCriterionV2[];
  conformanceStatement: string;
  auditTrail: {
    criteriaChecked: string[];
    criteriaPass: string[];
    criteriaNotApplicable: string[];
  };
}

/**
 * V2 Accessible Response Wrapper
 */
export interface AccessibleResponseV2<T> {
  data: T;
  accessibility: UniversalAccessibilityMetadataV2;
  wcag: WCAGComplianceMetadataV2;
}

/**
 * V2 Verify Request (extends V1 with V2 preferences)
 */
export const VerifyRequestSchemaV2 = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchemaV2.optional(),
});

export type VerifyRequestV2 = z.infer<typeof VerifyRequestSchemaV2>;

/**
 * V2 Settle Request (extends V1 with V2 preferences)
 */
export const SettleRequestSchemaV2 = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchemaV2.optional(),
});

export type SettleRequestV2 = z.infer<typeof SettleRequestSchemaV2>;

// ============================================================================
// V2 Environment Bindings (extends V1)
// ============================================================================

/**
 * V2 Environment with extended bindings
 */
export interface EnvV2 extends Env {
  // New V2 KV Namespace
  USER_PREFERENCES?: KVNamespace;

  // New V2 AI Config
  OPENAI_MODEL_SIMPLE?: string;
  OPENAI_MODEL_EXPERT?: string;
  USER_PREFERENCES_TTL?: string;

  // New V2 Feature Flags
  WCAG_COMPLIANCE_ENABLED?: string;
  MULTILANG_ENABLED?: string;
  FORMAT_CONVERSION_ENABLED?: string;
  ADAPTIVE_COMPLEXITY_ENABLED?: string;
  READING_LEVEL_ANALYSIS?: string;
}

// ============================================================================
// V3 Type System - Universal Accessibility (All Levels, All Languages, All Formats)
// ============================================================================
// V3 PRINCIPLE: Server provides EVERYTHING, client chooses what it needs.
// - All cognitive levels (beginner to expert)
// - All languages (minimum: es, en, + user requested)
// - All visual variants (contrast, colorblind, fontSize, theme)
// - All motor options (keyboard, voice, switch, eye)
// - All audio variants (TTS optimized/non-optimized, with/without pauses)
// - All formats (JSON, XML, plaintext, markdown, HTML, JSON-LD, Braille, SSML)

/**
 * V3 Cognitive Levels (5 levels for complete coverage)
 */
export type CognitiveLevelV3 = 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert';

/**
 * V3 Abstraction Levels
 */
export type AbstractionLevelV3 = 'concrete' | 'mixed' | 'abstract';

/**
 * V3 Output Formats (expanded)
 */
export type OutputFormatV3 = 'json' | 'xml' | 'plaintext' | 'markdown' | 'html' | 'jsonld' | 'braille' | 'ssml';

/**
 * V3 Contrast Modes
 */
export type ContrastModeV3 = 'high' | 'normal' | 'low';

/**
 * V3 Color Blind Types
 */
export type ColorBlindTypeV3 = 'deuteranopia' | 'protanopia' | 'tritanopia' | 'none';

/**
 * V3 Font Sizes
 */
export type FontSizeV3 = 'small' | 'medium' | 'large' | 'x-large';

/**
 * V3 Theme Modes
 */
export type ThemeModeV3 = 'light' | 'dark';

/**
 * V3 Motor Input Methods
 */
export type MotorInputV3 = 'keyboard' | 'voice' | 'switch' | 'eye';

/**
 * V3 Audio Variant Types
 */
export type AudioVariantV3 = 'ttsOptimized' | 'ttsNonOptimized' | 'withPauses' | 'withoutPauses';

/**
 * V3 Enhanced Step with metadata
 * Mejora #1: stepByStep con timestamps, iconos y estados
 */
export interface AccessibleStepV3 {
  step?: number; // Número de paso (1, 2, 3...)
  text: string; // Descripción del paso
  icon?: string; // Emoji o icono visual (✓, 🔐, 📡, ⏳)
  context?: string; // Por qué es importante este paso
  estimatedTime?: string; // Tiempo estimado ("~10 minutos")
  timestamp?: string; // ISO 8601 timestamp cuando ocurrió
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'; // Estado del paso
}

/**
 * V3 Resource Link
 */
export interface ResourceLinkV3 {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'faq' | 'support';
}

/**
 * V3 Extended Hints
 */
export interface ExtendedHintsV3 {
  ifError?: string;
  commonMistakes?: string[];
  nextSteps?: string;
  troubleshooting?: string;
  relatedResources?: ResourceLinkV3[];
  safeguards?: string[];
}

/**
 * V3 Concrete Example
 * MEJORA #7: Soporta datos reales del pago actual
 */
export interface ConcreteExampleV3 {
  scenario: string;
  input: string | Record<string, string>; // string simple o datos estructurados
  output: string;
  explanation: string;
  visualization?: string; // Link para verificar (ej: WoC explorer)
  relatable?: string; // Analogía del mundo real
}

/**
 * V3 Reading Level Metrics
 */
export interface ReadingLevelV3 {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  estimatedReadingTime: string;
}

/**
 * V3 Comprehension Checkpoint
 * Mejora #2: Checkpoints contextuales de comprensión
 */
export interface ComprehensionCheckpointV3 {
  question: string; // Pregunta para validar comprensión
  expectedAnswer: string; // Respuesta esperada
  hint?: string; // Pista para ayudar al usuario
  glossaryRef?: string; // Referencia a término del glosario
  actionLink?: string; // Link para verificar (ej: WoC explorer)
  importance?: 'low' | 'medium' | 'high'; // Importancia del checkpoint
  safeguard?: string; // Advertencia de seguridad
}

/**
 * V3 Cognitive Content - Complete content for ONE cognitive level
 */
/**
 * V3 Voice Command Hints - For motor accessibility
 */
export interface VoiceCommandHints {
  commands: Array<{
    trigger: string; // "verificar pago"
    action: string; // "ver el estado de la transacción"
    context?: string; // Cuándo usar este comando
  }>;
  examples: string[]; // "Di 'verificar pago' para..."
  wakePhrases?: string[]; // ["Hey Bitcoin", "Ok BSV"]
}

export interface CognitiveContentV3 {
  plainLanguage: string;
  explanation: string;
  detailedExplanation?: string;
  stepByStep: AccessibleStepV3[];
  hints: ExtendedHintsV3;
  glossary?: Record<string, string>;
  examples?: ConcreteExampleV3[];
  checkpoints?: ComprehensionCheckpointV3[];
  readingLevel?: ReadingLevelV3;
  memoryAids?: string[];
  voiceCommandHints?: VoiceCommandHints; // NUEVO: comandos de voz para accesibilidad motora
}

/**
 * V3 Abstraction Content - Content for ONE abstraction level
 */
export interface AbstractionContentV3 {
  description: string;
  content: CognitiveContentV3;
}

/**
 * V3 Language Content - Complete content in ONE language
 */
export interface LanguageContentV3 {
  code: string; // 'es', 'en', 'pt', 'fr', 'de', etc.
  direction: 'ltr' | 'rtl';
  locale: string; // 'es-ES', 'en-US', 'pt-BR', etc.
  culturalContext?: string;
  // Content by cognitive level
  byLevel: Record<CognitiveLevelV3, CognitiveContentV3>;
  // Content by abstraction level
  byAbstraction: Record<AbstractionLevelV3, AbstractionContentV3>;
}

/**
 * V3 Visual Variant - Visual accessibility variant
 */
export interface VisualVariantV3 {
  description: string;
  cssHints?: Record<string, string>;
  ariaLabels?: Record<string, string>;
  altTexts?: string[];
  colorPalette?: string[];
  recommended?: boolean; // ✨ NUEVO: Indica si esta variante coincide con las preferencias del usuario
}

/**
 * V3 Motor Guidance - Guidance for ONE motor input method
 */
export interface MotorGuidanceV3 {
  instructions: string[];
  shortcuts?: Record<string, string>;
  timing?: {
    estimatedTime: string;
    adjustable: boolean;
  };
  focusOrder?: number[];
}

/**
 * V3 Audio Content - Audio variant content
 */
export interface AudioContentV3 {
  text: string;
  ssml?: string;
  pauses?: number[]; // Pause positions in ms
  pronunciation?: Record<string, string>;
  rate?: 'slow' | 'normal' | 'fast';
}

/**
 * V3 Content Section - ALL cognitive and abstraction levels
 */
export interface ContentSectionV3 {
  byLevel: Record<CognitiveLevelV3, CognitiveContentV3>;
  byAbstraction: Record<AbstractionLevelV3, AbstractionContentV3>;
}

/**
 * V3 Visual Section - ALL visual variants
 */
export interface VisualSectionV3 {
  contrast: Record<ContrastModeV3, VisualVariantV3>;
  colorBlind: Record<ColorBlindTypeV3, VisualVariantV3>;
  fontSize: Record<FontSizeV3, VisualVariantV3>;
  theme: Record<ThemeModeV3, VisualVariantV3>;
}

/**
 * V3 Motor Section - ALL motor input methods
 */
export interface MotorSectionV3 {
  keyboard: MotorGuidanceV3;
  voice: MotorGuidanceV3;
  switch: MotorGuidanceV3;
  eye: MotorGuidanceV3;
}

/**
 * V3 Audio Section - ALL audio variants
 */
export interface AudioSectionV3 {
  ttsOptimized: AudioContentV3;
  ttsNonOptimized: AudioContentV3;
  withPauses: AudioContentV3;
  withoutPauses: AudioContentV3;
}

/**
 * V3 Formats Section - Content in ALL formats
 */
export interface FormatsSectionV3 {
  json: string;
  xml: string;
  plaintext: string;
  markdown: string;
  html: string;
  jsonld: string;
  braille: string;
  ssml: string;
}

/**
 * V3 Recommendations - Server suggestions based on user preferences
 */
export interface RecommendationsV3 {
  cognitiveLevel: CognitiveLevelV3;
  language: string;
  visualMode: string; // e.g., "high-contrast-dark"
  motorMode: MotorInputV3;
  format: OutputFormatV3;
  confidence: number; // 0-1, how confident the server is in these recommendations
}

/**
 * V3 Metadata Section
 */
export interface MetadataSectionV3 {
  version: 3;
  generatedBy: 'ai' | 'template' | 'hybrid';
  generatedAt: string;
  cacheHit: boolean;
  userPreferences?: AccessibilityPreferencesV3;
  wcagLevel: 'AAA';
}

/**
 * V3 Universal Accessibility Metadata - The complete V3 structure
 * Contains ALL levels, ALL languages, ALL variants
 */
export interface UniversalAccessibilityMetadataV3 {
  // ALL cognitive levels and abstraction levels
  content: ContentSectionV3;

  // ALL languages (minimum: es, en, + user requested)
  languages: Record<string, LanguageContentV3>; // 'es', 'en', 'pt', etc.

  // ALL visual variants
  visual: VisualSectionV3;

  // ALL motor input methods
  motor: MotorSectionV3;

  // ALL audio variants
  audio: AudioSectionV3;

  // Content in ALL formats
  formats: FormatsSectionV3;

  // Server recommendations (client can ignore)
  recommendations: RecommendationsV3;

  // Metadata
  metadata: MetadataSectionV3;
}

/**
 * V3 Accessibility Preferences Schema
 * User specifies preferences, but server provides EVERYTHING
 */
export const AccessibilityPreferencesSchemaV3 = z.object({
  // === Linguistic ===
  languages: z.array(z.string().length(2).toLowerCase()).min(1).default(['es', 'en']),
  primaryLanguage: z.string().length(2).toLowerCase().default('es'),
  dialect: z.string().optional(),

  // === Cognitive ===
  cognitiveLevel: z.enum(['beginner', 'simple', 'medium', 'advanced', 'expert']).optional(),
  abstractionLevel: z.enum(['concrete', 'mixed', 'abstract']).optional(),
  includeExamples: z.boolean().default(true),
  includeGlossary: z.boolean().default(true),
  includeCheckpoints: z.boolean().default(false),

  // === Visual ===
  contrastMode: z.enum(['high', 'normal', 'low']).optional(),
  colorBlindType: z.enum(['deuteranopia', 'protanopia', 'tritanopia', 'none']).optional(),
  fontSize: z.enum(['small', 'medium', 'large', 'x-large']).optional(),
  darkMode: z.boolean().optional(),
  screenReaderOptimized: z.boolean().default(true),

  // === Motor ===
  motorInput: z.enum(['keyboard', 'voice', 'switch', 'eye']).optional(),
  includeKeyboardHints: z.boolean().default(true),
  includeVoiceHints: z.boolean().default(false),

  // === Format ===
  preferredFormats: z.array(z.enum(['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld', 'braille', 'ssml'])).default(['json']),
  brailleOptimized: z.boolean().default(false),
  includeSemanticMarkup: z.boolean().default(false),

  // === Audio ===
  audioFriendly: z.boolean().default(true),
  ttsOptimized: z.boolean().default(true),

  // === Personalization ===
  userId: z.string().optional(),
  adaptiveComplexity: z.boolean().default(false),

  // === WCAG ===
  wcagLevel: z.enum(['A', 'AA', 'AAA']).default('AAA'),
});

export type AccessibilityPreferencesV3 = z.infer<typeof AccessibilityPreferencesSchemaV3>;

/**
 * V3 Accessible Response Wrapper
 */
export interface AccessibleResponseV3<T> {
  data: T;
  accessibility: UniversalAccessibilityMetadataV3;
}

/**
 * V3 Verify Request
 */
export const VerifyRequestSchemaV3 = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchemaV3.optional(),
});

export type VerifyRequestV3 = z.infer<typeof VerifyRequestSchemaV3>;

/**
 * V3 Settle Request
 */
export const SettleRequestSchemaV3 = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchemaV3.optional(),
});

export type SettleRequestV3 = z.infer<typeof SettleRequestSchemaV3>;

/**
 * V3 Environment Bindings (extends V2)
 */
export interface EnvV3 extends EnvV2 {
  // V3 Feature Flags
  ACCESSIBILITY_V3_ENABLED?: string;
  V3_ROLLOUT_PERCENTAGE?: string;

  // V3 Format Conversion
  FORMAT_CONVERTERS_ENABLED?: string;

  // V3 Multi-Language
  MAX_LANGUAGES?: string; // Maximum number of languages to return (default: all requested)

  // V3 Performance
  LAZY_LOADING_ENABLED?: string; // Allow clients to request specific levels/languages only
  STREAMING_ENABLED?: string; // Enable streaming for large responses

  // V3 Mejoras Críticas
  FEATURE_STEP_BY_STEP_V2?: string;
  FEATURE_CHECKPOINTS?: string;
  FEATURE_STABLE_GLOSSARY?: string;

  // V3 Prioridades Altas
  FEATURE_VOICE_COMMANDS?: string;
  FEATURE_PREFERENCE_DETECTION?: string;
  FEATURE_ADAPTIVE_COMPLEXITY_V3?: string;
  FEATURE_REAL_EXAMPLES?: string;
}
