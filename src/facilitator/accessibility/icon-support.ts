/**
 * Icon Support System for Cognitive Accessibility
 *
 * Provides visual icons to aid comprehension for users with cognitive disabilities.
 * Icons are categorized by type (status, concept, action) and support Spanish.
 */

import type { CognitiveContentV3 } from '../types';

/**
 * Step with timestamp - local interface for icon support
 */
interface StepWithTimestamp {
  text: string;
  icon?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'error';
  estimatedTime?: string;
  context?: string;
}

/**
 * Comprehensive icon library organized by category
 */
export const ICON_LIBRARY = {
  status: {
    success: '✅',
    pending: '⏳',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    inProgress: '🔄',
    completed: '🎉',
  },
  concept: {
    txid: '🔑',
    blockchain: '⛓️',
    payment: '💳',
    money: '💰',
    verification: '🔐',
    broadcast: '📡',
    network: '🌐',
    time: '⏰',
    address: '📬',
    satoshis: '🪙',
    signature: '✍️',
    mempool: '📥',
  },
  action: {
    next: '▶️',
    back: '◀️',
    help: '❓',
    save: '💾',
    copy: '📋',
    check: '🔍',
    send: '📤',
    receive: '📥',
  },
} as const;

/**
 * Memory aids in Spanish with icons
 * These help users remember key blockchain/payment concepts
 */
export const MEMORY_AIDS_ES = [
  '🔑 txid = Tu llave única de transacción',
  '⛓️ blockchain = Registro público permanente',
  '⏳ mempool = Sala de espera para transacciones',
  '💰 satoshis = La moneda más pequeña de Bitcoin',
  '🔐 firma digital = Tu autorización criptográfica',
  '📡 broadcast = Enviar a toda la red',
  '📬 dirección = Como tu número de cuenta',
  '🪙 satoshi = 0.00000001 Bitcoin',
] as const;

/**
 * Memory aids in English with icons
 */
export const MEMORY_AIDS_EN = [
  '🔑 txid = Your unique transaction key',
  '⛓️ blockchain = Permanent public ledger',
  '⏳ mempool = Waiting room for transactions',
  '💰 satoshis = Smallest unit of Bitcoin',
  '🔐 digital signature = Your cryptographic authorization',
  '📡 broadcast = Send to entire network',
  '📬 address = Like your account number',
  '🪙 satoshi = 0.00000001 Bitcoin',
] as const;

/**
 * Auto-detect and add icons to content based on keywords
 *
 * @param content - Cognitive content to enrich with icons
 * @param language - Language code (es, en, etc.)
 * @returns Content with icons added to steps and memory aids
 */
export function addIconsToContent(
  content: CognitiveContentV3,
  language: string = 'es'
): CognitiveContentV3 {
  // Add icons to stepByStep
  const stepsWithIcons = content.stepByStep.map((step) => {
    let icon = step.icon;

    if (!icon) {
      // Auto-detect icon based on step text keywords
      const text = step.text.toLowerCase();

      // Verification/validation keywords
      if (text.includes('verif') || text.includes('valid') || text.includes('compro')) {
        icon = ICON_LIBRARY.concept.verification;
      }
      // Broadcast/send keywords
      else if (text.includes('broadcast') || text.includes('envía') || text.includes('send')) {
        icon = ICON_LIBRARY.concept.broadcast;
      }
      // Success/confirmation keywords
      else if (
        text.includes('confirm') ||
        text.includes('éxito') ||
        text.includes('success') ||
        text.includes('completado')
      ) {
        icon = ICON_LIBRARY.status.success;
      }
      // Pending/waiting keywords
      else if (text.includes('esper') || text.includes('wait') || text.includes('pending')) {
        icon = ICON_LIBRARY.status.pending;
      }
      // Error keywords
      else if (text.includes('error') || text.includes('fall') || text.includes('rechaz')) {
        icon = ICON_LIBRARY.status.error;
      }
      // Warning keywords
      else if (text.includes('advertencia') || text.includes('cuidado') || text.includes('warning')) {
        icon = ICON_LIBRARY.status.warning;
      }
      // Transaction/payment keywords
      else if (text.includes('pago') || text.includes('transaction') || text.includes('payment')) {
        icon = ICON_LIBRARY.concept.payment;
      }
      // Network keywords
      else if (text.includes('red') || text.includes('network')) {
        icon = ICON_LIBRARY.concept.network;
      }
      // Default to info icon
      else {
        icon = ICON_LIBRARY.status.info;
      }
    }

    return { ...step, icon };
  });

  // Add memory aids if missing or incomplete
  const memoryAids = content.memoryAids?.length
    ? content.memoryAids
    : selectRelevantMemoryAids(content, language);

  return {
    ...content,
    stepByStep: stepsWithIcons,
    memoryAids,
  };
}

/**
 * Select relevant memory aids based on content context
 *
 * @param content - Content to analyze for relevant terms
 * @param language - Language code (es, en, etc.)
 * @returns Array of 3-5 most relevant memory aids
 */
function selectRelevantMemoryAids(content: CognitiveContentV3, language: string): string[] {
  const allText = `${content.plainLanguage} ${content.explanation} ${content.stepByStep.map((s) => s.text).join(' ')}`.toLowerCase();

  const aids = language === 'en' ? [...MEMORY_AIDS_EN] : [...MEMORY_AIDS_ES];
  const relevanceScores = aids.map((aid) => {
    let score = 0;
    const aidLower = aid.toLowerCase();

    // Score based on keyword presence in content
    if (aidLower.includes('txid') && allText.includes('txid')) score += 3;
    if (aidLower.includes('blockchain') && (allText.includes('blockchain') || allText.includes('cadena')))
      score += 3;
    if (aidLower.includes('broadcast') && (allText.includes('broadcast') || allText.includes('envía')))
      score += 3;
    if (aidLower.includes('satoshi') && (allText.includes('satoshi') || allText.includes('monto')))
      score += 2;
    if (aidLower.includes('firma') && (allText.includes('firma') || allText.includes('signature')))
      score += 2;
    if (aidLower.includes('dirección') && (allText.includes('dirección') || allText.includes('address')))
      score += 2;
    if (aidLower.includes('mempool') && allText.includes('mempool')) score += 1;

    return { aid, score };
  });

  // Sort by relevance and take top 3-5
  const topAids = relevanceScores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.aid);

  // If no relevant aids found, return top 3 generic ones
  if (topAids.length === 0) {
    return aids.slice(0, 3);
  }

  return topAids;
}

/**
 * Get icon for a specific concept by name
 *
 * @param conceptName - Name of the concept (e.g., 'success', 'blockchain')
 * @returns Icon emoji or empty string if not found
 */
export function getIconForConcept(conceptName: string): string {
  const allIcons = { ...ICON_LIBRARY.status, ...ICON_LIBRARY.concept, ...ICON_LIBRARY.action };
  return allIcons[conceptName as keyof typeof allIcons] || '';
}

/**
 * Add status icons to steps based on step state
 *
 * @param steps - Array of steps with timestamps and status
 * @returns Steps with appropriate status icons
 */
export function addStatusIconsToSteps(steps: StepWithTimestamp[]): StepWithTimestamp[] {
  return steps.map((step) => {
    let icon = step.icon;

    // Override icon based on status if provided
    if (step.status && !icon) {
      switch (step.status) {
        case 'completed':
          icon = ICON_LIBRARY.status.completed;
          break;
        case 'in-progress':
          icon = ICON_LIBRARY.status.inProgress;
          break;
        case 'pending':
          icon = ICON_LIBRARY.status.pending;
          break;
        case 'error':
          icon = ICON_LIBRARY.status.error;
          break;
        default:
          icon = ICON_LIBRARY.status.info;
      }
    }

    return { ...step, icon };
  });
}

/**
 * Generate alt text for icons (accessibility for screen readers)
 *
 * @param icon - Icon emoji
 * @param language - Language code
 * @returns Descriptive alt text for the icon
 */
export function getIconAltText(icon: string, language: string = 'es'): string {
  const altTexts: Record<string, { es: string; en: string }> = {
    '✅': { es: 'Marca de verificación - Éxito', en: 'Check mark - Success' },
    '⏳': { es: 'Reloj de arena - Pendiente', en: 'Hourglass - Pending' },
    '❌': { es: 'X roja - Error', en: 'Red X - Error' },
    '⚠️': { es: 'Signo de advertencia', en: 'Warning sign' },
    'ℹ️': { es: 'Información', en: 'Information' },
    '🔄': { es: 'Flechas circulares - En progreso', en: 'Circular arrows - In progress' },
    '🎉': { es: 'Confeti - Completado', en: 'Confetti - Completed' },
    '🔑': { es: 'Llave - Identificador único', en: 'Key - Unique identifier' },
    '⛓️': { es: 'Cadena - Blockchain', en: 'Chain - Blockchain' },
    '💳': { es: 'Tarjeta de crédito - Pago', en: 'Credit card - Payment' },
    '💰': { es: 'Bolsa de dinero', en: 'Money bag' },
    '🔐': { es: 'Candado cerrado - Seguridad', en: 'Locked padlock - Security' },
    '📡': { es: 'Antena satelital - Transmisión', en: 'Satellite antenna - Broadcast' },
    '🌐': { es: 'Globo terráqueo - Red global', en: 'Globe - Global network' },
    '⏰': { es: 'Reloj despertador - Tiempo', en: 'Alarm clock - Time' },
    '📬': { es: 'Buzón de correo - Dirección', en: 'Mailbox - Address' },
    '🪙': { es: 'Moneda', en: 'Coin' },
    '✍️': { es: 'Mano escribiendo - Firma', en: 'Hand writing - Signature' },
    '📥': { es: 'Bandeja de entrada', en: 'Inbox' },
    '▶️': { es: 'Flecha derecha - Siguiente', en: 'Right arrow - Next' },
    '◀️': { es: 'Flecha izquierda - Anterior', en: 'Left arrow - Previous' },
    '❓': { es: 'Signo de interrogación - Ayuda', en: 'Question mark - Help' },
    '💾': { es: 'Disquete - Guardar', en: 'Floppy disk - Save' },
    '📋': { es: 'Portapapeles - Copiar', en: 'Clipboard - Copy' },
    '🔍': { es: 'Lupa - Revisar', en: 'Magnifying glass - Review' },
    '📤': { es: 'Bandeja de salida - Enviar', en: 'Outbox - Send' },
  };

  const altText = altTexts[icon];
  if (!altText) return icon;

  return language === 'en' ? altText.en : altText.es;
}
