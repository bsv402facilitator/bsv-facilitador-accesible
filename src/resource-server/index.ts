import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type {
  PaymentRequirements,
  PaymentPayload,
  VerifyRequest,
  VerifyResponse,
  SettleRequest,
  SettleResponse,
} from '../types';

/**
 * Resource Server Demo - X402 Payment Flow con Accesibilidad Universal
 *
 * Este es un servidor de recursos demo que implementa el flujo completo de pago X402.
 * Protege un endpoint GET /api/data y requiere pago BSV testnet para acceder.
 *
 * Usa el facilitador accesible que proporciona mensajes en español claro y
 * metadatos accesibles para usuarios con discapacidades.
 */

// Environment bindings para Cloudflare Workers
type Bindings = {
  FACILITATOR_URL?: string; // URL del servicio facilitador
  PAYOUT_ADDRESS?: string; // Dirección BSV para recibir pagos
  NETWORK?: 'mainnet' | 'testnet'; // Red BSV (mainnet por defecto en producción)
  FACILITATOR?: Fetcher; // Service binding al facilitador (producción)
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware - permite todos los orígenes para propósitos de demo
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'X-PAYMENT',
      'X-Accessibility-Language',
      'X-Accessibility-Level',
      'X-Accessibility-Format',
    ],
  })
);

/**
 * Generar requisitos de pago para una solicitud de recurso
 *
 * @param resourceUrl - URL completa del recurso protegido
 * @param payToAddress - Dirección BSV para recibir el pago
 * @param amountSatoshis - Cantidad requerida en satoshis (como string)
 * @param description - Descripción opcional para el pago
 * @param network - Red BSV (por defecto mainnet)
 * @returns Objeto PaymentRequirements conforme a la especificación X402
 */
function generatePaymentRequirements(
  resourceUrl: string,
  payToAddress: string,
  amountSatoshis: string = '1000',
  description?: string,
  network: 'bsv-mainnet' | 'bsv-testnet' = 'bsv-mainnet'
): PaymentRequirements {
  return {
    scheme: 'exact',
    network,
    maxAmountRequired: amountSatoshis,
    resource: resourceUrl,
    description: description || `Pago requerido para acceder a ${resourceUrl}`,
    payTo: payToAddress,
    maxTimeoutSeconds: 300, // 5 minutos
  };
}

/**
 * Parsear el header X-PAYMENT desde JSON codificado en base64
 *
 * @param headerValue - PaymentPayload codificado en base64
 * @returns PaymentPayload parseado o null si es inválido
 */
function parsePaymentHeader(headerValue: string | undefined): PaymentPayload | null {
  if (!headerValue) {
    return null;
  }

  try {
    // Decodificar base64 a string JSON
    const jsonString = atob(headerValue);
    const payload = JSON.parse(jsonString) as PaymentPayload;

    // Validación básica - acepta tanto mainnet como testnet
    if (
      payload.x402Version === 1 &&
      payload.scheme === 'exact' &&
      (payload.network === 'bsv-mainnet' || payload.network === 'bsv-testnet') &&
      payload.payload?.transaction
    ) {
      return payload;
    }

    return null;
  } catch (error) {
    console.error('Error al parsear header X-PAYMENT:', error);
    return null;
  }
}

/**
 * Llamar al endpoint /verify del facilitador para validar el pago
 *
 * @param facilitatorUrl - URL base del servicio facilitador
 * @param payload - PaymentPayload del header X-PAYMENT
 * @param paymentRequirements - PaymentRequirements para este recurso
 * @param accessibilityPreferences - Preferencias de accesibilidad del usuario
 * @param facilitatorBinding - Service binding opcional al facilitador
 * @returns VerifyResponse del facilitador
 */
async function verifyPayment(
  facilitatorUrl: string,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  accessibilityPreferences?: any,
  facilitatorBinding?: Fetcher
): Promise<{ data: VerifyResponse; accessibility?: any }> {
  const verifyRequest: VerifyRequest = {
    payload,
    paymentRequirements,
    ...(accessibilityPreferences && { accessibilityPreferences }),
  };

  // Usar service binding si está disponible (producción), sino usar HTTP fetch (desarrollo local)
  const response = facilitatorBinding
    ? await facilitatorBinding.fetch('http://facilitator/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyRequest),
      })
    : await fetch(`${facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyRequest),
      });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verificación del facilitador falló: ${response.status} ${errorText}`);
  }

  const result = await response.json() as any;
  // El facilitador retorna AccessibleResponse<VerifyResponse>
  // Retornar tanto 'data' como 'accessibility'
  return {
    data: result.data as VerifyResponse,
    accessibility: result.accessibility
  };
}

/**
 * Llamar al endpoint /settle del facilitador para transmitir el pago a la blockchain
 *
 * @param facilitatorUrl - URL base del servicio facilitador
 * @param payload - PaymentPayload del header X-PAYMENT
 * @param paymentRequirements - PaymentRequirements para este recurso
 * @param accessibilityPreferences - Preferencias de accesibilidad del usuario
 * @param facilitatorBinding - Service binding opcional al facilitador
 * @returns SettleResponse del facilitador
 */
async function settlePayment(
  facilitatorUrl: string,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  accessibilityPreferences?: any,
  facilitatorBinding?: Fetcher
): Promise<{ data: SettleResponse; accessibility?: any }> {
  const settleRequest: SettleRequest = {
    payload,
    paymentRequirements,
    ...(accessibilityPreferences && { accessibilityPreferences }),
  };

  // Usar service binding si está disponible (producción), sino usar HTTP fetch (desarrollo local)
  const response = facilitatorBinding
    ? await facilitatorBinding.fetch('http://facilitator/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settleRequest),
      })
    : await fetch(`${facilitatorUrl}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settleRequest),
      });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Liquidación del facilitador falló: ${response.status} ${errorText}`);
  }

  const result = await response.json() as any;
  // El facilitador retorna AccessibleResponse<SettleResponse>
  // Retornar tanto 'data' como 'accessibility'
  return {
    data: result.data as SettleResponse,
    accessibility: result.accessibility
  };
}

// Endpoint de health check
app.get('/', (c) => {
  return c.json({
    service: 'X402 Resource Server Demo - Accesible',
    version: '1.0.0',
    endpoints: ['/api/data'],
    description: 'Servidor de recursos con facilitador X402 accesible en español',
  });
});

/**
 * Endpoint de recurso protegido - requiere pago X402
 *
 * Flujo:
 * 1. Sin header X-PAYMENT → Retornar 402 con PaymentRequirements
 * 2. X-PAYMENT presente → Parsear, verificar, liquidar, retornar datos
 * 3. Pago inválido → Retornar 402 con razón
 */
app.get('/api/data', async (c) => {
  const facilitatorUrl = c.env.FACILITATOR_URL || 'http://localhost:8787';
  const payoutAddress = c.env.PAYOUT_ADDRESS || 'mnLd5sVxHETdJqZJ6m3FepXGYPG8Z1WDWV'; // Dirección testnet por defecto para desarrollo
  const network = c.env.NETWORK === 'testnet' ? 'bsv-testnet' : 'bsv-mainnet'; // Mainnet por defecto

  // Obtener header X-PAYMENT
  const paymentHeader = c.req.header('X-PAYMENT');

  // Sin pago proporcionado - retornar 402 con requisitos
  if (!paymentHeader) {
    const resourceUrl = new URL(c.req.url).toString();
    const requirements = generatePaymentRequirements(
      resourceUrl,
      payoutAddress,
      '1000',
      'Acceso al endpoint de datos protegidos',
      network
    );

    return c.json(requirements, 402);
  }

  // Parsear payload de pago
  const payload = parsePaymentHeader(paymentHeader);
  if (!payload) {
    const resourceUrl = new URL(c.req.url).toString();
    const requirements = generatePaymentRequirements(
      resourceUrl,
      payoutAddress,
      '1000',
      'Acceso al endpoint de datos protegidos',
      network
    );

    return c.json(
      {
        ...requirements,
        error: 'Formato del header X-PAYMENT inválido',
      },
      402
    );
  }

  // Extraer preferencias de accesibilidad desde el payload o headers
  const accessibilityPreferences = (payload as any).accessibility || {
    language: c.req.header('X-Accessibility-Language') as 'es' | 'en' | undefined,
    cognitiveLevel: c.req.header('X-Accessibility-Level') as 'simple' | 'medium' | 'advanced' | undefined,
    audioFriendly: c.req.header('X-Accessibility-Format') !== 'text',
  };

  // Generar requisitos de pago para verificación
  const resourceUrl = new URL(c.req.url).toString();
  const paymentRequirements = generatePaymentRequirements(
    resourceUrl,
    payoutAddress,
    '1000',
    'Acceso al endpoint de datos protegidos',
    network
  );

  try {
    console.log('URL del facilitador:', facilitatorUrl);
    console.log('Tiene service binding:', !!c.env.FACILITATOR);
    console.log('Preferencias de accesibilidad:', accessibilityPreferences);

    // Paso 1: Verificar pago
    const verifyResult = await verifyPayment(
      facilitatorUrl,
      payload,
      paymentRequirements,
      accessibilityPreferences,
      c.env.FACILITATOR
    );

    if (!verifyResult.data.isValid) {
      return c.json(
        {
          ...paymentRequirements,
          error: `La verificación del pago falló: ${verifyResult.data.invalidReason}`,
          // Incluir metadata accesible del facilitador si está disponible
          ...(verifyResult.accessibility && { accessibility: verifyResult.accessibility }),
        },
        402
      );
    }

    // Paso 2: Liquidar pago (transmitir a blockchain)
    const settleResult = await settlePayment(
      facilitatorUrl,
      payload,
      paymentRequirements,
      accessibilityPreferences,
      c.env.FACILITATOR
    );

    if (!settleResult.data.success) {
      return c.json(
        {
          ...paymentRequirements,
          error: `La liquidación del pago falló: ${settleResult.data.errorReason}`,
          // Incluir metadata accesible del facilitador si está disponible
          ...(settleResult.accessibility && { accessibility: settleResult.accessibility }),
        },
        402
      );
    }

    // Pago exitoso - retornar datos protegidos
    return c.json({
      message: '¡Pago exitoso! Aquí están tus datos protegidos.',
      data: {
        timestamp: new Date().toISOString(),
        content: 'Este es contenido protegido accesible solo con pago BSV válido',
        funFact: '¡Bitcoin SV puede manejar más de 50,000 transacciones por segundo!',
      },
      payment: {
        txid: settleResult.data.transaction,
        payer: settleResult.data.payer,
        network: settleResult.data.network,
        amount: paymentRequirements.maxAmountRequired,
      },
      // Incluir metadata accesible del facilitador para transparencia
      ...(settleResult.accessibility && { accessibility: settleResult.accessibility }),
    });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    return c.json(
      {
        ...paymentRequirements,
        error: 'Error al procesar el pago. Por favor, intenta de nuevo.',
      },
      500
    );
  }
});

// Manejo de errores
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Error interno del servidor' }, 500);
});

export default app;
