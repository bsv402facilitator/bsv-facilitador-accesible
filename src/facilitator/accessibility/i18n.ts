/**
 * Mensajes centralizados en español claro para accesibilidad universal
 *
 * Estructura:
 * - errors: Mensajes de error categorizados por endpoint
 * - success: Mensajes de éxito
 *
 * Cada mensaje incluye:
 * - plainLanguage: Resumen ejecutivo (≤100 chars)
 * - explanation: Descripción detallada (≤300 chars)
 * - stepByStep: Pasos en orden (≤5 items de 80 chars)
 * - hints: Sugerencias accionables
 */

import type { AccessibleMetadata } from '../types';

interface MessageTemplate {
  plainLanguage: string;
  explanation: string;
  stepByStep: string[];
  hints: {
    ifError?: string;
    commonMistakes?: string[];
    nextSteps?: string;
  };
}

export const messages = {
  errors: {
    verify: {
      invalidAmount: {
        plainLanguage: 'El monto del pago es incorrecto',
        explanation:
          'La transacción enviada no tiene el monto requerido de {required} satoshis. El monto actual es {actual} satoshis.',
        stepByStep: [
          'Verifica el monto requerido en los payment requirements',
          'Crea una nueva transacción con el monto exacto',
          'Vuelve a enviar la transacción al facilitador',
        ],
        hints: {
          ifError: 'Crea una nueva transacción con {required} satoshis exactos',
          commonMistakes: [
            'Confundir satoshis con BSV (1 BSV = 100,000,000 satoshis)',
            'Olvidar incluir fees en el cálculo del monto',
          ],
          nextSteps: 'Consulta la documentación para crear transacciones con monto exacto',
        },
      },
      invalidAddress: {
        plainLanguage: 'La dirección no es válida o no es de testnet',
        explanation:
          'La transacción no envía fondos a la dirección correcta. Se requiere {required} pero la transacción envía a {actual}.',
        stepByStep: [
          'Verifica la dirección en los payment requirements',
          'Crea una nueva transacción con la dirección correcta',
          'Asegúrate de usar una dirección de testnet (comienza con m o n)',
        ],
        hints: {
          ifError: 'Crea una transacción que envíe a {required}',
          commonMistakes: [
            'Usar dirección de mainnet en lugar de testnet',
            'Copiar mal la dirección de destino',
          ],
          nextSteps: 'Verifica que la dirección comience con m o n para testnet',
        },
      },
      invalidFormat: {
        plainLanguage: 'El formato de la transacción es inválido',
        explanation:
          'La transacción BSV no se puede procesar. El formato hexadecimal es incorrecto o la estructura de la transacción está malformada.',
        stepByStep: [
          'Verifica que la transacción esté en formato hexadecimal válido',
          'Asegúrate de que la transacción esté correctamente firmada',
          'Revisa que todos los inputs y outputs sean válidos',
        ],
        hints: {
          ifError: 'Genera una nueva transacción usando una librería BSV válida',
          commonMistakes: [
            'Enviar transacción sin firmar',
            'Usar formato incorrecto (no hexadecimal)',
          ],
          nextSteps: 'Usa @bsv/sdk para crear transacciones válidas',
        },
      },
    },
    settle: {
      alreadyBroadcast: {
        plainLanguage: 'Esta transacción ya fue procesada',
        explanation:
          'La transacción con ID {txid} ya existe en la blockchain BSV testnet. No es necesario volver a enviarla.',
        stepByStep: [
          'Consultamos la blockchain para verificar el estado',
          'Encontramos que esta transacción ya fue procesada',
          'No es necesario reenviarla',
          'El pago ya está en proceso de confirmación',
        ],
        hints: {
          nextSteps: 'Verifica el estado en https://test.whatsonchain.com/tx/{txid}',
        },
      },
      networkError: {
        plainLanguage: 'No se pudo conectar con la blockchain',
        explanation:
          'El servicio de blockchain BSV no respondió a tiempo. Esto es temporal y no has perdido fondos. Tu transacción es válida.',
        stepByStep: [
          'Detectamos un problema de conexión con la red BSV',
          'Intentamos 3 veces sin éxito',
          'El problema es temporal, no es tu transacción',
          'Espera unos segundos y vuelve a intentar',
        ],
        hints: {
          ifError: 'Reintenta en 10-30 segundos. La red BSV suele responder rápido',
          commonMistakes: ['Intentar cambiar la transacción (no es necesario, es válida)'],
          nextSteps: 'Si el error persiste después de 5 intentos, contacta soporte',
        },
      },
      broadcastFailed: {
        plainLanguage: 'La blockchain rechazó la transacción',
        explanation:
          'La red BSV no aceptó la transacción. Esto puede deberse a fondos insuficientes, formato inválido o doble gasto.',
        stepByStep: [
          'La transacción fue enviada a la red BSV',
          'Los nodos rechazaron la transacción',
          'Verifica que tengas fondos suficientes',
          'Asegúrate de no estar gastando los mismos fondos dos veces',
        ],
        hints: {
          ifError: 'Verifica el balance de la dirección de origen',
          commonMistakes: [
            'Intentar gastar outputs ya gastados (doble gasto)',
            'No incluir suficientes fees',
          ],
          nextSteps: 'Revisa la transacción con un explorador de blockchain',
        },
      },
    },
  },
  success: {
    verifyValid: {
      plainLanguage: 'El pago se verificó correctamente',
      explanation:
        'Tu transacción cumple con todos los requisitos: monto de {amount} satoshis enviados a {address}',
      stepByStep: [
        'Recibimos tu transacción',
        'Validamos el monto y la dirección de destino',
        'La transacción está lista para ser procesada',
        'Puedes proceder con el paso de settlement',
      ],
      hints: {
        nextSteps: 'Llama al endpoint /settle para completar el pago',
      },
    },
    settleSuccess: {
      plainLanguage: 'El pago se completó exitosamente',
      explanation: 'Tu transacción fue transmitida a la blockchain BSV testnet con ID {txid}',
      stepByStep: [
        'Recibimos tu transacción firmada',
        'La validamos contra la red BSV',
        'La transmitimos a la blockchain',
        'La transacción está confirmada en la red',
      ],
      hints: {
        nextSteps: 'Puedes verificar tu transacción en WhatsOnChain con el ID proporcionado',
      },
    },
    supportedNetworks: {
      plainLanguage: 'Este facilitador soporta Bitcoin SV testnet',
      explanation:
        'Procesamos pagos X402 en la red de prueba de Bitcoin SV. Testnet usa dinero de prueba sin valor real.',
      stepByStep: [
        'Usa direcciones que comiencen con m o n',
        'Obtén fondos de prueba en faucets de BSV testnet',
        'Crea transacciones usando @bsv/sdk',
      ],
      hints: {
        nextSteps: 'Consulta la documentación para comenzar con BSV testnet',
      },
    },
  },
};

/**
 * English messages for international accessibility
 */
export const messagesEN = {
  errors: {
    verify: {
      invalidAmount: {
        plainLanguage: 'Payment amount is incorrect',
        explanation:
          'The transaction sent does not have the required amount of {required} satoshis. The actual amount is {actual} satoshis.',
        stepByStep: [
          'Check the required amount in payment requirements',
          'Create a new transaction with the exact amount',
          'Resend the transaction to the facilitator',
        ],
        hints: {
          ifError: 'Create a new transaction with exactly {required} satoshis',
          commonMistakes: [
            'Confusing satoshis with BSV (1 BSV = 100,000,000 satoshis)',
            'Forgetting to include fees in the amount calculation',
          ],
          nextSteps: 'Check the documentation to create transactions with exact amounts',
        },
      },
      invalidAddress: {
        plainLanguage: 'Address is invalid or not from testnet',
        explanation:
          'The transaction does not send funds to the correct address. Required: {required} but transaction sends to {actual}.',
        stepByStep: [
          'Check the address in payment requirements',
          'Create a new transaction with the correct address',
          'Ensure you use a testnet address (starts with m or n)',
        ],
        hints: {
          ifError: 'Create a transaction that sends to {required}',
          commonMistakes: [
            'Using mainnet address instead of testnet',
            'Copying the destination address incorrectly',
          ],
          nextSteps: 'Verify that the address starts with m or n for testnet',
        },
      },
      invalidFormat: {
        plainLanguage: 'Transaction format is invalid',
        explanation:
          'The BSV transaction cannot be processed. The hexadecimal format is incorrect or the transaction structure is malformed.',
        stepByStep: [
          'Verify that the transaction is in valid hexadecimal format',
          'Ensure the transaction is properly signed',
          'Check that all inputs and outputs are valid',
        ],
        hints: {
          ifError: 'Generate a new transaction using a valid BSV library',
          commonMistakes: ['Sending unsigned transaction', 'Using incorrect format (not hexadecimal)'],
          nextSteps: 'Use @bsv/sdk to create valid transactions',
        },
      },
    },
    settle: {
      alreadyBroadcast: {
        plainLanguage: 'This transaction was already processed',
        explanation:
          'The transaction with ID {txid} already exists on the BSV testnet blockchain. No need to resend it.',
        stepByStep: [
          'We queried the blockchain to verify the status',
          'We found that this transaction was already processed',
          'No need to resend it',
          'The payment is already being confirmed',
        ],
        hints: {
          nextSteps: 'Check the status at https://test.whatsonchain.com/tx/{txid}',
        },
      },
      networkError: {
        plainLanguage: 'Could not connect to the blockchain',
        explanation:
          'The BSV blockchain service did not respond in time. This is temporary and you have not lost funds. Your transaction is valid.',
        stepByStep: [
          'We detected a connection issue with the BSV network',
          'We tried 3 times without success',
          'The problem is temporary, not your transaction',
          'Wait a few seconds and try again',
        ],
        hints: {
          ifError: 'Retry in 10-30 seconds. The BSV network usually responds quickly',
          commonMistakes: ['Trying to change the transaction (not necessary, it is valid)'],
          nextSteps: 'If the error persists after 5 attempts, contact support',
        },
      },
      broadcastFailed: {
        plainLanguage: 'The blockchain rejected the transaction',
        explanation:
          'The BSV network did not accept the transaction. This may be due to insufficient funds, invalid format, or double spending.',
        stepByStep: [
          'The transaction was sent to the BSV network',
          'The nodes rejected the transaction',
          'Verify that you have sufficient funds',
          'Ensure you are not spending the same funds twice',
        ],
        hints: {
          ifError: 'Verify the balance of the source address',
          commonMistakes: [
            'Trying to spend already spent outputs (double spend)',
            'Not including enough fees',
          ],
          nextSteps: 'Review the transaction with a blockchain explorer',
        },
      },
    },
  },
  success: {
    verifyValid: {
      plainLanguage: 'Payment verified successfully',
      explanation:
        'Your transaction meets all requirements: {amount} satoshis sent to {address}',
      stepByStep: [
        'We received your transaction',
        'We validated the amount and destination address',
        'The transaction is ready to be processed',
        'You can proceed with the settlement step',
      ],
      hints: {
        nextSteps: 'Call the /settle endpoint to complete the payment',
      },
    },
    settleSuccess: {
      plainLanguage: 'Payment completed successfully',
      explanation: 'Your transaction was broadcast to the BSV testnet blockchain with ID {txid}',
      stepByStep: [
        'We received your signed transaction',
        'We validated it against the BSV network',
        'We broadcast it to the blockchain',
        'The transaction is confirmed on the network',
      ],
      hints: {
        nextSteps: 'You can verify your transaction on WhatsOnChain with the provided ID',
      },
    },
    supportedNetworks: {
      plainLanguage: 'This facilitator supports Bitcoin SV testnet',
      explanation:
        'We process X402 payments on the Bitcoin SV test network. Testnet uses test money with no real value.',
      stepByStep: [
        'Use addresses starting with m or n',
        'Get test funds from BSV testnet faucets',
        'Create transactions using @bsv/sdk',
      ],
      hints: {
        nextSteps: 'Check the documentation to get started with BSV testnet',
      },
    },
  },
};

/**
 * Get messages by language
 */
export function getMessagesByLanguage(lang: 'es' | 'en') {
  return lang === 'en' ? messagesEN : messages;
}

/**
 * Helper para crear AccessibleMetadata desde un template de mensaje
 */
export function createMetadataFromTemplate(
  template: MessageTemplate,
  replacements: Record<string, string> = {},
  cognitiveLevel: 'simple' | 'medium' | 'advanced' = 'simple',
  audioFriendly = true,
  language: 'es' | 'en' = 'es'
): AccessibleMetadata {
  // Función helper para reemplazar placeholders en strings
  const replace = (text: string): string => {
    let result = text;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  return {
    plainLanguage: replace(template.plainLanguage),
    explanation: replace(template.explanation),
    stepByStep: template.stepByStep.map(replace),
    hints: {
      ...(template.hints.ifError && { ifError: replace(template.hints.ifError) }),
      ...(template.hints.commonMistakes && { commonMistakes: template.hints.commonMistakes }),
      ...(template.hints.nextSteps && { nextSteps: replace(template.hints.nextSteps) }),
    },
    language,
    audioFriendly,
    cognitiveLevel,
  };
}
