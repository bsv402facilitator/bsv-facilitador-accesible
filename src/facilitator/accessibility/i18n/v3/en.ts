/**
 * V3 English Templates - Universal Accessibility
 *
 * Includes:
 * - 5 cognitive levels (beginner → expert)
 * - 3 abstraction levels (concrete → abstract)
 * - Enhanced content structure for LLM clients
 */

import type { MessageTemplateV3, MessageCatalogV3 } from './es';

// ============================================================================
// VERIFY - INVALID AMOUNT
// ============================================================================

const verifyInvalidAmountV3: MessageTemplateV3 = {
  byLevel: {
    beginner: {
      plainLanguage: 'You did not send enough money',
      explanation: 'The payment requires more money than you sent. Like trying to pay $5 with only $2.',
      detailedExplanation:
        'Each payment needs a specific minimum amount. Your transaction includes less money than needed. This happens when the amount is less than required or when you forget to include network fees.',
      stepByStep: [
        {
          text: 'Check how much money the payment requires',
          icon: '🔍',
          context: 'Look for the amount in the payment information',
        },
        {
          text: 'Verify how much you included in your transaction',
          icon: '📊',
          context: 'Look at your payment details',
        },
        {
          text: 'Calculate the missing difference',
          icon: '➕',
          context: 'Calculate: required amount - sent amount',
        },
        {
          text: 'Create a new transaction with the correct amount',
          icon: '✅',
          context: 'Make sure to include the total needed',
        },
      ],
      hints: {
        ifError: 'Verify that the amount also includes network fees',
        commonMistakes: [
          'Forgetting to add network fees to the amount',
          'Confusing satoshis with BSV (1 BSV = 100 million satoshis)',
          'Copying the required amount incorrectly',
        ],
        nextSteps: 'Verify the required amount and create a new payment with the correct quantity',
        troubleshooting: 'If it still fails, verify you are using the correct unit (satoshis)',
        safeguards: [
          'Do not send money until confirming the exact amount',
          'Always include margin for fees',
        ],
      },
      glossary: {
        Satoshi: 'The smallest unit of Bitcoin. 1 BSV = 100,000,000 satoshis',
        BSV: 'Bitcoin SV, the cryptocurrency you are using',
        'Network fee': 'Small payment to miners to process your transaction',
        Output: 'Destination of funds in a transaction',
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
        '💡 Always verify the amount BEFORE sending',
        '💡 Total amount = price + network fee',
        '💡 1 BSV = 100 million satoshis',
      ],
    },
    simple: {
      plainLanguage: 'Payment amount is less than required',
      explanation:
        'The BSV transaction you sent includes fewer satoshis than needed. The output to the seller address does not reach the minimum specified amount.',
      stepByStep: [
        {
          text: 'Identify the required amount in satoshis',
          context: 'Look in payment requirements',
        },
        {
          text: 'Locate the output paying to the seller',
          context: 'Review your transaction outputs',
        },
        {
          text: 'Compare: sent amount vs. required amount',
          context: 'Verify the difference',
        },
        {
          text: 'Adjust the transaction with the correct amount',
          context: 'Create new payment if necessary',
        },
      ],
      hints: {
        ifError: 'Verify you are using the same unit (satoshis). 1 BSV = 100,000,000 satoshis',
        commonMistakes: [
          'Confusing the order of outputs in the transaction',
          'Not including enough satoshis to cover amount + fees',
          'Using BSV instead of satoshis in calculation',
        ],
        nextSteps:
          'Recalculate the output to the seller address and ensure it is >= required amount',
      },
      glossary: {
        Output: 'Fund output in a BSV transaction',
        'Required amount': 'Minimum number of satoshis the seller must receive',
      },
    },
    medium: {
      plainLanguage: 'Payment output does not reach specified amount',
      explanation:
        'The transaction does not comply with the "exact" scheme: no output sends the required amount (or greater) to the address specified in payTo.',
      stepByStep: [
        {
          text: 'Parse transaction to extract outputs',
          context: 'Use @bsv/sdk or similar',
        },
        {
          text: 'Filter outputs by destination address',
          context: 'Look for match with payTo address',
        },
        {
          text: 'Compare output value vs. maxAmountRequired',
          context: 'Must be >= in satoshis',
        },
        {
          text: 'Validate that network matches',
          context: 'Mainnet vs testnet',
        },
      ],
      hints: {
        ifError: 'Verify address encoding (P2PKH, mainnet prefix: 1)',
        nextSteps: 'Rebuild transaction with correct output to payTo address',
      },
    },
    advanced: {
      plainLanguage: 'Exact output validation failed: insufficient amount',
      explanation:
        'X402 exact scheme protocol requires specific output. Your TX does not have output >= maxAmountRequired to payTo address. Possible causes: incorrect value in lockingScript, network mismatch, or fee calculation error.',
      stepByStep: [
        {
          text: 'Deserialize raw TX hex',
          context: 'Transaction.fromHex() or equivalent',
        },
        {
          text: 'Iterate outputs, extract script + amount',
          context: 'tx.outputs.forEach()',
        },
        {
          text: 'Validate P2PKH script type and extract address',
          context: 'Script.fromBinary() + toAddress()',
        },
        {
          text: 'Assert output.amount >= requirements.maxAmountRequired',
          context: 'Numeric comparison in satoshis',
        },
      ],
      hints: {
        ifError: 'Check address derivation (pubKeyHash) and network byte. Mainnet=0x00, Testnet=0x6F',
        nextSteps: 'Use TX builder with exact output construction',
      },
    },
    expert: {
      plainLanguage: 'X402 exact scheme validation failure: output value mismatch',
      explanation:
        'BSV TX output verification against X402 PaymentRequirements failed. No output satisfies: (1) locking script resolves to payTo address (2) value >= maxAmountRequired (string-encoded satoshis) (3) network matches bsv-mainnet/testnet. Root cause: likely UTXO selection or fee estimation bug in TX construction.',
      stepByStep: [
        {
          text: 'Parse TX.outputs[i].lockingScript → extract pubKeyHash',
          context: 'OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG',
        },
        {
          text: 'Derive address from pubKeyHash + network byte',
          context: 'Base58Check encoding',
        },
        {
          text: 'Assert derived address === requirements.payTo',
          context: 'String comparison',
        },
        {
          text: 'Assert BigInt(output.satoshis) >= BigInt(requirements.maxAmountRequired)',
          context: 'Avoid floating point',
        },
      ],
      hints: {
        ifError: 'Verify UTXO set, fee calculation (1 sat/byte baseline), and change output construction',
        nextSteps: 'Rebuild TX: ensure output[0] = exact payment, output[1] = change (if any)',
      },
    },
  },
  byAbstraction: {
    concrete: {
      description: 'Specific examples with numbers and real cases',
      content: {
        plainLanguage: 'You did not send enough money (example: 1000 of 5000 satoshis)',
        explanation:
          'Imagine you need to pay 5000 satoshis but only sent 1000. Like trying to buy a $5 coffee with only $1 in your pocket.',
        stepByStep: [
          {
            text: 'Required amount: 5000 satoshis',
            context: 'This is what the seller asks for',
          },
          {
            text: 'Sent amount: 1000 satoshis',
            context: 'This is what you included in your transaction',
          },
          {
            text: 'Difference: 4000 satoshis missing',
            context: 'You need to send 4000 more satoshis',
          },
        ],
        hints: {
          nextSteps: 'Create a new transaction with 5000 satoshis or more',
        },
        examples: [
          {
            scenario: 'Digital content purchase',
            input: 'Required: 10000 sats, Sent: 7500 sats',
            output: 'Error: 2500 satoshis missing',
            explanation: 'You must create a new transaction with at least 10000 satoshis',
          },
        ],
      },
    },
    mixed: {
      description: 'Mix of theory and practical examples',
      content: {
        plainLanguage: 'Insufficient payment output',
        explanation:
          'BSV transactions have outputs that specify how many satoshis go to each address. Your transaction does not have an output with enough value to the seller address.',
        stepByStep: [
          {
            text: 'Understand that a TX has multiple outputs',
            context: 'Like dividing money into several envelopes',
          },
          {
            text: 'One must go to seller with correct amount',
            context: 'Example: Output[0]: 5000 sats → seller',
          },
          {
            text: 'Another can be change returning to you',
            context: 'Example: Output[1]: 2000 sats → your address',
          },
        ],
        hints: {
          nextSteps: 'Verify that the correct output has amount >= required',
        },
      },
    },
    abstract: {
      description: 'Theoretical concepts of X402 protocol',
      content: {
        plainLanguage: 'Violation of X402 protocol exact scheme',
        explanation:
          'The X402 protocol defines an "exact" scheme where the BSV transaction must contain at least one output whose value in satoshis is greater than or equal to the maxAmountRequired specified in PaymentRequirements, directed to the address indicated in the payTo field.',
        stepByStep: [
          {
            text: 'X402 exact scheme validation',
            context: 'HTTP-native payment protocol',
          },
          {
            text: 'Output value assertion',
            context: 'Mathematical validation in satoshis',
          },
          {
            text: 'Address matching verification',
            context: 'P2PKH address comparison',
          },
        ],
        hints: {
          nextSteps: 'Implement TX construction logic compatible with X402 exact scheme',
        },
      },
    },
  },
};

// ============================================================================
// VERIFY - SUCCESS
// ============================================================================

const verifySuccessV3: MessageTemplateV3 = {
  byLevel: {
    beginner: {
      plainLanguage: '✅ Valid payment',
      explanation: 'Your Bitcoin payment is correct and ready to be processed.',
      stepByStep: [
        {
          text: 'Your payment was verified',
          icon: '✅',
        },
        {
          text: 'It will now be sent to the Bitcoin network',
          icon: '📡',
        },
      ],
      hints: {
        nextSteps: 'Wait for confirmation that the payment was processed on the blockchain',
      },
    },
    simple: {
      plainLanguage: 'Valid transaction',
      explanation: 'The BSV transaction meets all payment requirements.',
      stepByStep: [
        {
          text: 'Verification completed successfully',
        },
        {
          text: 'Transaction can be broadcast',
        },
      ],
      hints: {
        nextSteps: 'Proceed with settle to broadcast to the blockchain',
      },
    },
    medium: {
      plainLanguage: 'BSV transaction verified successfully',
      explanation: 'The transaction complies with the "exact" scheme, correct amount, and valid address.',
      stepByStep: [
        {
          text: 'Exact scheme validation: OK',
        },
        {
          text: 'Amount validation: OK',
        },
        {
          text: 'Address validation: OK',
        },
      ],
      hints: {},
    },
    advanced: {
      plainLanguage: 'Successful validation: exact scheme, outputs verified',
      explanation:
        'BSV mainnet transaction verified: outputs match PaymentRequirements, correct address matching, value >= maxAmountRequired.',
      stepByStep: [
        {
          text: 'Output validation passed',
        },
        {
          text: 'Address derivation verified',
        },
      ],
      hints: {},
    },
    expert: {
      plainLanguage: 'TX validation passed: exact scheme, UTXO verified, sig valid',
      explanation:
        'BSV transaction validated against PaymentRequirements: output[0] matches payTo address via P2PKH script, value >= maxAmountRequired (satoshis), network bsv-mainnet. TX ready for broadcast.',
      stepByStep: [
        {
          text: 'Cryptographic signature validation: PASS',
        },
        {
          text: 'X402 exact scheme compliance: PASS',
        },
      ],
      hints: {},
    },
  },
  byAbstraction: {
    concrete: {
      description: 'Confirmation with specific details',
      content: {
        plainLanguage: '✅ Valid payment: you sent {amount} satoshis to {address}',
        explanation: 'Your payment was reviewed and everything is correct. Can continue.',
        stepByStep: [
          {
            text: 'Payment verified',
          },
        ],
        hints: {},
      },
    },
    mixed: {
      description: 'Confirmation with technical context',
      content: {
        plainLanguage: 'Transaction verified correctly',
        explanation:
          'The transaction meets X402 requirements: correct amount, valid address, valid BSV format.',
        stepByStep: [
          {
            text: 'All checks passed',
          },
        ],
        hints: {},
      },
    },
    abstract: {
      description: 'Confirmation at protocol level',
      content: {
        plainLanguage: 'X402 exact scheme validation: PASS',
        explanation: 'The transaction satisfies all X402 protocol criteria for the exact scheme.',
        stepByStep: [
          {
            text: 'Protocol compliance verified',
          },
        ],
        hints: {},
      },
    },
  },
};

// ============================================================================
// EXPORT CATALOG
// ============================================================================

export const englishTemplatesV3: MessageCatalogV3 = {
  'errors.verify.invalidAmount': verifyInvalidAmountV3,
  'success.verifyValid': verifySuccessV3,
  // TODO: Add more message types
};
