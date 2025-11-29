/**
 * Tests for WCAG 2.2 AAA Compliance Validator
 */

import { describe, it, expect } from 'vitest';
import {
  generateWCAGCompliance,
  meetsWCAGLevel,
  getFailingCriteria,
} from '../../../src/facilitator/accessibility/wcag-validator';
import type {
  UniversalAccessibilityMetadataV2,
  AccessibilityPreferencesV2,
} from '../../../src/facilitator/types';

// Helper to create minimal preferences
function createPreferences(overrides: Partial<AccessibilityPreferencesV2> = {}): AccessibilityPreferencesV2 {
  return {
    language: 'es',
    cognitiveLevel: 'simple',
    abstractionLevel: 'concrete',
    includeExamples: true,
    includeGlossary: true,
    includeCheckpoints: false,
    contrastMode: 'normal',
    colorBlindType: 'none',
    fontSize: 'medium',
    darkMode: false,
    screenReaderOptimized: true,
    includeKeyboardHints: true,
    includeVoiceHints: false,
    outputFormat: 'json',
    brailleOptimized: false,
    includeSemanticMarkup: false,
    audioFriendly: true,
    adaptiveComplexity: false,
    wcagLevel: 'AAA',
    ...overrides,
  };
}

// Helper to create minimal metadata
function createMetadata(
  overrides: Partial<UniversalAccessibilityMetadataV2> = {}
): UniversalAccessibilityMetadataV2 {
  return {
    content: {
      plainLanguage: 'Pago exitoso',
      explanation: 'La transacción fue verificada correctamente',
      stepByStep: [{ text: 'Paso 1' }, { text: 'Paso 2' }],
      hints: {},
    },
    visual: {
      contrastMode: 'normal',
      colorBlindSafe: true,
      colorBlindType: 'none',
      fontSize: 'medium',
      screenReaderOptimized: true,
      darkMode: false,
      altTextProvided: false,
    },
    cognitive: {
      level: 'simple',
      readingLevel: {
        fleschKincaidGrade: 6,
        fleschReadingEase: 80,
        estimatedReadingTime: '30 segundos',
      },
      memoryAids: [],
      checkpoints: [],
      abstractionLevel: 'concrete',
      iconSupport: false,
    },
    language: {
      code: 'es',
      direction: 'ltr',
      locale: 'es-ES',
    },
    motor: {
      keyboardNavigationHints: [],
      voiceCommandHints: [],
      timingAdjustable: false,
    },
    format: {
      availableFormats: ['json'],
      currentFormat: 'json',
      brailleOptimized: false,
      semanticMarkup: false,
    },
    personalization: {
      userPreferencesApplied: false,
      adaptiveComplexity: false,
    },
    metadata: {
      audioFriendly: true,
      version: 2,
      generatedBy: 'template',
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    },
    ...overrides,
  };
}

describe('WCAG Validator', () => {
  describe('generateWCAGCompliance', () => {
    it('should generate compliance metadata for Level A', () => {
      const metadata = createMetadata();
      const preferences = createPreferences({ wcagLevel: 'A' });
      const compliance = generateWCAGCompliance(metadata, preferences);

      expect(compliance.version).toBe('2.2');
      expect(compliance.level).toBe('A');
      expect(compliance.successCriteria).toBeDefined();
      expect(compliance.successCriteria.length).toBeGreaterThan(0);
      expect(compliance.conformanceStatement).toBeDefined();
      expect(compliance.auditTrail).toBeDefined();
    });

    it('should generate compliance metadata for Level AA', () => {
      const metadata = createMetadata();
      const preferences = createPreferences({ wcagLevel: 'AA' });
      const compliance = generateWCAGCompliance(metadata, preferences);

      expect(compliance.level).toBe('AA');
      expect(compliance.successCriteria.length).toBeGreaterThan(0);
    });

    it('should generate compliance metadata for Level AAA', () => {
      const metadata = createMetadata();
      const preferences = createPreferences({ wcagLevel: 'AAA' });
      const compliance = generateWCAGCompliance(metadata, preferences);

      expect(compliance.level).toBe('AAA');
      expect(compliance.successCriteria.length).toBeGreaterThan(0);
    });

    it('should include audit trail with correct criteria', () => {
      const metadata = createMetadata();
      const preferences = createPreferences();
      const compliance = generateWCAGCompliance(metadata, preferences);

      expect(compliance.auditTrail.criteriaChecked.length).toBeGreaterThan(0);
      expect(compliance.auditTrail.criteriaPass.length).toBeGreaterThanOrEqual(0);
      expect(compliance.auditTrail.criteriaNotApplicable.length).toBeGreaterThanOrEqual(0);
    });

    it('should evaluate color blind safety (1.4.1 - Use of Color)', () => {
      const safeMetadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: true,
        },
      });
      const unsafeMetadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: false,
        },
      });

      const safeCompliance = generateWCAGCompliance(safeMetadata, createPreferences());
      const unsafeCompliance = generateWCAGCompliance(unsafeMetadata, createPreferences());

      const safeCriterion = safeCompliance.successCriteria.find((c) => c.id === '1.4.1');
      const unsafeCriterion = unsafeCompliance.successCriteria.find((c) => c.id === '1.4.1');

      expect(safeCriterion?.status).toBe('pass');
      expect(unsafeCriterion?.status).toBe('fail');
    });

    it('should evaluate enhanced contrast (1.4.6 - AAA)', () => {
      const highContrastMetadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          contrastMode: 'high',
        },
      });
      const normalContrastMetadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          contrastMode: 'normal',
        },
      });

      const highCompliance = generateWCAGCompliance(
        highContrastMetadata,
        createPreferences({ wcagLevel: 'AAA' })
      );
      const normalCompliance = generateWCAGCompliance(
        normalContrastMetadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      const highCriterion = highCompliance.successCriteria.find((c) => c.id === '1.4.6');
      const normalCriterion = normalCompliance.successCriteria.find((c) => c.id === '1.4.6');

      expect(highCriterion?.status).toBe('pass');
      expect(normalCriterion?.status).toBe('fail');
    });

    it('should evaluate reading level (3.1.5 - AAA)', () => {
      const easyReadingMetadata = createMetadata({
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 8,
            fleschReadingEase: 70,
            estimatedReadingTime: '30 segundos',
          },
        },
      });
      const hardReadingMetadata = createMetadata({
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 14,
            fleschReadingEase: 40,
            estimatedReadingTime: '1 minuto',
          },
        },
      });

      const easyCompliance = generateWCAGCompliance(easyReadingMetadata, createPreferences());
      const hardCompliance = generateWCAGCompliance(hardReadingMetadata, createPreferences());

      const easyCriterion = easyCompliance.successCriteria.find((c) => c.id === '3.1.5');
      const hardCriterion = hardCompliance.successCriteria.find((c) => c.id === '3.1.5');

      expect(easyCriterion?.status).toBe('pass');
      expect(hardCriterion?.status).toBe('fail');
    });

    it('should evaluate glossary presence (3.1.3 - AAA)', () => {
      const withGlossaryMetadata = createMetadata({
        content: {
          ...createMetadata().content,
          glossary: { BSV: 'Bitcoin SV' },
        },
      });
      const withoutGlossaryMetadata = createMetadata({
        content: {
          ...createMetadata().content,
          glossary: undefined,
        },
      });

      const withCompliance = generateWCAGCompliance(withGlossaryMetadata, createPreferences());
      const withoutCompliance = generateWCAGCompliance(
        withoutGlossaryMetadata,
        createPreferences()
      );

      const withCriterion = withCompliance.successCriteria.find((c) => c.id === '3.1.3');
      const withoutCriterion = withoutCompliance.successCriteria.find((c) => c.id === '3.1.3');

      expect(withCriterion?.status).toBe('pass');
      expect(withoutCriterion?.status).toBe('fail');
    });

    it('should mark WCAG 2.2 new criteria as not-applicable for JSON API', () => {
      const metadata = createMetadata();
      const preferences = createPreferences();
      const compliance = generateWCAGCompliance(metadata, preferences);

      // Focus criteria not applicable to JSON API
      const focusCriteria = ['2.4.11', '2.4.12', '2.4.13'];
      for (const id of focusCriteria) {
        const criterion = compliance.successCriteria.find((c) => c.id === id);
        expect(criterion?.status).toBe('not-applicable');
      }

      // Dragging not applicable
      const draggingCriterion = compliance.successCriteria.find((c) => c.id === '2.5.7');
      expect(draggingCriterion?.status).toBe('not-applicable');
    });
  });

  describe('meetsWCAGLevel', () => {
    it('should return true if all Level A criteria pass', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: true,
          contrastMode: 'normal',
        },
      });
      const compliance = generateWCAGCompliance(metadata, createPreferences({ wcagLevel: 'A' }));

      expect(meetsWCAGLevel(compliance, 'A')).toBe(true);
    });

    it('should return false if any Level A criteria fail', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: false, // Fails 1.4.1
        },
      });
      const compliance = generateWCAGCompliance(metadata, createPreferences({ wcagLevel: 'A' }));

      expect(meetsWCAGLevel(compliance, 'A')).toBe(false);
    });

    it('should return true if all Level AAA criteria pass', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: true,
          contrastMode: 'high',
          fontSize: 'medium',
        },
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 7,
            fleschReadingEase: 75,
            estimatedReadingTime: '30 segundos',
          },
        },
        content: {
          ...createMetadata().content,
          glossary: { BSV: 'Bitcoin SV' },
          hints: {
            ifError: 'Verifica los datos',
          },
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      expect(meetsWCAGLevel(compliance, 'AAA')).toBe(true);
    });

    it('should ignore not-applicable criteria', () => {
      const metadata = createMetadata();
      const compliance = generateWCAGCompliance(metadata, createPreferences());

      // Should still pass even though some criteria are not-applicable
      const meetsA = meetsWCAGLevel(compliance, 'A');
      expect(meetsA).toBe(true);
    });
  });

  describe('getFailingCriteria', () => {
    it('should return empty array if all criteria pass', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: true,
          contrastMode: 'high',
        },
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 8,
            fleschReadingEase: 70,
            estimatedReadingTime: '30 segundos',
          },
        },
        content: {
          ...createMetadata().content,
          glossary: { BSV: 'Bitcoin SV' },
          hints: {
            ifError: 'Verifica los datos',
          },
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      const failing = getFailingCriteria(compliance, 'AAA');
      expect(failing).toEqual([]);
    });

    it('should return failing criteria for Level AAA', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          contrastMode: 'normal', // Fails 1.4.6
        },
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 14, // Fails 3.1.5
            fleschReadingEase: 40,
            estimatedReadingTime: '1 minuto',
          },
        },
        content: {
          ...createMetadata().content,
          glossary: undefined, // Fails 3.1.3
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      const failing = getFailingCriteria(compliance, 'AAA');
      expect(failing.length).toBeGreaterThan(0);
      expect(failing.some((c) => c.id === '1.4.6')).toBe(true); // Enhanced contrast
      expect(failing.some((c) => c.id === '3.1.5')).toBe(true); // Reading level
      expect(failing.some((c) => c.id === '3.1.3')).toBe(true); // Unusual words
    });

    it('should only return failures for target level and below', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          contrastMode: 'high', // AAA pass
        },
        content: {
          ...createMetadata().content,
          glossary: undefined, // AAA level criterion - will fail
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      const failingAAA = getFailingCriteria(compliance, 'AAA');
      const failingAA = getFailingCriteria(compliance, 'AA');

      expect(failingAAA.length).toBeGreaterThan(0); // Should have AAA failures
      expect(failingAA.length).toBe(0); // AA should still pass
    });
  });

  describe('Conformance Statements', () => {
    it('should generate correct statement for full compliance', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          colorBlindSafe: true,
          contrastMode: 'high',
        },
        cognitive: {
          ...createMetadata().cognitive,
          readingLevel: {
            fleschKincaidGrade: 7,
            fleschReadingEase: 75,
            estimatedReadingTime: '30 segundos',
          },
        },
        content: {
          ...createMetadata().content,
          glossary: { BSV: 'Bitcoin SV' },
          hints: {
            ifError: 'Verifica los datos',
          },
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      expect(compliance.conformanceStatement).toContain('cumple con WCAG 2.2 Nivel AAA');
      expect(compliance.conformanceStatement).toContain('satisfechos');
    });

    it('should generate correct statement for partial compliance', () => {
      const metadata = createMetadata({
        visual: {
          ...createMetadata().visual,
          contrastMode: 'normal', // Fails AAA
        },
      });
      const compliance = generateWCAGCompliance(
        metadata,
        createPreferences({ wcagLevel: 'AAA' })
      );

      expect(compliance.conformanceStatement).toContain('NO cumple con WCAG 2.2 Nivel AAA');
      expect(compliance.conformanceStatement).toContain('Fallan:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle metadata with all optional fields', () => {
      const richMetadata = createMetadata({
        content: {
          plainLanguage: 'Test',
          explanation: 'Test explanation',
          detailedExplanation: 'Detailed test',
          stepByStep: [
            { text: 'Step 1', icon: '✓', context: 'Context', estimatedTime: '5s' },
          ],
          hints: {
            ifError: 'Error hint',
            commonMistakes: ['Mistake 1'],
            nextSteps: 'Next steps',
            troubleshooting: 'Troubleshooting',
            safeguards: ['Safeguard 1'],
          },
          glossary: { term: 'definition' },
          examples: [
            {
              scenario: 'Test scenario',
              input: 'input',
              output: 'output',
              explanation: 'explanation',
            },
          ],
        },
      });

      const compliance = generateWCAGCompliance(richMetadata, createPreferences());
      expect(compliance).toBeDefined();
      expect(compliance.successCriteria.length).toBeGreaterThan(0);
    });

    it('should handle metadata with minimal fields', () => {
      const minimalMetadata = createMetadata({
        content: {
          plainLanguage: 'Test',
          explanation: 'Test',
          stepByStep: [{ text: 'Step' }],
          hints: {},
        },
      });

      const compliance = generateWCAGCompliance(minimalMetadata, createPreferences());
      expect(compliance).toBeDefined();
      expect(compliance.successCriteria.length).toBeGreaterThan(0);
    });
  });
});
