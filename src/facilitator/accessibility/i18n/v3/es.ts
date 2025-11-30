/**
 * V3 Spanish Templates - Universal Accessibility
 *
 * Includes:
 * - 5 cognitive levels (beginner → expert)
 * - 3 abstraction levels (concrete → abstract)
 * - Enhanced content structure for LLM clients
 */

import type { CognitiveContentV3, AbstractionContentV3 } from '../../types';

/**
 * V3 Message Catalog - Complete structure for ONE message type
 */
export interface MessageTemplateV3 {
  byLevel: Record<string, CognitiveContentV3>;
  byAbstraction: Record<string, AbstractionContentV3>;
}

/**
 * V3 Message Catalog - All message types
 */
export type MessageCatalogV3 = Record<string, MessageTemplateV3>;

// ============================================================================
// VERIFY - INVALID AMOUNT
// ============================================================================

const verifyInvalidAmountV3: MessageTemplateV3 = {
  byLevel: {
    beginner: {
      plainLanguage: 'No enviaste suficiente dinero',
      explanation:
        'El pago requiere más dinero del que enviaste. Es como intentar pagar 5€ con solo 2€.',
      detailedExplanation:
        'Cada pago necesita una cantidad mínima específica. Tu transacción incluye menos dinero del necesario. Esto pasa cuando el monto es menor al requerido o cuando olvidas incluir las comisiones de red.',
      stepByStep: [
        {
          text: 'Revisa cuánto dinero requiere el pago',
          icon: '🔍',
          context: 'Busca el monto en la información del pago',
        },
        {
          text: 'Verifica cuánto incluiste en tu transacción',
          icon: '📊',
          context: 'Mira los detalles de tu pago',
        },
        {
          text: 'Suma la diferencia que falta',
          icon: '➕',
          context: 'Calcula: monto requerido - monto enviado',
        },
        {
          text: 'Crea una nueva transacción con el monto correcto',
          icon: '✅',
          context: 'Asegúrate de incluir el total necesario',
        },
      ],
      hints: {
        ifError: 'Verifica que el monto incluya también las comisiones de red (fees)',
        commonMistakes: [
          'Olvidar sumar las comisiones de red al monto',
          'Confundir satoshis con BSV (1 BSV = 100 millones de satoshis)',
          'Copiar mal el número del monto requerido',
        ],
        nextSteps: 'Verifica el monto requerido y crea un nuevo pago con la cantidad correcta',
        troubleshooting: 'Si sigue fallando, verifica que uses la unidad correcta (satoshis)',
        safeguards: [
          'No envíes dinero hasta confirmar el monto exacto',
          'Siempre incluye margen para comisiones',
        ],
      },
      glossary: {
        Satoshi: 'La unidad más pequeña de Bitcoin. 1 BSV = 100,000,000 satoshis',
        BSV: 'Bitcoin SV, la criptomoneda que estás usando',
        'Comisión de red': 'Pago pequeño a los mineros para procesar tu transacción',
        Output: 'Destino de los fondos en una transacción',
      },
      examples: [
        {
          scenario: 'Comprar un café con BSV',
          input: 'Envías 1000 satoshis pero se requieren 5000 satoshis',
          output: 'Error: monto insuficiente',
          explanation: 'Es como pagar 1€ por un café de 5€. Necesitas enviar 4000 satoshis más',
        },
      ],
      memoryAids: [
        '💡 Siempre verifica el monto ANTES de enviar',
        '💡 Monto total = precio + comisión de red',
        '💡 1 BSV = 100 millones de satoshis',
      ],
    },
    simple: {
      plainLanguage: 'El monto del pago es menor al requerido',
      explanation:
        'La transacción BSV que enviaste incluye menos satoshis de los necesarios. El output hacia la dirección del vendedor no alcanza el monto mínimo especificado.',
      stepByStep: [
        {
          text: 'Identifica el monto requerido en satoshis',
          context: 'Busca en los requisitos del pago',
        },
        {
          text: 'Localiza el output que paga al vendedor',
          context: 'Revisa los outputs de tu transacción',
        },
        {
          text: 'Compara: monto enviado vs. monto requerido',
          context: 'Verifica la diferencia',
        },
        {
          text: 'Ajusta la transacción con el monto correcto',
          context: 'Crea nuevo pago si es necesario',
        },
      ],
      hints: {
        ifError: 'Verifica que estés usando la misma unidad (satoshis). 1 BSV = 100,000,000 satoshis',
        commonMistakes: [
          'Confundir el orden de los outputs en la transacción',
          'No incluir suficientes satoshis para cubrir monto + fees',
          'Usar BSV en vez de satoshis en el cálculo',
        ],
        nextSteps:
          'Recalcula el output hacia la dirección del vendedor y asegúrate que sea >= monto requerido',
      },
      glossary: {
        Output: 'Salida de fondos en una transacción BSV',
        'Monto requerido': 'Cantidad mínima de satoshis que debe recibir el vendedor',
      },
    },
    medium: {
      plainLanguage: 'El output de pago no alcanza el monto especificado',
      explanation:
        'La transacción no cumple con el esquema "exact": ningún output envía el monto requerido (o mayor) a la dirección especificada en payTo.',
      stepByStep: [
        {
          text: 'Parsea la transacción para extraer outputs',
          context: 'Usa @bsv/sdk o similar',
        },
        {
          text: 'Filtra outputs por dirección de destino',
          context: 'Busca coincidencia con payTo address',
        },
        {
          text: 'Compara valor del output vs. maxAmountRequired',
          context: 'Debe ser >= en satoshis',
        },
        {
          text: 'Valida que el network coincida',
          context: 'Mainnet vs testnet',
        },
      ],
      hints: {
        ifError: 'Verifica address encoding (P2PKH, mainnet prefix: 1)',
        nextSteps: 'Rebuild transaction con output correcto hacia payTo address',
      },
    },
    advanced: {
      plainLanguage: 'Validación de output exacto falló: monto insuficiente',
      explanation:
        'Protocolo X402 exact scheme requiere output específico. Tu TX no tiene output >= maxAmountRequired hacia payTo address. Posibles causas: valor incorrecto en lockingScript, network mismatch, o fee calculation error.',
      stepByStep: [
        {
          text: 'Deserializar TX raw hex',
          context: 'Transaction.fromHex() o equivalente',
        },
        {
          text: 'Iterar outputs, extraer script + amount',
          context: 'tx.outputs.forEach()',
        },
        {
          text: 'Validar script tipo P2PKH y extraer address',
          context: 'Script.fromBinary() + toAddress()',
        },
        {
          text: 'Assert output.amount >= requirements.maxAmountRequired',
          context: 'Comparación numérica en satoshis',
        },
      ],
      hints: {
        ifError:
          'Check address derivation (pubKeyHash) y network byte. Mainnet=0x00, Testnet=0x6F',
        nextSteps: 'Usar TX builder con exact output construction',
      },
    },
    expert: {
      plainLanguage: 'X402 exact scheme validation failure: output value mismatch',
      explanation:
        'BSV TX output verification against X402 PaymentRequirements failed. No output satisfies: (1) locking script resolves to payTo address (2) value >= maxAmountRequired (string-encoded satoshis) (3) network matches bsv-mainnet/testnet. Root cause: likely UTXO selection or fee estimation bug in TX construction.',
      stepByStep: [
        {
          text: 'Parse TX.outputs[i].lockingScript → extract pubKeyHash',
          context: 'OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG',
        },
        {
          text: 'Derive address from pubKeyHash + network byte',
          context: 'Base58Check encoding',
        },
        {
          text: 'Assert derived address === requirements.payTo',
          context: 'String comparison',
        },
        {
          text: 'Assert BigInt(output.satoshis) >= BigInt(requirements.maxAmountRequired)',
          context: 'Avoid floating point',
        },
      ],
      hints: {
        ifError:
          'Verify UTXO set, fee calculation (1 sat/byte baseline), and change output construction',
        nextSteps:
          'Rebuild TX: ensure output[0] = exact payment, output[1] = change (if any)',
      },
    },
  },
  byAbstraction: {
    concrete: {
      description: 'Ejemplos específicos con números y casos reales',
      content: {
        plainLanguage: 'No enviaste suficiente dinero (ejemplo: 1000 de 5000 satoshis)',
        explanation:
          'Imagina que necesitas pagar 5000 satoshis pero solo enviaste 1000. Es como intentar comprar un café de 5€ con solo 1€ en tu bolsillo.',
        stepByStep: [
          {
            text: 'Monto requerido: 5000 satoshis',
            context: 'Esto es lo que pide el vendedor',
          },
          {
            text: 'Monto enviado: 1000 satoshis',
            context: 'Esto es lo que incluiste en tu transacción',
          },
          {
            text: 'Diferencia: 4000 satoshis faltan',
            context: 'Necesitas enviar 4000 satoshis más',
          },
        ],
        hints: {
          nextSteps: 'Crea una nueva transacción con 5000 satoshis o más',
        },
        examples: [
          {
            scenario: 'Compra de contenido digital',
            input: 'Requerido: 10000 sats, Enviado: 7500 sats',
            output: 'Error: faltan 2500 satoshis',
            explanation: 'Debes crear una nueva transacción con al menos 10000 satoshis',
          },
        ],
      },
    },
    mixed: {
      description: 'Mezcla de teoría y ejemplos prácticos',
      content: {
        plainLanguage: 'Output de pago insuficiente',
        explanation:
          'Las transacciones BSV tienen outputs (salidas) que especifican cuántos satoshis va cada dirección. Tu transacción no tiene un output con suficiente valor hacia la dirección del vendedor.',
        stepByStep: [
          {
            text: 'Entiende que una TX tiene múltiples outputs',
            context: 'Como dividir dinero en varios sobres',
          },
          {
            text: 'Uno debe ir al vendedor con el monto correcto',
            context: 'Ejemplo: Output[0]: 5000 sats → vendedor',
          },
          {
            text: 'Otro puede ser cambio que vuelve a ti',
            context: 'Ejemplo: Output[1]: 2000 sats → tu dirección',
          },
        ],
        hints: {
          nextSteps: 'Verifica que el output correcto tenga el monto >= requerido',
        },
      },
    },
    abstract: {
      description: 'Conceptos teóricos del protocolo X402',
      content: {
        plainLanguage: 'Violación del esquema exact del protocolo X402',
        explanation:
          'El protocolo X402 define un esquema "exact" donde la transacción BSV debe contener al menos un output cuyo valor en satoshis sea mayor o igual al maxAmountRequired especificado en los PaymentRequirements, dirigido a la dirección indicada en el campo payTo.',
        stepByStep: [
          {
            text: 'X402 exact scheme validation',
            context: 'Protocolo de pago HTTP-native',
          },
          {
            text: 'Output value assertion',
            context: 'Validación matemática en satoshis',
          },
          {
            text: 'Address matching verification',
            context: 'Comparación de direcciones P2PKH',
          },
        ],
        hints: {
          nextSteps: 'Implementar lógica de construcción de TX compatible con X402 exact scheme',
        },
      },
    },
  },
};

// ============================================================================
// VERIFY - SUCCESS
// ============================================================================

const verifySuccessV3: MessageTemplateV3 = {
  byLevel: {
    beginner: {
      plainLanguage: '✅ Pago válido',
      explanation: 'Tu pago de Bitcoin es correcto y está listo para procesarse.',
      stepByStep: [
        {
          text: 'Tu pago fue verificado',
          icon: '✅',
        },
        {
          text: 'Ahora se enviará a la red Bitcoin',
          icon: '📡',
        },
      ],
      hints: {
        nextSteps: 'Espera confirmación de que el pago se procesó en la blockchain',
      },
    },
    simple: {
      plainLanguage: 'Transacción válida',
      explanation: 'La transacción BSV cumple con todos los requisitos de pago.',
      stepByStep: [
        {
          text: 'Verificación completada exitosamente',
        },
        {
          text: 'La transacción puede ser transmitida',
        },
      ],
      hints: {
        nextSteps: 'Procede con el settle para transmitir a la blockchain',
      },
    },
    medium: {
      plainLanguage: 'Transacción BSV verificada exitosamente',
      explanation:
        'La transacción cumple con el esquema "exact", monto correcto, y dirección válida.',
      stepByStep: [
        {
          text: 'Validación de esquema exact: OK',
        },
        {
          text: 'Validación de monto: OK',
        },
        {
          text: 'Validación de dirección: OK',
        },
      ],
      hints: {},
    },
    advanced: {
      plainLanguage: 'Validación exitosa: esquema exact, outputs verificados',
      explanation:
        'Transacción BSV mainnet verificada: outputs coinciden con PaymentRequirements, address matching correcto, value >= maxAmountRequired.',
      stepByStep: [
        {
          text: 'Output validation passed',
        },
        {
          text: 'Address derivation verified',
        },
      ],
      hints: {},
    },
    expert: {
      plainLanguage: 'TX validation passed: exact scheme, UTXO verified, sig valid',
      explanation:
        'BSV transaction validated against PaymentRequirements: output[0] matches payTo address via P2PKH script, value >= maxAmountRequired (satoshis), network bsv-mainnet. TX ready for broadcast.',
      stepByStep: [
        {
          text: 'Cryptographic signature validation: PASS',
        },
        {
          text: 'X402 exact scheme compliance: PASS',
        },
      ],
      hints: {},
    },
  },
  byAbstraction: {
    concrete: {
      description: 'Confirmación con detalles específicos',
      content: {
        plainLanguage: '✅ Pago válido: enviaste {amount} satoshis a {address}',
        explanation: 'Tu pago fue revisado y todo está correcto. Puede continuar.',
        stepByStep: [
          {
            text: 'Pago verificado',
          },
        ],
        hints: {},
      },
    },
    mixed: {
      description: 'Confirmación con contexto técnico',
      content: {
        plainLanguage: 'Transacción verificada correctamente',
        explanation:
          'La transacción cumple con los requisitos X402: monto correcto, dirección válida, formato BSV válido.',
        stepByStep: [
          {
            text: 'Todos los checks pasaron',
          },
        ],
        hints: {},
      },
    },
    abstract: {
      description: 'Confirmación a nivel de protocolo',
      content: {
        plainLanguage: 'X402 exact scheme validation: PASS',
        explanation:
          'La transacción satisface todos los criterios del protocolo X402 para el esquema exact.',
        stepByStep: [
          {
            text: 'Protocol compliance verified',
          },
        ],
        hints: {},
      },
    },
  },
};

// ============================================================================
// EXPORT CATALOG
// ============================================================================

export const spanishTemplatesV3: MessageCatalogV3 = {
  'errors.verify.invalidAmount': verifyInvalidAmountV3,
  'success.verifyValid': verifySuccessV3,
  // TODO: Add more message types
};
