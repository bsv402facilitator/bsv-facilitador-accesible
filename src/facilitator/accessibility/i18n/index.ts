/**
 * i18n Index - Orchestrates V1 and V2 templates
 * Maintains backward compatibility with existing code
 */

import { spanishTemplatesV1 } from './v1/es';
import { englishTemplatesV1 } from './v1/en';
import type { MessageTemplate, MessageCatalog } from './types';
import type { AccessibleMetadata } from '../../types';

/**
 * V1 Exports (for backward compatibility)
 */
export const messages = spanishTemplatesV1;
export const messagesEN = englishTemplatesV1;

/**
 * Get messages by language (V1)
 */
export function getMessagesByLanguage(lang: 'es' | 'en'): MessageCatalog {
  return lang === 'en' ? messagesEN : messages;
}

/**
 * Helper para crear AccessibleMetadata desde un template de mensaje (V1)
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

// Re-export types
export type { MessageTemplate, MessageCatalog };
