/**
 * Script de diagnóstico para settle endpoint
 *
 * Este script:
 * 1. Obtiene UTXOs de la wallet
 * 2. Crea una transacción válida firmada
 * 3. Verifica que el hex es válido
 * 4. Testea el endpoint /settle local y remoto
 */

import { PrivateKey, Transaction, P2PKH, Hash, ARC } from '@bsv/sdk';

const FACILITATOR_LOCAL = 'http://localhost:8787';
const FACILITATOR_REMOTE = 'https://facilitador-bsv-x402-accesible.andresleontest.workers.dev';
const WIF = 'L26hwwP6om6MYkpNykXVyKr6ACpG1Qe3S4n6weRWZ54ftHvkGVtK';
const ADDRESS = 'n2CazoRPsfLDFuCr49ZnqVkFTc6RvzSTkk';
const WOC_API = 'https://api.whatsonchain.com/v1/bsv/test';

interface UTXO {
  tx_hash: string;
  tx_pos: number;
  value: number;
  height: number;
}

/**
 * Obtiene UTXOs de la dirección
 */
async function getUTXOs(address: string): Promise<UTXO[]> {
  const url = `${WOC_API}/address/${address}/unspent`;
  console.log(`\n🔍 Fetching UTXOs from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs: ${response.status} ${response.statusText}`);
  }

  const utxos = await response.json();
  console.log(`✅ Found ${utxos.length} UTXOs`);

  return utxos;
}

/**
 * Obtiene la source transaction de WhatsOnChain
 */
async function getSourceTransaction(txid: string): Promise<Transaction> {
  const url = `${WOC_API}/tx/${txid}/hex`;
  console.log(`   Fetching source tx: ${txid.substring(0, 16)}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch source tx: ${response.status}`);
  }

  const hex = await response.text();
  return Transaction.fromHex(hex);
}

/**
 * Crea una transacción BSV válida usando @bsv/sdk (método correcto con source transaction)
 */
async function createValidTransaction(wif: string, address: string): Promise<string> {
  console.log('\n📝 Creating valid BSV transaction...');

  // 1. Obtener UTXOs
  const utxos = await getUTXOs(address);

  if (utxos.length === 0) {
    throw new Error('No UTXOs available. Fund the address first: https://faucet.bitcoincloud.net/');
  }

  // 2. Crear private key
  const privateKey = PrivateKey.fromWif(wif);

  console.log(`   Address: ${address}`);

  // 3. Seleccionar UTXO con suficientes fondos (al menos 2000 sats para fee)
  const utxo = utxos.find((u) => u.value > 2000);

  if (!utxo) {
    throw new Error(`No UTXO with enough funds. Largest UTXO: ${Math.max(...utxos.map((u) => u.value))} sats`);
  }

  console.log(`\n   Using UTXO: ${utxo.tx_hash.substring(0, 16)}...:${utxo.tx_pos} (${utxo.value} sats)`);

  // 4. Obtener source transaction (REQUERIDO para firma)
  const sourceTransaction = await getSourceTransaction(utxo.tx_hash);

  // 5. Crear transacción
  const tx = new Transaction();

  // 6. Agregar input con sourceTransaction
  tx.addInput({
    sourceTransaction,
    sourceOutputIndex: utxo.tx_pos,
    unlockingScriptTemplate: new P2PKH().unlock(privateKey),
  });

  // 7. Agregar output (self-payment con change)
  // Enviamos una pequeña cantidad a nosotros mismos
  const paymentAmount = 1000; // 1000 sats

  tx.addOutput({
    lockingScript: new P2PKH().lock(address),
    satoshis: paymentAmount,
  });

  // 8. Agregar output de change (vuelto)
  tx.addOutput({
    lockingScript: new P2PKH().lock(address),
    change: true, // El SDK calcula automáticamente el change
  });

  // 9. Calcular fee y firmar
  console.log('\n   🔐 Calculating fee and signing...');

  await tx.fee();
  await tx.sign();

  // 10. Validar transacción
  const txHex = tx.toHex();
  const txid = tx.id('hex') as string;

  console.log(`\n✅ Transaction created successfully`);
  console.log(`   TXID: ${txid}`);
  console.log(`   Size: ${txHex.length / 2} bytes`);
  console.log(`   Hex length: ${txHex.length} chars`);
  console.log(`   Hex preview: ${txHex.substring(0, 100)}...`);

  return txHex;
}

/**
 * Testea el endpoint /settle
 */
async function testSettleEndpoint(facilitatorUrl: string, txHex: string): Promise<void> {
  console.log(`\n🚀 Testing ${facilitatorUrl}/settle`);

  const payload = {
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
      maxAmountRequired: '1000',
      resource: 'https://example.com/api/resource',
      payTo: ADDRESS,
      maxTimeoutSeconds: 3600,
    },
  };

  try {
    const response = await fetch(`${facilitatorUrl}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log(`\n✅ Settle successful!`);
      if (result.transaction) {
        console.log(`   TXID: ${result.transaction}`);
        console.log(`   Explorer: https://test.whatsonchain.com/tx/${result.transaction}`);
      }
    } else {
      console.log(`\n❌ Settle failed`);
      console.log(`   Error: ${result.errorReason}`);
      if (result.plainLanguage) {
        console.log(`   Message: ${result.plainLanguage}`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Request failed:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 BSV Settle Endpoint Diagnostic Tool');
  console.log('=======================================');

  try {
    // 1. Crear transacción válida
    const txHex = await createValidTransaction(WIF, ADDRESS);

    // 2. Testear endpoint local (si está corriendo)
    console.log('\n\n📍 Testing LOCAL facilitator...');
    await testSettleEndpoint(FACILITATOR_LOCAL, txHex);

    // 3. Testear endpoint remoto
    console.log('\n\n📍 Testing REMOTE facilitator...');
    await testSettleEndpoint(FACILITATOR_REMOTE, txHex);

    console.log('\n\n✅ Diagnostic complete');
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

main();
