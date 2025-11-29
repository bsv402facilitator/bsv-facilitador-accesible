/**
 * Verificación de transacciones BSV sin broadcast
 *
 * Este módulo implementa la lógica de User Story 1: validar que una transacción BSV
 * cumple con los payment requirements (monto, dirección, red) sin hacer broadcast.
 *
 * Basado en: C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\verify.ts
 */

import { Transaction, Hash, BigNumber, PublicKey } from '@bsv/sdk';
import { Buffer } from 'node:buffer';
import { PaymentPayload, PaymentRequirements, VerifyResponse, VerifyErrorCodes } from './types';
import { logger } from './logger';

/**
 * Convert base64 string to hexadecimal string
 * Uses Buffer from Node.js (available via nodejs_compat_v2 in Cloudflare Workers)
 */
export function base64ToHex(base64: string): string {
  return Buffer.from(base64, 'base64').toString('hex');
}

/**
 * Parse a raw transaction from hex string or binary
 * @throws Error if transaction is malformed
 */
export function parseTransaction(txHex: string): Transaction {
  let tx: Transaction;

  try {
    // Intentar parsear como binary array primero (más robusto)
    const txBytes = Buffer.from(txHex, 'hex');
    tx = Transaction.fromBinary(Array.from(txBytes));
  } catch (binaryError) {
    try {
      // Si falla, intentar con fromHex
      tx = Transaction.fromHex(txHex);
    } catch (hexError) {
      // Si ambos fallan, lanzar el error más descriptivo
      const errorMsg = hexError instanceof Error ? hexError.message : String(hexError);
      throw new Error(`Failed to parse transaction: ${errorMsg}`);
    }
  }

  // Validate basic structure
  if (!tx.inputs || tx.inputs.length === 0) {
    throw new Error('Transaction has no inputs');
  }
  if (!tx.outputs || tx.outputs.length === 0) {
    throw new Error('Transaction has no outputs');
  }

  return tx;
}

/**
 * Check if a locking script is a P2PKH script that pays to the given address
 * T034: Verifica si un output de transacción paga a una dirección específica usando P2PKH
 */
export function isP2PKHToAddress(
  lockingScript: { toHex: () => string },
  targetAddress: string,
  isTestnet: boolean = false
): boolean {
  try {
    const scriptHex = lockingScript.toHex();
    // P2PKH script format: OP_DUP OP_HASH160 <20 bytes pubkey hash> OP_EQUALVERIFY OP_CHECKSIG
    // Hex: 76 a9 14 <40 hex chars = 20 bytes> 88 ac

    if (scriptHex.length !== 50) {
      return false;
    } // 25 bytes = 50 hex chars
    if (!scriptHex.startsWith('76a914')) {
      return false;
    }
    if (!scriptHex.endsWith('88ac')) {
      return false;
    }

    // Extract pubkey hash from script
    const pubkeyHash = scriptHex.slice(6, 46);

    // Derive address from pubkey hash and compare
    // BSV testnet addresses start with 'm' or 'n', mainnet with '1'
    const derivedAddress = pubkeyHashToAddress(pubkeyHash, isTestnet);

    return derivedAddress === targetAddress;
  } catch (error) {
    logger.warn('Error checking P2PKH output', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Convert a pubkey hash to a BSV address
 * @param pubkeyHash - 20 byte pubkey hash as hex string
 * @param testnet - true for testnet, false for mainnet (default: false/mainnet)
 */
export function pubkeyHashToAddress(pubkeyHash: string, testnet: boolean = false): string {
  // Version byte: 0x6f for testnet, 0x00 for mainnet
  const versionByte = testnet ? '6f' : '00';
  const payload = versionByte + pubkeyHash;

  // Double SHA256 for checksum using @bsv/sdk Hash
  const payloadBytes = Array.from(Buffer.from(payload, 'hex'));
  const checksum = Hash.hash256(payloadBytes);
  const checksumHex = Buffer.from(checksum).toString('hex').slice(0, 8);

  // Base58 encode with checksum
  const fullPayload = payload + checksumHex;
  return base58Encode(Buffer.from(fullPayload, 'hex'));
}

/**
 * Base58 encode a buffer
 */
export function base58Encode(buffer: Buffer): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let num = BigInt('0x' + buffer.toString('hex'));
  let result = '';

  while (num > 0n) {
    const remainder = num % 58n;
    num = num / 58n;
    result = ALPHABET[Number(remainder)] + result;
  }

  // Add leading zeros
  for (const byte of buffer) {
    if (byte === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Base58 decode a string to buffer
 */
export function base58Decode(address: string): Buffer | null {
  try {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    let num = 0n;
    for (const char of address) {
      const index = ALPHABET.indexOf(char);
      if (index === -1) {
        return null;
      }
      num = num * 58n + BigInt(index);
    }

    let hex = num.toString(16);
    if (hex.length % 2) {
      hex = '0' + hex;
    }

    // Add leading zeros
    for (const char of address) {
      if (char === '1') {
        hex = '00' + hex;
      } else {
        break;
      }
    }

    return Buffer.from(hex, 'hex');
  } catch {
    return null;
  }
}

/**
 * T033: Valida que una dirección BSV sea válida y de la red especificada
 */
export function validateBsvAddress(address: string, isTestnet: boolean = false): boolean {
  try {
    // Decode base58
    const decoded = base58Decode(address);
    if (!decoded || decoded.length !== 25) {
      return false;
    }

    // Extract version, payload, and checksum
    const version = decoded[0];
    const payload = decoded.slice(0, 21);
    const checksum = decoded.slice(21, 25);

    // Verify checksum
    const payloadBytes = Array.from(payload);
    const expectedChecksum = Buffer.from(Hash.hash256(payloadBytes)).slice(0, 4);

    if (!checksum.equals(expectedChecksum)) {
      logger.warn('Address checksum validation failed', {
        address: address.substring(0, 8) + '...',
      });
      return false;
    }

    // Verify network
    const expectedVersion = isTestnet ? 0x6f : 0x00; // 0x6f for testnet, 0x00 for mainnet
    if (version !== expectedVersion) {
      logger.warn('Address network mismatch', {
        address: address.substring(0, 8) + '...',
        version: version.toString(16),
        expected: expectedVersion.toString(16),
        network: isTestnet ? 'testnet' : 'mainnet',
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('Address validation failed', {
      address: address.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Sum all outputs that pay to the specified address
 * @returns Total satoshis paid to the address
 */
export function sumOutputsToAddress(tx: Transaction, targetAddress: string, isTestnet: boolean = false): bigint {
  let total = 0n;

  for (const output of tx.outputs) {
    if (output.lockingScript && isP2PKHToAddress(output.lockingScript, targetAddress, isTestnet)) {
      // satoshis can be number or BigNumber
      const satoshis =
        typeof output.satoshis === 'object' && output.satoshis !== null
          ? BigInt((output.satoshis as BigNumber).toString())
          : BigInt(output.satoshis ?? 0);
      total += satoshis;
    }
  }

  return total;
}

/**
 * T035: Extract payer address from transaction inputs
 * Uses the first input's source transaction output to derive the sender address
 */
export function extractPayerAddress(tx: Transaction, isTestnet: boolean = false): string | undefined {
  try {
    // Get the first input
    const firstInput = tx.inputs[0];
    if (!firstInput || !firstInput.unlockingScript) {
      return undefined;
    }

    // P2PKH unlocking script format: <signature> <pubkey>
    // We need to extract the public key and derive the address from it
    const unlockingScriptHex = firstInput.unlockingScript.toHex();

    // Parse the script to get the public key
    const pubkey = extractPublicKeyFromUnlockingScript(unlockingScriptHex);
    if (!pubkey) {
      return undefined;
    }

    // Derive address from public key
    return publicKeyToAddress(pubkey, isTestnet);
  } catch (error) {
    logger.warn('Failed to extract payer address from transaction', {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

/**
 * Extract public key from P2PKH unlocking script
 * Format: <signature length byte> <signature> <pubkey length byte> <pubkey>
 */
export function extractPublicKeyFromUnlockingScript(scriptHex: string): string | null {
  try {
    let offset = 0;

    // Read signature length (first byte)
    const sigLength = parseInt(scriptHex.slice(offset, offset + 2), 16);
    offset += 2;

    // Skip signature
    offset += sigLength * 2;

    // Read pubkey length
    const pubkeyLength = parseInt(scriptHex.slice(offset, offset + 2), 16);
    offset += 2;

    // Standard compressed pubkey is 33 bytes, uncompressed is 65 bytes
    if (pubkeyLength !== 33 && pubkeyLength !== 65) {
      return null;
    }

    // Extract pubkey
    const pubkey = scriptHex.slice(offset, offset + pubkeyLength * 2);

    return pubkey;
  } catch {
    return null;
  }
}

/**
 * Convert a public key to a BSV address
 */
export function publicKeyToAddress(pubkeyHex: string, testnet: boolean = false): string {
  try {
    // Use @bsv/sdk PublicKey to handle the conversion
    const pubkey = PublicKey.fromString(pubkeyHex);
    const hash = pubkey.toHash();

    // Convert hash (string or number[]) to hex string
    let hashHex: string;
    if (typeof hash === 'string') {
      hashHex = hash;
    } else {
      hashHex = Buffer.from(hash as number[]).toString('hex');
    }

    return pubkeyHashToAddress(hashHex, testnet);
  } catch {
    // Fallback: manual hash computation using Hash.hash160
    try {
      const pubkeyBytes = Array.from(Buffer.from(pubkeyHex, 'hex'));
      const hash160 = Hash.hash160(pubkeyBytes);
      const hashHex = Buffer.from(hash160 as number[]).toString('hex');
      return pubkeyHashToAddress(hashHex, testnet);
    } catch {
      return '';
    }
  }
}

/**
 * T036: Verifica que una transacción BSV cumpla con los payment requirements
 *
 * Valida:
 * - Formato de transacción válido (parseable)
 * - Monto exacto en output a dirección destino
 * - Dirección destino válida y de la red correcta
 *
 * @param payload - PaymentPayload con transacción firmada
 * @param requirements - PaymentRequirements con monto y dirección esperados
 * @returns VerifyResponse con isValid y posible invalidReason
 */
export function verifyTransaction(
  payload: PaymentPayload,
  requirements: PaymentRequirements
): VerifyResponse {
  const startTime = Date.now();

  try {
    // Determinar si es testnet basado en el payload/requirements network
    const isTestnet = payload.network === 'bsv-testnet' || requirements.network === 'bsv-testnet';

    // Paso 1: Validar dirección destino primero (fail fast)
    if (!validateBsvAddress(requirements.payTo, isTestnet)) {
      logger.warn('Invalid address or network mismatch in requirements', {
        address: requirements.payTo.substring(0, 8) + '...',
        expectedNetwork: isTestnet ? 'testnet' : 'mainnet',
      });

      return {
        isValid: false,
        invalidReason: VerifyErrorCodes.INVALID_ADDRESS,
      };
    }

    // Paso 2: Convertir y parsear transacción
    let txHex: string;
    try {
      // El payload puede estar en base64 o hex, intentar ambos
      if (payload.payload.transaction.match(/^[0-9a-fA-F]+$/)) {
        // Ya es hex
        txHex = payload.payload.transaction;
      } else {
        // Asumir base64
        txHex = base64ToHex(payload.payload.transaction);
      }
    } catch {
      logger.error('Transaction decode failed', {
        txLength: payload.payload.transaction.length,
      });

      return {
        isValid: false,
        invalidReason: VerifyErrorCodes.INVALID_FORMAT,
      };
    }

    // Paso 3: Parsear transacción
    let tx: Transaction;
    try {
      tx = parseTransaction(txHex);
    } catch (parseError) {
      logger.error('Transaction parsing failed', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        txHexLength: txHex.length,
      });

      return {
        isValid: false,
        invalidReason: VerifyErrorCodes.INVALID_FORMAT,
      };
    }

    // Paso 4: Sumar outputs que pagan a la dirección destino
    const totalToPayee = sumOutputsToAddress(tx, requirements.payTo, isTestnet);

    if (totalToPayee === 0n) {
      logger.warn('No outputs found paying to required address', {
        address: requirements.payTo.substring(0, 8) + '...',
        outputCount: tx.outputs.length,
        network: isTestnet ? 'testnet' : 'mainnet',
      });

      const payer = extractPayerAddress(tx, isTestnet);

      return {
        isValid: false,
        invalidReason: VerifyErrorCodes.INVALID_ADDRESS,
        payer,
      };
    }

    // Paso 5: Verificar monto
    const requiredAmount = BigInt(requirements.maxAmountRequired);

    if (totalToPayee < requiredAmount) {
      logger.warn('Amount mismatch in transaction', {
        expected: requiredAmount.toString(),
        actual: totalToPayee.toString(),
        address: requirements.payTo.substring(0, 8) + '...',
      });

      const payer = extractPayerAddress(tx, isTestnet);

      return {
        isValid: false,
        invalidReason: VerifyErrorCodes.INVALID_AMOUNT,
        payer,
      };
    }

    // Paso 6: Todo válido, extraer dirección del pagador
    const payer = extractPayerAddress(tx, isTestnet);

    const elapsed = Date.now() - startTime;
    logger.info('Transaction verified successfully', {
      txid: tx.id('hex'),
      payer: payer ? payer.substring(0, 8) + '...' : 'unknown',
      amount: requiredAmount.toString(),
      network: isTestnet ? 'testnet' : 'mainnet',
      elapsedMs: elapsed,
    });

    return {
      isValid: true,
      payer,
    };
  } catch (error) {
    logger.error('Unexpected error during transaction verification', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Error inesperado, retornar como formato inválido
    return {
      isValid: false,
      invalidReason: VerifyErrorCodes.INVALID_FORMAT,
    };
  }
}

/**
 * Get the raw hex transaction from a PaymentPayload
 * Utility function for use with settle operations
 */
export function getTransactionHex(payload: PaymentPayload): string {
  // El payload puede estar en base64 o hex, intentar ambos
  if (payload.payload.transaction.match(/^[0-9a-fA-F]+$/)) {
    return payload.payload.transaction;
  } else {
    return base64ToHex(payload.payload.transaction);
  }
}
