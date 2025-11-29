import type { AccessibleErrorResponse } from '../types/accessibility';
import { buildMetadata } from '../facilitator/accessibility/metadata';

/**
 * Determina el código de estado HTTP basado en el tipo de error
 */
function getStatusCode(error: unknown): number {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Errores de cliente (4xx)
    if (
      message.includes('malformed json') ||
      message.includes('unexpected token') ||
      message.includes('json')
    ) {
      return 400;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 400;
    }
    if (message.includes('unauthorized') || message.includes('permiso')) {
      return 401;
    }
    if (message.includes('forbidden')) {
      return 403;
    }
    if (message.includes('not found')) {
      return 404;
    }
  }

  return 500;
}

/**
 * Detecta el tipo de error y genera mensajes apropiados
 */
function categorizeError(error: unknown): {
  plainLanguage: string;
  explanation: string;
  stepByStep: string[];
} {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Error de red
    if (message.includes('network') || message.includes('conexión')) {
      return {
        plainLanguage: 'No se pudo conectar con el servicio',
        explanation:
          'Hubo un problema al intentar comunicarse con el servidor. Esto puede deberse a una falta de conexión a internet o a que el servicio no está disponible en este momento.',
        stepByStep: [
          'Verifica tu conexión a internet',
          'Espera unos minutos e intenta nuevamente',
          'Si el problema persiste, contacta soporte',
        ],
      };
    }

    // Error de validación
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        plainLanguage: 'Los datos proporcionados no son correctos',
        explanation:
          'La información que ingresaste no cumple con los requisitos necesarios. Por favor, revisa que todos los campos estén completos y sean válidos.',
        stepByStep: [
          'Revisa que todos los campos estén completos',
          'Verifica que los datos sean del formato correcto',
          'Intenta enviar la información nuevamente',
        ],
      };
    }

    // Error de autenticación
    if (message.includes('unauthorized') || message.includes('auth')) {
      return {
        plainLanguage: 'No tienes permiso para realizar esta acción',
        explanation:
          'Tu sesión puede haber expirado o no tienes los permisos necesarios para realizar esta operación.',
        stepByStep: [
          'Verifica que hayas iniciado sesión',
          'Intenta cerrar sesión y volver a ingresar',
          'Contacta soporte si necesitas permisos especiales',
        ],
      };
    }
  }

  // Error genérico
  return {
    plainLanguage: 'Ocurrió un problema inesperado',
    explanation:
      'El sistema encontró un error que no pudo procesar. Este problema ha sido registrado y será revisado por el equipo técnico.',
    stepByStep: [
      'Intenta realizar la acción nuevamente',
      'Si el error persiste, espera unos minutos',
      'Contacta soporte si el problema continúa',
    ],
  };
}

/**
 * Sanitiza el mensaje de error para evitar exponer información sensible
 */
function sanitizeErrorMessage(error: unknown): string {
  let message = 'Error desconocido';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    message = JSON.stringify(error);
  }

  // Eliminar información sensible
  const sensitivePatterns = [
    /password[=:]\s*\S+/gi,
    /token[=:]\s*\S+/gi,
    /api[_-]?key[=:]\s*\S+/gi,
    /secret[=:]\s*\S+/gi,
    /bearer\s+\S+/gi,
  ];

  sensitivePatterns.forEach((pattern) => {
    message = message.replace(pattern, '[REDACTED]');
  });

  return message;
}

/**
 * Maneja errores globales y los convierte en respuestas accesibles
 */
export function handleGlobalError(error: unknown): AccessibleErrorResponse & { status: number } {
  try {
    const sanitizedMessage = sanitizeErrorMessage(error);
    const { plainLanguage, explanation, stepByStep } = categorizeError(error);
    const status = getStatusCode(error);

    const metadata = buildMetadata(plainLanguage, explanation, stepByStep, {
      ifError: 'Revisa los detalles del error y contacta soporte si es necesario',
      nextSteps: 'Intenta realizar la operación nuevamente',
    });

    return {
      error: sanitizedMessage,
      metadata: {
        accessible: metadata,
        i18n: {
          lang: 'es',
        },
      },
      status,
    };
  } catch {
    // Fallback si falla el manejo de errores
    return {
      error: 'Error del sistema',
      metadata: {
        accessible: {
          plainLanguage: 'Ocurrió un problema en el sistema',
          explanation: 'El sistema encontró un error y no pudo procesarlo correctamente.',
          stepByStep: ['Intenta nuevamente más tarde', 'Contacta soporte si el problema persiste'],
          hints: {},
          language: 'es',
          audioFriendly: true,
          cognitiveLevel: 'simple' as const,
        },
        i18n: {
          lang: 'es',
        },
      },
      status: 500,
    };
  }
}
