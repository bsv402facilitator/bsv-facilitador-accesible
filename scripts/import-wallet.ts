#!/usr/bin/env tsx
/**
 * Script para importar wallet desde seed phrase (mnemonic)
 * Uso:
 *   npx tsx scripts/import-wallet.ts
 *
 * Este script:
 * 1. Importa wallet desde palabras de recuperación (BIP39 mnemonic)
 * 2. Deriva claves usando BIP32/BIP44 path estándar para BSV
 * 3. Genera direcciones testnet
 * 4. Verifica balance en WhatsOnChain
 * 5. Guarda la información en wallet-imported.json
 */

import { HD, Mnemonic } from '@bsv/sdk';
import { writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Configuración
// ============================================================================

// Wallet proporcionada por el usuario
const mnemonicPhrase = 'evolve lottery shrimp host cute ancient useful calm race napkin outer boss';
const address = 'mvV6uHSpDfk4PLa1B1Mf8wYQMn7Gf9eMf4';

console.log('🔐 Importando wallet desde seed phrase...\n');

// ============================================================================
// Paso 1: Derivar claves desde mnemonic
// ============================================================================

console.log('📝 Mnemonic words: ' + mnemonicPhrase.split(' ').length + ' palabras');
console.log('📍 Dirección objetivo: ' + address + '\n');

// Crear mnemonic object y convertir a seed
const mnemonic = Mnemonic.fromString(mnemonicPhrase);

// Verificar que el mnemonic es válido
if (!mnemonic.check()) {
  console.error('❌ Error: El mnemonic no es válido.\n');
  process.exit(1);
}

console.log('✅ Mnemonic válido\n');

// Convertir mnemonic a seed
const seed = mnemonic.toSeed();

// Crear HD wallet desde seed
const hdPrivateKey = HD.fromSeed(seed);

// Derivar usando BIP44 path para BSV testnet
// m/44'/0'/0'/0/0 (primer address de la wallet)
const derivationPath = "m/44'/0'/0'/0/0";

console.log('🔑 Derivando claves usando path: ' + derivationPath + '\n');

let derivedKey;
try {
  derivedKey = hdPrivateKey.derive(derivationPath);
} catch (error) {
  console.error('❌ Error al derivar path.\n');
  console.error('Detalles:', error);
  process.exit(1);
}

const privateKey = derivedKey.privKey;
const publicKey = derivedKey.pubKey;

// Generar dirección testnet
const derivedAddress = publicKey.toAddress('testnet');

console.log('✅ Claves derivadas:');
console.log(`   Private Key (WIF): ${privateKey.toWif()}`);
console.log(`   Public Key: ${publicKey.toString()}`);
console.log(`   Dirección derivada: ${derivedAddress}\n`);

// Verificar que la dirección derivada coincida con la proporcionada
if (derivedAddress !== address) {
  console.warn('⚠️  ADVERTENCIA: La dirección derivada NO coincide con la proporcionada.\n');
  console.warn(`   Esperada: ${address}`);
  console.warn(`   Derivada: ${derivedAddress}\n`);
  console.warn('   Esto puede significar que:');
  console.warn('   1. El path de derivación es diferente');
  console.warn('   2. El mnemonic no corresponde a esta dirección');
  console.warn('   3. La dirección usa un formato diferente\n');
  console.warn('   Continuando con la dirección derivada...\n');
}

// Usar la dirección derivada para el resto del script
const finalAddress = derivedAddress;

// ============================================================================
// Paso 2: Verificar balance en WhatsOnChain
// ============================================================================

console.log('🔍 Verificando balance en WhatsOnChain...\n');

interface UTXO {
  tx_hash: string;
  tx_pos: number;
  value: number;
  height: number;
}

async function getUnspentOutputs(addr: string): Promise<UTXO[]> {
  const url = `https://api.whatsonchain.com/v1/bsv/test/address/${addr}/unspent`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        // 404 significa que no hay UTXOs (balance = 0)
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const utxos: UTXO[] = await response.json();
    return utxos;
  } catch (error) {
    console.error('❌ Error verificando balance:', error);
    return [];
  }
}

async function getAddressInfo(addr: string) {
  const url = `https://api.whatsonchain.com/v1/bsv/test/address/${addr}/info`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

const utxos = await getUnspentOutputs(finalAddress);
const addressInfo = await getAddressInfo(finalAddress);

if (addressInfo) {
  console.log('✅ Información de la dirección:');
  console.log(`   Balance: ${addressInfo.balance} satoshis`);
  console.log(`   Total recibido: ${addressInfo.totalReceived} satoshis`);
  console.log(`   Total enviado: ${addressInfo.totalSent} satoshis`);
  console.log(`   Transacciones: ${addressInfo.txCount}\n`);
} else {
  console.log('ℹ️  No se pudo obtener información de la dirección (puede estar vacía)\n');
}

if (utxos.length === 0) {
  console.log('⚠️  No se encontraron UTXOs (fondos disponibles) en esta dirección.\n');
  console.log('📝 Para obtener fondos de testnet:');
  console.log(`   1. Visita: https://faucet.bitcoincloud.net/`);
  console.log(`   2. Envía fondos a: ${finalAddress}`);
  console.log(`   3. Espera confirmación (10-20 minutos)`);
  console.log(`   4. Verifica en: https://test.whatsonchain.com/address/${finalAddress}\n`);
} else {
  console.log(`✅ Se encontraron ${utxos.length} UTXO(s):\n`);

  let totalBalance = 0;
  utxos.forEach((utxo, i) => {
    console.log(`   UTXO #${i + 1}:`);
    console.log(`   - TXID: ${utxo.tx_hash}`);
    console.log(`   - Index: ${utxo.tx_pos}`);
    console.log(`   - Value: ${utxo.value} satoshis`);
    console.log(`   - Status: ${utxo.height > 0 ? 'Confirmed' : 'Unconfirmed'}\n`);
    totalBalance += utxo.value;
  });

  console.log(`💰 Balance total disponible: ${totalBalance} satoshis (${(totalBalance / 100000000).toFixed(8)} BSV)\n`);
}

// ============================================================================
// Paso 3: Guardar información de wallet
// ============================================================================

const walletInfo = {
  source: 'imported_from_mnemonic',
  network: 'testnet',
  mnemonic: mnemonicPhrase,
  derivationPath: derivationPath,
  privateKey: privateKey.toWif(),
  publicKey: publicKey.toString(),
  address: finalAddress,
  addressProvided: address,
  addressMatch: finalAddress === address,
  balance: addressInfo?.balance || 0,
  utxoCount: utxos.length,
  faucets: [
    'https://faucet.bitcoincloud.net/',
    'https://testnet.satoshisvision.network/',
  ],
  explorer: `https://test.whatsonchain.com/address/${finalAddress}`,
  apiUnspent: `https://api.whatsonchain.com/v1/bsv/test/address/${finalAddress}/unspent`,
  instructions: [
    '1. Verifica el balance en el explorador',
    '2. Si no hay fondos, obtén del faucet',
    '3. Ejecuta scripts/build-real-transaction-imported.ts para crear transacciones',
    '4. Prueba el facilitador con transacciones reales',
  ],
};

const outputPath = join(process.cwd(), 'wallet-imported.json');
writeFileSync(outputPath, JSON.stringify(walletInfo, null, 2));

console.log('💾 Información de wallet guardada en: wallet-imported.json\n');

// ============================================================================
// Paso 4: Actualizar .gitignore si es necesario
// ============================================================================

console.log('✅ Wallet importada exitosamente!\n');

if (utxos.length > 0) {
  console.log('🚀 Próximos pasos:');
  console.log('   1. Ejecuta: npx tsx scripts/build-real-transaction-imported.ts');
  console.log('   2. Esto creará verify-payload.json y settle-payload.json');
  console.log('   3. Prueba el facilitador con las transacciones reales\n');
} else {
  console.log('⏳ Esperando fondos en la wallet...');
  console.log(`   Verifica el balance en: ${walletInfo.explorer}\n`);
}

console.log('⚠️  IMPORTANTE: NO compartas tu mnemonic ni private key con nadie!');
console.log('⚠️  Esta es una wallet de TESTNET, pero las claves deben mantenerse privadas.\n');
