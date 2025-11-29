import { describe, test, expect } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockPaymentTransaction } from '../helpers/mockTransaction';

describe('POST /verify - Integration Tests (User Story 1)', () => {
  const validRequest = {
    payload: {
      x402Version: 1,
      scheme: 'exact' as const,
      network: 'bsv-testnet' as const,
      payload: {
        transaction: createMockPaymentTransaction('mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', 500),
      },
    },
    paymentRequirements: {
      scheme: 'exact' as const,
      network: 'bsv-testnet' as const,
      maxAmountRequired: '500',
      resource: 'https://api.example.com/resource',
      payTo: 'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', // Dirección testnet válida
      maxTimeoutSeconds: 300,
    },
  };

  // T030: POST /verify endpoint returns 200 with AccessibleResponse structure
  test('POST /verify returns 200 with AccessibleResponse structure', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    expect(res.status).toBe(200);

    const json = await res.json();

    // Verificar estructura AccessibleResponse<VerifyResponse>
    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('accessibility');

    // Verificar data (VerifyResponse)
    expect(json.data).toHaveProperty('isValid');
    expect(typeof json.data.isValid).toBe('boolean');

    // Verificar accessibility (AccessibleMetadata)
    expect(json.accessibility).toHaveProperty('plainLanguage');
    expect(json.accessibility).toHaveProperty('explanation');
    expect(json.accessibility).toHaveProperty('stepByStep');
    expect(json.accessibility).toHaveProperty('hints');
    expect(json.accessibility).toHaveProperty('language');
    expect(json.accessibility).toHaveProperty('audioFriendly');
    expect(json.accessibility).toHaveProperty('cognitiveLevel');

    // Verificar tipos
    expect(typeof json.accessibility.plainLanguage).toBe('string');
    expect(typeof json.accessibility.explanation).toBe('string');
    expect(Array.isArray(json.accessibility.stepByStep)).toBe(true);
    expect(json.accessibility.language).toBe('es');
    expect(typeof json.accessibility.audioFriendly).toBe('boolean');
    expect(['simple', 'medium', 'advanced']).toContain(json.accessibility.cognitiveLevel);
  });

  // T031: POST /verify with mainnet address returns error with clear Spanish explanation
  test('POST /verify with mainnet address returns error with clear Spanish explanation', async () => {
    const mainnetRequest = {
      ...validRequest,
      paymentRequirements: {
        ...validRequest.paymentRequirements,
        payTo: '1mmQjSi1JQEUZ35UzoPAMCZ31juaLjwhR', // Mainnet address válida (para test de rechazo)
      },
    };

    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mainnetRequest),
    });

    expect(res.status).toBe(200); // Retorna 200 pero con isValid: false

    const json = await res.json();

    expect(json.data.isValid).toBe(false);
    expect(json.data.invalidReason).toBeDefined();

    // Verificar que metadata está en español claro
    expect(json.accessibility.language).toBe('es');
    expect(json.accessibility.plainLanguage).toMatch(/testnet|red de prueba/i);
    expect(json.accessibility.explanation.length).toBeGreaterThan(0);
    expect(json.accessibility.hints.ifError).toBeDefined();
  });

  // T032: POST /verify with invalid Zod schema returns 400 with Spanish validation message
  test('POST /verify with invalid Zod schema returns 400 with Spanish validation message', async () => {
    const invalidRequest = {
      payload: {
        // Falta x402Version (requerido)
        scheme: 'exact',
        network: 'bsv-testnet',
        payload: {
          transaction: 'abc',
        },
      },
      paymentRequirements: {
        scheme: 'exact',
        network: 'bsv-testnet',
        maxAmountRequired: '500',
        resource: 'https://api.example.com/resource',
        payTo: 'mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf',
        maxTimeoutSeconds: 300,
      },
    };

    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidRequest),
    });

    expect(res.status).toBe(400);

    const json = await res.json();

    // Verificar que el mensaje de error está en español
    expect(json).toHaveProperty('error');
    // Los mensajes Zod customizados deben estar en español
    expect(JSON.stringify(json)).toMatch(/requerido|esperado|inválido/i);
  });

  // Tests adicionales de validación
  test('POST /verify with empty body returns 400', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  test('POST /verify with malformed JSON returns 400', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json{',
    });

    expect(res.status).toBe(400);
  });

  test('POST /verify metadata respects length limits', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    const json = await res.json();

    // T027: plainLanguage is ≤100 chars
    expect(json.accessibility.plainLanguage.length).toBeLessThanOrEqual(100);

    // T028: explanation is ≤300 chars
    expect(json.accessibility.explanation.length).toBeLessThanOrEqual(300);

    // T029: stepByStep has ≤5 items, each ≤80 chars
    expect(json.accessibility.stepByStep.length).toBeLessThanOrEqual(5);
    json.accessibility.stepByStep.forEach((step: string) => {
      expect(step.length).toBeLessThanOrEqual(80);
    });
  });
});
