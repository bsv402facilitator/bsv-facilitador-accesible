/**
 * Reading Level Analysis - Flesch-Kincaid algorithms
 *
 * Calculates reading difficulty metrics for accessibility metadata to ensure
 * content meets WCAG 2.2 AAA requirements for reading level.
 */

import type { ReadingLevelV2 } from '../types';

/**
 * Calculate reading level metrics for a given text
 *
 * Uses Flesch Reading Ease and Flesch-Kincaid Grade Level algorithms
 * to determine text complexity and estimated reading time.
 *
 * @param text - The text to analyze
 * @returns Reading level metrics
 */
export function calculateReadingLevel(text: string): ReadingLevelV2 {
  // Handle empty or very short text
  if (!text || text.trim().length === 0) {
    return {
      fleschKincaidGrade: 0,
      fleschReadingEase: 100,
      estimatedReadingTime: '0 segundos',
    };
  }

  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);

  // Avoid division by zero
  if (sentences === 0 || words === 0) {
    return {
      fleschKincaidGrade: 0,
      fleschReadingEase: 100,
      estimatedReadingTime: '0 segundos',
    };
  }

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  // Score: 0-100 (higher = easier)
  // 90-100: Very easy (5th grade)
  // 60-70: Standard (8th-9th grade)
  // 0-30: Very difficult (college graduate)
  const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Flesch-Kincaid Grade Level: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  // Result: US grade level (0-18+)
  const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Estimated reading time (average 200 words/minute)
  const readingTimeMinutes = words / 200;
  const estimatedReadingTime = formatReadingTime(readingTimeMinutes);

  return {
    fleschKincaidGrade: Math.max(0, Math.round(fleschKincaidGrade)),
    fleschReadingEase: Math.max(0, Math.min(100, Math.round(fleschReadingEase))),
    estimatedReadingTime,
  };
}

/**
 * Count sentences in text
 *
 * Sentences are delimited by periods, exclamation marks, or question marks.
 */
function countSentences(text: string): number {
  // Split by sentence terminators, filter empty strings
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return Math.max(1, sentences.length); // At least 1 sentence
}

/**
 * Count words in text
 *
 * Words are separated by whitespace.
 */
function countWords(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return Math.max(1, words.length); // At least 1 word
}

/**
 * Count syllables in text
 *
 * Uses a simplified algorithm that works for both English and Spanish:
 * - Count vowel groups (consecutive vowels = 1 syllable)
 * - Handle Spanish accented vowels (á, é, í, ó, ú, ü, ñ)
 * - Each word has at least 1 syllable
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let totalSyllables = 0;

  for (const word of words) {
    // Remove non-alphabetic characters (preserve Spanish chars)
    const cleanWord = word.replace(/[^a-záéíóúñü]/gi, '');
    if (cleanWord.length === 0) continue;

    // Count vowel groups
    // Spanish vowels: a, e, i, o, u, á, é, í, ó, ú, ü
    const vowelGroups = cleanWord.match(/[aeiouáéíóúü]+/gi);
    const syllableCount = vowelGroups ? vowelGroups.length : 1;

    totalSyllables += syllableCount;
  }

  return Math.max(1, totalSyllables); // At least 1 syllable
}

/**
 * Format reading time in Spanish
 *
 * @param minutes - Reading time in minutes
 * @returns Formatted string in Spanish
 */
function formatReadingTime(minutes: number): string {
  if (minutes < 0.05) {
    // Less than 3 seconds
    return '0 segundos';
  } else if (minutes < 1) {
    // Less than 1 minute - show seconds
    const seconds = Math.ceil(minutes * 60);
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  } else if (minutes < 2) {
    // Between 1-2 minutes
    return '1 minuto';
  } else {
    // 2+ minutes
    const roundedMinutes = Math.ceil(minutes);
    return `${roundedMinutes} minutos`;
  }
}

/**
 * Get reading level description based on Flesch-Kincaid Grade
 *
 * @param grade - Flesch-Kincaid grade level (0-18+)
 * @returns Human-readable description in Spanish
 */
export function getReadingLevelDescription(grade: number): string {
  if (grade <= 5) {
    return 'Muy fácil (nivel primaria)';
  } else if (grade <= 8) {
    return 'Fácil (nivel secundaria básica)';
  } else if (grade <= 12) {
    return 'Moderado (nivel preparatoria)';
  } else if (grade <= 16) {
    return 'Difícil (nivel universitario)';
  } else {
    return 'Muy difícil (nivel posgrado)';
  }
}

/**
 * Determine if text meets WCAG 2.2 Level AAA reading level requirement
 *
 * WCAG 2.2 Success Criterion 3.1.5 (AAA):
 * "When text requires reading ability more advanced than the lower secondary
 * education level after removal of proper names and titles, supplemental
 * content, or a version that does not require reading ability more advanced
 * than the lower secondary education level, is available."
 *
 * Lower secondary education ≈ 9th grade (US) ≈ 14-15 years old
 *
 * @param readingLevel - Reading level metrics
 * @returns True if meets AAA requirement (grade ≤ 9)
 */
export function meetsWCAGReadingLevel(readingLevel: ReadingLevelV2): boolean {
  return readingLevel.fleschKincaidGrade <= 9;
}

/**
 * Get recommended cognitive level based on reading level
 *
 * Maps Flesch-Kincaid grades to our 5 cognitive levels.
 *
 * @param grade - Flesch-Kincaid grade level
 * @returns Recommended cognitive level
 */
export function getCognitiveLevelFromGrade(
  grade: number
): 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert' {
  if (grade <= 3) {
    return 'beginner';
  } else if (grade <= 8) {
    return 'simple';
  } else if (grade <= 12) {
    return 'medium';
  } else if (grade <= 16) {
    return 'advanced';
  } else {
    return 'expert';
  }
}
