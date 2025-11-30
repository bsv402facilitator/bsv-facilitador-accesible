/**
 * Facilitador X402 BSV con Accesibilidad Universal
 *
 * Entrypoint principal - define routes, middleware y error handling
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import {
  VerifyRequestSchemaV2,
  SettleRequestSchemaV2,
  VerifyErrorCodes,
  SettleErrorCodes,
  AccessibilityPreferencesSchemaV2,
} from './types';
import type {
  AccessibleResponse,
  AccessibleResponseV2,
  VerifyResponse,
  SettleResponse,
  EnvV2,
  AccessibilityPreferencesV2,
} from './types';
import { verifyTransaction } from './verify';
import { settleTransaction } from './settle';
import { createAccessibleResponse, createAccessibleResponseV2 } from './accessibility/metadata';
import { createMetadataWithAI } from './accessibility/ai-metadata';
import { createMetadataWithAIV2 } from './accessibility/ai-metadata-v2';
import { generateWCAGCompliance } from './accessibility/wcag-validator';
import { logger } from './logger';
import { handleGlobalError } from '../utils/error-handler';
import {
  getUserPreferences,
  setUserPreferences,
  deleteUserPreferences,
} from './accessibility/preference-cache';
import {
  toXML,
  toPlainText,
  toMarkdown,
  toHTML,
  toJSONLD,
} from './accessibility/format-converters';

const app = new Hono<{ Bindings: EnvV2 }>();

// ============================================================================
// Middleware
// ============================================================================

// CORS para permitir requests desde clientes LLM (Claude Desktop, ChatGPT)
app.use(
  '/*',
  cors({
    origin: '*', // Permitir todos los orígenes (seguro para facilitador público)
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
  zValidator('json', VerifyRequestSchemaV2, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
        },
        400
      );
    }
    return undefined;
  }),
  async (c) => {
    const requestBody = c.req.valid('json');
    const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

    // Usar preferencias V2 completas con valores por defecto
    const preferences: AccessibilityPreferencesV2 = {
      language: accessibilityPreferences?.language ?? 'es',
      cognitiveLevel: accessibilityPreferences?.cognitiveLevel ?? 'simple',
      audioFriendly: accessibilityPreferences?.audioFriendly ?? true,
      outputFormat: accessibilityPreferences?.outputFormat ?? 'json',
      dialect: accessibilityPreferences?.dialect,
      abstractionLevel: accessibilityPreferences?.abstractionLevel ?? 'concrete',
      includeExamples: accessibilityPreferences?.includeExamples ?? true,
      includeGlossary: accessibilityPreferences?.includeGlossary ?? true,
      includeCheckpoints: accessibilityPreferences?.includeCheckpoints ?? false,
      contrastMode: accessibilityPreferences?.contrastMode ?? 'normal',
      colorBlindType: accessibilityPreferences?.colorBlindType ?? 'none',
      fontSize: accessibilityPreferences?.fontSize ?? 'medium',
      darkMode: accessibilityPreferences?.darkMode ?? false,
      screenReaderOptimized: accessibilityPreferences?.screenReaderOptimized ?? true,
      includeKeyboardHints: accessibilityPreferences?.includeKeyboardHints ?? true,
      includeVoiceHints: accessibilityPreferences?.includeVoiceHints ?? false,
      brailleOptimized: accessibilityPreferences?.brailleOptimized ?? false,
      includeSemanticMarkup: accessibilityPreferences?.includeSemanticMarkup ?? false,
      userId: accessibilityPreferences?.userId,
      adaptiveComplexity: accessibilityPreferences?.adaptiveComplexity ?? false,
      wcagLevel: accessibilityPreferences?.wcagLevel ?? 'AAA',
    };

    logger.info('Verify request received', {
      network: payload.network,
      scheme: payload.scheme,
      requiredAmount: paymentRequirements.maxAmountRequired,
      language: preferences.language,
      cognitiveLevel: preferences.cognitiveLevel,
    });

    // T043: Llamar a verifyTransaction() y envolver en AccessibleResponseV2
    const verifyResult = verifyTransaction(payload, paymentRequirements);

    // Generate metadata with AI V2
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

    const metadata = await createMetadataWithAIV2(
      messageType,
      context,
      preferences,
      c.env
    );

    const wcag = generateWCAGCompliance(metadata, preferences);

    const response: AccessibleResponseV2<VerifyResponse> = createAccessibleResponseV2(
      verifyResult,
      metadata,
      wcag
    );

    // Aplicar conversión de formato según preferencias
    const outputFormat = preferences.outputFormat;

    switch (outputFormat) {
      case 'xml':
        return c.text(toXML(response), 200, { 'Content-Type': 'application/xml' });

      case 'plaintext':
        return c.text(toPlainText(response), 200, { 'Content-Type': 'text/plain; charset=utf-8' });

      case 'markdown':
        return c.text(toMarkdown(response), 200, { 'Content-Type': 'text/markdown; charset=utf-8' });

      case 'html':
        return c.html(toHTML(response));

      case 'jsonld':
        const jsonld = toJSONLD(response);
        return c.json(JSON.parse(jsonld), 200, { 'Content-Type': 'application/ld+json' });

      case 'json':
      default:
        return c.json(response);
    }
  }
);

/**
 * POST /settle - Broadcastear transacción BSV a blockchain (User Story 2)
 *
 * T068, T069, T070
 */
app.post(
  '/settle',
  zValidator('json', SettleRequestSchemaV2, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error,
        },
        400
      );
    }
    return undefined;
  }),
  async (c) => {
    const requestBody = c.req.valid('json');
    const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

    // Usar preferencias V2 completas con valores por defecto
    const preferences: AccessibilityPreferencesV2 = {
      language: accessibilityPreferences?.language ?? 'es',
      cognitiveLevel: accessibilityPreferences?.cognitiveLevel ?? 'simple',
      audioFriendly: accessibilityPreferences?.audioFriendly ?? true,
      outputFormat: accessibilityPreferences?.outputFormat ?? 'json',
      dialect: accessibilityPreferences?.dialect,
      abstractionLevel: accessibilityPreferences?.abstractionLevel ?? 'concrete',
      includeExamples: accessibilityPreferences?.includeExamples ?? true,
      includeGlossary: accessibilityPreferences?.includeGlossary ?? true,
      includeCheckpoints: accessibilityPreferences?.includeCheckpoints ?? false,
      contrastMode: accessibilityPreferences?.contrastMode ?? 'normal',
      colorBlindType: accessibilityPreferences?.colorBlindType ?? 'none',
      fontSize: accessibilityPreferences?.fontSize ?? 'medium',
      darkMode: accessibilityPreferences?.darkMode ?? false,
      screenReaderOptimized: accessibilityPreferences?.screenReaderOptimized ?? true,
      includeKeyboardHints: accessibilityPreferences?.includeKeyboardHints ?? true,
      includeVoiceHints: accessibilityPreferences?.includeVoiceHints ?? false,
      brailleOptimized: accessibilityPreferences?.brailleOptimized ?? false,
      includeSemanticMarkup: accessibilityPreferences?.includeSemanticMarkup ?? false,
      userId: accessibilityPreferences?.userId,
      adaptiveComplexity: accessibilityPreferences?.adaptiveComplexity ?? false,
      wcagLevel: accessibilityPreferences?.wcagLevel ?? 'AAA',
    };

    logger.info('Settle request received', {
      network: payload.network,
      scheme: payload.scheme,
      language: preferences.language,
      cognitiveLevel: preferences.cognitiveLevel,
    });

    // T069: Llamar a settleTransaction() y envolver en AccessibleResponseV2
    const settleResult = await settleTransaction(payload, paymentRequirements);

    // Generate metadata with AI V2
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

    const metadata = await createMetadataWithAIV2(
      messageType,
      context,
      preferences,
      c.env
    );

    const wcag = generateWCAGCompliance(metadata, preferences);

    const response: AccessibleResponseV2<SettleResponse> = createAccessibleResponseV2(
      settleResult,
      metadata,
      wcag
    );

    // Aplicar conversión de formato según preferencias
    const outputFormat = preferences.outputFormat;

    switch (outputFormat) {
      case 'xml':
        return c.text(toXML(response), 200, { 'Content-Type': 'application/xml' });

      case 'plaintext':
        return c.text(toPlainText(response), 200, { 'Content-Type': 'text/plain; charset=utf-8' });

      case 'markdown':
        return c.text(toMarkdown(response), 200, { 'Content-Type': 'text/markdown; charset=utf-8' });

      case 'html':
        return c.html(toHTML(response));

      case 'jsonld':
        const jsonld = toJSONLD(response);
        return c.json(JSON.parse(jsonld), 200, { 'Content-Type': 'application/ld+json' });

      case 'json':
      default:
        return c.json(response);
    }
  }
);

// ============================================================================
// User Preferences Endpoints (V2)
// ============================================================================

/**
 * GET /preferences/:userId - Retrieve user accessibility preferences
 *
 * Returns cached preferences or 404 if not found.
 */
app.get('/preferences/:userId', async (c) => {
  const userId = c.req.param('userId');

  if (!userId || userId.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: 'userId is required and cannot be empty',
      },
      400
    );
  }

  logger.info('Get preferences request', { userId });

  const preferences = await getUserPreferences(userId, c.env);

  if (!preferences) {
    return c.json(
      {
        success: false,
        error: 'No preferences found for this user',
      },
      404
    );
  }

  return c.json({
    success: true,
    preferences,
  });
});

/**
 * PUT /preferences/:userId - Store user accessibility preferences
 *
 * Validates and stores preferences with 30-day TTL.
 */
app.put(
  '/preferences/:userId',
  zValidator('json', AccessibilityPreferencesSchemaV2, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error.message,
          details: result.error.errors,
        },
        400
      );
    }
    return undefined;
  }),
  async (c) => {
    const userId = c.req.param('userId');
    const preferences = c.req.valid('json');

    if (!userId || userId.trim().length === 0) {
      return c.json(
        {
          success: false,
          error: 'userId is required and cannot be empty',
        },
        400
      );
    }

    logger.info('Set preferences request', { userId, preferences });

    try {
      await setUserPreferences(userId, preferences, c.env);

      return c.json({
        success: true,
        preferences,
      });
    } catch (error) {
      logger.error('Failed to set preferences', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to store preferences',
        },
        500
      );
    }
  }
);

/**
 * DELETE /preferences/:userId - Delete user accessibility preferences
 *
 * Removes preferences from cache. Returns success even if not found.
 */
app.delete('/preferences/:userId', async (c) => {
  const userId = c.req.param('userId');

  if (!userId || userId.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: 'userId is required and cannot be empty',
      },
      400
    );
  }

  logger.info('Delete preferences request', { userId });

  const deleted = await deleteUserPreferences(userId, c.env);

  return c.json({
    success: true,
    deleted,
  });
});

// ============================================================================
// Export
// ============================================================================

export default app;
