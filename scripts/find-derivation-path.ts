#!/usr/bin/env tsx
/**
 * Script para encontrar el path de derivación correcto de una wallet
 * Prueba múltiples paths BIP32/BIP44 comunes
 */

import { HD, Mnemonic, PrivateKey } from '@bsv/sdk';

const mnemonicPhrase = 'evolve lottery shrimp host cute ancient useful calm race napkin outer boss';
const targetAddress = 'mvV6uHSpDfk4PLa1B1Mf8wYQMn7Gf9eMf4';

console.log('🔍 Buscando path de derivación...\n');
console.log(`Dirección objetivo: ${targetAddress}\n`);

// Crear seed desde mnemonic
const mnemonic = Mnemonic.fromString(mnemonicPhrase);
const seed = mnemonic.toSeed();
const hdKey = HD.fromSeed(seed);

// Paths comunes a probar
const pathsToTry = [
  "m/44'/0'/0'/0/0",      // BIP44 BSV mainnet
  "m/44'/1'/0'/0/0",      // BIP44 testnet (coin type 1)
  "m/44'/145'/0'/0/0",    // BIP44 Bitcoin Cash
  "m/0'/0/0",             // Legacy path
  "m/0/0",                // Simple path
  "m/44'/0'/0'/0",        // Sin index final
  "m/44'/0'/0'",          // Account level
  "m/0",                  // Root + 1
  "m/0/0/0",              // Triple simple
  "m/44'/0'/0'/0/0/0",    // Extra level
];

console.log(`Probando ${pathsToTry.length} paths de derivación:\n`);

for (const path of pathsToTry) {
  try {
    const derived = hdKey.derive(path);
    const privateKey = derived.privKey;
    const publicKey = derived.pubKey;

    // Probar ambos: mainnet y testnet
    const mainnetAddr = publicKey.toAddress('mainnet');
    const testnetAddr = publicKey.toAddress('testnet');

    console.log(`Path: ${path}`);
    console.log(`  Mainnet: ${mainnetAddr}`);
    console.log(`  Testnet: ${testnetAddr}`);

    if (mainnetAddr === targetAddress) {
      console.log(`\n✅ ¡ENCONTRADO! Path: ${path} (mainnet format)`);
      console.log(`   Private Key (WIF): ${privateKey.toWif()}`);
      process.exit(0);
    }

    if (testnetAddr === targetAddress) {
      console.log(`\n✅ ¡ENCONTRADO! Path: ${path} (testnet format)`);
      console.log(`   Private Key (WIF): ${privateKey.toWif()}`);
      process.exit(0);
    }

    console.log('');
  } catch (error) {
    console.log(`Path: ${path} - Error: ${error.message}\n`);
  }
}

console.log('❌ No se encontró el path de derivación en los paths comunes.');
console.log('\nPosibles razones:');
console.log('1. El mnemonic no corresponde a esta dirección');
console.log('2. Se usa un path de derivación no estándar');
console.log('3. Se requiere una passphrase adicional (BIP39)\n');

// Probar con passphrase vacía vs sin passphrase
console.log('Probando con passphrase vacía...\n');
const seedWithPassphrase = mnemonic.toSeed('');
const hdKeyWithPassphrase = HD.fromSeed(seedWithPassphrase);

for (const path of pathsToTry.slice(0, 3)) {
  try {
    const derived = hdKeyWithPassphrase.derive(path);
    const testnetAddr = derived.pubKey.toAddress('testnet');

    console.log(`Path: ${path} (con passphrase vacía)`);
    console.log(`  Testnet: ${testnetAddr}`);

    if (testnetAddr === targetAddress) {
      console.log(`\n✅ ¡ENCONTRADO con passphrase vacía!`);
      console.log(`   Private Key (WIF): ${derived.privKey.toWif()}`);
      process.exit(0);
    }

    console.log('');
  } catch (error) {
    console.log(`Error: ${error.message}\n`);
  }
}

console.log('\n❌ No se encontró match incluso con passphrase vacía.');
