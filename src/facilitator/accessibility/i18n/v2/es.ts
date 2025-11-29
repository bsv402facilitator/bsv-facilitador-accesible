/**
 * V2 Spanish Templates - 5 cognitive levels
 * TO BE IMPLEMENTED IN PHASE 2
 */

import type { MessageCatalogV2 } from '../types';

// Placeholder - will be populated in Phase 2
export const spanishTemplatesV2: Partial<MessageCatalogV2> = {
  glossary: {
    satoshi: 'Unidad mínima de Bitcoin SV. 1 BSV = 100,000,000 satoshis',
    txid: 'Identificador único de 64 caracteres hexadecimales de una transacción',
    blockchain: 'Registro distribuido e inmutable de transacciones',
    testnet: 'Red de prueba de Bitcoin SV con monedas sin valor real',
    mainnet: 'Red principal de Bitcoin SV con monedas de valor real',
    output: 'Dirección de destino y monto en una transacción BSV',
    input: 'Referencia a fondos previos que se gastan en una transacción',
    fee: 'Pequeña cantidad pagada a mineros por procesar una transacción',
    hexadecimal: 'Sistema numérico base-16 usando dígitos 0-9 y letras A-F',
  },
  icons: {
    verify: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    success: '✅',
    pending: '⏳',
    network: '🌐',
    blockchain: '⛓',
    transaction: '💸',
  },
};
