/**
 * Facilitador X402 BSV con Accesibilidad Universal
 *
 * Entrypoint principal - define routes, middleware y error handling
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import type { Context } from 'hono';
import {
  VerifyRequestSchema,
  SettleRequestSchema,
  AccessibleResponse,
  VerifyResponse,
  SettleResponse,
  VerifyErrorCodes,
  SettleErrorCodes,
  Env,
} from './types';
import { verifyTransaction } from './verify';
import { settleTransaction } from './settle';
import { createAccessibleResponse } from './accessibility/metadata';
import { createMetadataWithAI } from './accessibility/ai-metadata';
import { messages, createMetadataFromTemplate, getMessagesByLanguage } from './accessibility/i18n';
import { logger } from './logger';
import { handleGlobalError } from '../utils/error-handler';

const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// Middleware
// ============================================================================

// CORS para permitir requests desde clientes LLM (Claude Desktop, ChatGPT)
app.use(
  '/*',
  cors({
    origin: '*', // Permitir todos los orígenes (seguro para facilitador público)
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Error handling global para errores no capturados
app.onError((err, c) => {
  // Log del error para debugging
  logger.error('Unhandled error in request', {
    path: c.req.path,
    method: c.req.method,
    error: err.message,
    stack: err.stack,
  });

  // Usar el handler global de errores que sanitiza y formatea
  const errorResponse = handleGlobalError(err);

  return c.json(errorResponse, errorResponse.status);
});

// ============================================================================
// Endpoints
// ============================================================================

/**
 * GET / - Health check y redes soportadas
 */
app.get('/', async (c) => {
  // Permitir preferencias opcionales desde query params
  const language = (c.req.query('language') as 'es' | 'en') ?? 'es';
  const cognitiveLevel =
    (c.req.query('cognitiveLevel') as 'simple' | 'medium' | 'advanced') ?? 'simple';
  const audioFriendly = c.req.query('audioFriendly') !== 'false';

  const metadata = await createMetadataWithAI(
    'success.supportedNetworks',
    {},
    { language, cognitiveLevel, audioFriendly },
    c.env
  );

  const response: AccessibleResponse<{ networks: string[] }> = createAccessibleResponse(
    { networks: ['bsv-mainnet', 'bsv-testnet'] },
    metadata
  );

  return c.json(response);
});

/**
 * POST /verify - Verificar transacción BSV sin broadcast (User Story 1)
 *
 * T042, T043, T044
 */
app.post(
  '/verify',
  zValidator('json', VerifyRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
        },
        400
      );
    }
  }),
  async (c) => {
    const requestBody = c.req.valid('json');
    const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

    // Extraer preferencias con valores por defecto
    const language = accessibilityPreferences?.language ?? 'es';
    const cognitiveLevel = accessibilityPreferences?.cognitiveLevel ?? 'simple';
    const audioFriendly = accessibilityPreferences?.audioFriendly ?? true;

    logger.info('Verify request received', {
      network: payload.network,
      scheme: payload.scheme,
      requiredAmount: paymentRequirements.maxAmountRequired,
      language,
      cognitiveLevel,
    });

    // T043: Llamar a verifyTransaction() y envolver en AccessibleResponse
    const verifyResult = verifyTransaction(payload, paymentRequirements);

    // Generate metadata with AI
    let metadata;
    let messageType: string;
    let context: Record<string, string> = {};

    if (verifyResult.isValid) {
      // Success case
      messageType = 'success.verifyValid';
      context = {
        amount: paymentRequirements.maxAmountRequired,
        address: paymentRequirements.payTo,
      };
    } else {
      // Error case: determine message type based on invalidReason
      const invalidReason = verifyResult.invalidReason;

      switch (invalidReason) {
        case VerifyErrorCodes.INVALID_AMOUNT:
          messageType = 'errors.verify.invalidAmount';
          context = {
            required: paymentRequirements.maxAmountRequired,
            actual: '0', // TODO: extraer monto real de la transacción
          };
          break;

        case VerifyErrorCodes.INVALID_ADDRESS:
          messageType = 'errors.verify.invalidAddress';
          context = {
            required: paymentRequirements.payTo,
            actual: 'desconocida',
          };
          break;

        case VerifyErrorCodes.INVALID_FORMAT:
        default:
          messageType = 'errors.verify.invalidFormat';
          context = {};
          break;
      }
    }

    metadata = await createMetadataWithAI(
      messageType,
      context,
      { language, cognitiveLevel, audioFriendly },
      c.env
    );

    const response: AccessibleResponse<VerifyResponse> = createAccessibleResponse(
      verifyResult,
      metadata
    );

    return c.json(response);
  }
);

/**
 * POST /settle - Broadcastear transacción BSV a blockchain (User Story 2)
 *
 * T068, T069, T070
 */
app.post(
  '/settle',
  zValidator('json', SettleRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
        },
        400
      );
    }
  }),
  async (c) => {
    const requestBody = c.req.valid('json');
    const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

    // Extraer preferencias con valores por defecto
    const language = accessibilityPreferences?.language ?? 'es';
    const cognitiveLevel = accessibilityPreferences?.cognitiveLevel ?? 'simple';
    const audioFriendly = accessibilityPreferences?.audioFriendly ?? true;

    logger.info('Settle request received', {
      network: payload.network,
      scheme: payload.scheme,
      language,
      cognitiveLevel,
    });

    // T069: Llamar a settleTransaction() y envolver en AccessibleResponse
    const settleResult = await settleTransaction(payload, paymentRequirements);

    // Generate metadata with AI
    let metadata;
    let messageType: string;
    let context: Record<string, string> = {};

    if (settleResult.success) {
      // Success case
      messageType = 'success.settleSuccess';
      context = {
        txid: settleResult.transaction || '',
      };
    } else {
      // Error case: determine message type based on errorReason
      const errorReason = settleResult.errorReason;

      switch (errorReason) {
        case SettleErrorCodes.ALREADY_BROADCAST:
          messageType = 'errors.settle.alreadyBroadcast';
          context = {
            txid: settleResult.transaction || '',
          };
          break;

        case SettleErrorCodes.NETWORK_ERROR:
          messageType = 'errors.settle.networkError';
          context = {};
          break;

        case SettleErrorCodes.BROADCAST_FAILED:
        default:
          messageType = 'errors.settle.broadcastFailed';
          context = {};
          break;
      }
    }

    metadata = await createMetadataWithAI(
      messageType,
      context,
      { language, cognitiveLevel, audioFriendly },
      c.env
    );

    const response: AccessibleResponse<SettleResponse> = createAccessibleResponse(
      settleResult,
      metadata
    );

    return c.json(response);
  }
);

// ============================================================================
// Export
// ============================================================================

export default app;
