/**
 * Generador de checkpoints de comprensión contextuales
 *
 * CRÍTICO: Los checkpoints validan que el usuario entienda conceptos clave
 * y previenen errores comunes en el uso del sistema X402.
 *
 * Mejora #2: Poblar checkpoints de comprensión
 */

import type { ComprehensionCheckpointV3, CognitiveLevelV3, MetadataContext } from '../types';

/**
 * Checkpoint extendido con propiedades adicionales
 */
export interface EnhancedCheckpoint extends ComprehensionCheckpointV3 {
  glossaryRef?: string; // Referencia a término del glosario
  actionLink?: string; // Link para verificar (ej: WoC explorer)
  importance?: 'low' | 'medium' | 'high';
  safeguard?: string; // Advertencia de seguridad
}

/**
 * Genera checkpoints contextuales según el escenario y nivel cognitivo
 *
 * @param scenario - Tipo de operación ('verify', 'settle', 'error')
 * @param context - Contexto de la operación (txid, amount, etc.)
 * @param level - Nivel cognitivo del usuario
 * @param language - Idioma ('es', 'en')
 * @returns Array de checkpoints adaptados al contexto
 */
export function generateCheckpoints(
  scenario: string,
  context: MetadataContext,
  level: CognitiveLevelV3,
  language: string = 'es'
): EnhancedCheckpoint[] {
  const checkpoints: EnhancedCheckpoint[] = [];

  // Checkpoints específicos por escenario
  if (scenario.includes('verify')) {
    checkpoints.push(...generateVerifyCheckpoints(level, language));
  }

  if (scenario.includes('settle')) {
    checkpoints.push(...generateSettleCheckpoints(context, level, language));
  }

  if (scenario.includes('error')) {
    checkpoints.push(...generateErrorCheckpoints(level, language));
  }

  // Limitar a 3-5 checkpoints según nivel
  const maxCheckpoints = level === 'beginner' ? 3 : level === 'simple' ? 4 : 5;
  return checkpoints.slice(0, maxCheckpoints);
}

/**
 * Checkpoints para operación de verificación
 */
function generateVerifyCheckpoints(
  level: CognitiveLevelV3,
  language: string
): EnhancedCheckpoint[] {
  if (language === 'en') {
    return generateVerifyCheckpointsEN(level);
  }

  const checkpoints: EnhancedCheckpoint[] = [];

  if (level === 'beginner') {
    checkpoints.push({
      question: '¿Qué significa que el pago fue "verificado"?',
      expectedAnswer:
        'Significa que el sistema revisó que todo esté correcto, pero aún NO se ha enviado',
      hint: 'Piensa en esto como revisar que un sobre tenga la dirección correcta antes de echarlo al buzón',
      importance: 'high',
      safeguard: 'Verificar NO envía el pago, solo lo valida',
    });

    checkpoints.push({
      question: '¿Ya se envió el dinero a la blockchain?',
      expectedAnswer: 'No, solo se verificó. El envío ocurre con el "broadcast"',
      hint: 'Verificar ≠ Enviar. Son dos pasos diferentes',
      importance: 'high',
      safeguard: 'No confundir verificación con envío',
    });
  } else if (level === 'simple') {
    checkpoints.push({
      question: '¿Cuál es la diferencia entre verificar y broadcast?',
      expectedAnswer: 'Verificar valida la transacción sin enviarla. Broadcast la envía a la red',
      hint: 'Son dos operaciones distintas en el flujo X402',
      importance: 'high',
      glossaryRef: 'broadcast',
    });

    checkpoints.push({
      question: '¿Qué se valida en la verificación?',
      expectedAnswer: 'Se valida la firma digital, el monto y la dirección de destino',
      hint: 'La verificación revisa que todo esté correcto antes de enviar',
      importance: 'medium',
    });
  } else {
    // medium, advanced, expert
    checkpoints.push({
      question: '¿Qué valida el facilitador en /verify?',
      expectedAnswer:
        'Valida firma ECDSA, outputs según PaymentRequirements, y formato de transacción BSV',
      hint: 'Verificación criptográfica completa sin broadcast',
      importance: 'medium',
      glossaryRef: 'firma digital',
    });
  }

  return checkpoints;
}

/**
 * Checkpoints para operación de verificación (inglés)
 */
function generateVerifyCheckpointsEN(level: CognitiveLevelV3): EnhancedCheckpoint[] {
  const checkpoints: EnhancedCheckpoint[] = [];

  if (level === 'beginner') {
    checkpoints.push({
      question: 'What does it mean that the payment was "verified"?',
      expectedAnswer: 'It means the system checked everything is correct, but it has NOT been sent yet',
      hint: 'Think of it as checking an envelope has the right address before mailing it',
      importance: 'high',
      safeguard: 'Verify does NOT send the payment, it only validates it',
    });

    checkpoints.push({
      question: 'Has the money been sent to the blockchain?',
      expectedAnswer: 'No, it was only verified. Sending happens with "broadcast"',
      hint: 'Verify ≠ Send. They are two different steps',
      importance: 'high',
      safeguard: "Don't confuse verification with sending",
    });
  } else if (level === 'simple') {
    checkpoints.push({
      question: 'What is the difference between verify and broadcast?',
      expectedAnswer: 'Verify validates the transaction without sending it. Broadcast sends it to the network',
      hint: 'They are two distinct operations in the X402 flow',
      importance: 'high',
      glossaryRef: 'broadcast',
    });
  } else {
    checkpoints.push({
      question: 'What does the facilitator validate in /verify?',
      expectedAnswer: 'It validates ECDSA signature, outputs per PaymentRequirements, and BSV transaction format',
      hint: 'Complete cryptographic verification without broadcast',
      importance: 'medium',
      glossaryRef: 'digital signature',
    });
  }

  return checkpoints;
}

/**
 * Checkpoints para operación de settlement
 */
function generateSettleCheckpoints(
  context: MetadataContext,
  level: CognitiveLevelV3,
  language: string
): EnhancedCheckpoint[] {
  if (language === 'en') {
    return generateSettleCheckpointsEN(context, level);
  }

  const checkpoints: EnhancedCheckpoint[] = [];

  // Checkpoint sobre txid (CRÍTICO - siempre incluir)
  checkpoints.push({
    question: '¿Entiendes qué es un txid?',
    expectedAnswer: 'Es el identificador único de tu transacción',
    hint: 'Es como un número de seguimiento para tu pago',
    glossaryRef: 'txid',
    actionLink: context.txid ? `https://whatsonchain.com/tx/${context.txid}` : undefined,
    importance: 'high',
  });

  if (level === 'beginner') {
    checkpoints.push({
      question: '¿El dinero ya llegó a su destino?',
      expectedAnswer: 'Está en camino - aparecerá en el libro de pagos en ~10 minutos',
      hint: 'Las transacciones Bitcoin se confirman en bloques que aparecen cada 10 minutos aproximadamente',
      importance: 'medium',
      glossaryRef: 'confirmación',
    });

    checkpoints.push({
      question: '¿Guardaste tu txid?',
      expectedAnswer: 'Sí, es importante guardarlo para futuras referencias',
      hint: 'El txid es tu comprobante de pago',
      importance: 'high',
      safeguard: 'Siempre guarda el txid para futuras referencias',
    });
  } else if (level === 'simple') {
    checkpoints.push({
      question: '¿Cuánto tiempo tarda la confirmación en la blockchain?',
      expectedAnswer: 'Aproximadamente 10 minutos (un bloque BSV)',
      hint: 'Los bloques BSV se minan cada ~10 minutos en promedio',
      importance: 'medium',
      glossaryRef: 'blockchain',
    });
  } else {
    // medium, advanced, expert
    checkpoints.push({
      question: '¿Qué significa que la transacción esté en mempool?',
      expectedAnswer: 'Está esperando ser incluida en el próximo bloque minado',
      hint: 'El mempool es la cola de transacciones pendientes',
      importance: 'medium',
      glossaryRef: 'mempool',
    });
  }

  return checkpoints;
}

/**
 * Checkpoints para operación de settlement (inglés)
 */
function generateSettleCheckpointsEN(
  context: MetadataContext,
  level: CognitiveLevelV3
): EnhancedCheckpoint[] {
  const checkpoints: EnhancedCheckpoint[] = [];

  // Checkpoint sobre txid (CRÍTICO - siempre incluir)
  checkpoints.push({
    question: 'Do you understand what a txid is?',
    expectedAnswer: "It's the unique identifier of your transaction",
    hint: "It's like a tracking number for your payment",
    glossaryRef: 'txid',
    actionLink: context.txid ? `https://whatsonchain.com/tx/${context.txid}` : undefined,
    importance: 'high',
  });

  if (level === 'beginner') {
    checkpoints.push({
      question: 'Has the money arrived at its destination?',
      expectedAnswer: "It's on its way - it will appear in the ledger in ~10 minutes",
      hint: 'Bitcoin transactions are confirmed in blocks that appear approximately every 10 minutes',
      importance: 'medium',
      glossaryRef: 'confirmation',
    });

    checkpoints.push({
      question: 'Did you save your txid?',
      expectedAnswer: 'Yes, it is important to save it for future reference',
      hint: 'The txid is your payment receipt',
      importance: 'high',
      safeguard: 'Always save the txid for future reference',
    });
  } else if (level === 'simple') {
    checkpoints.push({
      question: 'How long does blockchain confirmation take?',
      expectedAnswer: 'Approximately 10 minutes (one BSV block)',
      hint: 'BSV blocks are mined approximately every ~10 minutes on average',
      importance: 'medium',
      glossaryRef: 'blockchain',
    });
  } else {
    checkpoints.push({
      question: 'What does it mean that the transaction is in mempool?',
      expectedAnswer: 'It is waiting to be included in the next mined block',
      hint: 'The mempool is the queue of pending transactions',
      importance: 'medium',
      glossaryRef: 'mempool',
    });
  }

  return checkpoints;
}

/**
 * Checkpoints para escenarios de error
 */
function generateErrorCheckpoints(
  level: CognitiveLevelV3,
  language: string
): EnhancedCheckpoint[] {
  if (language === 'en') {
    return generateErrorCheckpointsEN(level);
  }

  const checkpoints: EnhancedCheckpoint[] = [];

  if (level === 'beginner' || level === 'simple') {
    checkpoints.push({
      question: '¿Entiendes por qué falló la operación?',
      expectedAnswer: 'Sí, leí la explicación del error',
      hint: 'La explicación incluye pasos para resolver el problema',
      importance: 'high',
    });

    checkpoints.push({
      question: '¿Sabes qué hacer para resolver el error?',
      expectedAnswer: 'Sí, seguiré los pasos sugeridos',
      hint: 'Si tienes dudas, contacta soporte con el mensaje de error',
      importance: 'high',
      safeguard: 'No reintentes sin entender el problema',
    });
  } else {
    checkpoints.push({
      question: '¿Identificaste la causa raíz del error?',
      expectedAnswer: 'Sí, entiendo qué causó el fallo',
      hint: 'Revisa los detalles técnicos en la respuesta',
      importance: 'medium',
    });
  }

  return checkpoints;
}

/**
 * Checkpoints para escenarios de error (inglés)
 */
function generateErrorCheckpointsEN(level: CognitiveLevelV3): EnhancedCheckpoint[] {
  const checkpoints: EnhancedCheckpoint[] = [];

  if (level === 'beginner' || level === 'simple') {
    checkpoints.push({
      question: 'Do you understand why the operation failed?',
      expectedAnswer: 'Yes, I read the error explanation',
      hint: 'The explanation includes steps to solve the problem',
      importance: 'high',
    });

    checkpoints.push({
      question: 'Do you know what to do to resolve the error?',
      expectedAnswer: 'Yes, I will follow the suggested steps',
      hint: 'If you have doubts, contact support with the error message',
      importance: 'high',
      safeguard: "Don't retry without understanding the problem",
    });
  } else {
    checkpoints.push({
      question: 'Did you identify the root cause of the error?',
      expectedAnswer: 'Yes, I understand what caused the failure',
      hint: 'Review the technical details in the response',
      importance: 'medium',
    });
  }

  return checkpoints;
}

/**
 * Convierte EnhancedCheckpoint a ComprehensionCheckpointV3
 * (remueve campos extendidos que no están en el tipo base)
 */
export function toBaseCheckpoint(checkpoint: EnhancedCheckpoint): ComprehensionCheckpointV3 {
  return {
    question: checkpoint.question,
    expectedAnswer: checkpoint.expectedAnswer,
    hint: checkpoint.hint,
  };
}

/**
 * Convierte array de EnhancedCheckpoint a ComprehensionCheckpointV3[]
 */
export function toBaseCheckpoints(checkpoints: EnhancedCheckpoint[]): ComprehensionCheckpointV3[] {
  return checkpoints.map(toBaseCheckpoint);
}
