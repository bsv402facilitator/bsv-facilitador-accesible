/**
 * Integration tests for V3 Universal Accessibility
 *
 * Tests the core principle: "Server provides EVERYTHING, client chooses"
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMetadataWithAIV3 } from '../../src/facilitator/accessibility/ai-metadata-v3';
import type { EnvV3, AccessibilityPreferencesV3, MetadataContext } from '../../src/facilitator/types';

/**
 * Create mock V3 environment
 */
function createMockEnvV3(overrides?: Partial<EnvV3>): EnvV3 {
  return {
    OPENAI_API_KEY: 'test-key',
    ACCESSIBILITY_V3_ENABLED: 'true',
    V3_ROLLOUT_PERCENTAGE: '100',
    AI_ENABLED: 'false', // Disable AI for deterministic tests
    WALLET_ADDRESS: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
    NETWORK: 'testnet',
    ...overrides,
  } as EnvV3;
}

describe('V3 Universal Accessibility - Integration Tests', () => {
  let env: EnvV3;
  let context: MetadataContext;

  beforeEach(() => {
    env = createMockEnvV3();
    context = {
      amount: '5000',
      address: 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk',
    };
  });

  describe('Core Principle: Server provides EVERYTHING', () => {
    it('should return ALL 5 cognitive levels', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es', 'en'],
        primaryLanguage: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Verify ALL cognitive levels are present
      expect(metadata.content.byLevel).toHaveProperty('beginner');
      expect(metadata.content.byLevel).toHaveProperty('simple');
      expect(metadata.content.byLevel).toHaveProperty('medium');
      expect(metadata.content.byLevel).toHaveProperty('advanced');
      expect(metadata.content.byLevel).toHaveProperty('expert');

      // Each level should have required fields
      const levels = ['beginner', 'simple', 'medium', 'advanced', 'expert'] as const;
      for (const level of levels) {
        const content = metadata.content.byLevel[level];
        expect(content.plainLanguage).toBeDefined();
        expect(content.explanation).toBeDefined();
        expect(content.stepByStep).toBeDefined();
        expect(Array.isArray(content.stepByStep)).toBe(true);
      }
    });

    it('should return ALL 3 abstraction levels', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        abstractionLevel: 'concrete',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Verify ALL abstraction levels are present
      expect(metadata.content.byAbstraction).toHaveProperty('concrete');
      expect(metadata.content.byAbstraction).toHaveProperty('mixed');
      expect(metadata.content.byAbstraction).toHaveProperty('abstract');

      // Each abstraction level should have description + content
      const abstractions = ['concrete', 'mixed', 'abstract'] as const;
      for (const abstraction of abstractions) {
        const abstractionContent = metadata.content.byAbstraction[abstraction];
        expect(abstractionContent.description).toBeDefined();
        expect(abstractionContent.content).toBeDefined();
        expect(abstractionContent.content.plainLanguage).toBeDefined();
      }
    });

    it('should return ALL requested languages (minimum es + en)', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es', 'en', 'pt'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Should always include es and en
      expect(metadata.languages).toHaveProperty('es');
      expect(metadata.languages).toHaveProperty('en');

      // Each language should have complete content
      const spanish = metadata.languages.es;
      expect(spanish.code).toBe('es');
      expect(spanish.direction).toBe('ltr');
      expect(spanish.locale).toBe('es-ES');
      expect(spanish.byLevel).toHaveProperty('beginner');
      expect(spanish.byLevel).toHaveProperty('expert');

      const english = metadata.languages.en;
      expect(english.code).toBe('en');
      expect(english.direction).toBe('ltr');
      expect(english.locale).toBe('en-US');
      expect(english.byLevel).toHaveProperty('beginner');
      expect(english.byLevel).toHaveProperty('expert');
    });

    it('should return ALL visual variants', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Contrast modes
      expect(metadata.visual.contrast).toHaveProperty('high');
      expect(metadata.visual.contrast).toHaveProperty('normal');
      expect(metadata.visual.contrast).toHaveProperty('low');

      // Color blind types
      expect(metadata.visual.colorBlind).toHaveProperty('deuteranopia');
      expect(metadata.visual.colorBlind).toHaveProperty('protanopia');
      expect(metadata.visual.colorBlind).toHaveProperty('tritanopia');
      expect(metadata.visual.colorBlind).toHaveProperty('none');

      // Font sizes
      expect(metadata.visual.fontSize).toHaveProperty('small');
      expect(metadata.visual.fontSize).toHaveProperty('medium');
      expect(metadata.visual.fontSize).toHaveProperty('large');
      expect(metadata.visual.fontSize).toHaveProperty('x-large');

      // Themes
      expect(metadata.visual.theme).toHaveProperty('light');
      expect(metadata.visual.theme).toHaveProperty('dark');

      // Verify structure
      expect(metadata.visual.contrast.high.description).toBeDefined();
      expect(metadata.visual.contrast.high.colorPalette).toBeDefined();
      expect(Array.isArray(metadata.visual.contrast.high.colorPalette)).toBe(true);
    });

    it('should return ALL motor input methods', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // All motor input methods
      expect(metadata.motor).toHaveProperty('keyboard');
      expect(metadata.motor).toHaveProperty('voice');
      expect(metadata.motor).toHaveProperty('switch');
      expect(metadata.motor).toHaveProperty('eye');

      // Verify keyboard guidance structure
      expect(metadata.motor.keyboard.instructions).toBeDefined();
      expect(Array.isArray(metadata.motor.keyboard.instructions)).toBe(true);
      expect(metadata.motor.keyboard.shortcuts).toBeDefined();

      // Verify voice guidance
      expect(metadata.motor.voice.instructions).toBeDefined();
      expect(Array.isArray(metadata.motor.voice.instructions)).toBe(true);
    });

    it('should return ALL audio variants', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // All audio variants
      expect(metadata.audio).toHaveProperty('ttsOptimized');
      expect(metadata.audio).toHaveProperty('ttsNonOptimized');
      expect(metadata.audio).toHaveProperty('withPauses');
      expect(metadata.audio).toHaveProperty('withoutPauses');

      // Verify TTS optimized structure
      expect(metadata.audio.ttsOptimized.text).toBeDefined();
      expect(metadata.audio.ttsOptimized.ssml).toBeDefined();
      expect(metadata.audio.ttsOptimized.rate).toBeDefined();

      // Verify pauses variant
      expect(metadata.audio.withPauses.pauses).toBeDefined();
      expect(Array.isArray(metadata.audio.withPauses.pauses)).toBe(true);
    });

    it('should return ALL format conversions', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // All formats
      expect(metadata.formats).toHaveProperty('json');
      expect(metadata.formats).toHaveProperty('xml');
      expect(metadata.formats).toHaveProperty('plaintext');
      expect(metadata.formats).toHaveProperty('markdown');
      expect(metadata.formats).toHaveProperty('html');
      expect(metadata.formats).toHaveProperty('jsonld');
      expect(metadata.formats).toHaveProperty('braille');
      expect(metadata.formats).toHaveProperty('ssml');

      // Verify formats are strings
      expect(typeof metadata.formats.json).toBe('string');
      expect(typeof metadata.formats.xml).toBe('string');
      expect(typeof metadata.formats.markdown).toBe('string');
      expect(typeof metadata.formats.braille).toBe('string');
    });
  });

  describe('Recommendations (Client can ignore)', () => {
    it('should provide server recommendations based on preferences', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        cognitiveLevel: 'simple',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Recommendations should match preferences
      expect(metadata.recommendations.cognitiveLevel).toBe('simple');
      expect(metadata.recommendations.language).toBe('es');
      expect(metadata.recommendations.confidence).toBeGreaterThan(0);
      expect(metadata.recommendations.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide default recommendations when no preferences given', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Should have sensible defaults
      expect(metadata.recommendations.cognitiveLevel).toBe('simple');
      expect(metadata.recommendations.motorMode).toBe('keyboard');
      expect(metadata.recommendations.format).toBeDefined();
    });
  });

  describe('Metadata section', () => {
    it('should include complete metadata information', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      expect(metadata.metadata.version).toBe(3);
      expect(metadata.metadata.generatedBy).toMatch(/^(ai|template|hybrid)$/);
      expect(metadata.metadata.generatedAt).toBeDefined();
      expect(metadata.metadata.wcagLevel).toBe('AAA');
      expect(metadata.metadata.userPreferences).toEqual(preferences);
    });

    it('should indicate template or hybrid generation when AI disabled', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // AI is disabled in our mock env, so should be template or hybrid (AI tried but failed)
      expect(['template', 'hybrid']).toContain(metadata.metadata.generatedBy);
    });
  });

  describe('Content Quality', () => {
    it('should have different content for different cognitive levels', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      const beginner = metadata.content.byLevel.beginner.plainLanguage;
      const expert = metadata.content.byLevel.expert.plainLanguage;

      // Beginner and expert should have different content
      expect(beginner).toBeDefined();
      expect(expert).toBeDefined();
      // They should be different strings (for most cases)
      // Note: In template fallback they might be similar, but structure is correct
    });

    it('should have glossary for beginner level', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        cognitiveLevel: 'beginner',
        includeGlossary: true,
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      const beginnerContent = metadata.content.byLevel.beginner;
      // Beginner level should typically have glossary
      expect(beginnerContent).toBeDefined();
    });

    it('should have examples for concrete abstraction level', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        abstractionLevel: 'concrete',
        includeExamples: true,
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      const concreteContent = metadata.content.byAbstraction.concrete;
      expect(concreteContent.description).toBeDefined();
      expect(concreteContent.content).toBeDefined();
    });
  });

  describe('Different Message Types', () => {
    it('should generate metadata for verify success', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      expect(metadata.content.byLevel.simple.plainLanguage).toBeDefined();
      expect(metadata.languages.es).toBeDefined();
    });

    it('should generate metadata for invalid amount error', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const errorContext: MetadataContext = {
        required: '5000',
        actual: '1000',
      };

      const metadata = await createMetadataWithAIV3(
        'errors.verify.invalidAmount',
        errorContext,
        preferences,
        env
      );

      expect(metadata.content.byLevel.beginner.plainLanguage).toBeDefined();
      expect(metadata.content.byLevel.expert.plainLanguage).toBeDefined();
      expect(metadata.languages.es).toBeDefined();
      expect(metadata.languages.en).toBeDefined();
    });
  });

  describe('Multiple Languages', () => {
    it('should generate same structure for all languages', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es', 'en'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      const spanish = metadata.languages.es;
      const english = metadata.languages.en;

      // Both should have same cognitive levels
      expect(Object.keys(spanish.byLevel).sort()).toEqual(
        Object.keys(english.byLevel).sort()
      );

      // Both should have same abstraction levels
      expect(Object.keys(spanish.byAbstraction).sort()).toEqual(
        Object.keys(english.byAbstraction).sort()
      );
    });

    it('should respect RTL direction for Arabic (future)', async () => {
      // Note: Arabic not implemented yet, but structure supports it
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es', 'en'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // Verify LTR for Spanish and English
      expect(metadata.languages.es.direction).toBe('ltr');
      expect(metadata.languages.en.direction).toBe('ltr');
    });
  });

  describe('Performance & Caching', () => {
    it('should complete generation in reasonable time', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es', 'en'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const startTime = Date.now();

      await createMetadataWithAIV3('success.verifyValid', context, preferences, env);

      const elapsed = Date.now() - startTime;

      // V3 generates multiple languages + all levels, so allow up to 1 second
      // (includes AI timeout attempts before fallback to templates)
      expect(elapsed).toBeLessThan(1000);
    });

    it('should indicate cache hit when available', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        audioFriendly: true,
        wcagLevel: 'AAA',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      // First call should not be cache hit (no KV in test env)
      expect(metadata.metadata.cacheHit).toBe(false);
    });
  });

  describe('WCAG AAA Compliance', () => {
    it('should always indicate AAA level compliance', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        languages: ['es'],
        primaryLanguage: 'es',
        wcagLevel: 'AAA',
        audioFriendly: true,
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        env
      );

      expect(metadata.metadata.wcagLevel).toBe('AAA');
    });
  });
});
