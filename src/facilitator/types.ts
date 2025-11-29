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
