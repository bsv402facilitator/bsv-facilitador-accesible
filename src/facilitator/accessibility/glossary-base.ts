/**
 * Glosarios base estables para accesibilidad universal
 *
 * CRÍTICO: Estos 4 términos SIEMPRE deben estar presentes en el glosario,
 * independientemente del contexto o nivel cognitivo.
 *
 * Mejora #3: Estabilizar glosario (4 términos base + contextuales)
 */

/**
 * Glosario base en español (4 términos SIEMPRE presentes)
 */
export const BASE_GLOSSARY_ES = {
  transacción: 'Transferencia de dinero digital de una persona a otra',
  blockchain: 'Libro de contabilidad público donde se registran todos los pagos',
  liquidado: 'Pago enviado exitosamente a la red Bitcoin',
  txid: 'Identificador único de la transacción (como un número de seguimiento)',
} as const;

/**
 * Glosario base en inglés (4 términos SIEMPRE presentes)
 */
export const BASE_GLOSSARY_EN = {
  transaction: 'Digital money transfer from one person to another',
  blockchain: 'Public ledger where all payments are recorded',
  settled: 'Payment successfully sent to the Bitcoin network',
  txid: 'Unique transaction identifier (like a tracking number)',
} as const;

/**
 * Glosarios contextuales adicionales por escenario (español)
 * Se agregan ADEMÁS del glosario base según el contexto
 */
export const CONTEXTUAL_GLOSSARY_ES: Record<string, Record<string, string>> = {
  verify: {
    verificar: 'Comprobar que todo esté correcto antes de enviar el pago',
    'firma digital': 'Como tu firma en un cheque, pero imposible de falsificar',
    validar: 'Revisar que la transacción cumple todos los requisitos',
  },
  settle: {
    broadcast: 'Enviar la transacción a la red Bitcoin para que sea procesada',
    mempool: 'Sala de espera donde las transacciones esperan ser confirmadas',
    confirmación: 'Cuando la transacción se incluye en un bloque de la blockchain',
  },
  error: {
    satoshis: 'La unidad más pequeña de Bitcoin (0.00000001 BTC)',
    'dirección Bitcoin': 'Como un número de cuenta bancaria, pero para Bitcoin',
  },
  technical: {
    Bitcoin: 'Moneda digital descentralizada sin bancos intermediarios',
    BSV: 'Bitcoin Satoshi Vision - versión original de Bitcoin',
    P2PKH: 'Tipo más común de dirección Bitcoin (empieza con 1)',
    UTXO: 'Saldo disponible para gastar (Unspent Transaction Output)',
  },
};

/**
 * Glosarios contextuales adicionales por escenario (inglés)
 */
export const CONTEXTUAL_GLOSSARY_EN: Record<string, Record<string, string>> = {
  verify: {
    verify: 'Check that everything is correct before sending the payment',
    'digital signature': 'Like your signature on a check, but impossible to forge',
    validate: 'Review that the transaction meets all requirements',
  },
  settle: {
    broadcast: 'Send the transaction to the Bitcoin network to be processed',
    mempool: 'Waiting room where transactions wait to be confirmed',
    confirmation: 'When the transaction is included in a blockchain block',
  },
  error: {
    satoshis: 'The smallest unit of Bitcoin (0.00000001 BTC)',
    'Bitcoin address': 'Like a bank account number, but for Bitcoin',
  },
  technical: {
    Bitcoin: 'Decentralized digital currency without bank intermediaries',
    BSV: 'Bitcoin Satoshi Vision - original version of Bitcoin',
    P2PKH: 'Most common type of Bitcoin address (starts with 1)',
    UTXO: 'Available balance to spend (Unspent Transaction Output)',
  },
};

/**
 * Crea un glosario completo combinando base + contextuales
 *
 * @param language - Código de idioma ('es', 'en')
 * @param scenarios - Lista de escenarios aplicables (['verify', 'settle'])
 * @param contentText - Texto del contenido para detectar términos adicionales
 * @returns Glosario completo con mínimo 4 términos (base) + contextuales
 */
export function createStableGlossary(
  language: string,
  scenarios: string[],
  contentText?: string
): Record<string, string> {
  // 1. SIEMPRE empezar con el glosario base (4 términos garantizados)
  const baseGlossary =
    language === 'en' ? { ...BASE_GLOSSARY_EN } : { ...BASE_GLOSSARY_ES };

  // 2. Agregar términos contextuales según escenarios
  const contextualGlossaries =
    language === 'en' ? CONTEXTUAL_GLOSSARY_EN : CONTEXTUAL_GLOSSARY_ES;

  for (const scenario of scenarios) {
    const contextual = contextualGlossaries[scenario];
    if (contextual) {
      Object.assign(baseGlossary, contextual);
    }
  }

  // 3. Detectar términos técnicos en el contenido y agregar si aplica
  if (contentText) {
    const detectedTerms = detectTermsInContent(contentText, language);
    Object.assign(baseGlossary, detectedTerms);
  }

  return baseGlossary;
}

/**
 * Detecta términos técnicos en el contenido que necesitan definición
 */
function detectTermsInContent(
  content: string,
  language: string
): Record<string, string> {
  const detected: Record<string, string> = {};
  const lowerContent = content.toLowerCase();

  const technicalTerms =
    language === 'en' ? CONTEXTUAL_GLOSSARY_EN['technical'] : CONTEXTUAL_GLOSSARY_ES['technical'];

  // Buscar términos técnicos en el contenido
  if (technicalTerms) {
    for (const [term, definition] of Object.entries(technicalTerms)) {
      if (lowerContent.includes(term.toLowerCase())) {
        detected[term] = definition;
      }
    }
  }

  return detected;
}

/**
 * Determina escenarios aplicables basándose en el tipo de mensaje
 */
export function detectScenarios(messageType: string): string[] {
  const scenarios: string[] = [];

  if (messageType.includes('verify')) {
    scenarios.push('verify');
  }

  if (messageType.includes('settle')) {
    scenarios.push('settle');
  }

  if (messageType.includes('error')) {
    scenarios.push('error');
  }

  // Siempre incluir términos técnicos básicos para niveles advanced/expert
  scenarios.push('technical');

  return scenarios;
}
