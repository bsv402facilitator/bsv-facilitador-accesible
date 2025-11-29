/**
 * i18n Index - Orchestrates V1 and V2 templates
 * Maintains backward compatibility with existing code
 */

import { spanishTemplatesV1 } from './v1/es';
import { englishTemplatesV1 } from './v1/en';
import { spanishTemplatesV2 } from './v2/es';
import { englishTemplatesV2 } from './v2/en';
import type { MessageTemplate, MessageCatalog, MessageCatalogV2, MessageTemplateV2 } from './types';
import type { AccessibleMetadata } from '../../types';

/**
 * V1 Exports (for backward compatibility)
 */
export const messages = spanishTemplatesV1;
export const messagesEN = englishTemplatesV1;

/**
 * V2 Exports (new multi-level templates)
 */
export const messagesV2ES = spanishTemplatesV2;
export const messagesV2EN = englishTemplatesV2;

/**
 * Get messages by language (V1)
 * @deprecated Use getMessagesByLanguageV2 for enhanced accessibility
 */
export function getMessagesByLanguage(lang: 'es' | 'en'): MessageCatalog {
  return lang === 'en' ? messagesEN : messages;
}

/**
 * Get V2 messages by language
 */
export function getMessagesByLanguageV2(lang: 'es' | 'en' | 'pt' | 'fr' | 'de'): MessageCatalogV2 {
  // For now, only ES and EN are implemented
  // PT, FR, DE will fallback to EN
  switch (lang) {
    case 'es':
      return messagesV2ES;
    case 'en':
    default:
      return messagesV2EN;
  }
}

/**
 * Helper para crear AccessibleMetadata desde un template de mensaje (V1)
 * @deprecated Use createMetadataFromTemplateV2 for enhanced accessibility
 */
export function createMetadataFromTemplate(
  template: MessageTemplate,
  replacements: Record<string, string> = {},
  cognitiveLevel: 'simple' | 'medium' | 'advanced' = 'simple',
  audioFriendly = true,
  language: 'es' | 'en' = 'es'
): AccessibleMetadata {
  // Función helper para reemplazar placeholders en strings
  const replace = (text: string): string => {
    let result = text;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  return {
    plainLanguage: replace(template.plainLanguage),
    explanation: replace(template.explanation),
    stepByStep: template.stepByStep.map(replace),
    hints: {
      ...(template.hints.ifError && { ifError: replace(template.hints.ifError) }),
      ...(template.hints.commonMistakes && { commonMistakes: template.hints.commonMistakes }),
      ...(template.hints.nextSteps && { nextSteps: replace(template.hints.nextSteps) }),
    },
    language,
    audioFriendly,
    cognitiveLevel,
  };
}

/**
 * Helper para crear AccessibleMetadata desde un template V2 de mensaje
 */
export function createMetadataFromTemplateV2(
  template: MessageTemplateV2,
  replacements: Record<string, string> = {},
  cognitiveLevel: 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert' = 'simple',
  audioFriendly = true,
  language: 'es' | 'en' = 'es'
): AccessibleMetadata {
  // Función helper para reemplazar placeholders en strings
  const replace = (text: string): string => {
    let result = text;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  // Map V2 cognitive levels to V1 for backward compatibility
  const v1CognitiveLevel: 'simple' | 'medium' | 'advanced' =
    cognitiveLevel === 'beginner' || cognitiveLevel === 'simple'
      ? 'simple'
      : cognitiveLevel === 'expert'
        ? 'advanced'
        : cognitiveLevel;

  return {
    plainLanguage: replace(template.plainLanguage),
    explanation: replace(template.explanation),
    stepByStep: template.stepByStep.map(step =>
      typeof step === 'string' ? replace(step) : replace(step.text)
    ),
    hints: {
      ...(template.hints.ifError && { ifError: replace(template.hints.ifError) }),
      ...(template.hints.commonMistakes && { commonMistakes: template.hints.commonMistakes }),
      ...(template.hints.nextSteps && { nextSteps: replace(template.hints.nextSteps) }),
    },
    language,
    audioFriendly,
    cognitiveLevel: v1CognitiveLevel,
  };
}

/**
 * Get template from V2 catalog by message type and cognitive level
 */
export function getTemplateV2(
  catalog: MessageCatalogV2,
  messageType: 'errors.verify.invalidAmount' | 'errors.verify.invalidAddress' | 'errors.verify.invalidFormat' |
              'errors.settle.alreadyBroadcast' | 'errors.settle.networkError' | 'errors.settle.broadcastFailed' |
              'success.verifyValid' | 'success.settleSuccess' | 'success.supportedNetworks',
  cognitiveLevel: 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert' = 'simple'
): MessageTemplateV2 {
  const [category, subcategory, type] = messageType.split('.') as [
    'errors' | 'success',
    'verify' | 'settle' | 'verifyValid' | 'settleSuccess' | 'supportedNetworks',
    string?
  ];

  if (category === 'errors') {
    const errorCategory = catalog.errors[subcategory as 'verify' | 'settle'];
    if (type && type in errorCategory) {
      return (errorCategory as any)[type][cognitiveLevel];
    }
  } else if (category === 'success' && !type) {
    return (catalog.success as any)[subcategory][cognitiveLevel];
  }

  // Fallback to simple level if type not found
  throw new Error(`Template not found: ${messageType}`);
}

// Re-export types
export type { MessageTemplate, MessageCatalog, MessageCatalogV2, MessageTemplateV2 };
