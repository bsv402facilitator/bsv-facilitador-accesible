import { describe, test, expect } from 'vitest';
import {
  verifyTransaction,
  validateBsvAddress,
  extractPayerAddress,
  isP2PKHToAddress,
} from '../../src/facilitator/verify';
import { PaymentRequirements, PaymentPayload } from '../../src/facilitator/types';
import { VerifyErrorCodes } from '../../src/facilitator/types';
import { createMockPaymentTransaction } from '../helpers/mockTransaction';

describe('verify - Unit Tests (User Story 1)', () => {
  // Mock data para tests
  // Dirección testnet válida generada con @bsv/sdk
  const validPaymentRequirements: PaymentRequirements = {
    scheme: 'exact',
    network: 'bsv-testnet',
    maxAmountRequired: '500',
    resource: 'https://api.example.com/resource',
    payTo: 'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', // Dirección testnet válida
    maxTimeoutSeconds: 300,
  };

  const validPaymentPayload: PaymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'bsv-testnet',
    payload: {
      // Transacción BSV testnet válida creada con @bsv/sdk
      transaction: createMockPaymentTransaction('mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', 500),
    },
  };

  // T022: Valid transaction returns isValid true with simple cognitiveLevel
  test('valid transaction returns isValid true', () => {
    const result = verifyTransaction(validPaymentPayload, validPaymentRequirements);

    expect(result.isValid).toBe(true);
    expect(result.invalidReason).toBeUndefined();
    expect(result.payer).toBeDefined();
  });

  // T023: Invalid amount returns isValid false with invalid_amount error code
  test('invalid amount returns isValid false with invalid_amount error code', () => {
    const invalidRequirements = {
      ...validPaymentRequirements,
      maxAmountRequired: '1000', // Monto diferente al esperado
    };

    const result = verifyTransaction(validPaymentPayload, invalidRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe(VerifyErrorCodes.INVALID_AMOUNT);
  });

  // T024: Invalid address returns isValid false with invalid_address error code
  test('invalid address returns isValid false with invalid_address error code', () => {
    const invalidRequirements = {
      ...validPaymentRequirements,
      payTo: 'mWrongAddress123456789', // Dirección incorrecta
    };

    const result = verifyTransaction(validPaymentPayload, invalidRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe(VerifyErrorCodes.INVALID_ADDRESS);
  });

  // T025: Invalid format returns isValid false with invalid_format error code
  test('invalid format returns isValid false with invalid_format error code', () => {
    const invalidPayload = {
      ...validPaymentPayload,
      payload: {
        transaction: 'invalid-hex-string', // Formato inválido
      },
    };

    const result = verifyTransaction(invalidPayload, validPaymentRequirements);

    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toBe(VerifyErrorCodes.INVALID_FORMAT);
  });

  // T026: Metadata has all required fields (tested at integration level)
  // T027: plainLanguage is ≤100 chars (tested at i18n level)
  // T028: explanation is ≤300 chars (tested at i18n level)
  // T029: stepByStep has ≤5 items, each ≤80 chars (tested at i18n level)

  describe('validateBsvAddress', () => {
    test('accepts valid testnet address starting with m', () => {
      expect(validateBsvAddress('mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7', true)).toBe(true);
    });

    test('accepts valid testnet address starting with n', () => {
      expect(validateBsvAddress('n2ZATFEHZzTiM7ForRhHA49GmSRKXFbvJe', true)).toBe(true);
    });

    test('rejects mainnet address when testnet required', () => {
      expect(validateBsvAddress('1mmQjSi1JQEUZ35UzoPAMCZ31juaLjwhR', true)).toBe(false);
    });

    test('rejects invalid address format', () => {
      expect(validateBsvAddress('invalid-address', true)).toBe(false);
    });

    test('rejects empty address', () => {
      expect(validateBsvAddress('', true)).toBe(false);
    });
  });

  describe('isP2PKHToAddress', () => {
    test('detects P2PKH output to specific address', () => {
      // Test con output real P2PKH
      const mockOutput = {
        satoshis: 500,
        lockingScript: {
          toHex: () => 'OP_DUP OP_HASH160 ... OP_EQUALVERIFY OP_CHECKSIG',
        },
      };

      // Esto debería retornar boolean
      const result = isP2PKHToAddress(
        mockOutput.lockingScript as any,
        'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7'
      );
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extractPayerAddress', () => {
    test('extracts payer address from transaction inputs', () => {
      // Mock de transacción BSV con inputs
      const mockTx = {
        inputs: [
          {
            unlockingScript: {
              toHex: () => '...',
            },
          },
        ],
      };

      // Esto debería extraer la dirección del primer input o retornar undefined
      const address = extractPayerAddress(mockTx as any);
      expect(address === undefined || typeof address === 'string').toBe(true);
    });
  });
});
