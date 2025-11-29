/**
 * Shared types for i18n templates
 */

/**
 * V1 Message Template
 */
export interface MessageTemplate {
  plainLanguage: string;
  explanation: string;
  stepByStep: string[];
  hints: {
    ifError?: string;
    commonMistakes?: string[];
    nextSteps?: string;
  };
}

/**
 * V2 Message Template (Enhanced with additional fields)
 */
export interface MessageTemplateV2 extends MessageTemplate {
  detailedExplanation?: string;
  glossary?: Record<string, string>;
  examples?: Array<{
    scenario: string;
    input: string;
    output: string;
    explanation: string;
  }>;
  memoryAids?: string[];
}

/**
 * V1 Message Catalog - All templates for a single language
 */
export interface MessageCatalog {
  errors: {
    verify: {
      invalidAmount: MessageTemplate;
      invalidAddress: MessageTemplate;
      invalidFormat: MessageTemplate;
    };
    settle: {
      alreadyBroadcast: MessageTemplate;
      networkError: MessageTemplate;
      broadcastFailed: MessageTemplate;
    };
  };
  success: {
    verifyValid: MessageTemplate;
    settleSuccess: MessageTemplate;
    supportedNetworks: MessageTemplate;
  };
}

/**
 * V2 Message Catalog - Templates with 5 cognitive levels
 */
export interface MessageCatalogV2 {
  errors: {
    verify: {
      invalidAmount: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
      invalidAddress: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
      invalidFormat: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
    };
    settle: {
      alreadyBroadcast: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
      networkError: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
      broadcastFailed: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
    };
  };
  success: {
    verifyValid: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
    settleSuccess: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
    supportedNetworks: Record<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert', MessageTemplateV2>;
  };
  glossary: Record<string, string>;
  icons: Record<string, string>;
}
