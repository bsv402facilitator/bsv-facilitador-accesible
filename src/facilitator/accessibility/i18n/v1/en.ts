/**
 * V1 English Templates
 * Extracted from original i18n.ts for backward compatibility
 */

import type { MessageCatalog } from '../types';

export const englishTemplatesV1: MessageCatalog = {
  errors: {
    verify: {
      invalidAmount: {
        plainLanguage: 'Payment amount is incorrect',
        explanation:
          'The transaction sent does not have the required amount of {required} satoshis. The actual amount is {actual} satoshis.',
        stepByStep: [
          'Check the required amount in payment requirements',
          'Create a new transaction with the exact amount',
          'Resend the transaction to the facilitator',
        ],
        hints: {
          ifError: 'Create a new transaction with exactly {required} satoshis',
          commonMistakes: [
            'Confusing satoshis with BSV (1 BSV = 100,000,000 satoshis)',
            'Forgetting to include fees in the amount calculation',
          ],
          nextSteps: 'Check the documentation to create transactions with exact amounts',
        },
      },
      invalidAddress: {
        plainLanguage: 'Address is invalid or not from testnet',
        explanation:
          'The transaction does not send funds to the correct address. Required: {required} but transaction sends to {actual}.',
        stepByStep: [
          'Check the address in payment requirements',
          'Create a new transaction with the correct address',
          'Ensure you use a testnet address (starts with m or n)',
        ],
        hints: {
          ifError: 'Create a transaction that sends to {required}',
          commonMistakes: [
            'Using mainnet address instead of testnet',
            'Copying the destination address incorrectly',
          ],
          nextSteps: 'Verify that the address starts with m or n for testnet',
        },
      },
      invalidFormat: {
        plainLanguage: 'Transaction format is invalid',
        explanation:
          'The BSV transaction cannot be processed. The hexadecimal format is incorrect or the transaction structure is malformed.',
        stepByStep: [
          'Verify that the transaction is in valid hexadecimal format',
          'Ensure the transaction is properly signed',
          'Check that all inputs and outputs are valid',
        ],
        hints: {
          ifError: 'Generate a new transaction using a valid BSV library',
          commonMistakes: ['Sending unsigned transaction', 'Using incorrect format (not hexadecimal)'],
          nextSteps: 'Use @bsv/sdk to create valid transactions',
        },
      },
    },
    settle: {
      alreadyBroadcast: {
        plainLanguage: 'This transaction was already processed',
        explanation:
          'The transaction with ID {txid} already exists on the BSV testnet blockchain. No need to resend it.',
        stepByStep: [
          'We queried the blockchain to verify the status',
          'We found that this transaction was already processed',
          'No need to resend it',
          'The payment is already being confirmed',
        ],
        hints: {
          nextSteps: 'Check the status at https://test.whatsonchain.com/tx/{txid}',
        },
      },
      networkError: {
        plainLanguage: 'Could not connect to the blockchain',
        explanation:
          'The BSV blockchain service did not respond in time. This is temporary and you have not lost funds. Your transaction is valid.',
        stepByStep: [
          'We detected a connection issue with the BSV network',
          'We tried 3 times without success',
          'The problem is temporary, not your transaction',
          'Wait a few seconds and try again',
        ],
        hints: {
          ifError: 'Retry in 10-30 seconds. The BSV network usually responds quickly',
          commonMistakes: ['Trying to change the transaction (not necessary, it is valid)'],
          nextSteps: 'If the error persists after 5 attempts, contact support',
        },
      },
      broadcastFailed: {
        plainLanguage: 'The blockchain rejected the transaction',
        explanation:
          'The BSV network did not accept the transaction. This may be due to insufficient funds, invalid format, or double spending.',
        stepByStep: [
          'The transaction was sent to the BSV network',
          'The nodes rejected the transaction',
          'Verify that you have sufficient funds',
          'Ensure you are not spending the same funds twice',
        ],
        hints: {
          ifError: 'Verify the balance of the source address',
          commonMistakes: [
            'Trying to spend already spent outputs (double spend)',
            'Not including enough fees',
          ],
          nextSteps: 'Review the transaction with a blockchain explorer',
        },
      },
    },
  },
  success: {
    verifyValid: {
      plainLanguage: 'Payment verified successfully',
      explanation:
        'Your transaction meets all requirements: {amount} satoshis sent to {address}',
      stepByStep: [
        'We received your transaction',
        'We validated the amount and destination address',
        'The transaction is ready to be processed',
        'You can proceed with the settlement step',
      ],
      hints: {
        nextSteps: 'Call the /settle endpoint to complete the payment',
      },
    },
    settleSuccess: {
      plainLanguage: 'Payment completed successfully',
      explanation: 'Your transaction was broadcast to the BSV testnet blockchain with ID {txid}',
      stepByStep: [
        'We received your signed transaction',
        'We validated it against the BSV network',
        'We broadcast it to the blockchain',
        'The transaction is confirmed on the network',
      ],
      hints: {
        nextSteps: 'You can verify your transaction on WhatsOnChain with the provided ID',
      },
    },
    supportedNetworks: {
      plainLanguage: 'This facilitator supports Bitcoin SV testnet',
      explanation:
        'We process X402 payments on the Bitcoin SV test network. Testnet uses test money with no real value.',
      stepByStep: [
        'Use addresses starting with m or n',
        'Get test funds from BSV testnet faucets',
        'Create transactions using @bsv/sdk',
      ],
      hints: {
        nextSteps: 'Check the documentation to get started with BSV testnet',
      },
    },
  },
};
