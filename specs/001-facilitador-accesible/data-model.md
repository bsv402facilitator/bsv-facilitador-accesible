# Data Model: Facilitador X402 BSV con Accesibilidad Universal

**Feature Branch**: `001-facilitador-accesible`
**Date**: 2025-11-27
**Status**: Complete

## Overview

Este documento define el modelo de datos completo del facilitador X402 BSV con accesibilidad universal. Todas las entidades están validadas mediante schemas Zod con mensajes customizados en español claro, siguiendo las mejores prácticas de type-safety en TypeScript y accesibilidad WCAG 2.1 Level AA.

El modelo se divide en tres categorías principales:
1. **Entidades Core de X402**: PaymentRequirements, PaymentPayload (definidas por el protocolo X402)
2. **Entidades de Request/Response**: VerifyRequest, VerifyResponse, SettleRequest, SettleResponse, SupportedNetworksResponse
3. **Entidades de Accesibilidad**: AccessibleMetadata, AccessibleResponse<T>, Hints (extensiones propias del facilitador)

Todas las entidades incluyen:
- Zod schema para validación runtime con mensajes en español
- TypeScript type inferido del schema para type-safety en compilación
- Ejemplos JSON realistas
- Documentación de relaciones con otras entidades

---

## Core Entities

### PaymentRequirements

**Purpose**: Define los requisitos de pago que el servidor de recursos solicita. Esta entidad es enviada por el servidor protegido al cliente para indicar cuánto debe pagar, a qué dirección, y en qué red blockchain.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| scheme | `"exact"` | Yes | Esquema de pago. Solo "exact" soportado en MVP | Literal "exact" |
| network | `"bsv-testnet"` | Yes | Red blockchain. Solo testnet en MVP | Literal "bsv-testnet" |
| maxAmountRequired | `string` | Yes | Monto máximo en satoshis como string numérico | Regex `/^\d+$/` (solo dígitos) |
| resource | `string` | Yes | URL del recurso protegido | Formato URL válido |
| description | `string` | No | Descripción opcional del recurso | String opcional |
| payTo | `string` | Yes | Dirección BSV destino del pago | String 25-35 caracteres |
| maxTimeoutSeconds | `number` | Yes | Tiempo límite para completar el pago | Número positivo |

**Zod Schema**:
```typescript
import { z } from 'zod';

export const PaymentRequirementsSchema = z.object({
  scheme: z.literal('exact'),
  network: z.literal('bsv-testnet'),
  maxAmountRequired: z.string().regex(/^\d+$/, 'Must be numeric string (satoshis)'),
  resource: z.string().url(),
  description: z.string().optional(),
  payTo: z.string().min(25).max(35), // BSV address length
  maxTimeoutSeconds: z.number().positive(),
});
```

**TypeScript Type**:
```typescript
export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;
```

**Example**:
```json
{
  "scheme": "exact",
  "network": "bsv-testnet",
  "maxAmountRequired": "500",
  "resource": "https://api.example.com/protected-resource",
  "description": "Acceso premium a API de datos",
  "payTo": "mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf",
  "maxTimeoutSeconds": 300
}
```

**Relationships**:
- Usado en `VerifyRequest.paymentRequirements` para validar transacciones
- Usado en `SettleRequest.paymentRequirements` para contextualizar el broadcast
- Referenciado en metadata accesible para explicar requisitos al usuario

---

### PaymentPayload

**Purpose**: Representa la transacción BSV firmada enviada por el cliente. Contiene la transacción serializada en formato hexadecimal y metadata del protocolo X402.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| x402Version | `1` | Yes | Versión del protocolo X402 | Literal 1 |
| scheme | `"exact"` | Yes | Esquema de pago (debe coincidir con requirements) | Literal "exact" |
| network | `"bsv-testnet"` | Yes | Red blockchain (debe coincidir con requirements) | Literal "bsv-testnet" |
| payload.transaction | `string` | Yes | Transacción BSV firmada en formato hexadecimal | String no vacío |

**Zod Schema**:
```typescript
export const PaymentPayloadSchema = z.object({
  x402Version: z.literal(1),
  scheme: z.literal('exact'),
  network: z.literal('bsv-testnet'),
  payload: z.object({
    transaction: z.string().min(1, 'Transaction is required'),
  }),
});
```

**TypeScript Type**:
```typescript
export type PaymentPayload = z.infer<typeof PaymentPayloadSchema>;
```

**Example**:
```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "bsv-testnet",
  "payload": {
    "transaction": "0100000001a6b97044316c6f7e31894e0f2a2e7e3e3e9e7e3e9e7e3e9e7e3e9e7e3e9e01000000484730440220..."
  }
}
```

**Relationships**:
- Usado en `VerifyRequest.payload` para enviar transacción a validar
- Usado en `SettleRequest.payload` para enviar transacción a broadcastear
- Parseado por funciones de verify y settle para extraer outputs y validar estructura

---

### VerifyRequest

**Purpose**: Request enviado al endpoint POST `/verify` para validar que una transacción cumple con los requisitos de pago sin broadcastear a blockchain.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| payload | `PaymentPayload` | Yes | Transacción BSV firmada | Schema PaymentPayloadSchema |
| paymentRequirements | `PaymentRequirements` | Yes | Requisitos de pago a validar | Schema PaymentRequirementsSchema |

**Zod Schema**:
```typescript
export const VerifyRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
});
```

**TypeScript Type**:
```typescript
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
```

**Example**:
```json
{
  "payload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "bsv-testnet",
    "payload": {
      "transaction": "0100000001a6b97044316c6f7e31894e0f2a2e7e3e3e9e7e3e9e7e3e9e7e3e9e7e3e9e01000000484730440220..."
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "bsv-testnet",
    "maxAmountRequired": "500",
    "resource": "https://api.example.com/protected-resource",
    "payTo": "mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf",
    "maxTimeoutSeconds": 300
  }
}
```

**Relationships**:
- Procesado por endpoint POST `/verify`
- Genera `VerifyResponse` como output
- Valida que `payload.network` coincida con `paymentRequirements.network`
- Valida que `payload.scheme` coincida con `paymentRequirements.scheme`

---

### VerifyResponse

**Purpose**: Response del endpoint POST `/verify` indicando si la transacción es válida y cumple con los requisitos de pago, incluyendo metadata accesible.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| isValid | `boolean` | Yes | Indica si la transacción es válida | Boolean |
| invalidReason | `string` | No | Código de error si isValid=false | String opcional (ver VerifyErrorCodes) |
| payer | `string` | No | Dirección BSV del pagador (extraída de tx) | String opcional |

**Zod Schema**:
```typescript
export const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  invalidReason: z.string().optional(),
  payer: z.string().optional(),
});
```

**TypeScript Type**:
```typescript
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
```

**Example (Success)**:
```json
{
  "isValid": true,
  "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk"
}
```

**Example (Failure - Invalid Amount)**:
```json
{
  "isValid": false,
  "invalidReason": "invalid_amount",
  "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk"
}
```

**Relationships**:
- Retornado por endpoint POST `/verify`
- Envuelto en `AccessibleResponse<VerifyResponse>` para incluir metadata accesible
- `invalidReason` mapea a error codes de `VerifyErrorCodes`
- Usado por clientes LLM para decidir si proceder con `/settle`

---

### SettleRequest

**Purpose**: Request enviado al endpoint POST `/settle` para broadcastear una transacción válida a la blockchain BSV.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| payload | `PaymentPayload` | Yes | Transacción BSV firmada | Schema PaymentPayloadSchema |
| paymentRequirements | `PaymentRequirements` | Yes | Requisitos de pago (para contexto) | Schema PaymentRequirementsSchema |

**Zod Schema**:
```typescript
export const SettleRequestSchema = z.object({
  payload: PaymentPayloadSchema,
  paymentRequirements: PaymentRequirementsSchema,
});
```

**TypeScript Type**:
```typescript
export type SettleRequest = z.infer<typeof SettleRequestSchema>;
```

**Example**:
```json
{
  "payload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "bsv-testnet",
    "payload": {
      "transaction": "0100000001a6b97044316c6f7e31894e0f2a2e7e3e3e9e7e3e9e7e3e9e7e3e9e7e3e9e01000000484730440220..."
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "bsv-testnet",
    "maxAmountRequired": "500",
    "resource": "https://api.example.com/protected-resource",
    "payTo": "mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf",
    "maxTimeoutSeconds": 300
  }
}
```

**Relationships**:
- Procesado por endpoint POST `/settle`
- Genera `SettleResponse` como output
- Típicamente enviado después de recibir `VerifyResponse` con `isValid: true`
- Desencadena broadcast a blockchain vía WhatsOnChain API

---

### SettleResponse

**Purpose**: Response del endpoint POST `/settle` indicando si el broadcast fue exitoso, incluyendo el txid en blockchain y metadata accesible.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| success | `boolean` | Yes | Indica si el broadcast fue exitoso | Boolean |
| errorReason | `string` | No | Código de error si success=false | String opcional (ver SettleErrorCodes) |
| transaction | `string` | No | TXID en blockchain (si success=true) | String opcional |
| payer | `string` | No | Dirección BSV del pagador | String opcional |
| network | `"bsv-testnet"` | Yes | Red donde se broadcasted la tx | Literal "bsv-testnet" |

**Zod Schema**:
```typescript
export const SettleResponseSchema = z.object({
  success: z.boolean(),
  errorReason: z.string().optional(),
  transaction: z.string().optional(),
  payer: z.string().optional(),
  network: z.literal('bsv-testnet'),
});
```

**TypeScript Type**:
```typescript
export type SettleResponse = z.infer<typeof SettleResponseSchema>;
```

**Example (Success)**:
```json
{
  "success": true,
  "transaction": "8f3e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8",
  "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk",
  "network": "bsv-testnet"
}
```

**Example (Failure - Already Broadcast)**:
```json
{
  "success": false,
  "errorReason": "already_broadcast",
  "transaction": "8f3e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8",
  "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk",
  "network": "bsv-testnet"
}
```

**Relationships**:
- Retornado por endpoint POST `/settle`
- Envuelto en `AccessibleResponse<SettleResponse>` para incluir metadata accesible
- `errorReason` mapea a error codes de `SettleErrorCodes`
- `transaction` (txid) puede usarse para consultar estado en blockchain explorers

---

### SupportedNetworksResponse

**Purpose**: Response del endpoint GET `/` indicando qué redes blockchain soporta el facilitador.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| networks | `string[]` | Yes | Array de redes soportadas | Array de strings |

**Zod Schema**:
```typescript
export const SupportedNetworksResponseSchema = z.object({
  networks: z.array(z.string()),
});
```

**TypeScript Type**:
```typescript
export type SupportedNetworksResponse = z.infer<typeof SupportedNetworksResponseSchema>;
```

**Example**:
```json
{
  "networks": ["bsv-testnet"]
}
```

**Relationships**:
- Retornado por endpoint GET `/` (health check)
- Envuelto en `AccessibleResponse<SupportedNetworksResponse>` para incluir metadata accesible
- Usado por clientes para verificar compatibilidad antes de enviar pagos

---

## Accessibility Entities

### AccessibleMetadata

**Purpose**: Metadata de accesibilidad universal adjunta a todos los responses del facilitador. Permite a clientes LLM interpretar resultados y explicarlos a usuarios con discapacidades cognitivas o visuales en lenguaje claro sin jerga técnica.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| plainLanguage | `string` | Yes | Mensaje conciso ejecutivo (max 100 chars) | String ≤100 caracteres |
| explanation | `string` | Yes | Descripción detallada (max 300 chars) | String ≤300 caracteres |
| stepByStep | `string[]` | Yes | Pasos en orden (max 5 items de 80 chars) | Array ≤5 items, cada item ≤80 chars |
| hints | `Hints` | Yes | Sugerencias para resolución de errores | Schema HintsSchema |
| language | `"es"` | Yes | Idioma de los mensajes (siempre español en MVP) | Literal "es" |
| audioFriendly | `boolean` | Yes | Si es compatible con TTS (text-to-speech) | Boolean (true para mensajes importantes) |
| cognitiveLevel | `"simple" \| "medium" \| "advanced"` | Yes | Nivel de complejidad cognitiva del mensaje | Union "simple" \| "medium" \| "advanced" |

**Zod Schema**:
```typescript
export const AccessibleMetadataSchema = z.object({
  plainLanguage: z.string().max(100, 'Plain language must be ≤100 characters'),
  explanation: z.string().max(300, 'Explanation must be ≤300 characters'),
  stepByStep: z.array(
    z.string().max(80, 'Each step must be ≤80 characters')
  ).max(5, 'Maximum 5 steps allowed'),
  hints: HintsSchema,
  language: z.literal('es'),
  audioFriendly: z.boolean(),
  cognitiveLevel: z.enum(['simple', 'medium', 'advanced']),
});
```

**TypeScript Type**:
```typescript
export type AccessibleMetadata = z.infer<typeof AccessibleMetadataSchema>;
```

**Example (Success - Simple)**:
```json
{
  "plainLanguage": "El pago se verificó correctamente",
  "explanation": "Tu transacción cumple con todos los requisitos: monto de 500 satoshis enviados a mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf",
  "stepByStep": [
    "Recibimos tu transacción",
    "Validamos el monto y la dirección de destino",
    "La transacción está lista para ser procesada",
    "Puedes proceder con el paso de settlement"
  ],
  "hints": {
    "nextSteps": "Llama al endpoint /settle para completar el pago"
  },
  "language": "es",
  "audioFriendly": true,
  "cognitiveLevel": "simple"
}
```

**Example (Error - Medium)**:
```json
{
  "plainLanguage": "No pudimos conectar con la red BSV",
  "explanation": "El servicio de blockchain BSV no respondió a tiempo. Esto es temporal y no has perdido fondos. Tu transacción es válida.",
  "stepByStep": [
    "Detectamos un problema de conexión con la red BSV",
    "Intentamos 3 veces sin éxito",
    "El problema es temporal, no es tu transacción",
    "Espera unos segundos y vuelve a intentar"
  ],
  "hints": {
    "ifError": "Reintenta en 10-30 segundos. La red BSV suele responder rápido",
    "commonMistakes": [
      "Intentar cambiar la transacción (no es necesario, la transacción es válida)"
    ],
    "nextSteps": "Si el error persiste después de 5 intentos, contacta soporte"
  },
  "language": "es",
  "audioFriendly": true,
  "cognitiveLevel": "medium"
}
```

**Relationships**:
- Incluido en todos los `AccessibleResponse<T>`
- Construido por helpers en `src/facilitator/accessibility/metadata.ts`
- Mensajes fuente en `src/facilitator/accessibility/i18n.ts`
- Contiene subcampo `hints` de tipo `Hints`

**Validation Rules**:
- `plainLanguage`: Máximo 100 caracteres para ser conciso y scannable
- `explanation`: Máximo 300 caracteres (aproximadamente 2-3 oraciones)
- `stepByStep`: Máximo 5 items para evitar abrumar al usuario
- Cada item de `stepByStep`: Máximo 80 caracteres por legibilidad
- `cognitiveLevel`: "simple" para éxitos y errores básicos, "medium" para errores de red/troubleshooting, "advanced" reservado para futuro

---

### Hints

**Purpose**: Subcampo de `AccessibleMetadata` que proporciona sugerencias accionables para resolver errores y evitar errores comunes.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| ifError | `string` | No | Cómo resolver el error actual | String opcional |
| commonMistakes | `string[]` | No | Errores frecuentes a evitar | Array de strings opcional |
| nextSteps | `string` | No | Qué hacer después (siguiente acción) | String opcional |

**Zod Schema**:
```typescript
export const HintsSchema = z.object({
  ifError: z.string().optional(),
  commonMistakes: z.array(z.string()).optional(),
  nextSteps: z.string().optional(),
});
```

**TypeScript Type**:
```typescript
export type Hints = z.infer<typeof HintsSchema>;
```

**Example (Error Context)**:
```json
{
  "ifError": "Crea una nueva transacción con 500 satoshis exactos",
  "commonMistakes": [
    "Confundir satoshis con BSV (1 BSV = 100,000,000 satoshis)",
    "Olvidar incluir fees en el cálculo del monto"
  ],
  "nextSteps": "Consulta EXAMPLES.md sección 'Crear transacción con monto exacto'"
}
```

**Example (Success Context)**:
```json
{
  "nextSteps": "Llama al endpoint /settle para completar el pago"
}
```

**Relationships**:
- Subcampo de `AccessibleMetadata.hints`
- Todos los campos son opcionales (hints solo incluye los relevantes al contexto)
- `ifError` y `commonMistakes` típicamente presentes en errores
- `nextSteps` presente tanto en éxitos como errores

---

### AccessibleResponse<T>

**Purpose**: Wrapper genérico que envuelve todos los responses del facilitador para agregar metadata accesible de forma consistente. Mantiene separación entre data core (tipo T) y metadata de accesibilidad.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| data | `T` | Yes | Response core (VerifyResponse, SettleResponse, etc) | Generic type T |
| accessibility | `AccessibleMetadata` | Yes | Metadata accesible universal | Schema AccessibleMetadataSchema |

**TypeScript Type**:
```typescript
export interface AccessibleResponse<T> {
  data: T;
  accessibility: AccessibleMetadata;
}
```

**Example (AccessibleResponse<VerifyResponse>)**:
```json
{
  "data": {
    "isValid": true,
    "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk"
  },
  "accessibility": {
    "plainLanguage": "El pago se verificó correctamente",
    "explanation": "Tu transacción cumple con todos los requisitos: monto de 500 satoshis enviados a mqBPdELHZ2Hwvq7MQmZi3hGN6aBBvTkEjf",
    "stepByStep": [
      "Recibimos tu transacción",
      "Validamos el monto y la dirección de destino",
      "La transacción está lista para ser procesada",
      "Puedes proceder con el paso de settlement"
    ],
    "hints": {
      "nextSteps": "Llama al endpoint /settle para completar el pago"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Example (AccessibleResponse<SettleResponse>)**:
```json
{
  "data": {
    "success": true,
    "transaction": "8f3e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8",
    "payer": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk",
    "network": "bsv-testnet"
  },
  "accessibility": {
    "plainLanguage": "El pago se completó exitosamente",
    "explanation": "Tu transacción fue transmitida a la blockchain BSV testnet con ID 8f3e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8",
    "stepByStep": [
      "Recibimos tu transacción firmada",
      "La validamos contra la red BSV",
      "La transmitimos a la blockchain",
      "La transacción está confirmada en la red"
    ],
    "hints": {
      "nextSteps": "Puedes verificar tu transacción en WhatsOnChain con el ID proporcionado"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Relationships**:
- Envuelve TODOS los responses de endpoints: `/verify`, `/settle`, `/`
- `data` contiene el response core según protocolo X402
- `accessibility` agrega metadata sin modificar el contrato core
- Permite a clientes LLM ignorar `accessibility` si no la necesitan (backward compatible)

---

## Error Codes

### VerifyErrorCodes

**Purpose**: Códigos de error estándar para el endpoint `/verify`. Estos códigos se retornan en `VerifyResponse.invalidReason` cuando `isValid: false`.

**Definition**:
```typescript
export const VerifyErrorCodes = {
  INVALID_FORMAT: 'invalid_format',
  INVALID_AMOUNT: 'invalid_amount',
  INVALID_ADDRESS: 'invalid_address',
} as const;

export type VerifyErrorCode = (typeof VerifyErrorCodes)[keyof typeof VerifyErrorCodes];
```

**Error Codes**:

| Code | Description | When Used | AccessibleMetadata cognitiveLevel |
|------|-------------|-----------|----------------------------------|
| `invalid_format` | Formato de transacción BSV inválido | Transacción no parseable, checksum incorrecto, estructura malformada | `simple` |
| `invalid_amount` | Monto de la transacción no cumple requisitos | El output a `payTo` tiene monto diferente a `maxAmountRequired` | `simple` |
| `invalid_address` | Dirección de destino incorrecta | La transacción no tiene output a la dirección especificada en `payTo`, o es dirección mainnet en lugar de testnet | `simple` |

**Example Usage**:
```typescript
// En verify.ts
if (outputAmount !== requiredAmount) {
  return {
    isValid: false,
    invalidReason: VerifyErrorCodes.INVALID_AMOUNT,
    payer: payerAddress,
  };
}
```

---

### SettleErrorCodes

**Purpose**: Códigos de error estándar para el endpoint `/settle`. Estos códigos se retornan en `SettleResponse.errorReason` cuando `success: false`.

**Definition**:
```typescript
export const SettleErrorCodes = {
  BROADCAST_FAILED: 'broadcast_failed',
  ALREADY_BROADCAST: 'already_broadcast',
  NETWORK_ERROR: 'network_error',
} as const;

export type SettleErrorCode = (typeof SettleErrorCodes)[keyof typeof SettleErrorCodes];
```

**Error Codes**:

| Code | Description | When Used | AccessibleMetadata cognitiveLevel |
|------|-------------|-----------|----------------------------------|
| `broadcast_failed` | Broadcast a blockchain falló | WhatsOnChain API rechazó la transacción (formato inválido, fondos insuficientes, etc) | `medium` |
| `already_broadcast` | Transacción ya existe en blockchain | La transacción fue detectada en blockchain vía WhatsOnChain API antes de broadcast, o broadcast retornó error de duplicado | `simple` |
| `network_error` | Error de red al contactar blockchain | Timeout, fallo de conexión, o WhatsOnChain API no disponible después de 3 reintentos | `medium` |

**Example Usage**:
```typescript
// En settle.ts
if (isAlreadyBroadcast(error.message)) {
  return {
    success: false,
    errorReason: SettleErrorCodes.ALREADY_BROADCAST,
    transaction: txid,
    payer: payerAddress,
    network: 'bsv-testnet',
  };
}
```

---

## Validation Rules

### Cross-Entity Validation

**Rule 1: Network Consistency**
- `PaymentPayload.network` DEBE coincidir con `PaymentRequirements.network`
- Ambos deben ser `"bsv-testnet"` en MVP
- Validado en `/verify` y `/settle` antes de procesar transacción

**Rule 2: Scheme Consistency**
- `PaymentPayload.scheme` DEBE coincidir con `PaymentRequirements.scheme`
- Ambos deben ser `"exact"` en MVP
- Validado en `/verify` y `/settle` antes de procesar transacción

**Rule 3: Address Format**
- `PaymentRequirements.payTo` DEBE ser dirección BSV válida (checksum correcto)
- DEBE ser dirección testnet (prefijo 'm' o 'n')
- Validado usando `@bsv/sdk` método `Address.fromString()`

**Rule 4: Amount Format**
- `PaymentRequirements.maxAmountRequired` DEBE ser string numérico (solo dígitos, sin decimales)
- Representa satoshis (unidad mínima de BSV)
- Ejemplo válido: `"500"`, `"1000000"`
- Ejemplo inválido: `"5.00"`, `"cinco"`, `"1000 satoshis"`

**Rule 5: Transaction Hex Format**
- `PaymentPayload.payload.transaction` DEBE ser hexadecimal válido
- DEBE ser transacción BSV parseable por `@bsv/sdk`
- Validado al intentar parsear con `Transaction.fromHex()`

**Rule 6: Metadata Size Limits**
- `AccessibleMetadata.plainLanguage` DEBE ser ≤100 caracteres
- `AccessibleMetadata.explanation` DEBE ser ≤300 caracteres
- `AccessibleMetadata.stepByStep` DEBE tener ≤5 items
- Cada item de `stepByStep` DEBE ser ≤80 caracteres
- Response total incluyendo data + accessibility DEBE ser <50KB

**Rule 7: Cognitive Level Assignment**
- `cognitiveLevel: "simple"` SOLO para operaciones exitosas y errores de validación básicos
- `cognitiveLevel: "medium"` SOLO para errores de red, timeouts, troubleshooting
- `cognitiveLevel: "advanced"` NO usado en MVP (reservado para futuro)

**Rule 8: Audio Friendliness**
- `audioFriendly: true` REQUERIDO para todos los mensajes principales del usuario
- Mensajes deben evitar caracteres especiales que confundan TTS: `@`, `#`, `<`, `>`, etc
- Usar "arroba" en lugar de "@", "número" en lugar de "#"

---

## Entity Relationships

```
┌─────────────────────────┐
│  PaymentRequirements    │
│  - scheme               │
│  - network              │
│  - maxAmountRequired    │
│  - payTo                │
│  - resource             │
│  - maxTimeoutSeconds    │
└───────────┬─────────────┘
            │
            │ used in
            │
    ┌───────▼────────┐         ┌─────────────────┐
    │ VerifyRequest  │         │  PaymentPayload │
    │  - payload     ├────────►│  - x402Version  │
    │  - requirements│         │  - scheme       │
    └───────┬────────┘         │  - network      │
            │                  │  - payload.tx   │
            │ produces         └─────────────────┘
            │
    ┌───────▼────────┐
    │ VerifyResponse │
    │  - isValid     │
    │  - invalidReason (VerifyErrorCode)
    │  - payer       │
    └───────┬────────┘
            │
            │ wrapped in
            │
    ┌───────▼──────────────────┐
    │ AccessibleResponse<T>    │
    │  - data: T               │
    │  - accessibility         │
    └───────┬──────────────────┘
            │
            │ contains
            │
    ┌───────▼──────────────────┐
    │  AccessibleMetadata      │
    │  - plainLanguage         │
    │  - explanation           │
    │  - stepByStep            │
    │  - hints                 │◄───┐
    │  - language              │    │
    │  - audioFriendly         │    │
    │  - cognitiveLevel        │    │
    └──────────────────────────┘    │
                                    │
                                    │ contains
                             ┌──────┴────────┐
                             │  Hints        │
                             │  - ifError    │
                             │  - mistakes   │
                             │  - nextSteps  │
                             └───────────────┘

┌─────────────────────────┐
│  SettleRequest          │
│  - payload              │
│  - requirements         │
└───────┬─────────────────┘
        │
        │ produces
        │
┌───────▼─────────────────┐
│  SettleResponse         │
│  - success              │
│  - errorReason (SettleErrorCode)
│  - transaction (txid)   │
│  - payer                │
│  - network              │
└───────┬─────────────────┘
        │
        │ wrapped in
        │
┌───────▼──────────────────┐
│ AccessibleResponse<T>    │
│  (same structure)        │
└──────────────────────────┘
```

**Key Relationships**:

1. **PaymentRequirements → VerifyRequest/SettleRequest**: Requisitos de pago son input requerido para validación y settlement
2. **PaymentPayload → VerifyRequest/SettleRequest**: Transacción firmada es input requerido para ambos endpoints
3. **VerifyResponse/SettleResponse → AccessibleResponse<T>**: Todos los responses core son envueltos en AccessibleResponse para agregar metadata
4. **AccessibleMetadata → Hints**: Metadata siempre contiene un objeto Hints (puede estar vacío)
5. **ErrorCodes → invalidReason/errorReason**: Códigos de error estándar son usados en responses de error

**Data Flow**:

1. Cliente envía `VerifyRequest` a POST `/verify`
2. Facilitador valida `PaymentPayload` contra `PaymentRequirements`
3. Facilitador genera `VerifyResponse` con resultado de validación
4. Facilitador envuelve response en `AccessibleResponse<VerifyResponse>` con metadata apropiada
5. Si `isValid: true`, cliente puede enviar `SettleRequest` a POST `/settle`
6. Facilitador broadcastea transacción a blockchain vía WhatsOnChain API
7. Facilitador genera `SettleResponse` con resultado de broadcast
8. Facilitador envuelve response en `AccessibleResponse<SettleResponse>` con metadata apropiada

---

## Notes on Implementation

### Zod Custom Error Messages

Todos los schemas Zod deben configurarse con `customErrorMap` para mensajes en español:

```typescript
import { z } from 'zod';

// Custom error map en español
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: `Tipo inválido: esperado ${issue.expected}, recibido ${issue.received}` };
    case z.ZodIssueCode.invalid_literal:
      return { message: `Valor debe ser exactamente "${issue.expected}"` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Texto demasiado corto: mínimo ${issue.minimum} caracteres` };
      }
      return { message: `Valor demasiado pequeño: mínimo ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Texto demasiado largo: máximo ${issue.maximum} caracteres` };
      }
      return { message: `Valor demasiado grande: máximo ${issue.maximum}` };
    default:
      return { message: ctx.defaultError };
  }
};

// Aplicar globally o per-schema
z.setErrorMap(customErrorMap);
```

### Type Inference

Todos los TypeScript types son inferidos de los Zod schemas para garantizar sincronización:

```typescript
// ✅ CORRECTO: Type inferido del schema
export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

// ❌ INCORRECTO: Type definido manualmente (puede desincronizarse)
export type PaymentRequirements = {
  scheme: 'exact';
  network: 'bsv-testnet';
  // ... etc
};
```

### Generic Response Wrapper

Helper function para construir AccessibleResponse de forma consistente:

```typescript
// src/facilitator/accessibility/metadata.ts
export function createAccessibleResponse<T>(
  data: T,
  metadata: AccessibleMetadata
): AccessibleResponse<T> {
  return {
    data,
    accessibility: metadata,
  };
}
```

### Message Templates

Los mensajes en `i18n.ts` soportan interpolación de variables:

```typescript
// i18n.ts
export const messages = {
  errors: {
    verify: {
      invalidAmount: {
        explanation: 'La transacción tiene {actual} satoshis pero necesitas {required}',
        // ...
      }
    }
  }
};

// Usage
const explanation = messages.errors.verify.invalidAmount.explanation
  .replace('{actual}', actualAmount.toString())
  .replace('{required}', requiredAmount.toString());
```

---

## References

- **Facilitador BSV Base**: `C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\types.ts`
- **Spec Document**: `C:\Users\andre\programacion\x402\bsv\mcp-wallet-accesible\specs\001-facilitador-accesible\spec.md`
- **Research Document**: `C:\Users\andre\programacion\x402\bsv\mcp-wallet-accesible\specs\001-facilitador-accesible\research.md`
- **X402 Protocol**: https://github.com/bitcoin-sv/x402
- **WCAG 2.1 Level AA**: https://www.w3.org/WAI/WCAG21/quickref/
- **Zod Documentation**: https://zod.dev
- **@bsv/sdk Documentation**: https://docs.bsvblockchain.org/sdk
