#!/usr/bin/env tsx
/**
 * Script para crear una transacción BSV testnet real
 * Uso:
 *   npx tsx scripts/create-test-transaction.ts
 *
 * Este script genera:
 * 1. Un par de claves (privada/pública) para testnet
 * 2. Una dirección testnet para recibir fondos
 * 3. Una transacción de ejemplo (requiere fondos en la dirección)
 */

import { PrivateKey, P2PKH, Transaction, ARC } from '@bsv/sdk';

// ============================================================================
// Paso 1: Generar claves y dirección
// ============================================================================

console.log('🔑 Generando par de claves BSV testnet...\n');

// Generar private key aleatoria
const privateKey = PrivateKey.fromRandom();
const publicKey = privateKey.toPublicKey();

// Generar dirección testnet
const address = publicKey.toAddress('testnet');

console.log('✅ Claves generadas:');
console.log(`   Private Key (WIF): ${privateKey.toWif()}`);
console.log(`   Public Key: ${publicKey.toString()}`);
console.log(`   Address (testnet): ${address}\n`);

// ============================================================================
// Paso 2: Instrucciones para obtener fondos
// ============================================================================

console.log('💰 Para obtener fondos de testnet:\n');
console.log('1. Visita un faucet de BSV testnet:');
console.log('   - https://faucet.bitcoincloud.net/ (recomendado)');
console.log('   - https://testnet.satoshisvision.network/');
console.log('');
console.log(`2. Envía fondos a tu dirección: ${address}`);
console.log('');
console.log('3. Espera la confirmación (1-2 bloques, ~10-20 minutos)');
console.log('');
console.log('4. Verifica tu balance en un explorador:');
console.log(`   https://test.whatsonchain.com/address/${address}`);
console.log('');

// ============================================================================
// Paso 3: Crear transacción de ejemplo
// ============================================================================

console.log('📝 Ejemplo de cómo crear una transacción:');
console.log('');
console.log('```typescript');
console.log('// Una vez que tengas fondos en tu dirección:');
console.log('');
console.log('import { PrivateKey, P2PKH, Transaction } from "@bsv/sdk";');
console.log('');
console.log('const privateKey = PrivateKey.fromWif("' + privateKey.toWif() + '");');
console.log('const sourceAddress = "' + address + '";');
console.log('');
console.log('// Crear una transacción que pague al facilitador');
console.log('const facilitatorAddress = "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk"; // Ejemplo');
console.log('const amount = 100000; // 100,000 satoshis = 0.001 BSV');
console.log('');
console.log('// 1. Crear la transacción');
console.log('const tx = new Transaction();');
console.log('');
console.log('// 2. Agregar input (UTXO de tu dirección)');
console.log('// Necesitas obtener tus UTXOs de WhatsOnChain API:');
console.log('// GET https://api.whatsonchain.com/v1/bsv/test/address/' + address + '/unspent');
console.log('');
console.log('// Ejemplo (reemplaza con tu UTXO real):');
console.log('// tx.addInput({');
console.log('//   sourceTXID: "tu_txid_de_utxo",');
console.log('//   sourceOutputIndex: 0,');
console.log('//   unlockingScriptTemplate: new P2PKH().unlock(privateKey),');
console.log('// });');
console.log('');
console.log('// 3. Agregar output (pago al facilitador)');
console.log('// tx.addOutput({');
console.log('//   lockingScript: new P2PKH().lock(facilitatorAddress),');
console.log('//   satoshis: amount,');
console.log('// });');
console.log('');
console.log('// 4. Agregar change output (vuelto a tu dirección)');
console.log('// tx.addOutput({');
console.log('//   lockingScript: new P2PKH().lock(sourceAddress),');
console.log('//   change: true,');
console.log('// });');
console.log('');
console.log('// 5. Firmar y serializar');
console.log('// await tx.fee();');
console.log('// await tx.sign();');
console.log('// const txHex = tx.toHex();');
console.log('');
console.log('// 6. Crear payload para el facilitador');
console.log('// const verifyPayload = {');
console.log('//   payload: {');
console.log('//     x402Version: 1,');
console.log('//     scheme: "exact",');
console.log('//     network: "bsv-testnet",');
console.log('//     payload: {');
console.log('//       transaction: txHex,');
console.log('//     },');
console.log('//   },');
console.log('//   paymentRequirements: {');
console.log('//     scheme: "exact",');
console.log('//     network: "bsv-testnet",');
console.log('//     maxAmountRequired: amount.toString(),');
console.log('//     resource: "https://example.com/api",');
console.log('//     payTo: facilitatorAddress,');
console.log('//     maxTimeoutSeconds: 3600,');
console.log('//   },');
console.log('// };');
console.log('```');
console.log('');

// ============================================================================
// Paso 4: Guardar información en archivo JSON
// ============================================================================

const walletInfo = {
  network: 'testnet',
  privateKey: privateKey.toWif(),
  publicKey: publicKey.toString(),
  address: address,
  faucets: [
    'https://faucet.bitcoincloud.net/',
    'https://testnet.satoshisvision.network/',
  ],
  explorer: `https://test.whatsonchain.com/address/${address}`,
  apiUnspent: `https://api.whatsonchain.com/v1/bsv/test/address/${address}/unspent`,
  instructions: [
    '1. Obtén fondos del faucet',
    '2. Espera confirmación',
    '3. Ejecuta scripts/build-real-transaction.ts para crear la transacción',
    '4. Prueba el facilitador con la transacción real',
  ],
};

console.log('💾 Guardando información de wallet en wallet-testnet.json...\n');

// Importar fs para guardar el archivo
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputPath = join(process.cwd(), 'wallet-testnet.json');
writeFileSync(outputPath, JSON.stringify(walletInfo, null, 2));

console.log(`✅ Información guardada en: ${outputPath}\n`);
console.log('⚠️  IMPORTANTE: Guarda tu private key de forma segura!');
console.log('⚠️  Esta es una wallet de TESTNET, los fondos NO tienen valor real.\n');
