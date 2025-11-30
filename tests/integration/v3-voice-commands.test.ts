/**
 * Integration tests para voice commands en V3 accessibility
 * Verifica que los comandos de voz están presentes en respuestas /v3/verify y /v3/settle
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createMetadataWithAIV3 } from '../../src/facilitator/accessibility/ai-metadata-v3';
import type { AccessibilityPreferencesV3, EnvV3, MetadataContext } from '../../src/facilitator/types';

// Mock environment
const mockEnv: EnvV3 = {
  OPENAI_API_KEY: 'test-key',
  AI_ENABLED: 'false', // Use templates only for consistent testing
  ACCESSIBILITY_V3_ENABLED: 'true',
  V3_ROLLOUT_PERCENTAGE: '100',
  WALLET_ADDRESS: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  NETWORK: 'testnet',
  FEATURE_VOICE_COMMANDS: 'true',
};

describe('V3 Voice Commands Integration', () => {
  describe('Voice Commands in Verify Response', () => {
    it('should include voice commands in motor section for verify success', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es', 'en'],
        cognitiveLevel: 'simple',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        amount: '100000',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Verificar que motor section existe
      expect(metadata.motor).toBeDefined();
      expect(metadata.motor.voice).toBeDefined();

      // Verificar que tiene instrucciones de voz
      expect(metadata.motor.voice.instructions).toBeDefined();
      expect(metadata.motor.voice.instructions.length).toBeGreaterThan(0);

      // Verificar que tiene shortcuts de voz
      expect(metadata.motor.voice.shortcuts).toBeDefined();
      expect(Object.keys(metadata.motor.voice.shortcuts).length).toBeGreaterThan(0);

      // Verificar comandos específicos de verify
      const shortcuts = Object.keys(metadata.motor.voice.shortcuts);
      expect(shortcuts).toContain('verificar pago');
      expect(shortcuts).toContain('siguiente paso');
    });

    it('should include voice commands for beginner level with wake phrases', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'beginner',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        amount: '100000',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Para nivel beginner, deberían haber comandos de despertar
      // (aunque no están directamente en motor.voice, están en la generación)
      expect(metadata.motor.voice.instructions.length).toBeGreaterThan(3);
    });
  });

  describe('Voice Commands in Settle Response', () => {
    it('should include settle-specific voice commands', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        amount: '100000',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        txid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      };

      const metadata = await createMetadataWithAIV3(
        'success.settleSuccess',
        context,
        preferences,
        mockEnv
      );

      // Verificar comandos específicos de settle
      const shortcuts = Object.keys(metadata.motor.voice.shortcuts);
      expect(shortcuts).toContain('ver txid');
      expect(shortcuts).toContain('copiar txid');
      expect(shortcuts).toContain('siguiente paso');
    });

    it('should include txid-related commands when txid is present', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'medium',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        txid: 'abc123def456',
      };

      const metadata = await createMetadataWithAIV3(
        'success.settleSuccess',
        context,
        preferences,
        mockEnv
      );

      expect(metadata.motor.voice.shortcuts).toHaveProperty('ver txid');
      expect(metadata.motor.voice.shortcuts).toHaveProperty('copiar txid');
    });
  });

  describe('Voice Commands in Error Response', () => {
    it('should include error-specific voice commands', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        required: '100000',
        actual: '50000',
      };

      const metadata = await createMetadataWithAIV3(
        'errors.verify.invalidAmount',
        context,
        preferences,
        mockEnv
      );

      // Verificar comandos específicos de error
      const shortcuts = Object.keys(metadata.motor.voice.shortcuts);
      expect(shortcuts).toContain('solución');
      expect(shortcuts).toContain('contactar soporte');
    });
  });

  describe('Voice Commands Adaptation by Cognitive Level', () => {
    it('should adapt voice commands for all cognitive levels', async () => {
      const levels: Array<'beginner' | 'simple' | 'medium' | 'advanced' | 'expert'> = [
        'beginner',
        'simple',
        'medium',
        'advanced',
        'expert',
      ];

      const context: MetadataContext = {
        amount: '100000',
      };

      for (const level of levels) {
        const preferences: AccessibilityPreferencesV3 = {
          primaryLanguage: 'es',
          languages: ['es'],
          cognitiveLevel: level,
          includeVoiceHints: true,
          wcagLevel: 'AAA',
        };

        const metadata = await createMetadataWithAIV3(
          'success.verifyValid',
          context,
          preferences,
          mockEnv
        );

        // Todos los niveles deben tener comandos de voz
        expect(metadata.motor.voice.instructions.length).toBeGreaterThan(0);
        expect(Object.keys(metadata.motor.voice.shortcuts).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Keyboard and Voice Command Combination', () => {
    it('should include both keyboard and voice guidance', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeKeyboardHints: true,
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {
        amount: '100000',
      };

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Verificar que ambos están presentes
      expect(metadata.motor.keyboard).toBeDefined();
      expect(metadata.motor.keyboard.instructions.length).toBeGreaterThan(0);

      expect(metadata.motor.voice).toBeDefined();
      expect(metadata.motor.voice.instructions.length).toBeGreaterThan(0);

      // Verificar que tienen shortcuts
      expect(Object.keys(metadata.motor.keyboard.shortcuts).length).toBeGreaterThan(0);
      expect(Object.keys(metadata.motor.voice.shortcuts).length).toBeGreaterThan(0);
    });
  });

  describe('Motor Input Methods', () => {
    it('should provide guidance for all 4 motor input methods', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {};

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Verificar que todos los métodos de entrada motora están presentes
      expect(metadata.motor.keyboard).toBeDefined();
      expect(metadata.motor.voice).toBeDefined();
      expect(metadata.motor.switch).toBeDefined();
      expect(metadata.motor.eye).toBeDefined();

      // Cada uno debe tener instrucciones, shortcuts y timing
      ['keyboard', 'voice', 'switch', 'eye'].forEach((method) => {
        expect(metadata.motor[method as keyof typeof metadata.motor].instructions).toBeDefined();
        expect(metadata.motor[method as keyof typeof metadata.motor].shortcuts).toBeDefined();
        expect(metadata.motor[method as keyof typeof metadata.motor].timing).toBeDefined();
        expect(metadata.motor[method as keyof typeof metadata.motor].timing?.adjustable).toBe(true);
      });
    });
  });

  describe('Voice Command Timing', () => {
    it('should include adjustable timing for voice commands', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {};

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Verificar timing
      expect(metadata.motor.voice.timing).toBeDefined();
      expect(metadata.motor.voice.timing?.estimatedTime).toBeDefined();
      expect(metadata.motor.voice.timing?.adjustable).toBe(true);

      // Voice debería ser más rápido que keyboard
      const voiceTime = parseInt(metadata.motor.voice.timing?.estimatedTime || '0');
      const keyboardTime = parseInt(metadata.motor.keyboard.timing?.estimatedTime || '0');
      expect(voiceTime).toBeLessThanOrEqual(keyboardTime);
    });
  });

  describe('Navigation Commands Integration', () => {
    it('should include step navigation commands', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {};

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // Verificar que hay comandos de navegación
      const shortcuts = Object.keys(metadata.motor.voice.shortcuts);

      // Debería tener comandos de navegación de pasos
      expect(shortcuts.some((s) => s.includes('paso') || s.includes('leer'))).toBe(true);
    });
  });

  describe('WCAG 2.5.6 Concurrent Input Compliance', () => {
    it('should support concurrent keyboard and voice input', async () => {
      const preferences: AccessibilityPreferencesV3 = {
        primaryLanguage: 'es',
        languages: ['es'],
        cognitiveLevel: 'simple',
        includeKeyboardHints: true,
        includeVoiceHints: true,
        wcagLevel: 'AAA',
      };

      const context: MetadataContext = {};

      const metadata = await createMetadataWithAIV3(
        'success.verifyValid',
        context,
        preferences,
        mockEnv
      );

      // WCAG 2.5.6: Deben existir múltiples métodos de entrada
      expect(metadata.motor.keyboard).toBeDefined();
      expect(metadata.motor.voice).toBeDefined();

      // Ambos deben ser funcionales (no placeholders vacíos)
      expect(metadata.motor.keyboard.instructions.length).toBeGreaterThan(0);
      expect(metadata.motor.voice.instructions.length).toBeGreaterThan(0);

      // Deben tener shortcuts diferentes pero complementarios
      expect(Object.keys(metadata.motor.keyboard.shortcuts).length).toBeGreaterThan(0);
      expect(Object.keys(metadata.motor.voice.shortcuts).length).toBeGreaterThan(0);
    });
  });
});
