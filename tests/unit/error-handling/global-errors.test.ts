import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGlobalError } from '../../../src/utils/error-handler';
import type { AccessibleErrorResponse } from '../../../src/types/accessibility';

describe('Global Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleGlobalError', () => {
    it('should handle Error instances with accessible format', () => {
      const error = new Error('Test error message');
      const result = handleGlobalError(error);

      expect(result).toMatchObject({
        error: expect.any(String),
        metadata: {
          accessible: {
            plainLanguage: expect.any(String),
            explanation: expect.any(String),
            stepByStep: expect.any(Array),
          },
          i18n: {
            lang: 'es',
          },
        },
      });

      expect(result.metadata.accessible.plainLanguage.length).toBeLessThanOrEqual(100);
      expect(result.metadata.accessible.explanation.length).toBeLessThanOrEqual(300);
      expect(result.metadata.accessible.stepByStep.length).toBeLessThanOrEqual(5);
    });

    it('should handle string errors', () => {
      const error = 'Simple string error';
      const result = handleGlobalError(error);

      expect(result).toMatchObject({
        error: expect.any(String),
        metadata: expect.any(Object),
      });
    });

    it('should handle unknown error types', () => {
      const error = { custom: 'object' };
      const result = handleGlobalError(error);

      expect(result).toMatchObject({
        error: expect.any(String),
        metadata: expect.any(Object),
      });
      // El error puede ser la representación JSON del objeto
      expect(result.error).toBeTruthy();
    });

    it('should handle null/undefined errors', () => {
      const resultNull = handleGlobalError(null);
      const resultUndefined = handleGlobalError(undefined);

      expect(resultNull.error).toContain('Error desconocido');
      expect(resultUndefined.error).toContain('Error desconocido');
    });

    it('should include error details in metadata', () => {
      const error = new Error('Specific error message');
      const result = handleGlobalError(error);

      expect(result.metadata.accessible.explanation).toContain('error');
    });

    it('should provide actionable steps in stepByStep', () => {
      const error = new Error('Test error');
      const result = handleGlobalError(error);

      expect(result.metadata.accessible.stepByStep.length).toBeGreaterThan(0);
      result.metadata.accessible.stepByStep.forEach((step: string) => {
        expect(step.length).toBeLessThanOrEqual(80);
        expect(step.length).toBeGreaterThan(0);
      });
    });

    it('should handle network errors specifically', () => {
      const error = new Error('Network request failed');
      const result = handleGlobalError(error);

      // Debe mencionar problemas de conexión o servicio
      const message = result.metadata.accessible.plainLanguage.toLowerCase();
      expect(
        message.includes('conexión') || message.includes('conectar') || message.includes('servicio')
      ).toBe(true);
    });

    it('should handle validation errors specifically', () => {
      const error = new Error('Validation failed: invalid input');
      const result = handleGlobalError(error);

      expect(result.metadata.accessible.plainLanguage).toContain('dato');
    });

    it('should handle authentication errors specifically', () => {
      const error = new Error('Unauthorized access');
      const result = handleGlobalError(error);

      expect(result.metadata.accessible.plainLanguage).toContain('permiso');
    });

    it('should set correct HTTP status codes', () => {
      const validationError = new Error('Validation failed');
      const authError = new Error('Unauthorized');
      const genericError = new Error('Something went wrong');

      const validationResult = handleGlobalError(validationError);
      const authResult = handleGlobalError(authError);
      const genericResult = handleGlobalError(genericError);

      expect(validationResult.status).toBe(400);
      expect(authResult.status).toBe(401);
      expect(genericResult.status).toBe(500);
    });

    it('should not expose sensitive information in errors', () => {
      const error = new Error('Database connection failed: password=secret123');
      const result = handleGlobalError(error);

      expect(result.metadata.accessible.plainLanguage).not.toContain('password');
      expect(result.metadata.accessible.plainLanguage).not.toContain('secret123');
      expect(result.metadata.accessible.explanation).not.toContain('password');
    });

    it('should use plain Spanish without technical jargon', () => {
      const error = new Error('Test error');
      const result = handleGlobalError(error);

      const jargonTerms = ['API', 'HTTP', 'JSON', 'endpoint', 'middleware'];
      const text = result.metadata.accessible.plainLanguage.toLowerCase();

      jargonTerms.forEach((term) => {
        expect(text).not.toContain(term.toLowerCase());
      });
    });

    it('should maintain consistent error response structure', () => {
      const error = new Error('Test error');
      const result = handleGlobalError(error);

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('status');
      expect(result.metadata).toHaveProperty('accessible');
      expect(result.metadata).toHaveProperty('i18n');
      expect(result.metadata.accessible).toHaveProperty('plainLanguage');
      expect(result.metadata.accessible).toHaveProperty('explanation');
      expect(result.metadata.accessible).toHaveProperty('stepByStep');
    });

    it('should handle errors during error handling gracefully', () => {
      const weirdError = {
        toString: () => {
          throw new Error('Cannot convert to string');
        },
      };

      const result = handleGlobalError(weirdError as any);

      expect(result).toMatchObject({
        error: expect.any(String),
        metadata: expect.any(Object),
        status: expect.any(Number),
      });
    });
  });

  describe('Error Response Format', () => {
    it('should match AccessibleErrorResponse type', () => {
      const error = new Error('Test');
      const result: AccessibleErrorResponse = handleGlobalError(error);

      expect(result.error).toBeDefined();
      expect(result.metadata.accessible.plainLanguage).toBeDefined();
      expect(result.metadata.accessible.explanation).toBeDefined();
      expect(result.metadata.accessible.stepByStep).toBeDefined();
      expect(result.metadata.i18n.lang).toBe('es');
    });

    it('should be JSON serializable', () => {
      const error = new Error('Test');
      const result = handleGlobalError(error);

      expect(() => JSON.stringify(result)).not.toThrow();
      const parsed = JSON.parse(JSON.stringify(result));
      expect(parsed).toMatchObject({
        error: expect.any(String),
        metadata: expect.any(Object),
        status: expect.any(Number),
      });
    });
  });
});
