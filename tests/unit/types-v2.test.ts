import { describe, it, expect } from 'vitest';
import { AccessibilityPreferencesSchemaV2 } from '../../src/facilitator/types';

describe('V2 Type System (Phase 1)', () => {
  describe('AccessibilityPreferencesSchemaV2', () => {
    it('should validate with defaults when empty object provided', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('es');
        expect(result.data.cognitiveLevel).toBe('simple');
        expect(result.data.wcagLevel).toBe('AAA');
        expect(result.data.outputFormat).toBe('json');
        expect(result.data.abstractionLevel).toBe('concrete');
        expect(result.data.contrastMode).toBe('normal');
        expect(result.data.fontSize).toBe('medium');
        expect(result.data.colorBlindType).toBe('none');
        expect(result.data.audioFriendly).toBe(true);
        expect(result.data.screenReaderOptimized).toBe(true);
        expect(result.data.darkMode).toBe(false);
        expect(result.data.includeExamples).toBe(true);
        expect(result.data.includeGlossary).toBe(true);
        expect(result.data.includeCheckpoints).toBe(false);
        expect(result.data.includeKeyboardHints).toBe(true);
        expect(result.data.includeVoiceHints).toBe(false);
        expect(result.data.brailleOptimized).toBe(false);
        expect(result.data.includeSemanticMarkup).toBe(false);
        expect(result.data.adaptiveComplexity).toBe(false);
      }
    });

    it('should validate all 5 languages', () => {
      const languages = ['es', 'en', 'pt', 'fr', 'de'] as const;

      languages.forEach((lang) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ language: lang });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.language).toBe(lang);
        }
      });
    });

    it('should validate all 5 cognitive levels', () => {
      const levels = ['beginner', 'simple', 'medium', 'advanced', 'expert'] as const;

      levels.forEach((level) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ cognitiveLevel: level });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.cognitiveLevel).toBe(level);
        }
      });
    });

    it('should validate all 6 output formats', () => {
      const formats = ['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld'] as const;

      formats.forEach((format) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ outputFormat: format });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.outputFormat).toBe(format);
        }
      });
    });

    it('should validate all WCAG levels', () => {
      const wcagLevels = ['A', 'AA', 'AAA'] as const;

      wcagLevels.forEach((level) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ wcagLevel: level });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.wcagLevel).toBe(level);
        }
      });
    });

    it('should validate complete preference object with all fields', () => {
      const prefs = {
        language: 'en' as const,
        dialect: 'en-US',
        cognitiveLevel: 'advanced' as const,
        abstractionLevel: 'abstract' as const,
        includeExamples: false,
        includeGlossary: true,
        includeCheckpoints: true,
        contrastMode: 'high' as const,
        colorBlindType: 'deuteranopia' as const,
        fontSize: 'large' as const,
        darkMode: true,
        screenReaderOptimized: false,
        includeKeyboardHints: true,
        includeVoiceHints: true,
        outputFormat: 'markdown' as const,
        brailleOptimized: true,
        includeSemanticMarkup: true,
        audioFriendly: false,
        userId: 'user123',
        adaptiveComplexity: true,
        wcagLevel: 'AA' as const,
      };

      const result = AccessibilityPreferencesSchemaV2.safeParse(prefs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(prefs);
      }
    });

    it('should reject invalid language', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({
        language: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid cognitive level', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({
        cognitiveLevel: 'super-expert',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid output format', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({
        outputFormat: 'pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid WCAG level', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({
        wcagLevel: 'AAAA',
      });
      expect(result.success).toBe(false);
    });

    it('should validate contrast modes', () => {
      const modes = ['high', 'normal', 'low'] as const;

      modes.forEach((mode) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ contrastMode: mode });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.contrastMode).toBe(mode);
        }
      });
    });

    it('should validate color blind types', () => {
      const types = ['deuteranopia', 'protanopia', 'tritanopia', 'none'] as const;

      types.forEach((type) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ colorBlindType: type });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.colorBlindType).toBe(type);
        }
      });
    });

    it('should validate font sizes', () => {
      const sizes = ['small', 'medium', 'large', 'x-large'] as const;

      sizes.forEach((size) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ fontSize: size });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.fontSize).toBe(size);
        }
      });
    });

    it('should validate abstraction levels', () => {
      const levels = ['concrete', 'mixed', 'abstract'] as const;

      levels.forEach((level) => {
        const result = AccessibilityPreferencesSchemaV2.safeParse({ abstractionLevel: level });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.abstractionLevel).toBe(level);
        }
      });
    });

    it('should validate boolean fields correctly', () => {
      const booleanFields = [
        'includeExamples',
        'includeGlossary',
        'includeCheckpoints',
        'darkMode',
        'screenReaderOptimized',
        'includeKeyboardHints',
        'includeVoiceHints',
        'brailleOptimized',
        'includeSemanticMarkup',
        'audioFriendly',
        'adaptiveComplexity',
      ];

      booleanFields.forEach((field) => {
        const resultTrue = AccessibilityPreferencesSchemaV2.safeParse({ [field]: true });
        expect(resultTrue.success).toBe(true);

        const resultFalse = AccessibilityPreferencesSchemaV2.safeParse({ [field]: false });
        expect(resultFalse.success).toBe(true);

        const resultInvalid = AccessibilityPreferencesSchemaV2.safeParse({ [field]: 'invalid' });
        expect(resultInvalid.success).toBe(false);
      });
    });

    it('should accept optional userId', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({ userId: 'user-abc-123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe('user-abc-123');
      }
    });

    it('should accept optional dialect', () => {
      const result = AccessibilityPreferencesSchemaV2.safeParse({
        language: 'es',
        dialect: 'es-MX',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dialect).toBe('es-MX');
      }
    });
  });
});
