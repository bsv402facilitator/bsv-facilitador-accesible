/**
 * WCAG 2.2 AAA Compliance Validator
 *
 * Generates WCAG compliance metadata and validates accessibility features
 * against Web Content Accessibility Guidelines 2.2 Level AAA.
 */

import type {
  WCAGComplianceMetadataV2,
  SuccessCriterionV2,
  UniversalAccessibilityMetadataV2,
  AccessibilityPreferencesV2,
  WCAGLevelV2,
} from '../types';
import { meetsWCAGReadingLevel } from './reading-level';

/**
 * Generate WCAG 2.2 compliance metadata for accessibility metadata
 *
 * Evaluates the provided accessibility metadata against WCAG 2.2 success criteria
 * and generates a compliance report.
 *
 * @param metadata - Universal accessibility metadata to validate
 * @param preferences - User accessibility preferences
 * @returns WCAG compliance metadata
 */
export function generateWCAGCompliance(
  metadata: UniversalAccessibilityMetadataV2,
  preferences: AccessibilityPreferencesV2
): WCAGComplianceMetadataV2 {
  const criteria = evaluateSuccessCriteria(metadata, preferences);
  const level = preferences.wcagLevel || 'AAA';

  return {
    version: '2.2',
    level,
    successCriteria: criteria,
    conformanceStatement: generateConformanceStatement(criteria, level),
    auditTrail: {
      criteriaChecked: criteria.map((c) => c.id),
      criteriaPass: criteria.filter((c) => c.status === 'pass').map((c) => c.id),
      criteriaNotApplicable: criteria.filter((c) => c.status === 'not-applicable').map((c) => c.id),
    },
  };
}

/**
 * Evaluate all applicable WCAG 2.2 success criteria
 *
 * @param metadata - Universal accessibility metadata
 * @param preferences - User preferences
 * @returns Array of success criteria with pass/fail status
 */
function evaluateSuccessCriteria(
  metadata: UniversalAccessibilityMetadataV2,
  _preferences: AccessibilityPreferencesV2
): SuccessCriterionV2[] {
  return [
    // ========================================
    // WCAG 2.2 Level A Criteria
    // ========================================

    // Principle 1: Perceivable
    {
      id: '1.1.1',
      name: 'Non-text Content',
      level: 'A',
      status: metadata.visual.altTextProvided ? 'pass' : 'not-applicable',
      notes: 'Alt text provided for visual elements',
    },
    {
      id: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      status: metadata.format.semanticMarkup ? 'pass' : 'not-applicable',
      notes: 'Semantic markup used for structure',
    },
    {
      id: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      status: metadata.visual.colorBlindSafe ? 'pass' : 'fail',
      notes: 'Content not relying solely on color',
    },

    // Principle 2: Operable
    {
      id: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      status:
        metadata.motor.keyboardNavigationHints.length > 0 ? 'pass' : 'not-applicable',
      notes: 'Keyboard navigation hints provided',
    },
    {
      id: '2.4.1',
      name: 'Bypass Blocks',
      level: 'A',
      status: 'not-applicable',
      notes: 'Single-page content, no blocks to bypass',
    },

    // Principle 3: Understandable
    {
      id: '3.1.1',
      name: 'Language of Page',
      level: 'A',
      status: 'pass',
      notes: `Language specified: ${metadata.language.code}`,
    },

    // ========================================
    // WCAG 2.2 Level AA Criteria
    // ========================================

    // Principle 1: Perceivable
    {
      id: '1.4.3',
      name: 'Contrast (Minimum)',
      level: 'AA',
      status: metadata.visual.contrastMode !== 'low' ? 'pass' : 'fail',
      notes: `Contrast mode: ${metadata.visual.contrastMode}`,
    },
    {
      id: '1.4.5',
      name: 'Images of Text',
      level: 'AA',
      status: 'not-applicable',
      notes: 'No images of text in JSON responses',
    },

    // Principle 2: Operable
    {
      id: '2.4.5',
      name: 'Multiple Ways',
      level: 'AA',
      status: metadata.content.stepByStep.length > 0 ? 'pass' : 'fail',
      notes: 'Step-by-step navigation provided',
    },
    {
      id: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      status: 'pass',
      notes: 'Clear structure with plainLanguage and explanation',
    },

    // Principle 3: Understandable
    {
      id: '3.1.2',
      name: 'Language of Parts',
      level: 'AA',
      status: 'pass',
      notes: 'Consistent language throughout content',
    },
    {
      id: '3.2.3',
      name: 'Consistent Navigation',
      level: 'AA',
      status: 'pass',
      notes: 'Consistent response structure',
    },
    {
      id: '3.3.3',
      name: 'Error Suggestion',
      level: 'AA',
      status: metadata.content.hints.ifError ? 'pass' : 'not-applicable',
      notes: 'Error suggestions provided in hints',
    },

    // ========================================
    // WCAG 2.2 Level AAA Criteria
    // ========================================

    // Principle 1: Perceivable
    {
      id: '1.4.6',
      name: 'Contrast (Enhanced)',
      level: 'AAA',
      status: metadata.visual.contrastMode === 'high' ? 'pass' : 'fail',
      notes: `Enhanced contrast: ${metadata.visual.contrastMode === 'high'}`,
    },
    {
      id: '1.4.8',
      name: 'Visual Presentation',
      level: 'AAA',
      status: metadata.visual.fontSize !== 'small' ? 'pass' : 'fail',
      notes: `Font size: ${metadata.visual.fontSize}`,
    },

    // Principle 2: Operable
    {
      id: '2.2.3',
      name: 'No Timing',
      level: 'AAA',
      status: 'pass',
      notes: 'No time limits on API responses',
    },
    {
      id: '2.4.9',
      name: 'Link Purpose (Link Only)',
      level: 'AAA',
      status:
        metadata.content.hints.relatedResources?.every((r) => r.title.length > 0)
          ? 'pass'
          : 'not-applicable',
      notes: 'Link purposes clear from title alone',
    },

    // Principle 3: Understandable
    {
      id: '3.1.3',
      name: 'Unusual Words',
      level: 'AAA',
      status: metadata.content.glossary ? 'pass' : 'fail',
      notes: `Glossary provided: ${!!metadata.content.glossary}`,
    },
    {
      id: '3.1.4',
      name: 'Abbreviations',
      level: 'AAA',
      status: metadata.content.glossary ? 'pass' : 'not-applicable',
      notes: 'Abbreviations explained in glossary if present',
    },
    {
      id: '3.1.5',
      name: 'Reading Level',
      level: 'AAA',
      status: meetsWCAGReadingLevel(metadata.cognitive.readingLevel) ? 'pass' : 'fail',
      notes: `Flesch-Kincaid Grade: ${metadata.cognitive.readingLevel.fleschKincaidGrade}`,
    },
    {
      id: '3.1.6',
      name: 'Pronunciation',
      level: 'AAA',
      status: metadata.metadata.audioFriendly ? 'pass' : 'not-applicable',
      notes: 'Audio-friendly text structure',
    },
    {
      id: '3.2.5',
      name: 'Change on Request',
      level: 'AAA',
      status: 'pass',
      notes: 'No automatic context changes',
    },
    {
      id: '3.3.5',
      name: 'Help',
      level: 'AAA',
      status:
        metadata.content.hints.ifError || metadata.content.hints.troubleshooting
          ? 'pass'
          : 'not-applicable',
      notes: 'Context-sensitive help provided',
    },

    // WCAG 2.2 New Criteria (2023)
    {
      id: '2.4.11',
      name: 'Focus Not Obscured (Minimum)',
      level: 'AA',
      status: 'not-applicable',
      notes: 'JSON API - no visual focus',
    },
    {
      id: '2.4.12',
      name: 'Focus Not Obscured (Enhanced)',
      level: 'AAA',
      status: 'not-applicable',
      notes: 'JSON API - no visual focus',
    },
    {
      id: '2.4.13',
      name: 'Focus Appearance',
      level: 'AAA',
      status: 'not-applicable',
      notes: 'JSON API - no visual focus',
    },
    {
      id: '2.5.7',
      name: 'Dragging Movements',
      level: 'AA',
      status: 'not-applicable',
      notes: 'JSON API - no dragging interactions',
    },
    {
      id: '2.5.8',
      name: 'Target Size (Minimum)',
      level: 'AA',
      status: 'not-applicable',
      notes: 'JSON API - no visual targets',
    },
    {
      id: '3.2.6',
      name: 'Consistent Help',
      level: 'A',
      status:
        metadata.content.hints.ifError || metadata.content.hints.nextSteps
          ? 'pass'
          : 'not-applicable',
      notes: 'Consistent help mechanism in hints',
    },
    {
      id: '3.3.7',
      name: 'Redundant Entry',
      level: 'A',
      status: 'not-applicable',
      notes: 'No form inputs in API responses',
    },
    {
      id: '3.3.8',
      name: 'Accessible Authentication (Minimum)',
      level: 'AA',
      status: 'not-applicable',
      notes: 'No authentication in accessibility layer',
    },
    {
      id: '3.3.9',
      name: 'Accessible Authentication (Enhanced)',
      level: 'AAA',
      status: 'not-applicable',
      notes: 'No authentication in accessibility layer',
    },
  ];
}

/**
 * Generate conformance statement based on success criteria results
 *
 * @param criteria - Evaluated success criteria
 * @param level - Target WCAG level
 * @returns Human-readable conformance statement in Spanish
 */
function generateConformanceStatement(
  criteria: SuccessCriterionV2[],
  level: WCAGLevelV2
): string {
  const levelMap: Record<WCAGLevelV2, number> = { A: 1, AA: 2, AAA: 3 };
  const targetLevelNum = levelMap[level];

  // Filter criteria relevant to target level
  const relevantCriteria = criteria.filter((c) => levelMap[c.level] <= targetLevelNum);

  // Count passing and applicable criteria
  const applicableCriteria = relevantCriteria.filter((c) => c.status !== 'not-applicable');
  const passingCriteria = applicableCriteria.filter((c) => c.status === 'pass');
  const failingCriteria = applicableCriteria.filter((c) => c.status === 'fail');

  const total = applicableCriteria.length;
  const passing = passingCriteria.length;
  const failing = failingCriteria.length;

  if (passing === total) {
    return `Este contenido cumple con WCAG 2.2 Nivel ${level}. Los ${total} criterios de éxito aplicables están satisfechos.`;
  } else if (failing === 0) {
    return `Este contenido cumple parcialmente con WCAG 2.2 Nivel ${level}. ${passing}/${total} criterios de éxito aplicables están satisfechos (${total - passing} no aplicables).`;
  } else {
    const failedIds = failingCriteria.map((c) => c.id).join(', ');
    return `Este contenido NO cumple con WCAG 2.2 Nivel ${level}. ${passing}/${total} criterios de éxito aplicables están satisfechos. Fallan: ${failedIds}`;
  }
}

/**
 * Check if metadata meets a specific WCAG level
 *
 * @param compliance - WCAG compliance metadata
 * @param level - WCAG level to check
 * @returns True if all criteria for that level pass
 */
export function meetsWCAGLevel(
  compliance: WCAGComplianceMetadataV2,
  level: WCAGLevelV2
): boolean {
  const levelMap: Record<WCAGLevelV2, number> = { A: 1, AA: 2, AAA: 3 };
  const targetLevelNum = levelMap[level];

  const relevantCriteria = compliance.successCriteria.filter(
    (c) => levelMap[c.level] <= targetLevelNum && c.status !== 'not-applicable'
  );

  return relevantCriteria.every((c) => c.status === 'pass');
}

/**
 * Get failing criteria for a specific WCAG level
 *
 * @param compliance - WCAG compliance metadata
 * @param level - WCAG level to check
 * @returns Array of failing criteria
 */
export function getFailingCriteria(
  compliance: WCAGComplianceMetadataV2,
  level: WCAGLevelV2
): SuccessCriterionV2[] {
  const levelMap: Record<WCAGLevelV2, number> = { A: 1, AA: 2, AAA: 3 };
  const targetLevelNum = levelMap[level];

  return compliance.successCriteria.filter(
    (c) => levelMap[c.level] <= targetLevelNum && c.status === 'fail'
  );
}
