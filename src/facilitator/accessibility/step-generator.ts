/**
 * Generador de stepByStep mejorado con timestamps, iconos y estados
 *
 * CRÍTICO: Los pasos ayudan al usuario a entender el flujo de la operación
 * de forma visual y temporal.
 *
 * Mejora #1: Restaurar stepByStep con timestamps, iconos y estados
 */

import type { AccessibleStepV3, CognitiveLevelV3 } from '../types';

/**
 * Iconos por tipo de paso
 */
export const STEP_ICONS = {
  received: '📥',
  validated: '✓',
  verified: '🔐',
  broadcast: '📡',
  pending: '⏳',
  confirmed: '✅',
  failed: '❌',
  processing: '⚙️',
  waiting: '⏸️',
  completed: '🎯',
} as const;

/**
 * Genera steps contextuales según el escenario
 *
 * @param scenario - Tipo de operación ('verify', 'settle')
 * @param level - Nivel cognitivo del usuario
 * @param language - Idioma ('es', 'en')
 * @param includeTimestamps - Si incluir timestamps relativos
 * @returns Array de pasos con iconos, estados y contexto
 */
export function generateSteps(
  scenario: string,
  level: CognitiveLevelV3,
  language: string = 'es',
  includeTimestamps: boolean = true
): AccessibleStepV3[] {
  if (scenario.includes('verify')) {
    return generateVerifySteps(level, language, includeTimestamps);
  }

  if (scenario.includes('settle')) {
    return generateSettleSteps(level, language, includeTimestamps);
  }

  // Fallback: steps genéricos
  return generateGenericSteps(level, language, includeTimestamps);
}

/**
 * Steps para operación de verificación
 */
function generateVerifySteps(
  level: CognitiveLevelV3,
  language: string,
  includeTimestamps: boolean
): AccessibleStepV3[] {
  if (language === 'en') {
    return generateVerifyStepsEN(level, includeTimestamps);
  }

  const baseTime = new Date();
  const steps: AccessibleStepV3[] = [];

  if (level === 'beginner') {
    steps.push({
      step: 1,
      text: 'Recibimos tu pago',
      icon: STEP_ICONS.received,
      context: 'El sistema capturó tu solicitud de pago',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Revisamos que todo esté correcto',
      icon: STEP_ICONS.validated,
      context: 'Verificamos la cantidad y la cuenta destino',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Confirmamos que es seguro',
      icon: STEP_ICONS.verified,
      context: 'Comprobamos la firma digital (como tu contraseña)',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 4,
      text: 'Listo para enviar',
      icon: STEP_ICONS.completed,
      context: 'El pago está validado, puedes hacer el "broadcast" cuando quieras',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
      estimatedTime: 'Inmediato (ya está listo)',
    });
  } else if (level === 'simple') {
    steps.push({
      step: 1,
      text: 'Transacción recibida',
      icon: STEP_ICONS.received,
      context: 'El facilitador recibió la transacción BSV',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Firma digital verificada',
      icon: STEP_ICONS.verified,
      context: 'Validación criptográfica exitosa',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Monto y dirección validados',
      icon: STEP_ICONS.validated,
      context: 'Coinciden con PaymentRequirements',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });
  } else {
    // medium, advanced, expert
    steps.push({
      step: 1,
      text: 'Transacción parseada',
      icon: STEP_ICONS.processing,
      context: 'Formato BSV validado con @bsv/sdk',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Firma ECDSA verificada',
      icon: STEP_ICONS.verified,
      context: 'Validación criptográfica según BIP-137',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Outputs validados contra PaymentRequirements',
      icon: STEP_ICONS.validated,
      context: 'payTo y maxAmountRequired coinciden',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });
  }

  return steps;
}

/**
 * Steps para operación de verificación (inglés)
 */
function generateVerifyStepsEN(
  level: CognitiveLevelV3,
  includeTimestamps: boolean
): AccessibleStepV3[] {
  const baseTime = new Date();
  const steps: AccessibleStepV3[] = [];

  if (level === 'beginner') {
    steps.push({
      step: 1,
      text: 'We received your payment',
      icon: STEP_ICONS.received,
      context: 'The system captured your payment request',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'We checked everything is correct',
      icon: STEP_ICONS.validated,
      context: 'We verified the amount and destination account',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'We confirmed it is safe',
      icon: STEP_ICONS.verified,
      context: 'We verified the digital signature (like your password)',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 4,
      text: 'Ready to send',
      icon: STEP_ICONS.completed,
      context: 'Payment is validated, you can broadcast when ready',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
      estimatedTime: 'Immediate (already ready)',
    });
  } else if (level === 'simple') {
    steps.push({
      step: 1,
      text: 'Transaction received',
      icon: STEP_ICONS.received,
      context: 'Facilitator received BSV transaction',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Digital signature verified',
      icon: STEP_ICONS.verified,
      context: 'Cryptographic validation successful',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Amount and address validated',
      icon: STEP_ICONS.validated,
      context: 'Match PaymentRequirements',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });
  } else {
    steps.push({
      step: 1,
      text: 'Transaction parsed',
      icon: STEP_ICONS.processing,
      context: 'BSV format validated with @bsv/sdk',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'ECDSA signature verified',
      icon: STEP_ICONS.verified,
      context: 'Cryptographic validation per BIP-137',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Outputs validated against PaymentRequirements',
      icon: STEP_ICONS.validated,
      context: 'payTo and maxAmountRequired match',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });
  }

  return steps;
}

/**
 * Steps para operación de settlement
 */
function generateSettleSteps(
  level: CognitiveLevelV3,
  language: string,
  includeTimestamps: boolean
): AccessibleStepV3[] {
  if (language === 'en') {
    return generateSettleStepsEN(level, includeTimestamps);
  }

  const baseTime = new Date();
  const steps: AccessibleStepV3[] = [];

  if (level === 'beginner') {
    steps.push({
      step: 1,
      text: 'Transacción recibida y validada',
      icon: STEP_ICONS.validated,
      context: 'Verificamos que todo esté correcto',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Firma criptográfica verificada',
      icon: STEP_ICONS.verified,
      context: 'Comprobamos tu autorización',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Broadcast a la red BSV',
      icon: STEP_ICONS.broadcast,
      context: 'Enviamos tu pago a la red Bitcoin',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 4,
      text: 'En mempool esperando confirmación',
      icon: STEP_ICONS.pending,
      context: 'Esperando a ser incluido en un bloque',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 minutos',
    });
  } else if (level === 'simple') {
    steps.push({
      step: 1,
      text: 'Transacción verificada',
      icon: STEP_ICONS.verified,
      context: 'Validación completa exitosa',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Broadcast a la blockchain',
      icon: STEP_ICONS.broadcast,
      context: 'Propagada a la red BSV',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'En mempool',
      icon: STEP_ICONS.pending,
      context: 'Esperando confirmación en el próximo bloque',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 minutos',
    });
  } else {
    // medium, advanced, expert
    steps.push({
      step: 1,
      text: 'Pre-broadcast validation',
      icon: STEP_ICONS.verified,
      context: 'Verificación completa ECDSA + outputs',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Broadcast vía WhatsOnChain API',
      icon: STEP_ICONS.broadcast,
      context: 'POST /tx/raw con retry exponencial',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Txid confirmado en mempool',
      icon: STEP_ICONS.pending,
      context: 'Esperando inclusión en bloque',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 min (1 bloque BSV)',
    });
  }

  return steps;
}

/**
 * Steps para operación de settlement (inglés)
 */
function generateSettleStepsEN(
  level: CognitiveLevelV3,
  includeTimestamps: boolean
): AccessibleStepV3[] {
  const baseTime = new Date();
  const steps: AccessibleStepV3[] = [];

  if (level === 'beginner') {
    steps.push({
      step: 1,
      text: 'Transaction received and validated',
      icon: STEP_ICONS.validated,
      context: 'We verified everything is correct',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Cryptographic signature verified',
      icon: STEP_ICONS.verified,
      context: 'We verified your authorization',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Broadcast to BSV network',
      icon: STEP_ICONS.broadcast,
      context: 'We sent your payment to the Bitcoin network',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 4,
      text: 'In mempool waiting for confirmation',
      icon: STEP_ICONS.pending,
      context: 'Waiting to be included in a block',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 minutes',
    });
  } else if (level === 'simple') {
    steps.push({
      step: 1,
      text: 'Transaction verified',
      icon: STEP_ICONS.verified,
      context: 'Complete validation successful',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Broadcast to blockchain',
      icon: STEP_ICONS.broadcast,
      context: 'Propagated to BSV network',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'In mempool',
      icon: STEP_ICONS.pending,
      context: 'Waiting for confirmation in next block',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 minutes',
    });
  } else {
    steps.push({
      step: 1,
      text: 'Pre-broadcast validation',
      icon: STEP_ICONS.verified,
      context: 'Complete ECDSA + outputs verification',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 2,
      text: 'Broadcast via WhatsOnChain API',
      icon: STEP_ICONS.broadcast,
      context: 'POST /tx/raw with exponential retry',
      timestamp: includeTimestamps ? addSeconds(baseTime, 2).toISOString() : undefined,
      status: 'completed',
    });

    steps.push({
      step: 3,
      text: 'Txid confirmed in mempool',
      icon: STEP_ICONS.pending,
      context: 'Waiting for block inclusion',
      timestamp: includeTimestamps ? addSeconds(baseTime, 3).toISOString() : undefined,
      status: 'pending',
      estimatedTime: '~10 min (1 BSV block)',
    });
  }

  return steps;
}

/**
 * Steps genéricos (fallback)
 */
function generateGenericSteps(
  _level: CognitiveLevelV3,
  language: string,
  includeTimestamps: boolean
): AccessibleStepV3[] {
  const baseTime = new Date();
  const isSpanish = language === 'es';

  const steps: AccessibleStepV3[] = [
    {
      step: 1,
      text: isSpanish ? 'Operación recibida' : 'Operation received',
      icon: STEP_ICONS.received,
      context: isSpanish ? 'El sistema capturó la solicitud' : 'System captured the request',
      timestamp: includeTimestamps ? baseTime.toISOString() : undefined,
      status: 'completed',
    },
    {
      step: 2,
      text: isSpanish ? 'Procesamiento completado' : 'Processing completed',
      icon: STEP_ICONS.completed,
      context: isSpanish ? 'La operación finalizó exitosamente' : 'Operation finished successfully',
      timestamp: includeTimestamps ? addSeconds(baseTime, 1).toISOString() : undefined,
      status: 'completed',
    },
  ];

  return steps;
}

/**
 * Helper: Añade segundos a una fecha
 */
function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
