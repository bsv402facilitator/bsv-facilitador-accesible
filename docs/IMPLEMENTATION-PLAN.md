# Plan: Implementar X402 Accessibility Extension Completa

## Objetivo

Implementar soporte completo para preferencias de accesibilidad en los 3 componentes del sistema X402 según la especificación creada.

## Estado Actual - Análisis Completo

### ✅ Lo que YA funciona
1. **Facilitador**: Infraestructura de accesibilidad 50% lista
   - ✅ Tipos `AccessibleResponse<T>` y `AccessibleMetadata` definidos
   - ✅ Función `createAccessibleResponse()` funcional
   - ✅ Mensajes en español completos
   - ✅ Metadata se propaga correctamente al cliente

2. **Resource Server**: Propagación de metadata 100% funcional
   - ✅ Extrae y propaga `accessibility` del facilitador al cliente
   - ✅ CORS configurado correctamente

3. **MCP Wallet**: Estructura básica lista
   - ✅ Tool `create_x402_payment` funcional
   - ✅ Función `createPaymentPayload()` genera payloads correctos

### ❌ Lo que FALTA implementar

#### Facilitador (2-3 horas)
- ❌ No acepta `accessibilityPreferences` en requests
- ❌ Usa valores hardcodeados (siempre 'simple', siempre español)
- ❌ No soporta múltiples idiomas (solo español)
- ❌ Schemas `VerifyRequest` y `SettleRequest` sin campo preferences

#### Resource Server (1-2 horas)
- ❌ No extrae preferences del payload X402
- ❌ No extrae preferences de headers HTTP
- ❌ No pasa preferences al facilitador

#### MCP Wallet (1-2 horas)
- ❌ No acepta parámetros de accesibilidad del usuario
- ❌ Tipo `X402PaymentPayload` sin campo `accessibility`
- ❌ Función `createPaymentPayload()` no recibe preferences

---

## Plan de Implementación

### Fase 1: Facilitador (PRIMERO - base del sistema)

#### 1.1 Actualizar tipos en `src/facilitator/types.ts`

**Agregar nuevo schema:**
```typescript
export const AccessibilityPreferencesSchema = z.object({
  language: z.enum(['es', 'en']).optional().default('es'),
  cognitiveLevel: z.enum(['simple', 'medium', 'advanced']).optional().default('simple'),
  audioFriendly: z.boolean().optional().default(true),
});

export type AccessibilityPreferences = z.infer<typeof AccessibilityPreferencesSchema>;
```

**Actualizar schemas existentes:**
```typescript
// Cambiar en AccessibleMetadataSchema (línea ~168)
language: z.enum(['es', 'en']),  // Era: z.literal('es')

// Actualizar VerifyRequestSchema (línea ~75)
export const VerifyRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchema.optional(),
});

// Actualizar SettleRequestSchema (línea ~105)
export const SettleRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
  accessibilityPreferences: AccessibilityPreferencesSchema.optional(),
});
```

#### 1.2 Agregar mensajes en inglés en `src/facilitator/accessibility/i18n.ts`

**Crear estructura de mensajes duplicada:**
```typescript
// Después de los mensajes en español
const messagesEN = {
  success: {
    verifyValid: {
      plainLanguage: 'Payment verified successfully',
      explanation: 'Your transaction is valid...',
      // ... todos los campos traducidos
    },
    // ... resto de mensajes
  },
  errors: {
    // ... todos los errores en inglés
  }
};

// Función helper
export function getMessagesByLanguage(lang: 'es' | 'en') {
  return lang === 'en' ? messagesEN : messages;
}
```

#### 1.3 Actualizar endpoints en `src/facilitator/index.ts`

**En `/verify` endpoint (línea ~93):**
```typescript
const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

// Usar preferences en metadata (reemplazar ~30 líneas)
const msgs = getMessagesByLanguage(accessibilityPreferences?.language ?? 'es');
metadata = createMetadataFromTemplate(
  msgs.success.verifyValid,
  { amount, address },
  accessibilityPreferences?.cognitiveLevel ?? 'simple',
  accessibilityPreferences?.audioFriendly ?? true
);
```

**En `/settle` endpoint (línea ~187):**
```typescript
const { payload, paymentRequirements, accessibilityPreferences } = requestBody;

// Idem: usar accessibilityPreferences en todas las llamadas
```

---

### Fase 2: Resource Server (SEGUNDO - intermediario)

#### 2.1 Actualizar CORS en `src/resource-server/index.ts`

```typescript
// Línea 37
allowHeaders: [
  'Content-Type',
  'X-PAYMENT',
  'X-Accessibility-Language',
  'X-Accessibility-Level',
  'X-Accessibility-Format'
],
```

#### 2.2 Actualizar funciones verifyPayment y settlePayment

**Agregar parámetro preferences:**
```typescript
async function verifyPayment(
  facilitatorUrl: string,
  payload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
  accessibilityPreferences?: any,  // NUEVO
  facilitatorBinding?: Fetcher
): Promise<{ data: VerifyResponse; accessibility?: any }>

// En el body del request:
const verifyRequest: VerifyRequest = {
  payload,
  paymentRequirements,
  ...(accessibilityPreferences && { accessibilityPreferences }),
};
```

**Repetir para settlePayment (similar).**

#### 2.3 Extraer preferences en endpoint `/api/data`

**Opción A - Desde payload (recomendado):**
```typescript
// Línea ~241
const payload = parsePaymentHeader(paymentHeader);
const accessibilityPreferences = payload?.accessibility || null;
```

**Opción B - Desde headers (alternativa):**
```typescript
// Línea ~220
const accessibilityPreferences = {
  language: c.req.header('X-Accessibility-Language'),
  cognitiveLevel: c.req.header('X-Accessibility-Level'),
  format: c.req.header('X-Accessibility-Format'),
};
```

#### 2.4 Pasar preferences a funciones

```typescript
// Línea ~274
const verifyResult = await verifyPayment(
  facilitatorUrl,
  payload,
  paymentRequirements,
  accessibilityPreferences,  // AGREGAR
  c.env.FACILITATOR
);

// Línea ~294
const settleResult = await settlePayment(
  facilitatorUrl,
  payload,
  paymentRequirements,
  accessibilityPreferences,  // AGREGAR
  c.env.FACILITATOR
);
```

---

### Fase 3: MCP Wallet (TERCERO - cliente)

#### 3.1 Actualizar tipos en `src/types/index.ts`

**Agregar interfaz AccessibilityPreferences:**
```typescript
export interface AccessibilityPreferences {
  language?: 'es' | 'en';
  cognitiveLevel?: 'simple' | 'intermediate' | 'advanced';
  format?: 'text' | 'audio-friendly';
}
```

**Actualizar X402PaymentPayload:**
```typescript
export interface X402PaymentPayload {
  x402Version: number;
  scheme: 'exact';
  network: 'bsv-mainnet' | 'bsv-testnet';
  payload: {
    transaction: string;
  };
  accessibility?: AccessibilityPreferences;  // NUEVO
}
```

#### 3.2 Actualizar `createPaymentPayload()` en `src/x402/payment-creator.ts`

**Firma:**
```typescript
export function createPaymentPayload(
  tx: Transaction,
  network: Network,
  accessibility?: AccessibilityPreferences  // NUEVO
): string
```

**Body:**
```typescript
const paymentPayload: X402PaymentPayload = {
  x402Version: 1,
  scheme: 'exact',
  network: network === 'testnet' ? 'bsv-testnet' : 'bsv-mainnet',
  payload: {
    transaction: txHex,  // Nota: ya está en HEX, no BASE64
  },
  ...(accessibility && { accessibility }),  // AGREGAR
};
```

#### 3.3 Actualizar tool en `src/server.ts`

**Agregar parámetros al inputSchema:**
```typescript
language: {
  type: 'string',
  enum: ['es', 'en'],
  description: 'Idioma preferido para respuestas de accesibilidad',
},
cognitiveLevel: {
  type: 'string',
  enum: ['simple', 'intermediate', 'advanced'],
  description: 'Nivel de complejidad de las explicaciones',
},
format: {
  type: 'string',
  enum: ['text', 'audio-friendly'],
  description: 'Formato optimizado para output',
},
```

#### 3.4 Actualizar handler en `src/tools/create-x402-payment.ts`

**Extraer preferences y pasar a createPaymentPayload:**
```typescript
const { language, cognitiveLevel, format } = params;

const accessibility: AccessibilityPreferences | undefined =
  (language || cognitiveLevel || format) ? {
    language,
    cognitiveLevel,
    format,
  } : undefined;

const paymentPayload = createPaymentPayload(tx, network, accessibility);
```

---

## Orden de Ejecución Recomendado

1. **Facilitador** (2-3 horas)
   - types.ts → i18n.ts → index.ts
   - Testing después de cada archivo

2. **Resource Server** (1-2 horas)
   - index.ts (todas las modificaciones juntas)
   - Deploy y testing

3. **MCP Wallet** (1-2 horas)
   - types/index.ts → payment-creator.ts → server.ts → tool handler
   - Rebuild y testing

**Tiempo total estimado**: 4-7 horas

---

## Archivos Críticos a Modificar

### Facilitador
- ✏️ `src/facilitator/types.ts` (agregar schemas)
- ✏️ `src/facilitator/accessibility/i18n.ts` (mensajes EN)
- ✏️ `src/facilitator/index.ts` (usar preferences)

### Resource Server
- ✏️ `src/resource-server/index.ts` (6 cambios)

### MCP Wallet
- ✏️ `src/types/index.ts` (agregar interfaz)
- ✏️ `src/x402/payment-creator.ts` (aceptar preferences)
- ✏️ `src/server.ts` (parámetros tool)
- ✏️ `src/tools/create-x402-payment.ts` (extraer y pasar)

---

## Testing Plan

### 1. Test Facilitador
```bash
# POST /verify con preferences
curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {...},
    "paymentRequirements": {...},
    "accessibilityPreferences": {
      "language": "en",
      "cognitiveLevel": "advanced"
    }
  }'

# Verificar que responde en inglés con nivel advanced
```

### 2. Test Resource Server
```bash
# Crear payload con MCP wallet (con preferences)
# Hacer request con X-PAYMENT
curl -H "X-PAYMENT: <payload-con-preferences>" \
  https://x402-resource-server-accesible-prod.andresleontest.workers.dev/api/data

# Verificar que accessibility en respuesta respeta preferences
```

### 3. Test MCP Wallet
```typescript
// Desde Claude Desktop
create_x402_payment({
  walletId: "test1",
  payTo: "mhSDV8SP...",
  amount: 1000,
  network: "testnet",
  language: "en",
  cognitiveLevel: "advanced"
})

// Verificar que payload incluye campo accessibility
```

---

## Deployment Strategy

1. **Deploy Facilitador primero**
   - `npm run deploy` desde facilitador
   - Verificar con curl que acepta preferences

2. **Deploy Resource Server**
   - `npm run deploy:resource`
   - Testing end-to-end

3. **Rebuild MCP Wallet**
   - `npm run build` en mcp-wallet
   - Reiniciar Claude Desktop
   - Testing con usuario real

---

## Rollback Plan

Si algo falla:
1. Revertir deploy con `wrangler rollback`
2. Los cambios son backward compatible (preferences opcionales)
3. Clientes sin preferences seguirán funcionando con defaults
