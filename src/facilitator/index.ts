/**
 * Facilitador X402 BSV con Accesibilidad Universal
 *
 * Entrypoint principal - define routes, middleware y error handling
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import {
  VerifyRequestSchema,
  SettleRequestSchema,
  AccessibleResponse,
  VerifyResponse,
  SettleResponse,
  VerifyErrorCodes,
  SettleErrorCodes,
} from './types';
import { verifyTransaction } from './verify';
import { settleTransaction } from './settle';
import { createAccessibleResponse } from './accessibility/metadata';
import { messages, createMetadataFromTemplate, getMessagesByLanguage } from './accessibility/i18n';
import { logger } from './logger';
import { handleGlobalError } from '../utils/error-handler';

const app = new Hono();

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
app.get('/', (c) => {
  // Permitir preferencias opcionales desde query params
  const language = (c.req.query('language') as 'es' | 'en') ?? 'es';
  const cognitiveLevel =
    (c.req.query('cognitiveLevel') as 'simple' | 'medium' | 'advanced') ?? 'simple';
  const audioFriendly = c.req.query('audioFriendly') !== 'false';

  const msgs = getMessagesByLanguage(language);
  const response: AccessibleResponse<{ networks: string[] }> = createAccessibleResponse(
    { networks: ['bsv-mainnet', 'bsv-testnet'] },
    createMetadataFromTemplate(msgs.success.supportedNetworks, {}, cognitiveLevel, audioFriendly, language)
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

    // Obtener mensajes en el idioma correcto
    const msgs = getMessagesByLanguage(language);
    let metadata;

    if (verifyResult.isValid) {
      // Éxito: usar mensaje de success.verifyValid
      metadata = createMetadataFromTemplate(
        msgs.success.verifyValid,
        {
          amount: paymentRequirements.maxAmountRequired,
          address: paymentRequirements.payTo,
        },
        cognitiveLevel,
        audioFriendly,
        language
      );
    } else {
      // Error: determinar qué mensaje usar según invalidReason
      const invalidReason = verifyResult.invalidReason;

      switch (invalidReason) {
        case VerifyErrorCodes.INVALID_AMOUNT:
          metadata = createMetadataFromTemplate(
            msgs.errors.verify.invalidAmount,
            {
              required: paymentRequirements.maxAmountRequired,
              actual: '0', // TODO: extraer monto real de la transacción
            },
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;

        case VerifyErrorCodes.INVALID_ADDRESS:
          metadata = createMetadataFromTemplate(
            msgs.errors.verify.invalidAddress,
            {
              required: paymentRequirements.payTo,
              actual: 'desconocida',
            },
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;

        case VerifyErrorCodes.INVALID_FORMAT:
        default:
          metadata = createMetadataFromTemplate(
            msgs.errors.verify.invalidFormat,
            {},
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;
      }
    }

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

    // Obtener mensajes en el idioma correcto
    const msgs = getMessagesByLanguage(language);
    let metadata;

    if (settleResult.success) {
      // Éxito: usar mensaje de success.settleSuccess
      metadata = createMetadataFromTemplate(
        msgs.success.settleSuccess,
        {
          txid: settleResult.transaction || '',
        },
        cognitiveLevel,
        audioFriendly,
        language
      );
    } else {
      // Error: determinar qué mensaje usar según errorReason
      const errorReason = settleResult.errorReason;

      switch (errorReason) {
        case SettleErrorCodes.ALREADY_BROADCAST:
          metadata = createMetadataFromTemplate(
            msgs.errors.settle.alreadyBroadcast,
            {
              txid: settleResult.transaction || '',
            },
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;

        case SettleErrorCodes.NETWORK_ERROR:
          metadata = createMetadataFromTemplate(
            msgs.errors.settle.networkError,
            {},
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;

        case SettleErrorCodes.BROADCAST_FAILED:
        default:
          metadata = createMetadataFromTemplate(
            msgs.errors.settle.broadcastFailed,
            {},
            cognitiveLevel,
            audioFriendly,
            language
          );
          break;
      }
    }

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
