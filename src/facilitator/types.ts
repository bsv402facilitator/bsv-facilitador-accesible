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
 */
export const AccessibilityPreferencesSchema = z.object({
  language: z.enum(['es', 'en']).optional().default('es'),
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
 */
export const AccessibleMetadataSchema = z.object({
  plainLanguage: z.string().max(100, 'Plain language must be ≤100 characters'),
  explanation: z.string().max(300, 'Explanation must be ≤300 characters'),
  stepByStep: z
    .array(z.string().max(80, 'Each step must be ≤80 characters'))
    .max(5, 'Maximum 5 steps allowed'),
  hints: HintsSchema,
  language: z.enum(['es', 'en']),
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
