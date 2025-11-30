/**
 * User Feedback System
 *
 * Allows users to provide feedback on accessibility metadata quality,
 * which can be used to improve future responses and track user satisfaction.
 */

import type { CognitiveLevelV3 } from '../types';
import { logger } from '../logger';

/**
 * Feedback rating scale
 */
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

/**
 * Feedback categories
 */
export type FeedbackCategory =
  | 'clarity' // How clear the explanation was
  | 'completeness' // How complete the information was
  | 'helpfulness' // How helpful the hints were
  | 'accuracy' // How accurate the information was
  | 'accessibility'; // How accessible the content was

/**
 * User feedback structure
 */
export interface UserFeedback {
  // Identification
  feedbackId: string;
  timestamp: string;
  messageType: string; // success.verifyValid, errors.settle.networkError, etc.
  cognitiveLevel: CognitiveLevelV3;
  language: string;

  // Ratings (1-5 scale)
  overallRating: FeedbackRating;
  categoryRatings?: Partial<Record<FeedbackCategory, FeedbackRating>>;

  // Qualitative feedback
  comment?: string;
  whatWasHelpful?: string;
  whatWasMissing?: string;
  suggestedImprovements?: string;

  // Context
  userAgent?: string;
  preferredFormats?: string[];
  assistiveTechnology?: string; // Screen reader, TTS engine, etc.

  // Interaction tracking
  glossaryTermsViewed?: string[];
  checkpointsAttempted?: number;
  checkpointsCorrect?: number;
  timeSpentReading?: number; // seconds
  formatsUsed?: string[];
}

/**
 * Aggregated feedback statistics
 */
export interface FeedbackStats {
  messageType: string;
  cognitiveLevel: CognitiveLevelV3;
  totalFeedbacks: number;
  averageOverallRating: number;
  averageCategoryRatings: Partial<Record<FeedbackCategory, number>>;
  commonIssues: string[];
  suggestedImprovements: string[];
  lastUpdated: string;
}

/**
 * Generate a unique feedback ID
 */
export function generateFeedbackId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `feedback-${timestamp}-${random}`;
}

/**
 * Validate feedback data
 */
export function validateFeedback(feedback: Partial<UserFeedback>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!feedback.messageType) errors.push('messageType is required');
  if (!feedback.cognitiveLevel) errors.push('cognitiveLevel is required');
  if (!feedback.language) errors.push('language is required');
  if (!feedback.overallRating) errors.push('overallRating is required');

  // Rating validation
  if (feedback.overallRating && (feedback.overallRating < 1 || feedback.overallRating > 5)) {
    errors.push('overallRating must be between 1 and 5');
  }

  if (feedback.categoryRatings) {
    for (const [category, rating] of Object.entries(feedback.categoryRatings)) {
      if (rating < 1 || rating > 5) {
        errors.push(`${category} rating must be between 1 and 5`);
      }
    }
  }

  // Cognitive level validation
  const validLevels: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
  if (feedback.cognitiveLevel && !validLevels.includes(feedback.cognitiveLevel)) {
    errors.push('Invalid cognitiveLevel');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Store feedback in KV storage
 *
 * @param feedback - User feedback to store
 * @param kv - KV namespace binding
 */
export async function storeFeedback(
  feedback: UserFeedback,
  kv: KVNamespace | undefined
): Promise<boolean> {
  if (!kv) {
    logger.warn('KV namespace not available, feedback not stored');
    return false;
  }

  try {
    const key = `feedback:${feedback.feedbackId}`;
    await kv.put(key, JSON.stringify(feedback), {
      expirationTtl: 86400 * 90, // 90 days
    });

    logger.info('Feedback stored', {
      feedbackId: feedback.feedbackId,
      messageType: feedback.messageType,
      rating: feedback.overallRating,
    });

    return true;
  } catch (error) {
    logger.error('Failed to store feedback', { error, feedbackId: feedback.feedbackId });
    return false;
  }
}

/**
 * Retrieve feedback by ID
 *
 * @param feedbackId - Feedback ID to retrieve
 * @param kv - KV namespace binding
 */
export async function getFeedback(
  feedbackId: string,
  kv: KVNamespace | undefined
): Promise<UserFeedback | null> {
  if (!kv) return null;

  try {
    const key = `feedback:${feedbackId}`;
    const data = await kv.get(key, 'json');
    return data as UserFeedback | null;
  } catch (error) {
    logger.error('Failed to retrieve feedback', { error, feedbackId });
    return null;
  }
}

/**
 * Get aggregated feedback statistics for a message type and cognitive level
 *
 * @param messageType - Message type (e.g., 'success.verifyValid')
 * @param cognitiveLevel - Cognitive level
 * @param kv - KV namespace binding
 */
export async function getFeedbackStats(
  messageType: string,
  cognitiveLevel: CognitiveLevelV3,
  kv: KVNamespace | undefined
): Promise<FeedbackStats | null> {
  if (!kv) return null;

  try {
    const key = `feedback-stats:${messageType}:${cognitiveLevel}`;
    const data = await kv.get(key, 'json');
    return data as FeedbackStats | null;
  } catch (error) {
    logger.error('Failed to retrieve feedback stats', { error, messageType, cognitiveLevel });
    return null;
  }
}

/**
 * Update aggregated feedback statistics
 *
 * This should be called periodically (e.g., via a cron job) to aggregate
 * individual feedbacks into statistics.
 *
 * @param messageType - Message type
 * @param cognitiveLevel - Cognitive level
 * @param kv - KV namespace binding
 */
export async function updateFeedbackStats(
  messageType: string,
  cognitiveLevel: CognitiveLevelV3,
  kv: KVNamespace | undefined
): Promise<boolean> {
  if (!kv) return false;

  try {
    // In a real implementation, you would:
    // 1. List all feedbacks for this messageType + cognitiveLevel
    // 2. Calculate aggregate statistics
    // 3. Store the stats
    //
    // For now, this is a placeholder that logs the intent
    logger.info('Update feedback stats called', { messageType, cognitiveLevel });

    // TODO: Implement actual aggregation logic when KV list operations are available
    return true;
  } catch (error) {
    logger.error('Failed to update feedback stats', { error, messageType, cognitiveLevel });
    return false;
  }
}

/**
 * Create a feedback prompt for users
 *
 * This generates user-friendly text asking for feedback,
 * tailored to the cognitive level.
 *
 * @param cognitiveLevel - User's cognitive level
 * @param language - Language code (es, en, etc.)
 */
export function createFeedbackPrompt(
  cognitiveLevel: CognitiveLevelV3,
  language: string = 'es'
): {
  prompt: string;
  questions: Array<{ id: string; text: string; type: 'rating' | 'text' }>;
} {
  const isSpanish = language === 'es';

  let prompt = '';
  const questions: Array<{ id: string; text: string; type: 'rating' | 'text' }> = [];

  if (cognitiveLevel === 'beginner' || cognitiveLevel === 'simple') {
    // Simple, clear feedback prompt
    prompt = isSpanish
      ? '¿Te fue útil esta información? Tu opinión nos ayuda a mejorar.'
      : 'Was this information helpful? Your feedback helps us improve.';

    questions.push({
      id: 'overallRating',
      text: isSpanish
        ? '¿Qué tan clara fue la explicación? (1 = confusa, 5 = muy clara)'
        : 'How clear was the explanation? (1 = confusing, 5 = very clear)',
      type: 'rating',
    });

    questions.push({
      id: 'whatWasHelpful',
      text: isSpanish ? '¿Qué te resultó más útil?' : 'What was most helpful?',
      type: 'text',
    });

    questions.push({
      id: 'whatWasMissing',
      text: isSpanish ? '¿Qué faltó o no quedó claro?' : 'What was missing or unclear?',
      type: 'text',
    });
  } else {
    // More detailed feedback for advanced users
    prompt = isSpanish
      ? 'Ayúdanos a mejorar la accesibilidad de esta respuesta.'
      : 'Help us improve the accessibility of this response.';

    questions.push({
      id: 'overallRating',
      text: isSpanish
        ? 'Calificación general (1-5)'
        : 'Overall rating (1-5)',
      type: 'rating',
    });

    questions.push({
      id: 'clarity',
      text: isSpanish ? 'Claridad de la explicación (1-5)' : 'Clarity of explanation (1-5)',
      type: 'rating',
    });

    questions.push({
      id: 'completeness',
      text: isSpanish
        ? 'Completitud de la información (1-5)'
        : 'Completeness of information (1-5)',
      type: 'rating',
    });

    questions.push({
      id: 'helpfulness',
      text: isSpanish
        ? 'Utilidad de las sugerencias (1-5)'
        : 'Helpfulness of hints (1-5)',
      type: 'rating',
    });

    questions.push({
      id: 'suggestedImprovements',
      text: isSpanish
        ? 'Sugerencias de mejora'
        : 'Suggested improvements',
      type: 'text',
    });
  }

  return { prompt, questions };
}

/**
 * Analyze feedback to identify patterns and issues
 *
 * @param feedbacks - Array of user feedbacks
 */
export function analyzeFeedbackPatterns(feedbacks: UserFeedback[]): {
  averageRating: number;
  commonIssues: string[];
  topSuggestions: string[];
  satisfactionRate: number; // Percentage of 4-5 star ratings
} {
  if (feedbacks.length === 0) {
    return {
      averageRating: 0,
      commonIssues: [],
      topSuggestions: [],
      satisfactionRate: 0,
    };
  }

  // Calculate average rating
  const totalRating = feedbacks.reduce((sum, f) => sum + f.overallRating, 0);
  const averageRating = totalRating / feedbacks.length;

  // Calculate satisfaction rate (4-5 stars)
  const satisfiedCount = feedbacks.filter((f) => f.overallRating >= 4).length;
  const satisfactionRate = (satisfiedCount / feedbacks.length) * 100;

  // Extract common issues
  const issues = feedbacks.map((f) => f.whatWasMissing).filter((issue): issue is string => !!issue);
  const commonIssues = [...new Set(issues)].slice(0, 5);

  // Extract top suggestions
  const suggestions = feedbacks
    .map((f) => f.suggestedImprovements)
    .filter((suggestion): suggestion is string => !!suggestion);
  const topSuggestions = [...new Set(suggestions)].slice(0, 5);

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    commonIssues,
    topSuggestions,
    satisfactionRate: Math.round(satisfactionRate),
  };
}
