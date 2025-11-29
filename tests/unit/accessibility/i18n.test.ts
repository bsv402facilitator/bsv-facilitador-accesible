import { describe, test, expect } from 'vitest';
import {
  messages,
  messagesEN,
  getMessagesByLanguage,
  createMetadataFromTemplate,
} from '../../../src/facilitator/accessibility/i18n';

describe('i18n messages validation', () => {
  describe('plainLanguage length limits', () => {
    test('all plainLanguage messages are ≤100 chars', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        expect(message.plainLanguage.length).toBeLessThanOrEqual(100);
        expect(message.plainLanguage.length).toBeGreaterThan(0);
      }
    });

    test('verify error messages have concise plainLanguage', () => {
      expect(messages.errors.verify.invalidAmount.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.errors.verify.invalidAddress.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.errors.verify.invalidFormat.plainLanguage.length).toBeLessThanOrEqual(100);
    });

    test('settle error messages have concise plainLanguage', () => {
      expect(messages.errors.settle.alreadyBroadcast.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.errors.settle.networkError.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.errors.settle.broadcastFailed.plainLanguage.length).toBeLessThanOrEqual(100);
    });

    test('success messages have concise plainLanguage', () => {
      expect(messages.success.verifyValid.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.success.settleSuccess.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(messages.success.supportedNetworks.plainLanguage.length).toBeLessThanOrEqual(100);
    });
  });

  describe('explanation length limits', () => {
    test('all explanation messages are ≤300 chars', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        // Replace placeholders with max length strings for testing
        const explanation = message.explanation
          .replace(/{required}/g, '999999999')
          .replace(/{actual}/g, '999999999')
          .replace(/{txid}/g, 'a'.repeat(64))
          .replace(/{amount}/g, '999999999')
          .replace(/{address}/g, 'mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf');

        expect(explanation.length).toBeLessThanOrEqual(300);
        expect(message.explanation.length).toBeGreaterThan(0);
      }
    });

    test('verify error explanations are detailed but concise', () => {
      const invalidAmount = messages.errors.verify.invalidAmount.explanation
        .replace(/{required}/g, '1000')
        .replace(/{actual}/g, '500');
      expect(invalidAmount.length).toBeLessThanOrEqual(300);

      const invalidAddress = messages.errors.verify.invalidAddress.explanation
        .replace(/{required}/g, 'mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf')
        .replace(/{actual}/g, 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk');
      expect(invalidAddress.length).toBeLessThanOrEqual(300);
    });

    test('settle error explanations with placeholders respect limit', () => {
      const alreadyBroadcast = messages.errors.settle.alreadyBroadcast.explanation.replace(
        /{txid}/g,
        'a'.repeat(64)
      );
      expect(alreadyBroadcast.length).toBeLessThanOrEqual(300);
    });

    test('success explanations with placeholders respect limit', () => {
      const verifyValid = messages.success.verifyValid.explanation
        .replace(/{amount}/g, '1000000')
        .replace(/{address}/g, 'mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf');
      expect(verifyValid.length).toBeLessThanOrEqual(300);

      const settleSuccess = messages.success.settleSuccess.explanation.replace(
        /{txid}/g,
        'a'.repeat(64)
      );
      expect(settleSuccess.length).toBeLessThanOrEqual(300);
    });
  });

  describe('stepByStep length limits', () => {
    test('all stepByStep arrays have ≤5 items', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        expect(message.stepByStep.length).toBeLessThanOrEqual(5);
        expect(message.stepByStep.length).toBeGreaterThan(0);
      }
    });

    test('all stepByStep items are ≤80 chars each', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        for (const step of message.stepByStep) {
          expect(step.length).toBeLessThanOrEqual(80);
          expect(step.length).toBeGreaterThan(0);
        }
      }
    });

    test('verify error steps are actionable and concise', () => {
      for (const step of messages.errors.verify.invalidAmount.stepByStep) {
        expect(step.length).toBeLessThanOrEqual(80);
      }
      expect(messages.errors.verify.invalidAmount.stepByStep.length).toBeLessThanOrEqual(5);
    });

    test('settle error steps are actionable and concise', () => {
      for (const step of messages.errors.settle.networkError.stepByStep) {
        expect(step.length).toBeLessThanOrEqual(80);
      }
      expect(messages.errors.settle.networkError.stepByStep.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Spanish language validation', () => {
    test('all messages are in Spanish', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      const spanishIndicators = ['el', 'la', 'es', 'está', 'tu', 'con', 'para', 'de'];

      for (const message of allMessages) {
        const text = (
          message.plainLanguage +
          ' ' +
          message.explanation +
          ' ' +
          message.stepByStep.join(' ')
        ).toLowerCase();

        const hasSpanishIndicator = spanishIndicators.some((indicator) => text.includes(indicator));
        expect(hasSpanishIndicator).toBe(true);
      }
    });

    test('messages avoid technical jargon where possible', () => {
      // Palabras técnicas aceptables con explicación
      /*
      const _acceptableTerms = [
        'transacción',
        'blockchain',
        'satoshis',
        'bsv',
        'testnet',
        'mainnet',
      ];
      */

      // Palabras técnicas que NO deberían aparecer sin contexto
      const unacceptableJargon = ['p2pkh', 'utxo', 'scriptpubkey', 'opcodes', 'locktime', 'nonce'];

      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        const text = (
          message.plainLanguage +
          ' ' +
          message.explanation +
          ' ' +
          message.stepByStep.join(' ')
        ).toLowerCase();

        for (const jargon of unacceptableJargon) {
          expect(text).not.toContain(jargon);
        }
      }
    });

    test('messages use clear, accessible Spanish', () => {
      // Verificar que los mensajes están en español y son accesibles
      // Buscamos que al menos ALGUNOS mensajes usen segunda persona o primera persona plural
      const personalPronouns = ['tu', 'tus', 'recibimos', 'validamos', 'puedes', 'asegúrate'];

      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      let messagesWithPersonalPronouns = 0;

      for (const message of allMessages) {
        const text = (
          message.plainLanguage +
          ' ' +
          message.explanation +
          ' ' +
          message.stepByStep.join(' ')
        ).toLowerCase();

        const hasPersonalPronoun = personalPronouns.some((pronoun) => text.includes(pronoun));

        if (hasPersonalPronoun) {
          messagesWithPersonalPronouns++;
        }
      }

      // Al menos el 70% de mensajes deben usar tono personal
      const percentage = messagesWithPersonalPronouns / allMessages.length;
      expect(percentage).toBeGreaterThan(0.7);
    });
  });

  describe('hints validation', () => {
    test('all error messages have actionable hints', () => {
      const errorMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
      ];

      for (const message of errorMessages) {
        // Error messages should have at least one hint
        const hasHint =
          message.hints.ifError !== undefined ||
          message.hints.commonMistakes !== undefined ||
          message.hints.nextSteps !== undefined;

        expect(hasHint).toBe(true);
      }
    });

    test('success messages have nextSteps hints', () => {
      expect(messages.success.verifyValid.hints.nextSteps).toBeDefined();
      expect(messages.success.settleSuccess.hints.nextSteps).toBeDefined();
      expect(messages.success.supportedNetworks.hints.nextSteps).toBeDefined();
    });

    test('commonMistakes are arrays of strings when present', () => {
      const messagesWithMistakes = [
        messages.errors.verify.invalidAmount,
        messages.errors.verify.invalidAddress,
        messages.errors.verify.invalidFormat,
        messages.errors.settle.networkError,
        messages.errors.settle.broadcastFailed,
      ];

      for (const message of messagesWithMistakes) {
        if (message.hints.commonMistakes) {
          expect(Array.isArray(message.hints.commonMistakes)).toBe(true);
          expect(message.hints.commonMistakes.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('message structure completeness', () => {
    test('all messages have required fields', () => {
      const allMessages = [
        ...Object.values(messages.errors.verify),
        ...Object.values(messages.errors.settle),
        ...Object.values(messages.success),
      ];

      for (const message of allMessages) {
        expect(message.plainLanguage).toBeDefined();
        expect(message.explanation).toBeDefined();
        expect(message.stepByStep).toBeDefined();
        expect(message.hints).toBeDefined();

        expect(typeof message.plainLanguage).toBe('string');
        expect(typeof message.explanation).toBe('string');
        expect(Array.isArray(message.stepByStep)).toBe(true);
        expect(typeof message.hints).toBe('object');
      }
    });

    test('verify has all expected error types', () => {
      expect(messages.errors.verify.invalidAmount).toBeDefined();
      expect(messages.errors.verify.invalidAddress).toBeDefined();
      expect(messages.errors.verify.invalidFormat).toBeDefined();
    });

    test('settle has all expected error types', () => {
      expect(messages.errors.settle.alreadyBroadcast).toBeDefined();
      expect(messages.errors.settle.networkError).toBeDefined();
      expect(messages.errors.settle.broadcastFailed).toBeDefined();
    });

    test('success has all expected message types', () => {
      expect(messages.success.verifyValid).toBeDefined();
      expect(messages.success.settleSuccess).toBeDefined();
      expect(messages.success.supportedNetworks).toBeDefined();
    });
  });
});

describe('createMetadataFromTemplate', () => {
  test('creates metadata with correct structure', () => {
    const template = messages.success.verifyValid;
    const metadata = createMetadataFromTemplate(template);

    expect(metadata).toHaveProperty('plainLanguage');
    expect(metadata).toHaveProperty('explanation');
    expect(metadata).toHaveProperty('stepByStep');
    expect(metadata).toHaveProperty('hints');
    expect(metadata).toHaveProperty('language');
    expect(metadata).toHaveProperty('audioFriendly');
    expect(metadata).toHaveProperty('cognitiveLevel');
  });

  test('replaces placeholders in plainLanguage', () => {
    const template = {
      plainLanguage: 'Test {name} here',
      explanation: 'Explanation',
      stepByStep: ['Step 1'],
      hints: {},
    };

    const metadata = createMetadataFromTemplate(template, { name: 'VALUE' });

    expect(metadata.plainLanguage).toBe('Test VALUE here');
  });

  test('replaces placeholders in explanation', () => {
    const template = messages.errors.verify.invalidAmount;
    const metadata = createMetadataFromTemplate(template, {
      required: '1000',
      actual: '500',
    });

    expect(metadata.explanation).toContain('1000');
    expect(metadata.explanation).toContain('500');
    expect(metadata.explanation).not.toContain('{required}');
    expect(metadata.explanation).not.toContain('{actual}');
  });

  test('replaces placeholders in stepByStep', () => {
    const template = {
      plainLanguage: 'Plain',
      explanation: 'Explanation',
      stepByStep: ['Step {num}', 'Another {num}'],
      hints: {},
    };

    const metadata = createMetadataFromTemplate(template, { num: '1' });

    expect(metadata.stepByStep[0]).toBe('Step 1');
    expect(metadata.stepByStep[1]).toBe('Another 1');
  });

  test('replaces placeholders in hints.ifError', () => {
    const template = messages.errors.verify.invalidAmount;
    const metadata = createMetadataFromTemplate(template, {
      required: '1000',
    });

    expect(metadata.hints.ifError).toContain('1000');
    expect(metadata.hints.ifError).not.toContain('{required}');
  });

  test('replaces placeholders in hints.nextSteps', () => {
    const template = messages.errors.settle.alreadyBroadcast;
    const metadata = createMetadataFromTemplate(template, {
      txid: 'abc123',
    });

    expect(metadata.hints.nextSteps).toContain('abc123');
    expect(metadata.hints.nextSteps).not.toContain('{txid}');
  });

  test('preserves commonMistakes array', () => {
    const template = messages.errors.verify.invalidAmount;
    const metadata = createMetadataFromTemplate(template);

    expect(metadata.hints.commonMistakes).toBeDefined();
    expect(Array.isArray(metadata.hints.commonMistakes)).toBe(true);
    expect(metadata.hints.commonMistakes).toEqual(template.hints.commonMistakes);
  });

  test('uses default cognitiveLevel "simple"', () => {
    const template = messages.success.verifyValid;
    const metadata = createMetadataFromTemplate(template);

    expect(metadata.cognitiveLevel).toBe('simple');
  });

  test('accepts custom cognitiveLevel', () => {
    const template = messages.errors.settle.networkError;
    const metadata = createMetadataFromTemplate(template, {}, 'medium');

    expect(metadata.cognitiveLevel).toBe('medium');
  });

  test('uses default audioFriendly true', () => {
    const template = messages.success.verifyValid;
    const metadata = createMetadataFromTemplate(template);

    expect(metadata.audioFriendly).toBe(true);
  });

  test('accepts custom audioFriendly', () => {
    const template = messages.success.verifyValid;
    const metadata = createMetadataFromTemplate(template, {}, 'simple', false);

    expect(metadata.audioFriendly).toBe(false);
  });

  test('always sets language to "es"', () => {
    const template = messages.success.verifyValid;
    const metadata = createMetadataFromTemplate(template);

    expect(metadata.language).toBe('es');
  });

  test('handles multiple placeholder occurrences', () => {
    const template = {
      plainLanguage: '{value} and {value}',
      explanation: '{value} {value} {value}',
      stepByStep: ['{value}'],
      hints: {
        ifError: '{value}',
        nextSteps: '{value}',
      },
    };

    const metadata = createMetadataFromTemplate(template, { value: 'TEST' });

    expect(metadata.plainLanguage).toBe('TEST and TEST');
    expect(metadata.explanation).toBe('TEST TEST TEST');
    expect(metadata.stepByStep[0]).toBe('TEST');
    expect(metadata.hints.ifError).toBe('TEST');
    expect(metadata.hints.nextSteps).toBe('TEST');
  });

  test('handles empty replacements object', () => {
    const template = messages.success.supportedNetworks;
    const metadata = createMetadataFromTemplate(template, {});

    expect(metadata.plainLanguage).toBe(template.plainLanguage);
    expect(metadata.explanation).toBe(template.explanation);
  });
});

// ============================================================================
// Phase 1 Backward Compatibility Tests
// ============================================================================

describe('Phase 1 Backward Compatibility', () => {
  describe('i18n Directory Refactoring', () => {
    test('messages export should still work', () => {
      expect(messages).toBeDefined();
      expect(messages.errors).toBeDefined();
      expect(messages.success).toBeDefined();
    });

    test('messagesEN export should still work', () => {
      expect(messagesEN).toBeDefined();
      expect(messagesEN.errors).toBeDefined();
      expect(messagesEN.success).toBeDefined();
    });

    test('getMessagesByLanguage should return Spanish messages', () => {
      const msgs = getMessagesByLanguage('es');
      expect(msgs).toBe(messages);
      expect(msgs.errors.verify.invalidAmount).toBeDefined();
    });

    test('getMessagesByLanguage should return English messages', () => {
      const msgs = getMessagesByLanguage('en');
      expect(msgs).toBe(messagesEN);
      expect(msgs.errors.verify.invalidAmount).toBeDefined();
    });

    test('Spanish messages structure remains unchanged', () => {
      expect(messages.errors.verify.invalidAmount).toHaveProperty('plainLanguage');
      expect(messages.errors.verify.invalidAmount).toHaveProperty('explanation');
      expect(messages.errors.verify.invalidAmount).toHaveProperty('stepByStep');
      expect(messages.errors.verify.invalidAmount).toHaveProperty('hints');
    });

    test('English messages structure remains unchanged', () => {
      expect(messagesEN.errors.verify.invalidAmount).toHaveProperty('plainLanguage');
      expect(messagesEN.errors.verify.invalidAmount).toHaveProperty('explanation');
      expect(messagesEN.errors.verify.invalidAmount).toHaveProperty('stepByStep');
      expect(messagesEN.errors.verify.invalidAmount).toHaveProperty('hints');
    });

    test('createMetadataFromTemplate with Spanish messages works', () => {
      const template = messages.errors.verify.invalidAmount;
      const metadata = createMetadataFromTemplate(template, { required: '1000', actual: '500' });

      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.explanation).toContain('1000');
      expect(metadata.language).toBe('es');
    });

    test('createMetadataFromTemplate with English language parameter works', () => {
      const template = messagesEN.errors.verify.invalidAmount;
      const metadata = createMetadataFromTemplate(
        template,
        { required: '1000', actual: '500' },
        'simple',
        true,
        'en'
      );

      expect(metadata.plainLanguage).toBeDefined();
      expect(metadata.explanation).toContain('1000');
      expect(metadata.language).toBe('en');
    });
  });

  describe('Message Content Integrity', () => {
    test('Spanish message content matches original', () => {
      expect(messages.errors.verify.invalidAmount.plainLanguage).toBe(
        'El monto del pago es incorrecto'
      );
      expect(messages.success.verifyValid.plainLanguage).toBe('El pago se verificó correctamente');
    });

    test('English message content matches original', () => {
      expect(messagesEN.errors.verify.invalidAmount.plainLanguage).toBe(
        'Payment amount is incorrect'
      );
      expect(messagesEN.success.verifyValid.plainLanguage).toBe('Payment verified successfully');
    });

    test('All Spanish error messages present', () => {
      expect(messages.errors.verify.invalidAmount).toBeDefined();
      expect(messages.errors.verify.invalidAddress).toBeDefined();
      expect(messages.errors.verify.invalidFormat).toBeDefined();
      expect(messages.errors.settle.alreadyBroadcast).toBeDefined();
      expect(messages.errors.settle.networkError).toBeDefined();
      expect(messages.errors.settle.broadcastFailed).toBeDefined();
    });

    test('All English error messages present', () => {
      expect(messagesEN.errors.verify.invalidAmount).toBeDefined();
      expect(messagesEN.errors.verify.invalidAddress).toBeDefined();
      expect(messagesEN.errors.verify.invalidFormat).toBeDefined();
      expect(messagesEN.errors.settle.alreadyBroadcast).toBeDefined();
      expect(messagesEN.errors.settle.networkError).toBeDefined();
      expect(messagesEN.errors.settle.broadcastFailed).toBeDefined();
    });

    test('All success messages present in both languages', () => {
      expect(messages.success.verifyValid).toBeDefined();
      expect(messages.success.settleSuccess).toBeDefined();
      expect(messages.success.supportedNetworks).toBeDefined();

      expect(messagesEN.success.verifyValid).toBeDefined();
      expect(messagesEN.success.settleSuccess).toBeDefined();
      expect(messagesEN.success.supportedNetworks).toBeDefined();
    });

    test('Placeholders still work in Spanish messages', () => {
      expect(messages.errors.verify.invalidAmount.explanation).toContain('{required}');
      expect(messages.errors.verify.invalidAmount.explanation).toContain('{actual}');
      expect(messages.success.verifyValid.explanation).toContain('{amount}');
      expect(messages.success.verifyValid.explanation).toContain('{address}');
    });

    test('Placeholders still work in English messages', () => {
      expect(messagesEN.errors.verify.invalidAmount.explanation).toContain('{required}');
      expect(messagesEN.errors.verify.invalidAmount.explanation).toContain('{actual}');
      expect(messagesEN.success.verifyValid.explanation).toContain('{amount}');
      expect(messagesEN.success.verifyValid.explanation).toContain('{address}');
    });
  });

  describe('English Messages Validation', () => {
    test('English messages follow same length constraints', () => {
      const allMessagesEN = [
        ...Object.values(messagesEN.errors.verify),
        ...Object.values(messagesEN.errors.settle),
        ...Object.values(messagesEN.success),
      ];

      for (const message of allMessagesEN) {
        expect(message.plainLanguage.length).toBeLessThanOrEqual(100);
        expect(message.explanation.length).toBeLessThanOrEqual(300);
        expect(message.stepByStep.length).toBeLessThanOrEqual(5);

        for (const step of message.stepByStep) {
          expect(step.length).toBeLessThanOrEqual(80);
        }
      }
    });

    test('English messages are actually in English', () => {
      const englishIndicators = ['the', 'is', 'are', 'was', 'your', 'with', 'to', 'for', 'and'];

      const allMessagesEN = [
        ...Object.values(messagesEN.errors.verify),
        ...Object.values(messagesEN.errors.settle),
        ...Object.values(messagesEN.success),
      ];

      for (const message of allMessagesEN) {
        const text = (
          message.plainLanguage +
          ' ' +
          message.explanation +
          ' ' +
          message.stepByStep.join(' ')
        ).toLowerCase();

        const hasEnglishIndicator = englishIndicators.some((indicator) => text.includes(indicator));
        expect(hasEnglishIndicator).toBe(true);
      }
    });
  });
});
