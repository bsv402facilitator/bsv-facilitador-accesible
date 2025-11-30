/**
 * Unit tests for icon-support.ts
 */

import { describe, it, expect } from 'vitest';
import {
  ICON_LIBRARY,
  MEMORY_AIDS_ES,
  MEMORY_AIDS_EN,
  addIconsToContent,
  getIconForConcept,
  addStatusIconsToSteps,
  getIconAltText,
} from '../../../src/facilitator/accessibility/icon-support';
import type { CognitiveContentV3 } from '../../../src/facilitator/types';

describe('icon-support', () => {
  describe('ICON_LIBRARY', () => {
    it('should have status icons', () => {
      expect(ICON_LIBRARY.status.success).toBe('✅');
      expect(ICON_LIBRARY.status.error).toBe('❌');
      expect(ICON_LIBRARY.status.pending).toBe('⏳');
      expect(ICON_LIBRARY.status.warning).toBe('⚠️');
      expect(ICON_LIBRARY.status.info).toBe('ℹ️');
      expect(ICON_LIBRARY.status.inProgress).toBe('🔄');
      expect(ICON_LIBRARY.status.completed).toBe('🎉');
    });

    it('should have concept icons', () => {
      expect(ICON_LIBRARY.concept.txid).toBe('🔑');
      expect(ICON_LIBRARY.concept.blockchain).toBe('⛓️');
      expect(ICON_LIBRARY.concept.payment).toBe('💳');
      expect(ICON_LIBRARY.concept.verification).toBe('🔐');
      expect(ICON_LIBRARY.concept.broadcast).toBe('📡');
    });

    it('should have action icons', () => {
      expect(ICON_LIBRARY.action.next).toBe('▶️');
      expect(ICON_LIBRARY.action.back).toBe('◀️');
      expect(ICON_LIBRARY.action.help).toBe('❓');
      expect(ICON_LIBRARY.action.save).toBe('💾');
    });
  });

  describe('MEMORY_AIDS', () => {
    it('should have Spanish memory aids', () => {
      expect(MEMORY_AIDS_ES).toHaveLength(8);
      expect(MEMORY_AIDS_ES[0]).toContain('txid');
      expect(MEMORY_AIDS_ES[1]).toContain('blockchain');
    });

    it('should have English memory aids', () => {
      expect(MEMORY_AIDS_EN).toHaveLength(8);
      expect(MEMORY_AIDS_EN[0]).toContain('txid');
      expect(MEMORY_AIDS_EN[1]).toContain('blockchain');
    });

    it('should have matching Spanish and English aids', () => {
      expect(MEMORY_AIDS_ES.length).toBe(MEMORY_AIDS_EN.length);
    });
  });

  describe('addIconsToContent', () => {
    it('should add icons to steps based on keywords', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Verificación exitosa',
        explanation: 'El pago fue verificado correctamente',
        stepByStep: [
          { text: 'Verificamos la firma digital' },
          { text: 'Broadcast de la transacción' },
          { text: 'Confirmación exitosa' },
        ],
        hints: {
          ifError: 'Revisa los datos',
          commonMistakes: [],
          nextSteps: 'Continúa',
        },
      };

      const result = addIconsToContent(content, 'es');

      expect(result.stepByStep[0]?.icon).toBe(ICON_LIBRARY.concept.verification);
      expect(result.stepByStep[1]?.icon).toBe(ICON_LIBRARY.concept.broadcast);
      expect(result.stepByStep[2]?.icon).toBe(ICON_LIBRARY.status.success);
    });

    it('should detect error keywords and add error icon', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Error en el pago',
        explanation: 'Hubo un error',
        stepByStep: [
          { text: 'Error en la transacción' },
          { text: 'Error al procesar pago' },
        ],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.stepByStep[0]?.icon).toBe(ICON_LIBRARY.status.error);
      expect(result.stepByStep[1]?.icon).toBe(ICON_LIBRARY.status.error);
    });

    it('should detect pending/waiting keywords', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Esperando confirmación',
        explanation: 'El pago está pendiente',
        stepByStep: [
          { text: 'Waiting for blockchain' },
          { text: 'Transaction is pending' },
        ],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.stepByStep[0]?.icon).toBe(ICON_LIBRARY.status.pending);
      expect(result.stepByStep[1]?.icon).toBe(ICON_LIBRARY.status.pending);
    });

    it('should detect warning keywords', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Advertencia',
        explanation: 'Ten cuidado',
        stepByStep: [{ text: 'Advertencia: revisa los datos' }],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.stepByStep[0]?.icon).toBe(ICON_LIBRARY.status.warning);
    });

    it('should preserve existing icons', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Test',
        explanation: 'Test',
        stepByStep: [{ text: 'Custom step', icon: '🚀' }],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.stepByStep[0]?.icon).toBe('🚀');
    });

    it('should add relevant memory aids based on content', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Transacción con txid abc123 enviada a la blockchain',
        explanation: 'El broadcast fue exitoso',
        stepByStep: [{ text: 'Verificar firma digital' }],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.memoryAids).toBeDefined();
      expect(result.memoryAids!.length).toBeGreaterThan(0);
      expect(result.memoryAids!.length).toBeLessThanOrEqual(5);
      // Should include relevant aids for txid and blockchain
      const hasRelevantAids = result.memoryAids!.some(
        (aid) => aid.includes('txid') || aid.includes('blockchain')
      );
      expect(hasRelevantAids).toBe(true);
    });

    it('should add default memory aids when no relevant ones found', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Simple message',
        explanation: 'Basic explanation',
        stepByStep: [{ text: 'Step 1' }],
        hints: {},
      };

      const result = addIconsToContent(content, 'es');

      expect(result.memoryAids).toBeDefined();
      expect(result.memoryAids!.length).toBeGreaterThanOrEqual(3);
    });

    it('should work with English language', () => {
      const content: CognitiveContentV3 = {
        plainLanguage: 'Transaction with txid sent to blockchain',
        explanation: 'Broadcast successful',
        stepByStep: [
          { text: 'Verify digital signature' },
          { text: 'Send to network' },
        ],
        hints: {},
      };

      const result = addIconsToContent(content, 'en');

      expect(result.stepByStep[0]?.icon).toBe(ICON_LIBRARY.concept.verification);
      expect(result.stepByStep[1]?.icon).toBe(ICON_LIBRARY.concept.broadcast);
      expect(result.memoryAids).toBeDefined();
      // Should use English memory aids
      const hasEnglishAids = result.memoryAids!.some((aid) =>
        aid.toLowerCase().includes('your') || aid.toLowerCase().includes('key')
      );
      expect(hasEnglishAids).toBe(true);
    });
  });

  describe('getIconForConcept', () => {
    it('should return icon for valid concept name', () => {
      expect(getIconForConcept('success')).toBe('✅');
      expect(getIconForConcept('blockchain')).toBe('⛓️');
      expect(getIconForConcept('help')).toBe('❓');
    });

    it('should return empty string for unknown concept', () => {
      expect(getIconForConcept('unknown')).toBe('');
      expect(getIconForConcept('randomConcept')).toBe('');
    });
  });

  describe('addStatusIconsToSteps', () => {
    it('should add completed icon to completed steps', () => {
      const steps = [
        { text: 'Step 1', status: 'completed' as const },
        { text: 'Step 2', status: 'completed' as const },
      ];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.icon).toBe(ICON_LIBRARY.status.completed);
      expect(result[1]?.icon).toBe(ICON_LIBRARY.status.completed);
    });

    it('should add in-progress icon to active steps', () => {
      const steps = [{ text: 'Step 1', status: 'in-progress' as const }];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.icon).toBe(ICON_LIBRARY.status.inProgress);
    });

    it('should add pending icon to pending steps', () => {
      const steps = [{ text: 'Step 1', status: 'pending' as const }];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.icon).toBe(ICON_LIBRARY.status.pending);
    });

    it('should add error icon to error steps', () => {
      const steps = [{ text: 'Step 1', status: 'error' as const }];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.icon).toBe(ICON_LIBRARY.status.error);
    });

    it('should preserve existing icons', () => {
      const steps = [{ text: 'Step 1', status: 'completed' as const, icon: '🎯' }];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.icon).toBe('🎯');
    });

    it('should handle steps without status', () => {
      const steps = [{ text: 'Step 1' }];

      const result = addStatusIconsToSteps(steps);

      expect(result[0]?.text).toBe('Step 1');
      // Should not have icon if no status and no existing icon
      expect(result[0]?.icon).toBeUndefined();
    });
  });

  describe('getIconAltText', () => {
    it('should return Spanish alt text for common icons', () => {
      expect(getIconAltText('✅', 'es')).toContain('Éxito');
      expect(getIconAltText('❌', 'es')).toContain('Error');
      expect(getIconAltText('⏳', 'es')).toContain('Pendiente');
      expect(getIconAltText('🔑', 'es')).toContain('Llave');
    });

    it('should return English alt text for common icons', () => {
      expect(getIconAltText('✅', 'en')).toContain('Success');
      expect(getIconAltText('❌', 'en')).toContain('Error');
      expect(getIconAltText('⏳', 'en')).toContain('Pending');
      expect(getIconAltText('🔑', 'en')).toContain('Key');
    });

    it('should return icon itself for unknown icons', () => {
      expect(getIconAltText('🦄', 'es')).toBe('🦄');
      expect(getIconAltText('💩', 'en')).toBe('💩');
    });

    it('should default to Spanish when language not specified', () => {
      const altText = getIconAltText('✅');
      expect(altText).toContain('Éxito');
    });

    it('should have alt text for all status icons', () => {
      const statusIcons = Object.values(ICON_LIBRARY.status);
      for (const icon of statusIcons) {
        const altText = getIconAltText(icon, 'es');
        expect(altText).toBeTruthy();
        expect(altText).not.toBe(icon); // Should have description, not just the icon
      }
    });

    it('should have alt text for all concept icons', () => {
      const conceptIcons = Object.values(ICON_LIBRARY.concept);
      for (const icon of conceptIcons) {
        const altText = getIconAltText(icon, 'en');
        expect(altText).toBeTruthy();
        expect(altText).not.toBe(icon);
      }
    });

    it('should have alt text for all action icons', () => {
      const actionIcons = Object.values(ICON_LIBRARY.action);
      for (const icon of actionIcons) {
        const altText = getIconAltText(icon, 'es');
        expect(altText).toBeTruthy();
        expect(altText).not.toBe(icon);
      }
    });
  });
});
