import { describe, test, expect } from 'vitest';
import {
  createAccessibleResponse,
  buildMetadata,
} from '../../../src/facilitator/accessibility/metadata';
import type {
  AccessibleMetadata,
  AccessibleResponse,
  VerifyResponse,
} from '../../../src/facilitator/types';

describe('createAccessibleResponse', () => {
  test('wraps data with accessibility metadata', () => {
    const data: VerifyResponse = {
      isValid: true,
      payer: 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk',
    };

    const metadata: AccessibleMetadata = {
      plainLanguage: 'El pago se verificó correctamente',
      explanation: 'Tu transacción cumple con todos los requisitos de pago',
      stepByStep: [
        'Recibimos tu transacción',
        'Validamos el monto y dirección',
        'La transacción está lista',
      ],
      hints: {
        nextSteps: 'Usa el endpoint /settle para completar el pago',
      },
      language: 'es',
      audioFriendly: true,
      cognitiveLevel: 'simple',
    };

    const result: AccessibleResponse<VerifyResponse> = createAccessibleResponse(data, metadata);

    expect(result).toEqual({
      data,
      accessibility: metadata,
    });
  });

  test('preserves type information for data', () => {
    const data: VerifyResponse = {
      isValid: false,
      invalidReason: 'invalid_amount',
      payer: 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk',
    };

    const metadata: AccessibleMetadata = {
      plainLanguage: 'El monto del pago es incorrecto',
      explanation: 'La transacción no tiene el monto requerido',
      stepByStep: ['Verifica el monto', 'Crea nueva transacción'],
      hints: {
        ifError: 'Crea una nueva transacción con el monto exacto',
      },
      language: 'es',
      audioFriendly: true,
      cognitiveLevel: 'simple',
    };

    const result = createAccessibleResponse(data, metadata);

    expect(result.data.isValid).toBe(false);
    expect(result.data.invalidReason).toBe('invalid_amount');
    expect(result.accessibility.cognitiveLevel).toBe('simple');
  });

  test('works with generic types', () => {
    interface CustomData {
      foo: string;
      bar: number;
    }

    const data: CustomData = {
      foo: 'test',
      bar: 42,
    };

    const metadata: AccessibleMetadata = {
      plainLanguage: 'Test metadata',
      explanation: 'This is a test',
      stepByStep: ['Step 1', 'Step 2'],
      hints: {},
      language: 'es',
      audioFriendly: true,
      cognitiveLevel: 'simple',
    };

    const result: AccessibleResponse<CustomData> = createAccessibleResponse(data, metadata);

    expect(result.data.foo).toBe('test');
    expect(result.data.bar).toBe(42);
  });
});

describe('buildMetadata', () => {
  test('builds complete metadata with all fields', () => {
    const result = buildMetadata(
      'Mensaje conciso',
      'Explicación detallada del mensaje',
      ['Paso 1', 'Paso 2', 'Paso 3'],
      {
        ifError: 'Cómo resolver el error',
        commonMistakes: ['Mistake 1', 'Mistake 2'],
        nextSteps: 'Qué hacer después',
      },
      'medium',
      false
    );

    expect(result).toEqual({
      plainLanguage: 'Mensaje conciso',
      explanation: 'Explicación detallada del mensaje',
      stepByStep: ['Paso 1', 'Paso 2', 'Paso 3'],
      hints: {
        ifError: 'Cómo resolver el error',
        commonMistakes: ['Mistake 1', 'Mistake 2'],
        nextSteps: 'Qué hacer después',
      },
      language: 'es',
      audioFriendly: false,
      cognitiveLevel: 'medium',
    });
  });

  test('uses default cognitiveLevel "simple"', () => {
    const result = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {});

    expect(result.cognitiveLevel).toBe('simple');
  });

  test('uses default audioFriendly true', () => {
    const result = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {});

    expect(result.audioFriendly).toBe(true);
  });

  test('always sets language to "es"', () => {
    const result = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {});

    expect(result.language).toBe('es');
  });

  test('throws error if plainLanguage exceeds 100 chars', () => {
    const longMessage = 'a'.repeat(101);

    expect(() => buildMetadata(longMessage, 'Explicación', ['Paso 1'], {})).toThrow(
      'plainLanguage excede 100 caracteres: 101 chars'
    );
  });

  test('allows plainLanguage exactly 100 chars', () => {
    const exactMessage = 'a'.repeat(100);

    const result = buildMetadata(exactMessage, 'Explicación', ['Paso 1'], {});

    expect(result.plainLanguage).toBe(exactMessage);
  });

  test('throws error if explanation exceeds 300 chars', () => {
    const longExplanation = 'a'.repeat(301);

    expect(() => buildMetadata('Mensaje', longExplanation, ['Paso 1'], {})).toThrow(
      'explanation excede 300 caracteres: 301 chars'
    );
  });

  test('allows explanation exactly 300 chars', () => {
    const exactExplanation = 'a'.repeat(300);

    const result = buildMetadata('Mensaje', exactExplanation, ['Paso 1'], {});

    expect(result.explanation).toBe(exactExplanation);
  });

  test('throws error if stepByStep has more than 5 items', () => {
    const tooManySteps = ['Paso 1', 'Paso 2', 'Paso 3', 'Paso 4', 'Paso 5', 'Paso 6'];

    expect(() => buildMetadata('Mensaje', 'Explicación', tooManySteps, {})).toThrow(
      'stepByStep excede 5 items: 6 items'
    );
  });

  test('allows stepByStep with exactly 5 items', () => {
    const exactSteps = ['Paso 1', 'Paso 2', 'Paso 3', 'Paso 4', 'Paso 5'];

    const result = buildMetadata('Mensaje', 'Explicación', exactSteps, {});

    expect(result.stepByStep).toEqual(exactSteps);
  });

  test('throws error if any stepByStep item exceeds 80 chars', () => {
    const longStep = 'a'.repeat(81);

    expect(() => buildMetadata('Mensaje', 'Explicación', [longStep], {})).toThrow(
      'stepByStep[0] excede 80 caracteres: 81 chars'
    );
  });

  test('throws error with correct index for long step', () => {
    const longStep = 'a'.repeat(81);
    const steps = ['Short', 'Also short', longStep];

    expect(() => buildMetadata('Mensaje', 'Explicación', steps, {})).toThrow(
      'stepByStep[2] excede 80 caracteres: 81 chars'
    );
  });

  test('allows stepByStep items exactly 80 chars', () => {
    const exactStep = 'a'.repeat(80);

    const result = buildMetadata('Mensaje', 'Explicación', [exactStep], {});

    expect(result.stepByStep[0]).toBe(exactStep);
  });

  test('allows empty hints object', () => {
    const result = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {});

    expect(result.hints).toEqual({});
  });

  test('allows partial hints object', () => {
    const result = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {
      nextSteps: 'Solo next steps',
    });

    expect(result.hints).toEqual({ nextSteps: 'Solo next steps' });
  });

  test('supports all cognitiveLevel values', () => {
    const simple = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {}, 'simple');
    expect(simple.cognitiveLevel).toBe('simple');

    const medium = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {}, 'medium');
    expect(medium.cognitiveLevel).toBe('medium');

    const advanced = buildMetadata('Mensaje', 'Explicación', ['Paso 1'], {}, 'advanced');
    expect(advanced.cognitiveLevel).toBe('advanced');
  });

  test('validates all constraints together', () => {
    // Create strings with exact length limits
    const plainLanguage100 = 'a'.repeat(100);
    const explanation300 = 'b'.repeat(300);
    const step80 = 'c'.repeat(80);

    const validMetadata = buildMetadata(
      plainLanguage100,
      explanation300,
      [step80, step80, step80, step80, step80],
      {
        ifError: 'Error hint',
        commonMistakes: ['Mistake 1', 'Mistake 2'],
        nextSteps: 'Next steps',
      },
      'medium',
      true
    );

    expect(validMetadata.plainLanguage.length).toBe(100);
    expect(validMetadata.explanation.length).toBe(300);
    expect(validMetadata.stepByStep.length).toBe(5);
    expect(validMetadata.stepByStep[0]?.length).toBe(80);
    expect(validMetadata.stepByStep[4]?.length).toBe(80);
  });
});
