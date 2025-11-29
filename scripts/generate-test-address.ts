/**
 * Script para generar direcciones BSV testnet válidas para tests
 */
import { PrivateKey } from '@bsv/sdk';

// Generar una dirección testnet válida
const privateKey = PrivateKey.fromRandom();
const testnetAddress = privateKey.toAddress('testnet').toString();

console.log('Testnet address:', testnetAddress);
console.log('Private key (WIF):', privateKey.toWif());

// Generar otra dirección para diferentes casos de test
const privateKey2 = PrivateKey.fromRandom();
const testnetAddress2 = privateKey2.toAddress('testnet').toString();

console.log('\nSecond testnet address:', testnetAddress2);
console.log('Second private key (WIF):', privateKey2.toWif());

// Generar una mainnet address para test de rechazo
const mainnetAddress = privateKey.toAddress('mainnet').toString();
console.log('\nMainnet address (for rejection tests):', mainnetAddress);
