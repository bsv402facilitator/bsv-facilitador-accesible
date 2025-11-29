/**
 * Helper functions to create valid BSV mock transactions for testing
 * Uses @bsv/sdk to ensure transactions are properly structured
 */

import { Transaction, PrivateKey, P2PKH, Script } from '@bsv/sdk';

/**
 * Creates a valid BSV testnet transaction that pays to a specific address
 *
 * @param payTo - Testnet address to pay to (e.g., 'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7')
 * @param amount - Amount in satoshis to pay
 * @returns Transaction hex string
 */
export function createMockPaymentTransaction(payTo: string, amount: number): string {
  // Create a temporary private key for the "sender"
  const senderKey = PrivateKey.fromRandom();
  const senderPubKey = senderKey.toPublicKey();

  // Create a new transaction
  const tx = new Transaction();

  // Add a mock input (UTXO)
  // In a real transaction, this would reference a previous transaction output
  // For testing purposes, we create a simplified but valid input structure
  const mockPrevTxId = '0'.repeat(64); // Mock previous transaction ID
  const mockOutputIndex = 0;

  // Create the input with a valid unlocking script
  // P2PKH unlocking script format: <signature> <pubkey>
  // For testing, we create a mock signature (DER format) and add the public key
  const mockSignature = Buffer.from([
    0x30,
    0x44, // DER sequence, length 68 bytes
    0x02,
    0x20, // integer, length 32
    ...Array(32).fill(0x01), // r value (32 bytes)
    0x02,
    0x20, // integer, length 32
    ...Array(32).fill(0x02), // s value (32 bytes)
    0x41, // SIGHASH_ALL | SIGHASH_FORKID
  ]);

  const pubKeyEncoded = senderPubKey.encode(true) as number[];
  const pubKeyBuffer = Buffer.from(pubKeyEncoded);

  // Build unlocking script: <sig_length> <sig> <pubkey_length> <pubkey>
  const unlockingScriptBytes = Buffer.concat([
    Buffer.from([mockSignature.length]),
    mockSignature,
    Buffer.from([pubKeyBuffer.length]),
    pubKeyBuffer,
  ]);

  const unlockingScript = Script.fromBinary(Array.from(unlockingScriptBytes));

  tx.addInput({
    sourceTXID: mockPrevTxId,
    sourceOutputIndex: mockOutputIndex,
    unlockingScript,
    sequence: 0xffffffff,
  });

  // Add output that pays to the target address
  const p2pkh = new P2PKH();
  const lockingScript = p2pkh.lock(payTo);

  tx.addOutput({
    satoshis: amount,
    lockingScript,
  });

  // Add a change output back to sender (to make transaction more realistic)
  const changeAmount = 1000; // Small change amount
  const senderAddress = senderPubKey.toAddress('testnet') || 'mgHihnXgpKqVFfWhCZmkzGQsu1LcX1F4Z7';
  const senderLockingScript = p2pkh.lock(senderAddress);

  tx.addOutput({
    satoshis: changeAmount,
    lockingScript: senderLockingScript,
  });

  // Return transaction as hex
  return tx.toHex();
}

/**
 * Creates a valid BSV testnet transaction with multiple outputs
 */
export function createMockMultiOutputTransaction(
  outputs: Array<{ address: string; amount: number }>
): string {
  // const _senderKey = PrivateKey.fromRandom(); // Not used in current implementation
  const tx = new Transaction();

  // Add mock input
  const mockPrevTxId = '0'.repeat(64);
  tx.addInput({
    sourceTXID: mockPrevTxId,
    sourceOutputIndex: 0,
    sequence: 0xffffffff,
  });

  // Add all outputs
  const p2pkh = new P2PKH();
  for (const output of outputs) {
    const lockingScript = p2pkh.lock(output.address);
    tx.addOutput({
      satoshis: output.amount,
      lockingScript,
    });
  }

  return tx.toHex();
}
