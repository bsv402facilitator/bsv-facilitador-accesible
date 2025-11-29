/**
 * Cliente para WhatsOnChain API con retry logic y timeout
 * Soporta tanto mainnet como testnet
 */

import { logger } from './logger';

const WOC_MAINNET_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
const WOC_TESTNET_BASE = 'https://api.whatsonchain.com/v1/bsv/test';
const FETCH_TIMEOUT_MS = 10000; // 10 segundos

/**
 * Obtiene la URL base de WhatsOnChain según la red
 *
 * @param isTestnet - true para testnet, false para mainnet
 * @returns URL base de la API de WhatsOnChain
 */
function getWocBaseUrl(isTestnet: boolean): string {
  return isTestnet ? WOC_TESTNET_BASE : WOC_MAINNET_BASE;
}

/**
 * Configuración de retry con backoff exponencial
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Calcula el delay para backoff exponencial
 *
 * @param attempt - Número de intento (0-indexed)
 * @param config - Configuración de retry
 * @returns Delay en millisegundos
 */
export function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Ejecuta fetch con timeout usando AbortController
 *
 * @param url - URL a consultar
 * @param options - Opciones de fetch
 * @returns Response de fetch
 * @throws Error si timeout se excede
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${FETCH_TIMEOUT_MS}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Detecta si un error de broadcast indica transacción duplicada
 *
 * @param errorMessage - Mensaje de error de WhatsOnChain API
 * @returns true si el error indica transacción ya broadcasted
 */
export function isAlreadyBroadcast(errorMessage: string): boolean {
  const patterns = [
    'Transaction already in the mempool',
    'txn-already-known',
    'Transaction already exists',
    'already in block chain',
    'txn-already-in-mempool',
  ];

  const lowerMessage = errorMessage.toLowerCase();
  return patterns.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
}

/**
 * Consulta si una transacción existe en blockchain
 *
 * @param txid - Transaction ID
 * @param isTestnet - true para testnet, false para mainnet (default: true)
 * @returns { found: boolean } - true si la transacción existe
 */
export async function getTransaction(txid: string, isTestnet: boolean = true): Promise<{ found: boolean }> {
  const baseUrl = getWocBaseUrl(isTestnet);
  const url = `${baseUrl}/tx/${txid}/hex`;

  try {
    const response = await fetchWithTimeout(url);
    logger.info('WhatsOnChain getTransaction', {
      txid,
      network: isTestnet ? 'testnet' : 'mainnet',
      status: response.status,
      found: response.ok,
    });

    return { found: response.ok };
  } catch (error) {
    logger.warn('WhatsOnChain getTransaction failed', {
      txid,
      network: isTestnet ? 'testnet' : 'mainnet',
      error: error instanceof Error ? error.message : String(error),
    });

    // Si falla la consulta, asumir que no existe
    return { found: false };
  }
}

/**
 * Hace broadcast de una transacción a la blockchain BSV con retry logic
 *
 * @param txHex - Transacción en formato hexadecimal
 * @param isTestnet - true para testnet, false para mainnet (default: true)
 * @param config - Configuración de retry (opcional)
 * @returns { success: boolean, txid?: string, error?: string }
 */
export async function broadcastTransaction(
  txHex: string,
  isTestnet: boolean = true,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ success: boolean; txid?: string; error?: string }> {
  const baseUrl = getWocBaseUrl(isTestnet);
  const url = `${baseUrl}/tx/raw`;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      logger.info('WhatsOnChain broadcast attempt', {
        attempt: attempt + 1,
        maxRetries: config.maxRetries + 1,
        network: isTestnet ? 'testnet' : 'mainnet',
      });

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txhex: txHex }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Detectar transacción duplicada
        if (isAlreadyBroadcast(errorText)) {
          logger.info('WhatsOnChain broadcast - already exists', {
            status: response.status,
          });

          // Extraer txid si está disponible en el error
          return {
            success: false,
            error: 'already_broadcast',
          };
        }

        // Error de broadcast (no reintentar)
        logger.error('WhatsOnChain broadcast failed', {
          status: response.status,
          error: errorText,
        });

        return {
          success: false,
          error: 'broadcast_failed',
        };
      }

      // Broadcast exitoso
      const txid = await response.text();
      logger.info('WhatsOnChain broadcast success', { txid });

      return {
        success: true,
        txid: txid.replace(/"/g, ''), // Remover comillas si las hay
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.warn('WhatsOnChain broadcast error', {
        attempt: attempt + 1,
        error: errorMessage,
      });

      // Si es el último intento, retornar error
      if (attempt === config.maxRetries) {
        return {
          success: false,
          error: 'network_error',
        };
      }

      // Esperar antes de reintentar (backoff exponencial)
      const delay = getBackoffDelay(attempt, config);
      logger.info('WhatsOnChain retry delay', {
        attempt: attempt + 1,
        delayMs: delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // No debería llegar aquí, pero TypeScript requiere un return
  return {
    success: false,
    error: 'network_error',
  };
}
