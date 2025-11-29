/**
 * V1 Spanish Templates
 * Extracted from original i18n.ts for backward compatibility
 */

import type { MessageCatalog } from '../types';

export const spanishTemplatesV1: MessageCatalog = {
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
