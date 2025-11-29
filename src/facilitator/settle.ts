/**
 * Settlement de transacciones BSV - Broadcast a blockchain
 *
 * Este módulo implementa la lógica de User Story 2: hacer broadcast de transacciones BSV válidas
 * a la blockchain testnet con detección de duplicados y manejo de errores de red.
 *
 * Funciones principales:
 * - settleTransaction(): Broadcastea una transacción después de validar que no existe
 * - Detección automática de transacciones duplicadas vía WhatsOnChain API
 * - Retry automático con backoff exponencial en errores de red
 */

import { Transaction } from '@bsv/sdk';
import { PaymentPayload, PaymentRequirements, SettleResponse, SettleErrorCodes } from './types';
import { logger } from './logger';
import { getTransaction, broadcastTransaction } from './whats-on-chain';
import { extractPayerAddress } from './verify';

/**
 * T060: Realiza settlement de una transacción BSV: valida que no existe y hace broadcast
 *
 * Flujo:
 * 1. Parsea la transacción para extraer el txid
 * 2. T061: Consulta WhatsOnChain API para ver si ya existe (detección de duplicados)
 * 3. Si ya existe, retorna error already_broadcast con el txid
 * 4. T059: Si no existe, hace broadcast a la blockchain con retry logic
 * 5. T062: Maneja errores de red, duplicados, y rechazos de blockchain
 *
 * @param payload - PaymentPayload con la transacción firmada
 * @param requirements - PaymentRequirements para contexto (no se valida aquí)
 * @returns SettleResponse indicando éxito/error con metadata
 */
export async function settleTransaction(
  payload: PaymentPayload,
  _requirements: PaymentRequirements
): Promise<SettleResponse> {
  try {
    // Determinar si es testnet basado en el payload network
    const isTestnet = payload.network === 'bsv-testnet';

    // Parsear transacción
    const tx = Transaction.fromHex(payload.payload.transaction);
    const txid = tx.id('hex') as string;

    logger.info('Settle transaction attempt', {
      txid,
      network: payload.network,
    });

    // T061: Verificar si la transacción ya existe en blockchain (detección de duplicados)
    const { found } = await getTransaction(txid, isTestnet);

    if (found) {
      logger.info('Settle transaction - already exists', { txid });

      return {
        success: false,
        errorReason: SettleErrorCodes.ALREADY_BROADCAST,
        transaction: txid,
        payer: extractPayerAddress(tx, isTestnet),
        network: payload.network,
      };
    }

    // T059: Hacer broadcast a blockchain con retry logic
    const broadcastResult = await broadcastTransaction(payload.payload.transaction, isTestnet);

    // T062: Manejo de errores de broadcast
    if (!broadcastResult.success) {
      // Detectar tipo de error
      if (broadcastResult.error === 'already_broadcast') {
        // Transacción duplicada detectada por mensaje de error de WhatsOnChain
        return {
          success: false,
          errorReason: SettleErrorCodes.ALREADY_BROADCAST,
          transaction: txid,
          payer: extractPayerAddress(tx, isTestnet),
          network: payload.network,
        };
      }

      if (broadcastResult.error === 'network_error') {
        // Error de red: timeout, conexión fallida, etc
        logger.error('Settle transaction - network error', { txid });

        return {
          success: false,
          errorReason: SettleErrorCodes.NETWORK_ERROR,
          payer: extractPayerAddress(tx, isTestnet),
          network: payload.network,
        };
      }

      // broadcast_failed: blockchain rechazó la transacción
      logger.error('Settle transaction - broadcast failed', {
        txid,
        error: broadcastResult.error,
      });

      return {
        success: false,
        errorReason: SettleErrorCodes.BROADCAST_FAILED,
        payer: extractPayerAddress(tx, isTestnet),
        network: payload.network,
      };
    }

    // Broadcast exitoso
    logger.info('Settle transaction success', {
      txid: broadcastResult.txid,
      network: payload.network,
    });

    return {
      success: true,
      transaction: broadcastResult.txid,
      payer: extractPayerAddress(tx, isTestnet),
      network: payload.network,
    };
  } catch (error) {
    // Error inesperado (parsing de transacción, etc)
    logger.error('Settle transaction unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
