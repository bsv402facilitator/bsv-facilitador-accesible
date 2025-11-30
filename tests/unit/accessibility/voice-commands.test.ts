/**
 * Tests para voice commands generation
 * Verifica que los comandos de voz se generan correctamente según contexto
 */

import { describe, it, expect } from 'vitest';
import {
  generateVoiceCommands,
  generateNavigationCommands,
  generateVoiceSetupInstructions,
} from '../../../src/facilitator/accessibility/voice-commands';
import type { CognitiveLevelV3 } from '../../../src/facilitator/types';

describe('Voice Commands Generator', () => {
  describe('generateVoiceCommands', () => {
    it('should generate base commands for any scenario', () => {
      const result = generateVoiceCommands('generic', 'simple');

      expect(result.commands).toBeDefined();
      expect(result.examples).toBeDefined();
      expect(result.commands.length).toBeGreaterThan(0);

      // Verificar que existan comandos base
      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('repetir información');
      expect(triggers).toContain('ayuda');
      expect(triggers).toContain('glosario');
    });

    it('should generate verify-specific commands', () => {
      const result = generateVoiceCommands('success.verifyValid', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('verificar pago');
      expect(triggers).toContain('siguiente paso');
    });

    it('should generate settle-specific commands', () => {
      const result = generateVoiceCommands('success.settleSuccess', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('ver txid');
      expect(triggers).toContain('copiar txid');
      expect(triggers).toContain('siguiente paso');
    });

    it('should generate error-specific commands', () => {
      const result = generateVoiceCommands('errors.verify.invalidAmount', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('solución');
      expect(triggers).toContain('contactar soporte');
    });

    it('should include navigation commands', () => {
      const result = generateVoiceCommands('generic', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('pausa');
      expect(triggers).toContain('continuar');
      expect(triggers).toContain('más lento');
      expect(triggers).toContain('más rápido');
    });

    it('should include wake phrases for beginner level', () => {
      const result = generateVoiceCommands('generic', 'beginner');

      expect(result.wakePhrases).toBeDefined();
      expect(result.wakePhrases).toContain('Hey Bitcoin');
      expect(result.wakePhrases).toContain('Ok BSV');
    });

    it('should include wake phrases for simple level', () => {
      const result = generateVoiceCommands('generic', 'simple');

      expect(result.wakePhrases).toBeDefined();
      expect(result.wakePhrases?.length).toBeGreaterThan(0);
    });

    it('should NOT include wake phrases for advanced levels', () => {
      const advancedResult = generateVoiceCommands('generic', 'advanced');
      const expertResult = generateVoiceCommands('generic', 'expert');

      expect(advancedResult.wakePhrases).toBeUndefined();
      expect(expertResult.wakePhrases).toBeUndefined();
    });

    it('should generate examples from commands', () => {
      const result = generateVoiceCommands('success.verifyValid', 'simple');

      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples[0]).toMatch(/^Di ".+" para .+$/);
    });

    it('should include action and context for each command', () => {
      const result = generateVoiceCommands('success.verifyValid', 'simple');

      result.commands.forEach((cmd) => {
        expect(cmd.trigger).toBeDefined();
        expect(cmd.action).toBeDefined();
        expect(typeof cmd.trigger).toBe('string');
        expect(typeof cmd.action).toBe('string');
        // context es opcional
        if (cmd.context) {
          expect(typeof cmd.context).toBe('string');
        }
      });
    });
  });

  describe('generateNavigationCommands', () => {
    it('should generate step navigation commands when hasSteps is true', () => {
      const result = generateNavigationCommands(true, false);

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('leer pasos');
      expect(triggers).toContain('paso siguiente');
      expect(triggers).toContain('paso anterior');
    });

    it('should generate glossary commands when hasGlossary is true', () => {
      const result = generateNavigationCommands(false, true);

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).toContain('definición de [término]');
    });

    it('should generate both when both are true', () => {
      const result = generateNavigationCommands(true, true);

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers.length).toBeGreaterThan(0);
      expect(triggers).toContain('leer pasos');
      expect(triggers).toContain('definición de [término]');
    });

    it('should generate empty commands when both are false', () => {
      const result = generateNavigationCommands(false, false);

      expect(result.commands.length).toBe(0);
      expect(result.examples.length).toBe(0);
    });
  });

  describe('generateVoiceSetupInstructions', () => {
    it('should generate detailed instructions for beginner level', () => {
      const result = generateVoiceSetupInstructions('beginner');

      expect(result.length).toBeGreaterThan(3);
      expect(result[0]).toMatch(/^1\./); // Debe empezar con numeración
      expect(result.join(' ')).toContain('Hey Bitcoin');
    });

    it('should generate medium instructions for simple/medium levels', () => {
      const simpleResult = generateVoiceSetupInstructions('simple');
      const mediumResult = generateVoiceSetupInstructions('medium');

      expect(simpleResult.length).toBeGreaterThan(2);
      expect(mediumResult.length).toBeGreaterThan(2);
      expect(simpleResult.length).toBeLessThan(6);
    });

    it('should generate concise instructions for advanced/expert levels', () => {
      const advancedResult = generateVoiceSetupInstructions('advanced');
      const expertResult = generateVoiceSetupInstructions('expert');

      expect(advancedResult.length).toBeLessThanOrEqual(4);
      expect(expertResult.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Voice Commands Structure', () => {
    it('should return valid structure with all required fields', () => {
      const result = generateVoiceCommands('success.settleSuccess', 'simple');

      // Verificar estructura
      expect(result).toHaveProperty('commands');
      expect(result).toHaveProperty('examples');
      expect(Array.isArray(result.commands)).toBe(true);
      expect(Array.isArray(result.examples)).toBe(true);
    });

    it('should have at least 5 examples', () => {
      const result = generateVoiceCommands('success.verifyValid', 'beginner');

      expect(result.examples.length).toBeGreaterThanOrEqual(5);
    });

    it('should limit examples to top 5 from commands', () => {
      const result = generateVoiceCommands('success.settleSuccess', 'simple');

      // Genera muchos comandos pero solo muestra primeros 5 como ejemplos
      expect(result.examples.length).toBe(5);
      expect(result.commands.length).toBeGreaterThan(5);
    });
  });

  describe('Cognitive Level Adaptation', () => {
    const levels: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];

    it('should generate different wake phrases based on cognitive level', () => {
      const beginnerResult = generateVoiceCommands('generic', 'beginner');
      const expertResult = generateVoiceCommands('generic', 'expert');

      expect(beginnerResult.wakePhrases).toBeDefined();
      expect(expertResult.wakePhrases).toBeUndefined();
    });

    it('should generate commands for all cognitive levels', () => {
      levels.forEach((level) => {
        const result = generateVoiceCommands('generic', level);

        expect(result.commands.length).toBeGreaterThan(0);
        expect(result.examples.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Scenario Context Awareness', () => {
    it('should NOT include settle commands in verify scenario', () => {
      const result = generateVoiceCommands('success.verifyValid', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      expect(triggers).not.toContain('ver txid');
      expect(triggers).not.toContain('copiar txid');
    });

    it('should NOT include verify commands in settle scenario', () => {
      const result = generateVoiceCommands('success.settleSuccess', 'simple');

      const triggers = result.commands.map((c) => c.trigger);
      // 'siguiente paso' es común para ambos, pero 'verificar pago' no
      expect(triggers).not.toContain('verificar pago');
    });

    it('should adapt to error scenarios', () => {
      const successResult = generateVoiceCommands('success.verifyValid', 'simple');
      const errorResult = generateVoiceCommands('errors.verify.invalidAmount', 'simple');

      const successTriggers = successResult.commands.map((c) => c.trigger);
      const errorTriggers = errorResult.commands.map((c) => c.trigger);

      // Error tiene comandos específicos
      expect(errorTriggers).toContain('solución');
      expect(errorTriggers).toContain('contactar soporte');

      // Success no tiene esos comandos
      expect(successTriggers).not.toContain('solución');
      expect(successTriggers).not.toContain('contactar soporte');
    });
  });
});
