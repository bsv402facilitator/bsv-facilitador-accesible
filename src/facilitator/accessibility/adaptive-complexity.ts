/**
 * Adaptive Complexity System
 * Sistema que aprende del comportamiento del usuario para ajustar automáticamente el nivel cognitivo
 */

import type { CognitiveLevelV3 } from '../types';

export interface BehaviorTracking {
  averageReadingTime?: string; // ISO 8601 duration
  glossaryTermsClicked?: string[];
  checkpointsAnswered?: number;
  checkpointsCorrect?: number;
  preferredComplexity?: CognitiveLevelV3;
  confidenceLevel?: number; // 0-1
  sessionHistory?: Array<{
    timestamp: string;
    level: CognitiveLevelV3;
    completedSuccessfully: boolean;
    scenario: string;
    timeSpent?: string; // ISO 8601 duration
  }>;
  totalInteractions?: number;
  errorCount?: number;
  successCount?: number;
  lastUpdated?: string; // ISO 8601 timestamp
}

export interface PersonalizationV3 {
  userPreferencesApplied: boolean;
  detectedPreferences?: Record<string, any>;
  adaptiveComplexity: boolean;
  behaviorTracking?: BehaviorTracking;
  recommendations?: {
    suggestedLevel: CognitiveLevelV3;
    reason: string;
    confidence: number; // 0-1
    basedOn?: string[]; // Factores considerados
  };
}

export interface ComplexitySuggestion {
  level: CognitiveLevelV3;
  confidence: number; // 0-1
  reason: string;
  factors: Array<{
    name: string;
    weight: number;
    value: any;
  }>;
}

/**
 * Algoritmo adaptativo que sugiere nivel de complejidad basado en comportamiento
 */
export function suggestComplexityLevel(
  tracking: BehaviorTracking,
  currentLevel: CognitiveLevelV3
): ComplexitySuggestion {
  let score = 0;
  const factors: Array<{ name: string; weight: number; value: any }> = [];

  // Factor 1: Precisión en checkpoints (peso alto: 40%)
  if (tracking.checkpointsAnswered && tracking.checkpointsCorrect !== undefined) {
    const accuracy = tracking.checkpointsCorrect / tracking.checkpointsAnswered;
    const checkpointScore = calculateCheckpointScore(accuracy);
    score += checkpointScore;

    factors.push({
      name: 'Precisión en checkpoints',
      weight: 0.4,
      value: `${(accuracy * 100).toFixed(0)}% (${tracking.checkpointsCorrect}/${tracking.checkpointsAnswered})`,
    });
  }

  // Factor 2: Uso del glosario (peso medio: 20%)
  const glossaryUse = tracking.glossaryTermsClicked?.length || 0;
  const glossaryScore = calculateGlossaryScore(glossaryUse);
  score += glossaryScore;

  factors.push({
    name: 'Consultas al glosario',
    weight: 0.2,
    value: glossaryUse,
  });

  // Factor 3: Historial de sesión (peso alto: 30%)
  const recentSuccesses = tracking.sessionHistory
    ?.slice(-5)
    .filter((s) => s.completedSuccessfully).length || 0;
  const sessionScore = calculateSessionScore(recentSuccesses, tracking.sessionHistory?.length || 0);
  score += sessionScore;

  factors.push({
    name: 'Sesiones exitosas recientes',
    weight: 0.3,
    value: `${recentSuccesses}/${Math.min(tracking.sessionHistory?.length || 0, 5)}`,
  });

  // Factor 4: Ratio de éxito general (peso bajo: 10%)
  if (tracking.totalInteractions && tracking.successCount !== undefined) {
    const successRatio = tracking.successCount / tracking.totalInteractions;
    const successScore = calculateSuccessScore(successRatio);
    score += successScore;

    factors.push({
      name: 'Ratio de éxito general',
      weight: 0.1,
      value: `${(successRatio * 100).toFixed(0)}%`,
    });
  }

  // Decidir nivel basado en score
  const levels: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  let newIndex = currentIndex;

  if (score >= 3) {
    // Score muy alto: subir nivel
    newIndex = Math.min(currentIndex + 1, 4);
  } else if (score >= 1.5) {
    // Score moderadamente alto: considerar subir
    newIndex = currentIndex; // Mantener por ahora
  } else if (score <= -3) {
    // Score muy bajo: bajar nivel
    newIndex = Math.max(currentIndex - 1, 0);
  } else if (score <= -1.5) {
    // Score moderadamente bajo: considerar bajar
    newIndex = currentIndex; // Mantener por ahora
  }

  const suggestedLevel = levels[newIndex]!;
  const confidence = calculateConfidence(score, tracking);
  const reason = generateReason(score, suggestedLevel, currentLevel, factors);

  return {
    level: suggestedLevel,
    confidence,
    reason,
    factors,
  };
}

/**
 * Calcula score basado en precisión de checkpoints
 */
function calculateCheckpointScore(accuracy: number): number {
  if (accuracy >= 0.9) return 2; // Excelente: puede subir
  if (accuracy >= 0.7) return 1; // Bueno: mantener
  if (accuracy >= 0.5) return 0; // Aceptable: mantener
  if (accuracy >= 0.3) return -1; // Malo: considerar bajar
  return -2; // Muy malo: bajar
}

/**
 * Calcula score basado en uso del glosario
 */
function calculateGlossaryScore(glossaryUse: number): number {
  if (glossaryUse === 0) return 1; // No necesita ayuda: puede subir
  if (glossaryUse <= 2) return 0.5; // Poco uso: mantener
  if (glossaryUse <= 5) return 0; // Uso moderado: normal
  if (glossaryUse <= 10) return -0.5; // Uso alto: necesita más explicaciones
  return -1; // Uso muy alto: bajar nivel
}

/**
 * Calcula score basado en historial de sesiones
 */
function calculateSessionScore(recentSuccesses: number, totalSessions: number): number {
  if (totalSessions === 0) return 0;

  const successRate = recentSuccesses / Math.min(totalSessions, 5);

  if (successRate >= 0.8) return 1.5; // 4-5 de 5: muy bien
  if (successRate >= 0.6) return 0.5; // 3 de 5: bien
  if (successRate >= 0.4) return 0; // 2 de 5: aceptable
  return -1.5; // 0-1 de 5: mal
}

/**
 * Calcula score basado en ratio de éxito general
 */
function calculateSuccessScore(successRatio: number): number {
  if (successRatio >= 0.9) return 0.5;
  if (successRatio >= 0.7) return 0.2;
  if (successRatio >= 0.5) return 0;
  return -0.5;
}

/**
 * Calcula confianza de la recomendación
 */
function calculateConfidence(score: number, tracking: BehaviorTracking): number {
  let confidence = Math.min(Math.abs(score) / 5, 1); // Base: normalizar score

  // Aumentar confianza si hay más datos
  const interactions = tracking.totalInteractions || 0;
  const dataFactor = Math.min(interactions / 20, 1); // Máxima confianza con 20+ interacciones

  confidence = confidence * 0.7 + dataFactor * 0.3;

  return Math.min(confidence, 1);
}

/**
 * Genera explicación de la recomendación
 */
function generateReason(
  score: number,
  suggestedLevel: CognitiveLevelV3,
  currentLevel: CognitiveLevelV3,
  factors: Array<{ name: string; weight: number; value: any }>
): string {
  if (suggestedLevel === currentLevel) {
    return `El nivel "${currentLevel}" es apropiado según tu rendimiento actual`;
  }

  const levels: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  const suggestedIndex = levels.indexOf(suggestedLevel);

  if (suggestedIndex > currentIndex) {
    // Subir nivel
    const topFactors = factors
      .filter((f) => typeof f.value === 'string' && f.value.includes('%'))
      .slice(0, 2)
      .map((f) => f.name)
      .join(' y ');

    return `Excelente rendimiento en ${topFactors}. Estás listo para contenido más avanzado`;
  } else {
    // Bajar nivel
    const weakFactors = factors
      .filter((f) => {
        const match = typeof f.value === 'string' && f.value.match(/(\d+)%/);
        return match && parseInt(match[1]!) < 50;
      })
      .slice(0, 2)
      .map((f) => f.name)
      .join(' y ');

    return `Parece que ${weakFactors} necesitan más apoyo. Un nivel más simple te ayudará a entender mejor`;
  }
}

/**
 * Inicializa tracking para un nuevo usuario
 */
export function initializeBehaviorTracking(): BehaviorTracking {
  return {
    glossaryTermsClicked: [],
    checkpointsAnswered: 0,
    checkpointsCorrect: 0,
    sessionHistory: [],
    totalInteractions: 0,
    errorCount: 0,
    successCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Actualiza tracking con nueva interacción
 */
export function updateBehaviorTracking(
  current: BehaviorTracking,
  update: {
    glossaryTerm?: string;
    checkpointAnswered?: boolean;
    checkpointCorrect?: boolean;
    sessionCompleted?: {
      level: CognitiveLevelV3;
      success: boolean;
      scenario: string;
      timeSpent?: string;
    };
    success?: boolean;
    error?: boolean;
  }
): BehaviorTracking {
  const updated: BehaviorTracking = { ...current };

  if (update.glossaryTerm) {
    updated.glossaryTermsClicked = [
      ...(updated.glossaryTermsClicked || []),
      update.glossaryTerm,
    ];
  }

  if (update.checkpointAnswered) {
    updated.checkpointsAnswered = (updated.checkpointsAnswered || 0) + 1;
    if (update.checkpointCorrect) {
      updated.checkpointsCorrect = (updated.checkpointsCorrect || 0) + 1;
    }
  }

  if (update.sessionCompleted) {
    updated.sessionHistory = [
      ...(updated.sessionHistory || []),
      {
        timestamp: new Date().toISOString(),
        level: update.sessionCompleted.level,
        completedSuccessfully: update.sessionCompleted.success,
        scenario: update.sessionCompleted.scenario,
        timeSpent: update.sessionCompleted.timeSpent,
      },
    ];

    // Mantener solo últimas 10 sesiones
    if (updated.sessionHistory.length > 10) {
      updated.sessionHistory = updated.sessionHistory.slice(-10);
    }
  }

  if (update.success !== undefined) {
    updated.totalInteractions = (updated.totalInteractions || 0) + 1;
    if (update.success) {
      updated.successCount = (updated.successCount || 0) + 1;
    }
  }

  if (update.error) {
    updated.errorCount = (updated.errorCount || 0) + 1;
    updated.totalInteractions = (updated.totalInteractions || 0) + 1;
  }

  updated.lastUpdated = new Date().toISOString();

  return updated;
}

/**
 * Determina si hay suficiente data para hacer recomendaciones
 */
export function hasEnoughDataForRecommendations(tracking: BehaviorTracking): boolean {
  return (
    (tracking.totalInteractions || 0) >= 3 ||
    (tracking.checkpointsAnswered || 0) >= 2 ||
    (tracking.sessionHistory?.length || 0) >= 2
  );
}

/**
 * Genera KV key para persistir tracking de usuario
 */
export function generateTrackingKey(userId: string): string {
  return `tracking:${userId}`;
}

/**
 * TTL para tracking: 30 días
 */
export const TRACKING_TTL = 86400 * 30;
