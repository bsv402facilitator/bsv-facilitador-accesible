/**
 * V2 English Templates - 5 cognitive levels (beginner → expert)
 * Includes: plain language, detailed explanations, examples, glossary, memory aids
 */

import type { MessageCatalogV2 } from '../types';

export const englishTemplatesV2: MessageCatalogV2 = {
  errors: {
    verify: {
      invalidAmount: {
        beginner: {
          plainLanguage: "You didn't send enough money",
          explanation:
            'The payment requires more money than you sent. Like trying to pay $5 with only $2.',
          detailedExplanation:
            'Each payment needs a specific minimum amount. Your transaction includes less money than required. This happens when the amount is lower than needed or when you forget to include network fees.',
          stepByStep: [
            'Check how much money the payment requires',
            'Verify how much you included in your transaction',
            'Add up the missing difference',
            'Create a new transaction with the correct amount',
          ],
          hints: {
            ifError: 'Make sure the amount also includes network fees',
            commonMistakes: [
              'Forgetting to add network fees to the amount',
              'Confusing satoshis with BSV (1 BSV = 100 million satoshis)',
              'Copying the wrong required amount',
            ],
            nextSteps: 'Check the required amount and create a new payment with the correct total',
          },
          examples: [
            {
              scenario: 'Buying coffee with BSV',
              input: 'You send 1000 satoshis but 5000 satoshis are required',
              output: 'Error: insufficient amount',
              explanation: 'Like paying $1 for a $5 coffee. You need to send 4000 more satoshis',
            },
          ],
          memoryAids: [
            '💡 Always check the amount BEFORE sending',
            '💡 Total amount = price + network fee',
          ],
        },
        simple: {
          plainLanguage: 'Payment amount is less than required',
          explanation:
            'The BSV transaction you sent includes fewer satoshis than necessary. The output to the vendor address doesn\'t meet the specified minimum amount.',
          stepByStep: [
            'Identify the required amount in satoshis',
            'Locate the output paying the vendor in your transaction',
            'Compare: amount sent vs. amount required',
            'Adjust the transaction to include the correct amount',
          ],
          hints: {
            ifError:
              'Verify you\'re using the same unit (satoshis). 1 BSV = 100,000,000 satoshis',
            commonMistakes: [
              'Confusing the order of outputs in the transaction',
              'Not including enough satoshis to cover amount + fees',
              'Using BSV instead of satoshis in calculations',
            ],
            nextSteps:
              'Recalculate the output to the vendor address and ensure it\'s >= required amount',
          },
          memoryAids: ['📌 Output amount >= required amount', '📌 Always in satoshis, not BSV'],
        },
        medium: {
          plainLanguage: 'Payment output doesn\'t reach the specified amount',
          explanation:
            'Transaction validation detected that no output pays the required amount to the destination address. This could be due to incorrect amount calculation or transaction output structure.',
          stepByStep: [
            'Extract destination address from payment requirements',
            'Iterate over all transaction outputs',
            'For each P2PKH output, verify if it pays to destination address',
            'Compare output amount with required amount',
            'Adjust the output or create a new one with correct amount',
          ],
          hints: {
            ifError:
              'Use @bsv/sdk to decode outputs and verify addresses. Make sure to compare satoshis as strings to avoid precision loss.',
            commonMistakes: [
              'Using floating point instead of string for large amounts',
              'Not verifying output type (must be P2PKH)',
              'Calculating fees incorrectly reducing payment amount',
            ],
            nextSteps:
              'Rebuild the transaction ensuring one output pays >= required amount to correct address',
            troubleshooting:
              '1. Decode tx with Transaction.fromHex()\n2. Iterate tx.outputs\n3. Use output.lockingScript.toAddress() to compare addresses',
          },
          memoryAids: [
            '🔍 Validation: exists(output) where output.address == required.address AND output.amount >= required.amount',
            '🔍 Always verify script type (P2PKH)',
          ],
        },
        advanced: {
          plainLanguage: 'Insufficient amount in P2PKH output to destination address',
          explanation:
            'The isP2PKHToAddress() function found no output that meets: (1) P2PKH script type, (2) address matches paymentRequirements.address, (3) satoshis >= paymentRequirements.amount. Typical error in fee estimation or UTXO selection.',
          stepByStep: [
            'Parse transaction hex: Transaction.fromHex(payload.transaction)',
            'Iterate outputs: for (const output of tx.outputs)',
            'Verify P2PKH type: lockingScript matches OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG',
            'Extract address: const addr = output.lockingScript.toAddress()',
            'Compare: addr.toString() === requirements.address',
            'Validate amount: BigInt(output.satoshis) >= BigInt(requirements.amount)',
          ],
          hints: {
            ifError:
              'Review fee estimation. Use tx.getFee() to calculate actual fee and adjust inputs/outputs. Verify you\'re using the correct network (testnet/mainnet) to derive addresses.',
            commonMistakes: [
              'Incorrect fee estimation reducing main output',
              'Using mainnet address on testnet (or vice versa)',
              'Precision lost when converting satoshis to number instead of BigInt',
              'Not validating script type before calling toAddress()',
            ],
            nextSteps:
              'Use a robust transaction builder (e.g., @bsv/sdk Transaction Builder) that handles fees automatically',
            relatedResources: [
              {
                title: 'BSV SDK Transaction Builder',
                url: 'https://docs.bsvblockchain.org/sdk/transactions',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '⚙️ Always: BigInt(output.satoshis) >= BigInt(required.amount)',
            '⚙️ toAddress() may return null if script is not P2PKH',
          ],
        },
        expert: {
          plainLanguage: 'Output validation failed: insufficient satoshis in P2PKH output to target address',
          explanation:
            'Transaction output validation using @bsv/sdk failed at isP2PKHToAddress() predicate. No output satisfies: script.isP2PKH() ∧ script.toAddress() == req.addr ∧ output.satoshis >= req.amount. Root cause: fee miscalculation, UTXO selection algorithm failure, or script construction error.',
          stepByStep: [
            'Decode transaction: tx = Transaction.fromHex(payload.transaction)',
            'Iterate outputs with early termination: for (const [idx, output] of tx.outputs.entries())',
            'Pattern match locking script for P2PKH: verify OP codes sequence',
            'Extract pubKeyHash: const pkh = lockingScript.chunks[2].data (20 bytes)',
            'Derive address: const addr = Address.fromPublicKeyHash(pkh, network)',
            'Validate address match: addr.toString() === requirements.address',
            'Validate amount using BigInt: BigInt(output.satoshis) >= BigInt(requirements.amount)',
            'If match found, return true; else continue iteration',
            'If loop completes without match, throw InvalidAmountError',
          ],
          hints: {
            ifError:
              'Profile the transaction construction pipeline. Check: (1) UTXO selection: sum(inputs) >= sum(outputs) + fee, (2) fee calculation: use accurate fee-per-byte rate, (3) network prefix: 0x00 for mainnet, 0x6F for testnet, (4) script generation: verify OP code sequence matches P2PKH template.',
            commonMistakes: [
              'Using JavaScript number type for satoshis (loses precision above 2^53)',
              'Hardcoding fee instead of calculating dynamically based on tx size',
              'Not accounting for change output in UTXO selection',
              'Comparing addresses without normalizing network prefix',
              'Forgetting to validate script type before calling toAddress() (throws on non-P2PKH)',
            ],
            nextSteps:
              'Implement a robust transaction builder: use @bsv/sdk Transaction.from() with automatic fee calculation, UTXO selection via greedy algorithm, and change output generation. Validate in testnet before mainnet deployment.',
            safeguards: [
              'Never use floating-point for satoshi amounts',
              'Always validate script type before address derivation',
              'Use testnet for initial validation',
              'Implement idempotency checks to prevent double-spend',
            ],
            relatedResources: [
              {
                title: 'BSV Transaction Structure',
                url: 'https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions',
                type: 'documentation',
              },
              {
                title: '@bsv/sdk API Reference',
                url: 'https://docs.bsvblockchain.org/sdk/',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '🧠 Validation logic: ∃ output ∈ tx.outputs : (isP2PKH(output.script) ∧ getAddress(output.script) = req.addr ∧ output.satoshis ≥ req.amount)',
            '🧠 Always: string→BigInt for amounts, never number',
            '🧠 toAddress() returns null for non-P2PKH scripts',
          ],
        },
      },

      invalidAddress: {
        beginner: {
          plainLanguage: 'Payment address is incorrect',
          explanation:
            'The BSV address you used is invalid or doesn\'t match the required one. Like writing the wrong shipping address for a package.',
          stepByStep: [
            'Copy the complete address again',
            'Verify there are no missing or extra characters',
            'Make sure to use the correct network address',
            'Try the payment again',
          ],
          hints: {
            ifError: 'BSV addresses are case-sensitive',
            commonMistakes: [
              'Copying only part of the address',
              'Confusing testnet address with mainnet',
              'Adding spaces when copying',
            ],
            nextSteps: 'Copy the complete address without spaces and verify it\'s correct',
          },
          memoryAids: ['💡 Valid addresses start with 1 or 3 (mainnet) or m/n (testnet)'],
        },
        simple: {
          plainLanguage: 'Invalid BSV address or doesn\'t match required',
          explanation:
            'The payer address extracted from the transaction is not valid according to BSV format or doesn\'t match what the vendor expects.',
          stepByStep: [
            'Verify the address uses valid characters (Base58)',
            'Confirm the address checksum is correct',
            'Compare with required address character by character',
            'If using testnet, make sure the address is testnet',
          ],
          hints: {
            ifError:
              'Use a library like @bsv/sdk to validate addresses. Don\'t validate manually with regex.',
            commonMistakes: [
              'Mixing mainnet and testnet addresses',
              'Not validating the address checksum',
              'Assuming any string is a valid address',
            ],
            nextSteps: 'Use Address.fromString(addr) from @bsv/sdk to validate before sending',
          },
          memoryAids: ['📌 Always validate with Address.fromString() before using'],
        },
        medium: {
          plainLanguage: 'Address validation failed: invalid format or network mismatch',
          explanation:
            'The address failed Base58Check validation or belongs to a different network (testnet vs mainnet) than expected by the facilitator.',
          stepByStep: [
            'Decode address with Base58Check',
            'Verify version byte matches network (0x00 mainnet, 0x6F testnet)',
            'Validate checksum (last 4 bytes = hash256(payload).slice(0,4))',
            'Compare address extracted from tx input with required',
          ],
          hints: {
            ifError:
              'The error can be: (1) malformed address, (2) network mismatch, (3) not a P2PKH address. Use Address.fromString() with try/catch.',
            commonMistakes: [
              'Not catching exception from Address.fromString() on invalid addresses',
              'Assuming all addresses are P2PKH (can be P2SH)',
              'Not verifying network when extracting address from input',
            ],
            nextSteps: 'Implement robust validation with proper error handling',
          },
          memoryAids: [
            '🔍 Validation: (1) Base58Check decode, (2) verify version byte, (3) verify checksum',
          ],
        },
        advanced: {
          plainLanguage: 'P2PKH address extraction or validation failed',
          explanation:
            'extractPayerAddress() couldn\'t derive a valid address from transaction inputs, or extracted address doesn\'t match requirements.address. Causes: inputs without valid unlocking script, network mismatch, or unsupported address format.',
          stepByStep: [
            'Iterate over tx.inputs: for (const input of tx.inputs)',
            'Parse unlocking script: input.unlockingScript',
            'Extract public key from last chunk: const pubKey = chunks[chunks.length - 1]',
            'Derive address: Address.fromPublicKey(pubKey, network)',
            'Validate P2PKH format: address must start with 1 (mainnet) or m/n (testnet)',
            'Compare with requirements.address',
          ],
          hints: {
            ifError:
              'Verify: (1) inputs have correct unlocking scripts, (2) public key is valid (33 or 65 bytes compressed/uncompressed), (3) you use correct network when deriving address.',
            commonMistakes: [
              'Assuming first input always has payer address',
              'Not handling inputs with multiple signatures (P2SH)',
              'Deriving address with wrong network',
              'Not validating last chunk is actually a public key',
            ],
            nextSteps:
              'Implement extractPayerAddress() with validation at each step and fallback if extraction fails',
            relatedResources: [
              {
                title: 'Bitcoin Script Format',
                url: 'https://wiki.bitcoinsv.io/index.php/Script',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '⚙️ extractPayerAddress: input → unlocking script → last chunk → public key → address',
            '⚙️ Always validate public key length: 33 or 65 bytes',
          ],
        },
        expert: {
          plainLanguage:
            'Address derivation from tx inputs failed: invalid P2PKH unlocking script or network mismatch',
          explanation:
            'The extractPayerAddress() function failed to derive a valid BSV address from transaction inputs. This occurs when: (1) unlocking script does not conform to standard P2PKH pattern (<signature> <publicKey>), (2) extracted public key is malformed (not 33/65 bytes), (3) Address.fromPublicKey() throws due to invalid ECDSA point, or (4) derived address belongs to different network than facilitator configuration.',
          stepByStep: [
            'Parse transaction: tx = Transaction.fromHex(hex)',
            'Access first input: const input = tx.inputs[0] (assumes single-sig)',
            'Decode unlocking script: const chunks = input.unlockingScript.chunks',
            'Validate chunk count: expect 2 chunks for P2PKH ([sig, pubKey])',
            'Extract public key: const pubKey = PublicKey.fromString(chunks[1].data.toString("hex"))',
            'Derive address: const addr = Address.fromPublicKey(pubKey, network)',
            'Validate network: addr.network must match facilitator network (mainnet/testnet)',
            'Compare: addr.toString() === requirements.address',
          ],
          hints: {
            ifError:
              'Debug pipeline: (1) verify input.unlockingScript is not empty, (2) check chunks.length === 2, (3) validate chunks[1].data is 33 or 65 bytes, (4) catch PublicKey.fromString() exceptions, (5) ensure network parameter matches facilitator config.',
            commonMistakes: [
              'Assuming all inputs have same address (multi-input txs may combine different addresses)',
              'Not handling compressed vs uncompressed public keys (33 vs 65 bytes)',
              'Using wrong network in Address.fromPublicKey() call',
              'Not validating ECDSA point on curve (PublicKey constructor validates this)',
              'Comparing addresses case-sensitively (BSV addresses are case-sensitive)',
            ],
            nextSteps:
              'Implement robust address extraction with: (1) validation at each step, (2) try/catch for PublicKey/Address constructors, (3) network verification, (4) fallback to null if extraction fails.',
            safeguards: [
              'Always validate public key is on secp256k1 curve before deriving address',
              'Never assume input[0] is the payer in multi-input transactions',
              'Handle both compressed (33-byte) and uncompressed (65-byte) keys',
              'Verify network matches facilitator configuration before comparison',
            ],
            relatedResources: [
              {
                title: 'P2PKH Transaction Structure',
                url: 'https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#Pay_to_Public_Key_Hash_.28P2PKH.29',
                type: 'documentation',
              },
              {
                title: 'secp256k1 Curve',
                url: 'https://en.bitcoin.it/wiki/Secp256k1',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '🧠 P2PKH unlocking: <sig> <pubKey> (2 chunks)',
            '🧠 Public key formats: compressed (33B: 02/03 + x) | uncompressed (65B: 04 + x + y)',
            '🧠 Address.fromPublicKey(key, network) → different addresses for mainnet/testnet',
          ],
        },
      },

      invalidFormat: {
        beginner: {
          plainLanguage: 'Transaction doesn\'t have the correct format',
          explanation:
            'The transaction data you sent can\'t be read. Like sending a damaged document that can\'t be opened.',
          stepByStep: [
            'Verify you copied the complete transaction',
            'Make sure it\'s hexadecimal text (only 0-9 and a-f)',
            'Try generating the transaction again',
            'Send the new transaction',
          ],
          hints: {
            ifError: 'BSV transactions must be in hexadecimal format',
            commonMistakes: [
              'Copying only part of the transaction',
              'Including spaces or special characters',
              'Using a different format (base64 instead of hex)',
            ],
            nextSteps: 'Generate the transaction again using your wallet and copy the complete hex',
          },
          memoryAids: ['💡 Valid hexadecimal: only characters 0-9 and a-f'],
        },
        simple: {
          plainLanguage: 'Transaction can\'t be decoded as valid BSV',
          explanation:
            'The transaction hex is malformed or incomplete. BSV SDK library can\'t parse it as a valid transaction.',
          stepByStep: [
            'Verify the hex is valid (even length, only 0-9a-f)',
            'Confirm the structure matches BSV format',
            'Use a library to validate before sending',
            'Regenerate transaction if necessary',
          ],
          hints: {
            ifError: 'Use Transaction.fromHex() to validate transaction before sending to facilitator',
            commonMistakes: [
              'Truncating hex when copying',
              'Encoding in base64 instead of hex',
              'Not including all required fields (inputs, outputs, locktime)',
            ],
            nextSteps: 'Validate locally with @bsv/sdk Transaction.fromHex() before sending',
          },
          memoryAids: ['📌 Hex length must be even (2 hex characters = 1 byte)'],
        },
        medium: {
          plainLanguage: 'Transaction.fromHex() parsing failed: invalid structure',
          explanation:
            '@bsv/sdk parsing function threw an error trying to decode the hex. This indicates the binary structure doesn\'t match expected BSV transaction format.',
          stepByStep: [
            'Decode hex to bytes: Buffer.from(hex, "hex")',
            'Verify minimum length: BSV tx minimum ≈ 60 bytes',
            'Try parsing: Transaction.fromHex(hex)',
            'If it fails, inspect first bytes (version, input count, etc.)',
            'Regenerate transaction with a reliable builder',
          ],
          hints: {
            ifError:
              'Parsing error can indicate: (1) corrupt hex, (2) non-standard format, (3) missing fields. Log complete error for diagnosis.',
            commonMistakes: [
              'Assuming any valid hex is a valid transaction',
              'Not validating minimum length before parsing',
              'Mixing formats (raw tx vs signed tx vs PSBT)',
            ],
            nextSteps: 'Use a transaction builder that generates guaranteed standard format',
          },
          memoryAids: [
            '🔍 BSV tx structure: version(4) + inputs + outputs + locktime(4)',
            '🔍 VarInt encoding: <0xFD = 1 byte, 0xFD = 3 bytes, 0xFE = 5 bytes, 0xFF = 9 bytes',
          ],
        },
        advanced: {
          plainLanguage: 'BSV transaction deserialization failed: schema validation error',
          explanation:
            '@bsv/sdk deserialization process detected a structural error in the transaction. Possible causes: (1) invalid version field, (2) incorrect varint encoding in input/output counts, (3) malformed scripts, (4) missing locktime field.',
          stepByStep: [
            'Parse version: first 4 bytes little-endian (typically 0x01000000 or 0x02000000)',
            'Read input count: varint (1-9 bytes)',
            'For each input: parse outpoint (36 bytes), script length (varint), script, sequence (4 bytes)',
            'Read output count: varint',
            'For each output: parse satoshis (8 bytes), script length (varint), script',
            'Parse locktime: last 4 bytes',
            'Validate: no field can be truncated',
          ],
          hints: {
            ifError:
              'Use Transaction.fromBinary() with buffer inspection. If it fails, implement manual parsing to identify exact byte where failure occurs.',
            commonMistakes: [
              'Not handling varint encoding correctly (confusing with fixed-size integers)',
              'Incorrect endianness (BSV uses little-endian for integers)',
              'Not validating each field has enough bytes',
              'Assuming script length matches script data length',
            ],
            nextSteps:
              'Implement thorough validation before parsing: check hex length, validate varint positions, ensure all fields present.',
            relatedResources: [
              {
                title: 'Bitcoin Transaction Serialization',
                url: 'https://wiki.bitcoinsv.io/index.php/Serialization',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '⚙️ Varint decode: <0xFD→1B, 0xFD→3B, 0xFE→5B, 0xFF→9B',
            '⚙️ Input: prevTxHash(32) + outIndex(4) + scriptLen(varint) + script + sequence(4)',
            '⚙️ Output: satoshis(8) + scriptLen(varint) + script',
          ],
        },
        expert: {
          plainLanguage: 'Transaction binary deserialization error: malformed wire format',
          explanation:
            'The transaction hex does not conform to BSV wire protocol specification. Deserialization failed during binary parsing, likely due to: (1) truncated byte stream, (2) incorrect varint encoding in input/output counts or script lengths, (3) invalid version number, (4) missing locktime field, or (5) non-canonical encoding of integer fields.',
          stepByStep: [
            'Validate hex: must be even length, only [0-9a-fA-F]',
            'Convert to buffer: const buf = Buffer.from(hex, "hex")',
            'Read version: buf.readInt32LE(0) → typically 1 or 2',
            'Read input count varint at offset 4: decode using varint rules',
            'For each input (i=0 to inputCount-1):',
            '  - prevTxHash: 32 bytes (reversed for display)',
            '  - prevOutIndex: 4 bytes LE',
            '  - scriptLen: varint',
            '  - unlockingScript: scriptLen bytes',
            '  - sequence: 4 bytes LE',
            'Read output count varint',
            'For each output (i=0 to outputCount-1):',
            '  - satoshis: 8 bytes LE (use BigInt)',
            '  - scriptLen: varint',
            '  - lockingScript: scriptLen bytes',
            'Read locktime: 4 bytes LE',
            'Verify: offset should equal buf.length (no extra/missing bytes)',
          ],
          hints: {
            ifError:
              'Implement comprehensive validation: (1) assert hex.length % 2 === 0, (2) try/catch around Transaction.fromHex(), (3) on error, manually parse to identify failure point, (4) validate all varint positions, (5) ensure buffer has sufficient bytes at each read.',
            commonMistakes: [
              'Not using BigInt for 8-byte satoshi amounts (JavaScript number has 53-bit precision limit)',
              'Reversing txid hash when not needed (internal representation vs display)',
              'Failing to handle witness/segwit format (BSV doesn\'t use segwit, but some wallets may produce it)',
              'Using big-endian instead of little-endian for integer reads',
              'Not validating varint range (0xFD-0xFE requires 2 bytes, 0xFF requires 8 bytes following)',
            ],
            nextSteps:
              'Use a battle-tested library (@bsv/sdk) for all transaction construction. Never manually construct hex strings. Validate all transactions locally before sending to facilitator.',
            safeguards: [
              'Always validate hex before attempting to parse',
              'Use Transaction.fromHex() with try/catch, never assume it succeeds',
              'For critical applications, implement redundant validation (parse twice with different libraries)',
              'Log full error stack trace for debugging',
            ],
            relatedResources: [
              {
                title: 'Bitcoin Protocol Specification',
                url: 'https://wiki.bitcoinsv.io/index.php/Protocol',
                type: 'documentation',
              },
              {
                title: 'VarInt Encoding',
                url: 'https://wiki.bitcoinsv.io/index.php/VarInt',
                type: 'documentation',
              },
              {
                title: '@bsv/sdk Transaction API',
                url: 'https://docs.bsvblockchain.org/sdk/transactions',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '🧠 Tx wire format: version(4) + #in(varint) + inputs + #out(varint) + outputs + locktime(4)',
            '🧠 All integers: little-endian (except txid hash display)',
            '🧠 VarInt: <253→1B | 253→0xFD+2B | 65536→0xFE+4B | 4B→0xFF+8B',
            '🧠 Always: validate buffer length before each read to prevent underflow',
          ],
        },
      },
    },

    settle: {
      alreadyBroadcast: {
        beginner: {
          plainLanguage: 'This transaction was already sent before',
          explanation:
            'The transaction you\'re trying to send already exists in the blockchain. You can\'t send the same transaction twice.',
          stepByStep: [
            'Check if the payment was already processed',
            'Consult payment status with the vendor',
            'If you need to pay again, create a new transaction',
          ],
          hints: {
            ifError: 'Save the transaction ID (txid) to track payments',
            commonMistakes: [
              'Clicking "pay" multiple times',
              'Not verifying if payment already completed',
              'Trying to resend the same transaction',
            ],
            nextSteps: 'Check payment status before creating a new one',
          },
          memoryAids: ['💡 Each transaction can only be sent once'],
        },
        simple: {
          plainLanguage: 'Transaction already exists in BSV blockchain',
          explanation:
            'The facilitator detected this transaction (identified by its txid) was already broadcast and exists in the blockchain.',
          stepByStep: [
            'Get transaction txid: SHA256(SHA256(tx))',
            'Query blockchain to see if it exists',
            'If it exists, don\'t try to rebroadcast',
            'If you need a new payment, generate a different transaction',
          ],
          hints: {
            ifError: 'Use a block explorer (e.g., whatsonchain.com) to verify txid',
            commonMistakes: [
              'Not checking status before broadcast',
              'Assuming network error means it wasn\'t sent',
              'Resending without changing inputs',
            ],
            nextSteps: 'Implement status check before broadcast to avoid duplicates',
          },
          memoryAids: ['📌 Txid = SHA256(SHA256(raw_tx)) → unique identifier'],
        },
        medium: {
          plainLanguage: 'Duplicate transaction detected: txid already on-chain',
          explanation:
            'Facilitator executed pre-broadcast verification by calling getTransaction(txid) to WhatsOnChain. Response indicates transaction already exists, so broadcast is skipped.',
          stepByStep: [
            'Calculate txid: hash256(serialized_tx).reverse()',
            'Call GET /tx/{txid}/hex on WhatsOnChain API',
            'If returns 200 with hex: transaction already exists',
            'If returns 404: transaction doesn\'t exist, proceed with broadcast',
            'Implement idempotency logic to avoid retries',
          ],
          hints: {
            ifError:
              'Implement duplicate detection before broadcast to save fees and avoid errors',
            commonMistakes: [
              'Not implementing pre-broadcast verification',
              'Relying only on broadcast API error (may be too late)',
              'Not caching successful broadcast results',
            ],
            nextSteps: 'Use getTransaction() before broadcastTransaction() as standard pattern',
          },
          memoryAids: [
            '🔍 Pattern: check getTransaction() BEFORE broadcastTransaction()',
            '🔍 Txid calculation: SHA256(SHA256(tx_bytes)).reverse()',
          ],
        },
        advanced: {
          plainLanguage: 'Idempotency check passed: transaction with this txid already mined/mempool',
          explanation:
            'System implements idempotency by checking if txid already exists in blockchain or mempool before broadcast. This prevents double-spend errors and allows safe client retries.',
          stepByStep: [
            'Serialize transaction: const txHex = tx.toHex()',
            'Calculate txid: const txid = tx.id (or tx.hash().reverse().toString("hex"))',
            'Verify existence: const { found, data } = await getTransaction(txid)',
            'If found === true: return { success: true, alreadyBroadcast: true, txid }',
            'If found === false: proceed with broadcastTransaction(txHex)',
            'Cache result in KV for optimization',
          ],
          hints: {
            ifError:
              'Implement caching of successfully broadcasted txids. Use KV with 24h TTL to avoid redundant verifications.',
            commonMistakes: [
              'Not implementing idempotency, causing errors on retries',
              'Relying only on broadcast API error handling',
              'Not distinguishing between "in blockchain" vs "in mempool"',
              'Not handling blockchain reorganizations (very rare but possible)',
            ],
            nextSteps:
              'Implement idempotency layer with: (1) pre-broadcast verification, (2) successful txids cache, (3) retry handling with exponential backoff',
            relatedResources: [
              {
                title: 'WhatsOnChain API - Get Transaction',
                url: 'https://developers.whatsonchain.com/#get-transaction-by-hash',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '⚙️ Idempotency pattern: check → broadcast → cache',
            '⚙️ Cache key: tx:{txid}:status, TTL: 24h',
          ],
        },
        expert: {
          plainLanguage:
            'Transaction idempotency verification: txid collision detected in blockchain state',
          explanation:
            'Pre-broadcast verification via WhatsOnChain GET /tx/{txid}/hex returned 200 OK, indicating transaction with identical txid already exists in confirmed blocks or mempool. This triggers idempotent response without re-broadcasting, preventing double-spend attempts and ensuring safe client retries. The system guarantees at-most-once semantics for transaction broadcast.',
          stepByStep: [
            'Compute txid: const txid = Buffer.from(sha256(sha256(txBytes))).reverse().toString("hex")',
            'Check KV cache: const cached = await env.METADATA_CACHE.get(`txid:${txid}`)',
            'If cache hit: return JSON.parse(cached) (skip API call)',
            'If cache miss: query WhatsOnChain: GET https://api.whatsonchain.com/v1/bsv/{network}/tx/{txid}/hex',
            'If status 200: parse response, cache result, return { success: true, alreadyBroadcast: true, txid, blockHeight: ... }',
            'If status 404: transaction not found, proceed to broadcast',
            'If status 429/500: implement exponential backoff retry (1s, 2s, 4s)',
            'After successful broadcast: cache txid with TTL=86400s (24h)',
          ],
          hints: {
            ifError:
              'Implement multi-layer idempotency: (1) in-memory cache (Worker script lifetime), (2) KV cache (cross-request), (3) blockchain query (source of truth). Handle edge case: txid in mempool but not yet confirmed → still idempotent.',
            commonMistakes: [
              'Not caching negative results (txid not found) → redundant API calls',
              'Using txid as-is without reversing byte order (internal vs display format)',
              'Not handling mempool vs confirmed distinction (both should trigger idempotency)',
              'Failing to invalidate cache on blockchain reorg (extremely rare on BSV)',
              'Not implementing circuit breaker for WhatsOnChain API downtime',
            ],
            nextSteps:
              'Implement robust idempotency layer: (1) KV-backed cache with 24h TTL, (2) exponential backoff for API failures, (3) metrics tracking (cache hit rate, API latency), (4) fallback to broadcast if verification fails (fail-open pattern).',
            safeguards: [
              'Always reverse txid byte order when computing from raw tx (internal→display)',
              'Cache both positive (tx exists) and negative (tx not found) results with different TTLs',
              'Implement circuit breaker: if WhatsOnChain fails 3 times, skip verification for 60s',
              'Monitor cache hit rate: should be >70% in steady state',
            ],
            relatedResources: [
              {
                title: 'WhatsOnChain API Documentation',
                url: 'https://developers.whatsonchain.com/',
                type: 'documentation',
              },
              {
                title: 'Bitcoin Transaction ID Calculation',
                url: 'https://wiki.bitcoinsv.io/index.php/TXID',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '🧠 Txid = SHA256d(tx).reverse() → display format for APIs',
            '🧠 Idempotency guarantee: same txid → same outcome (broadcast once)',
            '🧠 Cache strategy: positive (24h TTL) | negative (5min TTL) | API failure (skip cache)',
          ],
        },
      },

      networkError: {
        beginner: {
          plainLanguage: 'Couldn\'t connect to BSV network',
          explanation:
            'There was a connection problem trying to send your transaction to the blockchain. Like when the internet doesn\'t work.',
          stepByStep: [
            'Check your internet connection',
            'Wait a few seconds and try again',
            'If problem persists, wait a few minutes',
          ],
          hints: {
            ifError: 'The problem is usually temporary. Wait and try again.',
            commonMistakes: [
              'Giving up after first error',
              'Not checking internet connection',
              'Trying too fast without waiting',
            ],
            nextSteps: 'Wait 30 seconds and try the payment again',
          },
          memoryAids: ['💡 Network errors are usually temporary'],
        },
        simple: {
          plainLanguage: 'Connection error communicating with WhatsOnChain API',
          explanation:
            'Facilitator couldn\'t connect to blockchain service (WhatsOnChain) for broadcast. Could be timeout, rate limit, or temporarily down service.',
          stepByStep: [
            'System retries automatically 3 times',
            'Uses exponential backoff: waits 1s, 2s, 4s between retries',
            'If all fail, returns network error',
            'Client should retry complete operation',
          ],
          hints: {
            ifError: 'Implement client retry with exponential backoff',
            commonMistakes: [
              'Not implementing client-side retries',
              'Retrying too fast causing rate limiting',
              'Not distinguishing between recoverable and permanent errors',
            ],
            nextSteps: 'Wait 30-60 seconds and try broadcast again',
          },
          memoryAids: [
            '📌 Automatic retries: 3 times with backoff 1s, 2s, 4s',
            '📌 Network errors are typically temporary',
          ],
        },
        medium: {
          plainLanguage: 'WhatsOnChain API request failed after retries',
          explanation:
            'Call to broadcastTransaction() failed after 3 retries with exponential backoff. Possible causes: timeout (>10s), rate limiting (429), service down (500-503), or network problem.',
          stepByStep: [
            'Detect error type: timeout, rate limit, server error',
            'Apply backoff: 1s after first failure, 2s after second, 4s after third',
            'Log errors for diagnosis',
            'Return error to client with hint to retry',
            'Client should implement retry with larger backoff (30s+)',
          ],
          hints: {
            ifError:
              'Differentiate between recoverable errors (429, 503, timeout) and permanent (400, 404). Only retry recoverable ones.',
            commonMistakes: [
              'Retrying 400 errors (Bad Request) that will never succeed',
              'Not implementing circuit breaker for down services',
              'Not logging enough information for debugging',
            ],
            nextSteps:
              'Implement circuit breaker: if fails X times in Y minutes, stop trying temporarily',
          },
          memoryAids: [
            '🔍 Retry only: 429 (rate limit), 503 (unavailable), timeout',
            '🔍 Never retry: 400 (bad request), 401 (unauthorized)',
          ],
        },
        advanced: {
          plainLanguage:
            'Broadcast failed: WhatsOnChain API unreachable after exponential backoff retries',
          explanation:
            'fetchWithTimeout() executed 3 broadcast attempts with backoff (1s, 2s, 4s) but all failed. Possible causes: (1) timeout exceeded (10s), (2) HTTP 429/503, (3) DNS resolution failure, (4) TLS handshake failure, (5) AbortController timeout.',
          stepByStep: [
            'Configure timeout: AbortController with 10s timeout',
            'Attempt 1: POST /tx/raw with tx hex in body',
            'If fails: wait delay = 1000ms * Math.pow(2, attempt)',
            'Attempt 2: after 1s backoff',
            'Attempt 3: after 2s additional backoff',
            'If all fail: throw NetworkError with details',
            'Client: implement retry with larger backoff (30s, 60s, 120s)',
          ],
          hints: {
            ifError:
              'Implement observability: log attempt number, delay, error type, elapsed time. Use metrics to detect service degradation.',
            commonMistakes: [
              'Not using AbortController for timeout (timeout not reliable without it)',
              'Not differentiating between client timeout vs server timeout',
              'Hardcoding URLs instead of using configuration',
              'Not implementing fallback to alternative APIs (e.g., other explorers)',
            ],
            nextSteps:
              'Implement multi-provider fallback: if WhatsOnChain fails, try with another API (e.g., Satoshi.io)',
            relatedResources: [
              {
                title: 'WhatsOnChain Status Page',
                url: 'https://status.whatsonchain.com/',
                type: 'support',
              },
            ],
          },
          memoryAids: [
            '⚙️ Timeout implementation: AbortController + setTimeout',
            '⚙️ Backoff formula: delay = initialDelay * Math.pow(2, attempt)',
          ],
        },
        expert: {
          plainLanguage:
            'Broadcast request exhausted retry budget: persistent network-layer failure',
          explanation:
            'The broadcastTransaction() function failed after exhausting the configured retry budget (3 attempts with exponential backoff: 1s, 2s, 4s). Network-layer diagnostics indicate one of: (1) AbortSignal timeout at 10s boundary, (2) DNS resolution failure for api.whatsonchain.com, (3) TLS handshake timeout/failure, (4) TCP connection refused, (5) HTTP 429 rate limiting persisting across retries, or (6) HTTP 503 service degradation. This represents a transient infrastructure failure requiring client-side retry with extended backoff.',
          stepByStep: [
            'Initialize retry context: { maxRetries: 3, baseDelay: 1000ms, maxDelay: 10000ms }',
            'For attempt in [0, 1, 2]:',
            '  - Create AbortController with 10s timeout',
            '  - Execute: fetch(WHATSONCHAIN_URL, { method: "POST", body: txHex, signal })',
            '  - If success (status 200): parse JSON, return { txid }',
            '  - If failure (non-200 or exception):',
            '    - If attempt < maxRetries - 1: calculate delay = min(baseDelay * 2^attempt, maxDelay)',
            '    - await sleep(delay)',
            '    - Continue to next attempt',
            '  - If all attempts exhausted: throw NetworkError with diagnostic data',
            'Client-side recovery: implement retry with extended backoff (30s, 60s, 120s)',
          ],
          hints: {
            ifError:
              'Implement comprehensive error classification: (1) timeout → retryable with longer timeout, (2) 429 → retryable with extended backoff, (3) 503 → retryable, check status page, (4) 400 → non-retryable (bad request), (5) DNS/TLS → infrastructure issue, alert ops. Use structured logging: { attempt, delay, errorType, statusCode, latency }.',
            commonMistakes: [
              'Not implementing circuit breaker pattern (keeps hammering failing service)',
              'Using setTimeout-based timeout instead of AbortController (unreliable)',
              'Not logging enough context for post-mortem analysis (need: attempt#, delay, error type, latency)',
              'Hardcoding retry params instead of making them configurable via env vars',
              'Not implementing fallback to alternative blockchain APIs (vendor lock-in)',
            ],
            nextSteps:
              'Production-grade implementation checklist: (1) Multi-provider fallback (WhatsOnChain primary, Satoshi.io secondary), (2) Circuit breaker (fail-fast after N consecutive failures), (3) Exponential backoff with jitter (prevent thundering herd), (4) Comprehensive metrics (success rate, p95 latency, error breakdown), (5) Alerting on sustained failure rate >5%.',
            safeguards: [
              'Never retry non-idempotent operations without verification (use getTransaction() first)',
              'Implement rate limiting on client side to prevent self-DDoS',
              'Use jittered backoff: delay = baseDelay * (2^attempt) * (0.5 + random()*0.5)',
              'Monitor and alert on: retry rate >10%, timeout rate >5%, circuit breaker open',
            ],
            relatedResources: [
              {
                title: 'Circuit Breaker Pattern',
                url: 'https://martinfowler.com/bliki/CircuitBreaker.html',
                type: 'documentation',
              },
              {
                title: 'Exponential Backoff with Jitter',
                url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
                type: 'documentation',
              },
              {
                title: 'WhatsOnChain API Status',
                url: 'https://status.whatsonchain.com/',
                type: 'support',
              },
            ],
          },
          memoryAids: [
            '🧠 Retry budget: attempts=3, backoff=[1s, 2s, 4s], timeout=10s/attempt',
            '🧠 Error classification: timeout|429|503 → retryable | 400|404 → permanent',
            '🧠 Production pattern: multi-provider + circuit breaker + jittered backoff',
            '🧠 Observability: log {attempt, delay, errorType, latency, statusCode}',
          ],
        },
      },

      broadcastFailed: {
        beginner: {
          plainLanguage: 'BSV network rejected your transaction',
          explanation:
            'The blockchain didn\'t accept your transaction. Could be a problem with the data or because you already spent those coins.',
          stepByStep: [
            'Verify your wallet has enough funds',
            'Make sure you haven\'t used those coins in another payment',
            'Create a new transaction from scratch',
            'Try the payment again',
          ],
          hints: {
            ifError: 'Don\'t reuse the same transaction. Create a new one.',
            commonMistakes: [
              'Trying to use already spent coins (double-spend)',
              'Not having enough funds in wallet',
              'Using invalid signatures',
            ],
            nextSteps: 'Check your wallet and create a completely new transaction',
          },
          memoryAids: ['💡 Each coin can only be spent once'],
        },
        simple: {
          plainLanguage: 'Broadcast was rejected by BSV network',
          explanation:
            'WhatsOnChain returned an error indicating transaction is invalid according to BSV consensus rules. Common causes: double-spend, invalid signature, script that doesn\'t validate, insufficient fees.',
          stepByStep: [
            'Read error message from WhatsOnChain',
            'Identify problem: double-spend, invalid script, etc.',
            'Fix problem in transaction',
            'Generate a new valid transaction',
          ],
          hints: {
            ifError: 'WhatsOnChain error message usually indicates exactly what\'s wrong',
            commonMistakes: [
              'Not validating transaction locally before broadcast',
              'Using UTXOs that were already spent',
              'Calculating signatures incorrectly',
            ],
            nextSteps: 'Validate transaction locally with @bsv/sdk before broadcast',
          },
          memoryAids: ['📌 Always validate transaction before broadcast'],
        },
        medium: {
          plainLanguage: 'Transaction rejected by blockchain consensus rules',
          explanation:
            'BSV node rejected transaction because it violates consensus rules: double-spend detection, invalid signature, script execution failure, insufficient fees, or malformed transaction structure.',
          stepByStep: [
            'Parse WhatsOnChain error: extract code and message',
            'Classify error: double-spend, invalid sig, script fail, etc.',
            'If double-spend: verify if UTXOs are still available',
            'If signature: verify signing process',
            'If script: debug script execution',
            'Regenerate transaction fixing the problem',
          ],
          hints: {
            ifError:
              'Implement local validation that replicates consensus rules before broadcast',
            commonMistakes: [
              'Not verifying UTXO availability before building tx',
              'Signing with wrong private key',
              'Not including enough fees (tx can get stuck)',
            ],
            nextSteps: 'Use transaction builder that validates automatically before broadcast',
          },
          memoryAids: [
            '🔍 Consensus rules: valid signatures, unspent inputs, correct scripts',
          ],
        },
        advanced: {
          plainLanguage: 'Consensus validation failure: transaction violates BSV protocol rules',
          explanation:
            'Full node rejected transaction during consensus validation. Common errors: (1) double-spend (input already spent), (2) signature verification failed, (3) script execution returned false, (4) insufficient fees for mempool acceptance, (5) non-standard transaction structure.',
          stepByStep: [
            'Capture complete error from WhatsOnChain API response',
            'Parse error message to identify specific type',
            'If "missing inputs": UTXO already spent → query UTXO set',
            'If "signature verification failed": review signing process',
            'If "script failed": execute script locally for debug',
            'If "insufficient priority": increase fees',
            'Rebuild transaction from fresh UTXOs',
          ],
          hints: {
            ifError:
              'Implement pre-validation layer that simulates consensus rules: verify signatures, execute scripts, check UTXO existence. Use @bsv/sdk tx.verify() before broadcast.',
            commonMistakes: [
              'Not refreshing UTXO set before building tx (using stale UTXOs)',
              'Assuming all signatures are valid without verifying',
              'Not simulating script execution before broadcast',
              'Calculating fees incorrectly (too low → rejected)',
            ],
            nextSteps:
              'Implement validation pipeline: (1) UTXO freshness check, (2) signature verification, (3) script simulation, (4) fee calculation, (5) consensus rules validation',
            relatedResources: [
              {
                title: 'BSV Consensus Rules',
                url: 'https://wiki.bitcoinsv.io/index.php/Protocol_Rules',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '⚙️ Pre-validate: UTXOs exist, signatures valid, scripts pass, fees sufficient',
          ],
        },
        expert: {
          plainLanguage:
            'Blockchain consensus rejection: transaction failed validation at mempool or block inclusion stage',
          explanation:
            'The transaction was rejected by BSV full nodes during consensus validation. Root causes classified: (1) Double-spend: input UTXO already consumed in confirmed transaction or competing mempool tx, (2) Signature failure: ECDSA verification failed for one or more inputs, sighash mismatch, or wrong public key, (3) Script execution failure: unlocking script does not satisfy locking script predicate (OP_VERIFY failed, stack not clean, or false on top), (4) Fee market rejection: transaction fee below mempool minimum threshold (typically 0.5 sat/byte), (5) Non-standard transaction: uses non-whitelisted opcodes or script patterns, (6) Consensus rule violation: locktime/sequence constraints, output amount exceeds input amount.',
          stepByStep: [
            'Parse WhatsOnChain error response: extract errorCode and message',
            'Classify error type using pattern matching:',
            '  - "missing inputs" | "already spent" → UTXO_SPENT',
            '  - "signature.*failed" | "non-mandatory-script-verify-flag" → SIG_INVALID',
            '  - "script failed" | "stack.*not clean" → SCRIPT_FAILED',
            '  - "insufficient priority" | "fee.*too low" → FEE_INSUFFICIENT',
            'For UTXO_SPENT: query /tx/{prevTxId}/out/{outIdx}/spent to confirm consumption',
            'For SIG_INVALID: re-validate signature generation:',
            '  - Recompute sighash: tx.signature(inputIdx, prevOutScript, sighashType)',
            '  - Verify ECDSA: publicKey.verify(sighash, signature)',
            'For SCRIPT_FAILED: execute script interpreter locally:',
            '  - Concatenate unlocking + locking scripts',
            '  - Execute opcode by opcode, track stack state',
            '  - Identify failing opcode',
            'For FEE_INSUFFICIENT: recalculate fee: (sumInputs - sumOutputs) / txSize >= minFeeRate',
            'Reconstruct transaction addressing root cause',
          ],
          hints: {
            ifError:
              'Implement comprehensive pre-broadcast validation suite: (1) UTXO availability check via blockchain query, (2) signature verification using @bsv/sdk PublicKey.verify(), (3) script execution simulation with BSV script interpreter, (4) fee rate calculation and comparison with network minimums (query mempool info), (5) consensus rules validation (locktime, sequence, amount bounds). Log all validation steps with structured data for forensic analysis.',
            commonMistakes: [
              'Race condition: UTXO spent between tx construction and broadcast (use optimistic locking or UTXO reservation)',
              'Signature generation bugs: wrong sighash type (ALL vs SINGLE vs NONE), incorrect preimage format, endianness errors',
              'Script complexity: non-standard opcodes (OP_RETURN with >220 bytes), stack size limits (1000 elements), opcode count limits (201 ops)',
              'Fee calculation errors: not accounting for signature size variability (71-73 bytes), forgetting to include witness data in weight calculation',
              'Timing issues: using stale UTXO set, not accounting for mempool transactions',
            ],
            nextSteps:
              'Production validation pipeline: (1) Fetch fresh UTXO set with mempool awareness, (2) Build transaction with UTXO locking (reserve for 60s), (3) Sign with comprehensive sighash validation, (4) Execute full script simulation, (5) Calculate dynamic fee based on network congestion, (6) Pre-validate with local consensus rules engine, (7) Broadcast with retry/rollback strategy, (8) Monitor mempool for inclusion confirmation.',
            safeguards: [
              'Implement UTXO locking mechanism to prevent race conditions (reserve UTXO for tx construction)',
              'Use deterministic signature generation (RFC 6979) to ensure reproducibility',
              'Simulate all scripts locally before broadcast (never trust, always verify)',
              'Implement dynamic fee estimation based on real-time mempool analysis',
              'Never reuse signatures across different transactions (sighash uniqueness)',
            ],
            relatedResources: [
              {
                title: 'BSV Script Language Reference',
                url: 'https://wiki.bitcoinsv.io/index.php/Script',
                type: 'documentation',
              },
              {
                title: 'Transaction Signature Validation',
                url: 'https://wiki.bitcoinsv.io/index.php/SIGHASH_flags',
                type: 'documentation',
              },
              {
                title: 'Mempool and Fee Estimation',
                url: 'https://wiki.bitcoinsv.io/index.php/Fee_and_block_space_market',
                type: 'documentation',
              },
              {
                title: 'ECDSA Signature Verification',
                url: 'https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm',
                type: 'documentation',
              },
            ],
          },
          memoryAids: [
            '🧠 Rejection taxonomy: UTXO_SPENT | SIG_INVALID | SCRIPT_FAILED | FEE_LOW | NON_STANDARD',
            '🧠 Signature validation: sighash = SHA256d(tx preimage), verify(sighash, sig, pubKey)',
            '🧠 Script validation: concat(unlocking, locking) → execute → stack == [true]',
            '🧠 Fee calculation: (ΣinputAmounts - ΣoutputAmounts) / txSizeBytes ≥ minFeeRate',
            '🧠 Always: fresh UTXO query + local validation + retry budget',
          ],
        },
      },
    },
  },

  success: {
    verifyValid: {
      beginner: {
        plainLanguage: 'Your payment is valid',
        explanation:
          'The transaction you sent meets all requirements. The money, address, and format are correct.',
        stepByStep: [
          'Your transaction was reviewed',
          'Amount, address, and format were verified',
          'Everything is correct',
          'Now you can proceed to the next step',
        ],
        hints: {
          nextSteps: 'Proceed to confirm payment to send it to blockchain',
        },
        memoryAids: ['✅ Valid transaction = ready to send'],
      },
      simple: {
        plainLanguage: 'Verification successful: valid BSV transaction',
        explanation:
          'Facilitator validated transaction meets all requirements: correct amount, valid address, and standard BSV format.',
        stepByStep: [
          'Amount verified: matches or exceeds required',
          'Address verified: valid and on correct network',
          'Format verified: well-formed BSV transaction',
          'Result: isValid = true',
        ],
        hints: {
          nextSteps: 'You can proceed to /settle to broadcast the transaction',
        },
        memoryAids: ['📌 isValid: true → ready for broadcast'],
      },
      medium: {
        plainLanguage: 'Transaction verification passed: all requirements satisfied',
        explanation:
          'verifyTransaction() executed all validations successfully: (1) valid BSV format, (2) output amount >= required, (3) destination address matches requirements.address.',
        stepByStep: [
          'Step 1: parseTransaction(hex) → Transaction object',
          'Step 2: validateBsvAddress() → valid address',
          'Step 3: isP2PKHToAddress() → output found with correct amount',
          'Step 4: extractPayerAddress() → payer address (optional)',
          'Result: { isValid: true, txid }',
        ],
        hints: {
          nextSteps:
            'With isValid=true, client can call /settle for broadcast',
        },
        memoryAids: [
          '🔍 Validation pipeline: format → address → amount',
        ],
      },
      advanced: {
        plainLanguage:
          'Comprehensive transaction validation successful: all consensus and payment rules satisfied',
        explanation:
          'verifyTransaction() executed exhaustive validation without errors: (1) Transaction.fromHex() parsed successfully, (2) validateBsvAddress() confirmed address on correct network, (3) isP2PKHToAddress() found P2PKH output with satoshis >= required amount, (4) extractPayerAddress() derived input address successfully.',
        stepByStep: [
          'Parse: tx = Transaction.fromHex(payload.transaction)',
          'Address validation: Address.fromString(requirements.address, network)',
          'Output search: for output in tx.outputs where isP2PKH(output)',
          'Amount check: output.satoshis >= BigInt(requirements.amount)',
          'Payer extraction: extractPayerAddress(tx) → input[0] public key → address',
          'Response: { isValid: true, txid: tx.id, amount, address, payerAddress }',
        ],
        hints: {
          nextSteps:
            'Transaction ready for broadcast via /settle endpoint. Ensure idempotency by checking txid before broadcast.',
        },
        memoryAids: [
          '⚙️ Validation steps: parse → address → output → amount → payer',
        ],
      },
      expert: {
        plainLanguage:
          'Transaction validation pipeline completed: format, address, amount, and script validation passed',
        explanation:
          'The verifyTransaction() function successfully executed the complete validation pipeline without throwing errors: (1) Binary deserialization via Transaction.fromHex() confirmed valid BSV wire format, (2) Address validation via Address.fromString() with network parameter confirmed target address is valid for configured network (mainnet/testnet), (3) Output iteration located a P2PKH output with lockingScript.toAddress() matching requirements.address and satoshis >= requirements.amount (BigInt comparison), (4) Optional payer address extraction via extractPayerAddress() derived address from first input\'s public key. Result: { isValid: true, txid, amount, address, payerAddress?, invalidReason: null }.',
        stepByStep: [
          'Deserialize: const tx = Transaction.fromHex(payload.transaction) → validate wire format',
          'Network validation: const addr = Address.fromString(requirements.address, network) → throws if invalid or wrong network',
          'Output iteration: for (const output of tx.outputs)',
          '  - Extract address: const outAddr = output.lockingScript.toAddress()',
          '  - Compare: outAddr?.toString() === requirements.address',
          '  - Validate amount: BigInt(output.satoshis) >= BigInt(requirements.amount)',
          '  - If match: validationPassed = true, break',
          'Payer extraction (optional): const payerAddr = extractPayerAddress(tx) → derive from input[0].unlockingScript',
          'Response construction: { isValid: true, txid: tx.id, amount: requirements.amount, address: requirements.address, payerAddress }',
        ],
        hints: {
          nextSteps:
            'Transaction validated and ready for broadcast. Client should: (1) store txid for idempotency checks, (2) call /settle endpoint with same payload, (3) implement retry with idempotency (check getTransaction(txid) before rebroadcast), (4) monitor mempool/blockchain for confirmation.',
        },
        memoryAids: [
          '🧠 Validation guarantees: format valid ∧ address valid ∧ output exists ∧ amount sufficient',
          '🧠 No blockchain state check (UTXO existence not verified until broadcast)',
        ],
      },
    },

    settleSuccess: {
      beginner: {
        plainLanguage: 'Your payment was sent successfully',
        explanation:
          'Transaction was sent to BSV blockchain and was accepted. Your payment is being processed.',
        stepByStep: [
          'Your transaction was sent to BSV network',
          'Network accepted it correctly',
          'Now it\'s waiting for confirmation in a block',
          'Save the transaction ID to track it',
        ],
        hints: {
          nextSteps:
            'You can see your payment status in a block explorer using the txid',
        },
        memoryAids: ['✅ Payment sent = waiting for block confirmation'],
      },
      simple: {
        plainLanguage: 'Broadcast successful: transaction in BSV blockchain',
        explanation:
          'Transaction was successfully broadcast through WhatsOnChain and was accepted by BSV network. It\'s now in mempool waiting to be included in a block.',
        stepByStep: [
          'Transaction sent to WhatsOnChain API',
          'API returned success (status 200)',
          'Transaction now in BSV mempool',
          'Will be included in next block (≈10 minutes)',
        ],
        hints: {
          nextSteps:
            'Monitor txid on whatsonchain.com to see confirmations',
        },
        memoryAids: ['📌 Broadcast = in mempool, confirmation ≈ 10 min'],
      },
      medium: {
        plainLanguage:
          'Broadcast completed: transaction accepted into BSV mempool',
        explanation:
          'broadcastTransaction() executed successfully: (1) pre-broadcast verification (txid doesn\'t exist), (2) POST to WhatsOnChain /tx/raw, (3) 200 OK response with txid, (4) transaction now in mempool waiting for block inclusion.',
        stepByStep: [
          'Pre-verification: getTransaction(txid) → 404 (doesn\'t exist)',
          'Broadcast: POST /tx/raw with transaction hex',
          'Response: { txid: "..." } with status 200',
          'Result: { success: true, txid, message: "..." }',
          'Monitoring: tx will enter next block',
        ],
        hints: {
          nextSteps:
            'Client can monitor confirmations via GET /tx/{txid} periodically',
        },
        memoryAids: [
          '🔍 Broadcast pipeline: check existence → POST → mempool → block',
        ],
      },
      advanced: {
        plainLanguage:
          'Transaction broadcast successful: accepted into network mempool with retry resilience',
        explanation:
          'broadcastTransaction() completed successfully with retry logic: (1) getTransaction() pre-check returned 404 (tx doesn\'t exist), (2) POST /tx/raw executed with exponential backoff (up to 3 attempts), (3) WhatsOnChain returned 200 OK, (4) response parsed with txid, (5) transaction now in BSV nodes mempool, (6) will be included in next block (average time: 10 minutes, depends on fee rate).',
        stepByStep: [
          'Pre-broadcast check: await getTransaction(txid) → { found: false }',
          'Attempt 1: POST https://api.whatsonchain.com/v1/bsv/{network}/tx/raw',
          'If success (200): parse { txid } from response body',
          'If transient failure (429/503/timeout): wait backoff delay (1s, 2s, 4s)',
          'Retry with exponential backoff up to maxRetries (3)',
          'On success: return { success: true, txid, broadcastedAt: ISO timestamp }',
          'Cache result in KV for idempotency: key=txid, TTL=24h',
        ],
        hints: {
          nextSteps:
            'Client should: (1) store txid for future reference, (2) poll GET /tx/{txid} for confirmations, (3) wait for 1-6 confirmations depending on risk tolerance (1 conf ≈ 10min, 6 conf ≈ 60min).',
        },
        memoryAids: [
          '⚙️ Broadcast guarantee: at-most-once with idempotency checks',
          '⚙️ Retry: 3 attempts, backoff [1s, 2s, 4s]',
        ],
      },
      expert: {
        plainLanguage:
          'Transaction successfully propagated to BSV network: mempool acceptance confirmed with retry resilience',
        explanation:
          'The broadcastTransaction() function completed the full broadcast lifecycle: (1) Idempotency check via getTransaction(txid) returned 404 (transaction does not exist in blockchain or mempool), (2) HTTP POST to WhatsOnChain /tx/raw endpoint with transaction hex in request body, (3) Exponential backoff retry logic handled transient failures (network timeouts, rate limiting, service unavailability) with delays [1s, 2s, 4s], (4) WhatsOnChain returned HTTP 200 with JSON body containing txid, (5) Transaction now propagated across BSV node network and residing in mempool, (6) Expected block inclusion time: ≈10 minutes (assuming sufficient fee rate ≥0.5 sat/byte), (7) Result cached in KV namespace for 24h to optimize subsequent idempotency checks.',
        stepByStep: [
          'Compute txid: const txid = Buffer.from(sha256(sha256(txBytes))).reverse().toString("hex")',
          'Idempotency check: const existing = await env.METADATA_CACHE.get(`txid:${txid}`)',
          'If cache hit: return cached result (skip broadcast)',
          'If cache miss: query blockchain: GET /tx/{txid}/hex',
          'If 404 (not found): proceed to broadcast',
          'If 200 (exists): return { success: true, alreadyBroadcast: true }',
          'Broadcast with retry: for (let attempt = 0; attempt < 3; attempt++)',
          '  - POST /tx/raw with body: transaction hex',
          '  - Timeout: 10s via AbortController',
          '  - On success (200): parse { txid } from response',
          '  - On failure (timeout, 429, 503): await backoff (1s * 2^attempt)',
          '  - If all retries fail: throw NetworkError',
          'On broadcast success: cache result in KV',
          'Return: { success: true, txid, broadcastedAt: new Date().toISOString() }',
        ],
        hints: {
          nextSteps:
            'Post-broadcast workflow: (1) Store txid in client-side persistence for tracking, (2) Implement confirmation monitoring: poll GET /tx/{txid} every 30s until confirmations >= desired threshold, (3) Consider using webhooks if available (WhatsOnChain may offer callback APIs), (4) For high-value transactions: wait for 6 confirmations (≈60 min) to ensure finality against chain reorgs, (5) Update UI with mempool → confirmed state transitions.',
        },
        memoryAids: [
          '🧠 Broadcast lifecycle: idempotency check → POST /tx/raw → mempool → block inclusion',
          '🧠 Confirmation timeline: mempool (0 conf) → 1 conf (~10min) → 6 conf (~60min)',
          '🧠 Retry strategy: 3 attempts, exponential backoff [1s, 2s, 4s], fail on permanent errors',
          '🧠 Cache optimization: KV cache (txid → result) with 24h TTL',
        ],
      },
    },

    supportedNetworks: {
      beginner: {
        plainLanguage: 'This service works with BSV test network',
        explanation:
          'Facilitator is configured to work with BSV testnet. Testnet uses test coins with no real value.',
        stepByStep: [
          'Service accepts payments on BSV testnet',
          'Testnet is for testing, not real money',
          'Use addresses starting with "m" or "n"',
          'For real money, you need mainnet',
        ],
        hints: {
          nextSteps: 'Make sure to use a testnet wallet for testing',
        },
        memoryAids: ['💡 testnet = test network, mainnet = real network'],
      },
      simple: {
        plainLanguage: 'Facilitator configured for BSV testnet',
        explanation:
          'This endpoint returns supported BSV networks. Currently only testnet is enabled. Testnet allows testing without financial risk.',
        stepByStep: [
          'GET / returns list of networks',
          'Supported networks: ["bsv-testnet"]',
          'Testnet uses addresses with prefix "m" or "n"',
          'Mainnet uses addresses with prefix "1" or "3"',
        ],
        hints: {
          nextSteps: 'Configure your wallet to use BSV testnet',
        },
        memoryAids: ['📌 Prefixes: testnet (m/n), mainnet (1/3)'],
      },
      medium: {
        plainLanguage: 'Network configuration: BSV testnet enabled',
        explanation:
          'Facilitator is configured via wrangler.toml to operate on BSV testnet. This means all address validations use network prefix 0x6F (testnet) instead of 0x00 (mainnet).',
        stepByStep: [
          'Configuration in wrangler.toml: NETWORK=testnet',
          'All validations use testnet parameters',
          'Address validation expects m/n prefix (testnet)',
          'GET / endpoint returns ["bsv-testnet"]',
        ],
        hints: {
          nextSteps:
            'To change to mainnet, update NETWORK in wrangler.toml and redeploy',
        },
        memoryAids: [
          '🔍 Network config in wrangler.toml determines validations',
        ],
      },
      advanced: {
        plainLanguage:
          'Network configuration enforced: testnet-only address validation',
        explanation:
          'Facilitator implements network awareness through NETWORK configuration in wrangler.toml. This affects: (1) validateBsvAddress() uses network="testnet", (2) Address.fromString() validates version byte 0x6F, (3) Address.fromPublicKey() generates addresses with testnet prefix, (4) GET / endpoint exposes ["bsv-testnet"] for client discovery.',
        stepByStep: [
          'Configuration: env.NETWORK = "testnet" (from wrangler.toml)',
          'Address validation: Address.fromString(addr, "testnet")',
          'Version byte enforcement: testnet = 0x6F, mainnet = 0x00',
          'GET / response: { networks: ["bsv-testnet"] }',
          'To change to mainnet: (1) update NETWORK="mainnet", (2) update WALLET_ADDRESS, (3) redeploy',
        ],
        hints: {
          nextSteps:
            'For production mainnet: (1) verify WALLET_ADDRESS is mainnet, (2) update NETWORK in [env.production], (3) deploy with --env production',
        },
        memoryAids: [
          '⚙️ Network param propagates: config → validation → address generation',
        ],
      },
      expert: {
        plainLanguage:
          'Network configuration: testnet-enforced validation with client discovery',
        explanation:
          'The facilitator implements comprehensive network awareness: (1) Environment variable NETWORK (from wrangler.toml) controls network selection ("mainnet" | "testnet"), (2) All address validation functions (validateBsvAddress, extractPayerAddress, isP2PKHToAddress) use network parameter from env, (3) Address.fromString(addr, network) enforces version byte validation (0x6F for testnet, 0x00 for mainnet P2PKH), (4) GET / endpoint exposes supported networks array for client discovery, (5) Prevents accidental mixing of mainnet and testnet addresses through strict validation.',
        stepByStep: [
          'Configuration loading: const network = c.env.NETWORK as "mainnet" | "testnet"',
          'Address validation with network: Address.fromString(address, network)',
          'Version byte validation: testnet P2PKH = 0x6F, mainnet P2PKH = 0x00',
          'If mismatch: throw "Invalid address for network {network}"',
          'GET / handler: return { networks: [`bsv-${network}`] }',
          'Client discovery: client can query GET / to determine supported network',
          'Network migration: (1) update wrangler.toml [env.production].NETWORK, (2) update WALLET_ADDRESS to mainnet address, (3) deploy with --env production',
        ],
        hints: {
          nextSteps:
            'Production deployment checklist: (1) Verify WALLET_ADDRESS is valid mainnet address, (2) Set NETWORK="mainnet" in [env.production], (3) Test with mainnet testnet transactions first, (4) Monitor for address validation errors in logs, (5) Implement network-aware error messages for users.',
        },
        memoryAids: [
          '🧠 Network propagation: env.NETWORK → validation → address derivation',
          '🧠 Version bytes: testnet P2PKH (0x6F) | mainnet P2PKH (0x00)',
          '🧠 Client discovery: GET / → { networks: ["bsv-{network}"] }',
        ],
      },
    },
  },

  glossary: {
    satoshi: 'Smallest unit of Bitcoin SV. 1 BSV = 100,000,000 satoshis',
    txid: 'Unique 64-character hexadecimal identifier of a transaction',
    blockchain: 'Distributed and immutable ledger of transactions',
    testnet: 'Bitcoin SV test network with coins that have no real value',
    mainnet: 'Main Bitcoin SV network with coins that have real value',
    output: 'Destination address and amount in a BSV transaction',
    input: 'Reference to previous funds being spent in a transaction',
    fee: 'Small amount paid to miners for processing a transaction',
    hexadecimal: 'Base-16 number system using digits 0-9 and letters A-F',
    p2pkh: 'Pay to Public Key Hash: standard type of BSV transaction',
    utxo: 'Unspent Transaction Output: coins available to spend',
    mempool: 'Set of transactions waiting to be included in a block',
    'locking script': 'Script that defines conditions to spend an output',
    'unlocking script': 'Script that satisfies the conditions of the locking script',
    sighash: 'Transaction hash used to generate signatures',
    'base58check': 'Encoding used for BSV addresses with integrated checksum',
  },

  icons: {
    verify: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    success: '✅',
    pending: '⏳',
    network: '🌐',
    blockchain: '⛓',
    transaction: '💸',
    wallet: '👛',
    broadcast: '📡',
    confirmed: '🔒',
  },
};
