/**
 * Helpers para construcción de metadata accesible
 */

import type { AccessibleMetadata, AccessibleResponse } from '../types';

/**
 * Crea un AccessibleResponse envolviendo data con metadata accesible
 *
 * @param data - Response core (VerifyResponse, SettleResponse, etc)
 * @param metadata - Metadata accesible universal
 * @returns AccessibleResponse con data y accessibility
 */
export function createAccessibleResponse<T>(
  data: T,
  metadata: AccessibleMetadata
): AccessibleResponse<T> {
  return {
    data,
    accessibility: metadata,
  };
}

/**
 * Construye AccessibleMetadata desde componentes individuales
 *
 * @param plainLanguage - Mensaje conciso (≤100 chars)
 * @param explanation - Descripción detallada (≤300 chars)
 * @param stepByStep - Pasos en orden (≤5 items de 80 chars)
 * @param hints - Sugerencias accionables
 * @param cognitiveLevel - Nivel de complejidad cognitiva
 * @param audioFriendly - Compatible con TTS
 * @returns AccessibleMetadata completo
 */
export function buildMetadata(
  plainLanguage: string,
  explanation: string,
  stepByStep: string[],
  hints: {
    ifError?: string;
    commonMistakes?: string[];
    nextSteps?: string;
  },
  cognitiveLevel: 'simple' | 'medium' | 'advanced' = 'simple',
  audioFriendly = true
): AccessibleMetadata {
  // Validar longitudes para prevenir errores silenciosos
  if (plainLanguage.length > 100) {
    throw new Error(`plainLanguage excede 100 caracteres: ${plainLanguage.length} chars`);
  }

  if (explanation.length > 300) {
    throw new Error(`explanation excede 300 caracteres: ${explanation.length} chars`);
  }

  if (stepByStep.length > 5) {
    throw new Error(`stepByStep excede 5 items: ${stepByStep.length} items`);
  }

  for (const [index, step] of stepByStep.entries()) {
    if (step.length > 80) {
      throw new Error(`stepByStep[${index}] excede 80 caracteres: ${step.length} chars`);
    }
  }

  return {
    plainLanguage,
    explanation,
    stepByStep,
    hints,
    language: 'es',
    audioFriendly,
    cognitiveLevel,
  };
}
