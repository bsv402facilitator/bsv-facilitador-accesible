#!/usr/bin/env npx tsx

/**
 * Script simple para crear un payload X402 y mostrarlo en stdout
 */

import { PrivateKey, Transaction, P2PKH, ARC } from '@bsv/sdk';
import { createPaymentPayload } from '../src/x402/payment-creator.js';
import fs from 'fs';
import path from 'path';

interface WalletData {
  wif: string;
  address: string;
  network: 'mainnet' | 'testnet';
}

async function main() {
  try {
    // Leer wallet importada
    const walletPath = path.join(process.cwd(), 'wallet-imported.json');
    const walletData: WalletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

    const privateKey = PrivateKey.fromWif(walletData.wif);
    const sourceAddress = walletData.address;

    // Destino: dirección del resource server
    const payTo = process.env.PAY_TO || 'mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk';
    const amount = parseInt(process.env.AMOUNT || '1000');

    console.error(`📝 Creando transacción de pago...`);
    console.error(`   De: ${sourceAddress}`);
    console.error(`   A: ${payTo}`);
    console.error(`   Monto: ${amount} satoshis`);
    console.error('');

    // Obtener UTXOs
    const wocUrl = `https://api.whatsonchain.com/v1/bsv/test/address/${sourceAddress}/unspent`;
    console.error(`🔍 Obteniendo UTXOs de: ${wocUrl}`);

    const utxosResponse = await fetch(wocUrl);
    if (!utxosResponse.ok) {
      throw new Error(`Failed to fetch UTXOs: ${utxosResponse.status}`);
    }

    const utxos = await utxosResponse.json() as Array<{
      tx_hash: string;
      tx_pos: number;
      value: number;
      height: number;
    }>;

    if (utxos.length === 0) {
      throw new Error('No UTXOs found');
    }

    console.error(`✅ Encontrados ${utxos.length} UTXOs`);

    // Usar el primer UTXO
    const utxo = utxos[0];
    console.error(`   Usando UTXO: ${utxo.tx_hash.substring(0, 16)}...:${utxo.tx_pos} (${utxo.value} sats)`);

    // Obtener la transacción fuente
    const sourceTxUrl = `https://api.whatsonchain.com/v1/bsv/test/tx/${utxo.tx_hash}/hex`;
    const sourceTxResponse = await fetch(sourceTxUrl);
    if (!sourceTxResponse.ok) {
      throw new Error(`Failed to fetch source tx: ${sourceTxResponse.status}`);
    }
    const sourceTxHex = await sourceTxResponse.text();

    // Crear transaction
    const tx = new Transaction();

    // Input: el UTXO que vamos a gastar
    tx.addInput({
      sourceTransaction: Transaction.fromHex(sourceTxHex),
      sourceOutputIndex: utxo.tx_pos,
      unlockingScriptTemplate: new P2PKH().unlock(privateKey),
    });

    // Output 1: Pago al resource server
    tx.addOutput({
      lockingScript: new P2PKH().lock(payTo),
      satoshis: amount,
    });

    // Output 2: Cambio de vuelta a nuestra dirección
    const fee = 100; // 100 satoshis de fee
    const change = utxo.value - amount - fee;

    if (change > 0) {
      tx.addOutput({
        lockingScript: new P2PKH().lock(sourceAddress),
        satoshis: change,
      });
    }

    // Firmar
    console.error('');
    console.error('🔐 Firmando transacción...');
    await tx.sign();

    const txHex = tx.toHex();
    const txid = tx.id('hex') as string;

    console.error(`✅ Transacción creada`);
    console.error(`   TXID: ${txid}`);
    console.error(`   Size: ${tx.toHex().length / 2} bytes`);
    console.error('');

    // Crear payload X402
    const paymentPayload = createPaymentPayload(tx, 'testnet');

    console.error('✅ Payload X402 creado');
    console.error(`   Tamaño: ${paymentPayload.length} caracteres`);
    console.error('');

    // Output el payload a stdout (esto es lo que capturará el script bash)
    console.log(paymentPayload);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
