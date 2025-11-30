import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/facilitator/index';
import { createMockPaymentTransaction } from '../helpers/mockTransaction';
import { createMockEnvV2, spyOnFetch, mockOpenAISuccess } from '../helpers/ai-mocks';

describe('POST /verify - Integration Tests (User Story 1)', () => {
  let cleanupFetch: () => void;

  beforeAll(() => {
    // Mock OpenAI API
    cleanupFetch = spyOnFetch(mockOpenAISuccess());
  });

  afterAll(() => {
    cleanupFetch();
  });

  const mockEnv = createMockEnvV2({
    AI_ENABLED: 'false', // Disable AI for deterministic tests
  });

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
    const req = new Request('http://localhost/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(200);

    const json = await res.json();

    // Verificar estructura AccessibleResponse<VerifyResponse>
    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('accessibility');

    // Verificar data (VerifyResponse)
    expect(json.data).toHaveProperty('isValid');
    expect(typeof json.data.isValid).toBe('boolean');

    // Verificar accessibility V2 (UniversalAccessibilityMetadataV2)
    expect(json.accessibility).toHaveProperty('content');
    expect(json.accessibility).toHaveProperty('language');
    expect(json.accessibility).toHaveProperty('cognitive');
    expect(json.accessibility).toHaveProperty('metadata');

    // Verificar content
    expect(json.accessibility.content).toHaveProperty('plainLanguage');
    expect(json.accessibility.content).toHaveProperty('explanation');
    expect(json.accessibility.content).toHaveProperty('stepByStep');
    expect(json.accessibility.content).toHaveProperty('hints');

    // Verificar tipos
    expect(typeof json.accessibility.content.plainLanguage).toBe('string');
    expect(typeof json.accessibility.content.explanation).toBe('string');
    expect(Array.isArray(json.accessibility.content.stepByStep)).toBe(true);
    expect(json.accessibility.language.code).toBe('es');
    expect(typeof json.accessibility.metadata.audioFriendly).toBe('boolean');
    expect(['beginner', 'simple', 'medium', 'advanced', 'expert']).toContain(json.accessibility.cognitive.level);
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

    const req = new Request('http://localhost/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mainnetRequest),
    });

    const res = await app.fetch(req, mockEnv);

    expect(res.status).toBe(200); // Retorna 200 pero con isValid: false

    const json = await res.json();

    expect(json.data.isValid).toBe(false);
    expect(json.data.invalidReason).toBeDefined();

    // Verificar que metadata está en español claro (estructura V2)
    expect(json.accessibility.language.code).toBe('es');
    // El mensaje debe hablar de dirección inválida o incompatible
    expect(json.accessibility.content.plainLanguage).toMatch(/dirección|address|inválid|incompatible/i);
    expect(json.accessibility.content.explanation.length).toBeGreaterThan(0);
    expect(json.accessibility.content.hints.ifError).toBeDefined();
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
    const req = new Request('http://localhost/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validRequest),
    });

    const res = await app.fetch(req, mockEnv);
    const json = await res.json();

    // T027: plainLanguage is ≤100 chars (estructura V2)
    expect(json.accessibility.content.plainLanguage.length).toBeLessThanOrEqual(100);

    // T028: explanation is ≤300 chars
    expect(json.accessibility.content.explanation.length).toBeLessThanOrEqual(300);

    // T029: stepByStep has ≤5 items, each ≤80 chars (V2 uses AccessibleStepV2[])
    expect(json.accessibility.content.stepByStep.length).toBeLessThanOrEqual(5);
    json.accessibility.content.stepByStep.forEach((step: { text: string }) => {
      expect(step.text.length).toBeLessThanOrEqual(80);
    });
  });
});
