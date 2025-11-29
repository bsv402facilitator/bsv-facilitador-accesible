#!/usr/bin/env tsx
/**
 * Script para construir una transacción BSV real desde UTXOs
 * Uso:
 *   npx tsx scripts/build-real-transaction.ts
 *
 * Requisitos:
 * 1. Tener fondos en la wallet (ejecutar create-test-transaction.ts primero)
 * 2. Esperar confirmación de los fondos
 */

import { PrivateKey, P2PKH, Transaction, Utils } from '@bsv/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Paso 1: Cargar wallet info
// ============================================================================

const walletPath = join(process.cwd(), 'wallet-testnet.json');

let walletInfo: any;
try {
  walletInfo = JSON.parse(readFileSync(walletPath, 'utf-8'));
  console.log('✅ Wallet cargada desde wallet-testnet.json\n');
} catch (error) {
  console.error('❌ Error: No se encontró wallet-testnet.json');
  console.error('   Ejecuta primero: npx tsx scripts/create-test-transaction.ts\n');
  process.exit(1);
}

const privateKey = PrivateKey.fromWif(walletInfo.privateKey);
const sourceAddress = walletInfo.address;

console.log(`📍 Dirección: ${sourceAddress}\n`);

// ============================================================================
// Paso 2: Obtener UTXOs de WhatsOnChain
// ============================================================================

console.log('🔍 Buscando UTXOs en WhatsOnChain...\n');

interface UTXO {
  tx_hash: string;
  tx_pos: number;
  value: number;
  height: number;
}

async function getUnspentOutputs(address: string): Promise<UTXO[]> {
  const url = `https://api.whatsonchain.com/v1/bsv/test/address/${address}/unspent`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const utxos: UTXO[] = await response.json();
    return utxos;
  } catch (error) {
    console.error('❌ Error obteniendo UTXOs:', error);
    return [];
  }
}

const utxos = await getUnspentOutputs(sourceAddress);

if (utxos.length === 0) {
  console.error('❌ No se encontraron UTXOs (fondos) en esta dirección.\n');
  console.log('📝 Para obtener fondos:');
  console.log(`   1. Visita: https://faucet.bitcoincloud.net/`);
  console.log(`   2. Envía fondos a: ${sourceAddress}`);
  console.log(`   3. Espera confirmación (10-20 minutos)`);
  console.log(`   4. Verifica en: ${walletInfo.explorer}\n`);
  process.exit(1);
}

console.log(`✅ Se encontraron ${utxos.length} UTXO(s):\n`);
utxos.forEach((utxo, i) => {
  console.log(`   UTXO #${i + 1}:`);
  console.log(`   - TXID: ${utxo.tx_hash}`);
  console.log(`   - Index: ${utxo.tx_pos}`);
  console.log(`   - Value: ${utxo.value} satoshis`);
  console.log(`   - Confirmations: ${utxo.height > 0 ? 'Confirmed' : 'Unconfirmed'}\n`);
});

// ============================================================================
// Paso 3: Construir transacción
// ============================================================================

console.log('🔨 Construyendo transacción...\n');

// Configuración del pago
const facilitatorAddress = 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk'; // Dirección de ejemplo
const paymentAmount = 50000; // 50,000 satoshis (0.0005 BSV)

// Seleccionar el primer UTXO con suficientes fondos
const selectedUtxo = utxos.find((utxo) => utxo.value > paymentAmount + 1000); // +1000 para fee

if (!selectedUtxo) {
  console.error('❌ No hay UTXOs con suficientes fondos para el pago.\n');
  console.log(`   Necesitas al menos ${paymentAmount + 1000} satoshis`);
  console.log(`   Tu UTXO más grande tiene: ${Math.max(...utxos.map((u) => u.value))} satoshis\n`);
  process.exit(1);
}

console.log('✅ Usando UTXO:');
console.log(`   - TXID: ${selectedUtxo.tx_hash}`);
console.log(`   - Value: ${selectedUtxo.value} satoshis\n`);

// Obtener la transacción fuente (source transaction) de WhatsOnChain
console.log('📥 Descargando source transaction...\n');

async function getSourceTransaction(txid: string): Promise<string> {
  const url = `https://api.whatsonchain.com/v1/bsv/test/tx/${txid}/hex`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('❌ Error descargando source transaction:', error);
    throw error;
  }
}

const sourceTransactionHex = await getSourceTransaction(selectedUtxo.tx_hash);
const sourceTransaction = Transaction.fromHex(sourceTransactionHex);

console.log('✅ Source transaction descargada\n');

// Crear la transacción de pago
const tx = new Transaction();

// Agregar input (UTXO)
tx.addInput({
  sourceTransaction,
  sourceOutputIndex: selectedUtxo.tx_pos,
  unlockingScriptTemplate: new P2PKH().unlock(privateKey),
});

// Agregar output (pago al facilitador)
tx.addOutput({
  lockingScript: new P2PKH().lock(facilitatorAddress),
  satoshis: paymentAmount,
});

// Agregar output (change - vuelto a nuestra dirección)
tx.addOutput({
  lockingScript: new P2PKH().lock(sourceAddress),
  change: true,
});

// Calcular fee y firmar
await tx.fee();
await tx.sign();

const txHex = tx.toHex();
const txid = tx.id('hex') as string;

console.log('✅ Transacción creada y firmada:\n');
console.log(`   - TXID: ${txid}`);
console.log(`   - Size: ${txHex.length / 2} bytes`);
console.log(`   - Hex length: ${txHex.length} chars\n`);

// ============================================================================
// Paso 4: Crear payloads para el facilitador
// ============================================================================

const verifyPayload = {
  payload: {
    x402Version: 1,
    scheme: 'exact' as const,
    network: 'bsv-testnet' as const,
    payload: {
      transaction: txHex,
    },
  },
  paymentRequirements: {
    scheme: 'exact' as const,
    network: 'bsv-testnet' as const,
    maxAmountRequired: paymentAmount.toString(),
    resource: 'https://example.com/api/resource',
    payTo: facilitatorAddress,
    maxTimeoutSeconds: 3600,
  },
};

const settlePayload = {
  payload: {
    x402Version: 1,
    scheme: 'exact' as const,
    network: 'bsv-testnet' as const,
    payload: {
      transaction: txHex,
    },
  },
  paymentRequirements: {
    scheme: 'exact' as const,
    network: 'bsv-testnet' as const,
    maxAmountRequired: paymentAmount.toString(),
    resource: 'https://example.com/api/resource',
    payTo: facilitatorAddress,
    maxTimeoutSeconds: 3600,
  },
};

// Guardar payloads
const verifyPath = join(process.cwd(), 'verify-payload.json');
const settlePath = join(process.cwd(), 'settle-payload.json');

writeFileSync(verifyPath, JSON.stringify(verifyPayload, null, 2));
writeFileSync(settlePath, JSON.stringify(settlePayload, null, 2));

console.log('💾 Payloads guardados:\n');
console.log(`   - ${verifyPath}`);
console.log(`   - ${settlePath}\n`);

// ============================================================================
// Paso 5: Instrucciones para probar
// ============================================================================

console.log('🚀 Próximos pasos:\n');
console.log('1. Probar /verify endpoint:\n');
console.log('   curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/verify \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d @verify-payload.json\n');
console.log('2. Si verify es exitoso, probar /settle endpoint:\n');
console.log('   curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/settle \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d @settle-payload.json\n');
console.log('3. El settle endpoint hará broadcast de la transacción a la red BSV testnet.\n');
console.log('4. Verifica el broadcast en:\n');
console.log(`   https://test.whatsonchain.com/tx/${txid}\n`);
console.log('⚠️  Nota: La transacción solo se puede hacer broadcast UNA vez.\n');
console.log('   Si necesitas crear otra transacción, ejecuta este script nuevamente.\n');
