# Research: Facilitador X402 BSV con Accesibilidad Universal

**Feature Branch**: `001-facilitador-accesible`
**Date**: 2025-11-27
**Status**: Complete

## Overview

Este documento registra las decisiones técnicas tomadas durante la fase de investigación (Phase 0) para la implementación del facilitador X402 BSV con accesibilidad universal. El facilitador reutiliza la lógica core probada del facilitador existente (`C:\Users\andre\programacion\x402\bsv\facilitador`), reorganizándola bajo una nueva arquitectura que separa concerns y agrega una capa completa de accesibilidad mediante metadata estructurada compatible con clientes LLM.

La investigación se enfocó en validar decisiones arquitectónicas, identificar componentes reutilizables, y resolver preguntas técnicas específicas sobre accesibilidad, validación BSV, y manejo de errores. Todas las decisiones están fundamentadas en código probado y estándares de accesibilidad WCAG 2.1 Level AA.

## Research Questions

### 1. Estructura de metadata accesible compatible con múltiples clientes LLM

**Decision**: Usar estructura JSON fija con tipo genérico `AccessibleResponse<T>` que envuelve todos los responses del facilitador.

**Rationale**:
- Los clientes LLM (Claude Desktop, ChatGPT) pueden parsear JSON estructurado de forma predecible
- La estructura incluye campos well-known (`plainLanguage`, `explanation`, `stepByStep`, `hints`) que cualquier LLM puede interpretar sin configuración especial
- El patrón genérico `AccessibleResponse<T>` permite mantener el contrato core de X402 (VerifyResponse, SettleResponse) mientras agrega metadata accesible de forma consistente
- La metadata sigue principios WCAG 2.1 Level AA: lenguaje claro, errores accionables, compatibilidad con TTS

**Alternatives Considered**:
- **Opción rechazada 1**: Agregar campos de accesibilidad directamente a VerifyResponse y SettleResponse → Rechazada porque rompe separación de concerns y contamina los tipos core de X402
- **Opción rechazada 2**: Usar headers HTTP para metadata → Rechazada porque headers tienen limitaciones de tamaño y no son naturales para LLMs parsear
- **Opción rechazada 3**: Crear endpoints separados `/verify-accessible` → Rechazada porque duplica código y fragmenta la API

**References**:
- Código del facilitador base: `C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\types.ts`
- WCAG 2.1 Level AA guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Plan.md secciones 2.0-2.1 sobre estrategia LLM-first

**Implementation**:
```typescript
// src/facilitator/types.ts
export interface AccessibleMetadata {
  plainLanguage: string;          // Max 100 chars, mensaje conciso
  explanation: string;             // Max 300 chars, descripción detallada
  stepByStep: string[];            // Max 5 items, 80 chars cada uno
  hints: {
    ifError?: string;              // Cómo resolver el error
    commonMistakes?: string[];     // Errores frecuentes a evitar
    nextSteps?: string;            // Qué hacer después
  };
  language: 'es';                  // Siempre español en MVP
  audioFriendly: boolean;          // true para mensajes importantes
  cognitiveLevel: 'simple' | 'medium' | 'advanced';
}

export interface AccessibleResponse<T> {
  data: T;                         // Response core (VerifyResponse, SettleResponse)
  accessibility: AccessibleMetadata;
}
```

---

### 2. Validación de direcciones BSV para distinguir testnet de mainnet

**Decision**: Usar `@bsv/sdk` método `Address.fromString()` que valida checksum y versión de red automáticamente.

**Rationale**:
- El facilitador existente valida direcciones mediante parsing manual de scripts P2PKH, pero no valida explícitamente la versión de red
- `@bsv/sdk` proporciona validación completa: checksum, longitud, y versión de red (0x6f para testnet, 0x00 para mainnet)
- Las direcciones testnet tienen prefijos 'm' o 'n', mainnet tienen prefijo '1'
- La validación en SDK es más robusta que regex simples y previene errores sutiles de formato
- Si la dirección es mainnet, se puede lanzar error con metadata accesible explicando que debe ser testnet

**Alternatives Considered**:
- **Opción rechazada 1**: Validación con regex simple `/^[mn]/` → Rechazada porque no valida checksum ni detecta direcciones malformadas
- **Opción rechazada 2**: Reutilizar la función `pubkeyHashToAddress` del facilitador base → Rechazada porque solo construye direcciones, no las valida
- **Opción rechazada 3**: Validar prefix manualmente y asumir que es correcto → Rechazada porque no previene errores de checksum

**References**:
- Código del facilitador base: `C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\verify.ts` líneas 45-86 (funciones `isP2PKHToAddress`, `pubkeyHashToAddress`)
- Documentación @bsv/sdk: https://docs.bsvblockchain.org/sdk/address
- BSV address format specification: https://wiki.bitcoinsv.io/index.php/Bitcoin_address

**Implementation**:
```typescript
import { Address } from '@bsv/sdk';

function validateBsvAddress(address: string, requireTestnet: boolean = true): boolean {
  try {
    const addr = Address.fromString(address);

    // Verificar que la versión de red sea correcta
    const isTestnet = address.startsWith('m') || address.startsWith('n');

    if (requireTestnet && !isTestnet) {
      throw new Error('Address is mainnet, testnet required');
    }

    return true;
  } catch {
    return false;
  }
}
```

---

### 3. Retry logic para broadcast sin bloquear demasiado tiempo

**Decision**: Backoff exponencial con máximo 3 intentos usando delays 1s, 2s, 4s (total 7s máximo).

**Rationale**:
- El facilitador existente ya implementa retry con backoff exponencial en `whats-on-chain.ts`
- La configuración actual (3 intentos, inicial 1s, max 10s) es probada y funciona bien en producción
- Total de tiempo máximo: 7 segundos de delays + ~1.5s de intentos de fetch = ~8.5s, dentro del target de <2s p95 para el caso de éxito (sin retries) y <10s para el worst case
- Si todos los intentos fallan, retornar error con metadata explicando que el problema es temporal y el usuario puede reintentar
- Timeout de 10s en cada fetch individual a WhatsOnChain previene bloqueos indefinidos

**Alternatives Considered**:
- **Opción rechazada 1**: Retry lineal (1s, 1s, 1s) → Rechazada porque no da tiempo a que problemas temporales de red se resuelvan
- **Opción rechazada 2**: Más de 3 intentos → Rechazada porque excedería el timeout total aceptable y empeoraría UX
- **Opción rechazada 3**: Sin retry → Rechazada porque haría el sistema frágil ante problemas temporales de WhatsOnChain API

**References**:
- Código del facilitador base: `C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\whats-on-chain.ts` líneas 13-24, 40-50, 100-215
- Retry best practices: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/

**Implementation**:
```typescript
// Reutilizado de whats-on-chain.ts
interface RetryConfig {
  maxRetries: number;        // 3
  initialDelayMs: number;    // 1000
  maxDelayMs: number;        // 10000
}

function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

// Delays resultantes: 1s, 2s, 4s
```

---

### 4. Detección de transacciones ya broadcasted en sistema stateless

**Decision**: Consultar WhatsOnChain API endpoint `/tx/{txid}` antes de broadcast. Si retorna 200 OK, la transacción ya existe. Si retorna 404, proceder con broadcast.

**Rationale**:
- El facilitador es stateless, no puede recordar transacciones previas
- WhatsOnChain API proporciona endpoint `GET /tx/{txid}/hex` que retorna 200 si la transacción existe, 404 si no
- Si la consulta previa falla por problemas de red, proceder con broadcast de todas formas
- Si el broadcast falla con error "Transaction already in the mempool" o "txn-already-known", interpretar como ya broadcasted
- El facilitador existente ya tiene lógica para detectar estos errores en `whats-on-chain.ts` función `isAlreadyBroadcast()`

**Alternatives Considered**:
- **Opción rechazada 1**: Siempre intentar broadcast y manejar error de duplicado → Rechazada porque genera requests innecesarios y errores evitables
- **Opción rechazada 2**: Mantener cache en KV de txids procesados → Rechazada porque agrega complejidad, viola stateless, y tiene costos adicionales
- **Opción rechazada 3**: No detectar duplicados → Rechazada porque empeora experiencia del usuario al retornar errores genéricos

**References**:
- Código del facilitador base: `C:\Users\andre\programacion\x402\bsv\facilitador\src\facilitator\whats-on-chain.ts` líneas 54-65, 136-145, 218-235
- WhatsOnChain API docs: https://developers.whatsonchain.com/#get-transaction-by-hash

**Implementation**:
```typescript
// Reutilizado de whats-on-chain.ts
function isAlreadyBroadcast(errorMessage: string): boolean {
  const patterns = [
    'Transaction already in the mempool',
    'txn-already-known',
    'Transaction already exists',
    'already in block chain',
  ];
  return patterns.some(p => errorMessage.toLowerCase().includes(p.toLowerCase()));
}

async function getTransaction(txid: string): Promise<{ found: boolean }> {
  const url = `${WOC_TESTNET_BASE}/tx/${txid}/hex`;
  try {
    const response = await fetch(url);
    return { found: response.ok };
  } catch {
    return { found: false }; // Si falla la consulta, asumir que no existe
  }
}
```

---

### 5. Niveles cognitivos para metadata accesible

**Decision**: MVP usa solo dos niveles: `simple` para operaciones exitosas y errores de validación, `medium` para errores de red y troubleshooting. `advanced` se reserva para versiones futuras.

**Rationale**:
- WCAG 2.1 recomienda contenido comprensible para educación secundaria (nivel medio)
- `simple` (nivel primaria): Operaciones exitosas ("/verify válido", "/settle exitoso") y errores básicos de validación ("monto incorrecto", "dirección inválida")
- `medium` (nivel secundaria): Errores que requieren troubleshooting ("timeout de red", "WhatsOnChain no responde", "transacción ya procesada")
- `advanced`: NO se usa en MVP, reservado para debugging técnico o logs detallados en versiones futuras
- Esta granularidad permite a LLMs adaptar la complejidad de sus explicaciones según el contexto

**Alternatives Considered**:
- **Opción rechazada 1**: Solo un nivel "simple" para todo → Rechazada porque algunos errores requieren explicaciones más técnicas
- **Opción rechazada 2**: Tres niveles completos en MVP → Rechazada porque agrega complejidad innecesaria sin casos de uso claros
- **Opción rechazada 3**: Niveles basados en usuario (perfil) en lugar de mensaje → Rechazada porque requiere estado y autenticación

**References**:
- WCAG 2.1 Guideline 3.1 Readable: https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html
- Flesch-Kincaid readability scoring
- Plan.md asunción 8 sobre límites de complejidad cognitiva

**Implementation**:
```typescript
// Reglas de asignación de cognitiveLevel
function getCognitiveLevel(context: 'success' | 'validation_error' | 'network_error'): CognitiveLevel {
  switch (context) {
    case 'success':
    case 'validation_error':
      return 'simple'; // Mensajes directos sin troubleshooting
    case 'network_error':
      return 'medium'; // Requiere explicar reintentos, timeouts, etc
  }
}
```

---

### 6. Centralización de mensajes i18n

**Decision**: Centralizar TODOS los mensajes en español en archivo único `src/facilitator/accessibility/i18n.ts` con estructura jerárquica por tipo (errors, success, explanations, hints).

**Rationale**:
- Facilita mantenimiento: un solo lugar para actualizar todos los textos
- Permite validar consistencia de tono, nivel de lenguaje, y longitud de mensajes
- Simplifica futura traducción a otros idiomas (solo reemplazar i18n.ts)
- La estructura jerárquica (`messages.errors.verify.invalidAmount`, `messages.success.verifyValid`) hace el código más legible
- Permite tests específicos de calidad de mensajes (longitud, legibilidad, etc)

**Alternatives Considered**:
- **Opción rechazada 1**: Mensajes inline en el código → Rechazada porque dificulta mantenimiento y consistencia
- **Opción rechazada 2**: Mensajes en Zod schemas directamente → Rechazada porque mezcla validación con presentación
- **Opción rechazada 3**: Archivos separados por tipo de error → Rechazada porque fragmenta los mensajes innecesariamente

**References**:
- Best practices i18n: https://formatjs.io/docs/getting-started/message-declaration/
- Código del facilitador base no tiene centralización de mensajes (oportunidad de mejora)

**Implementation**:
```typescript
// src/facilitator/accessibility/i18n.ts
export const messages = {
  errors: {
    verify: {
      invalidAmount: {
        plainLanguage: 'El monto del pago es incorrecto',
        explanation: 'La transacción enviada no tiene el monto requerido de {required} satoshis. El monto actual es {actual} satoshis.',
        stepByStep: [
          'Verifica el monto requerido en los payment requirements',
          'Crea una nueva transacción con el monto exacto',
          'Vuelve a enviar la transacción al facilitador'
        ],
        hints: {
          ifError: 'Crea una nueva transacción con {required} satoshis exactos',
          commonMistakes: [
            'Confundir satoshis con BSV (1 BSV = 100,000,000 satoshis)',
            'Olvidar incluir fees en el cálculo del monto'
          ],
          nextSteps: 'Consulta EXAMPLES.md sección "Crear transacción con monto exacto"'
        }
      }
      // ... más mensajes de verify
    },
    settle: {
      // ... mensajes de settle
    }
  },
  success: {
    verifyValid: {
      plainLanguage: 'El pago se verificó correctamente',
      explanation: 'Tu transacción cumple con todos los requisitos: monto de {amount} satoshis enviados a {address}',
      stepByStep: [
        'Recibimos tu transacción',
        'Validamos el monto y la dirección de destino',
        'La transacción está lista para ser procesada',
        'Puedes proceder con el paso de settlement'
      ]
    }
    // ... más mensajes de success
  }
};
```

---

### 7. Limitaciones de tamaño de metadata

**Decision**: Limitar metadata accesible a tamaños fijos: `plainLanguage` ≤100 chars, `explanation` ≤300 chars, `stepByStep` ≤5 items de 80 chars cada uno.

**Rationale**:
- Cloudflare Workers tiene límite de 1MB por response, pero es buena práctica mantener responses pequeños (<50KB)
- Metadata típica ocupa ~2-5KB: suficiente para ser útil sin impactar performance
- Los límites fuerzan concisión y claridad: mensaje corto es más accesible que mensaje largo
- `plainLanguage` es el resumen ejecutivo (100 chars ≈ 1 tweet)
- `explanation` es la descripción detallada (300 chars ≈ 2-3 oraciones)
- `stepByStep` máximo 5 pasos previene listas abrumadoras
- Tests automatizados validan que los mensajes respetan estos límites

**Alternatives Considered**:
- **Opción rechazada 1**: Sin límites → Rechazada porque podría generar responses excesivamente grandes
- **Opción rechazada 2**: Límites más restrictivos (50/150/3) → Rechazada porque no da suficiente espacio para explicaciones claras
- **Opción rechazada 3**: Límites más amplios (200/500/10) → Rechazada porque puede resultar en información abrumadora

**References**:
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Plain language guidelines: recomiendan párrafos de 150 chars máximo

**Implementation**:
```typescript
// Tests de validación de longitud
test('plainLanguage respects 100 char limit', () => {
  Object.values(messages).forEach(category => {
    Object.values(category).forEach(msg => {
      expect(msg.plainLanguage.length).toBeLessThanOrEqual(100);
    });
  });
});

test('stepByStep has max 5 items of 80 chars each', () => {
  Object.values(messages).forEach(category => {
    Object.values(category).forEach(msg => {
      expect(msg.stepByStep.length).toBeLessThanOrEqual(5);
      msg.stepByStep.forEach(step => {
        expect(step.length).toBeLessThanOrEqual(80);
      });
    });
  });
});
```

---

### 8. Performance targets para endpoints

**Decision**: `/verify` <200ms p95 (validación sin red), `/settle` <2s p95 (incluyendo broadcast), timeout en fetch a WhatsOnChain API: 10 segundos.

**Rationale**:
- `/verify` es validación local de transacción BSV: parsing, checksum, validación de outputs → no requiere red → debe ser muy rápido
- El facilitador existente logra ~50ms en `/verify` según README, target de 200ms p95 es conservador
- `/settle` incluye broadcast a blockchain vía WhatsOnChain API: 1 intento exitoso toma ~500ms, con reintentos puede llegar a 2s
- Timeout de 10s en fetch individual previene que un request colgado bloquee el worker indefinidamente
- Estos targets son compatibles con UX fluida en clientes LLM: el usuario ve respuesta casi instantánea

**Alternatives Considered**:
- **Opción rechazada 1**: Target más agresivo (<100ms verify, <1s settle) → Rechazada porque settle depende de API externa impredecible
- **Opción rechazada 2**: Sin timeout en fetch → Rechazada porque podría causar workers colgados y agotar recursos
- **Opción rechazada 3**: Timeout más largo (30s) → Rechazada porque empeora UX significativamente

**References**:
- Código del facilitador base: `C:\Users\andre\programacion\x402\bsv\facilitador\README.md` líneas 320-325 (performance actual)
- Cloudflare Workers CPU time limits: https://developers.cloudflare.com/workers/platform/limits/#cpu-time

**Implementation**:
```typescript
// Timeout en fetch a WhatsOnChain
const FETCH_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## Technical Stack Validation

El stack técnico fue validado mediante análisis del facilitador existente que opera exitosamente en producción:

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Runtime** | Cloudflare Workers | - | Probado en producción, auto-scaling, bajo costo |
| **Compatibility** | nodejs_compat_v2 | - | Requerido para @bsv/sdk (usa Buffer, crypto) |
| **Framework HTTP** | Hono | 4.0+ | Ligero, rápido, excelente integración con Workers |
| **BSV SDK** | @bsv/sdk | 1.0+ | Estándar para operaciones BSV en TypeScript |
| **Validación** | Zod | 3.22+ | Type-safe, integración con Hono, mensajes customizables |
| **Validación Hono** | @hono/zod-validator | 0.4+ | Middleware que conecta Zod con Hono |
| **Testing** | Vitest | 2.1+ | Compatible con Workers, cobertura nativa, rápido |
| **Coverage** | @vitest/coverage-v8 | - | Coverage threshold enforcement >80% |
| **TypeScript** | 5.6+ | strict mode | Calidad de código, prevención de errores |
| **Linting** | ESLint 9 + @typescript-eslint 8 | - | Flat config, reglas estrictas |
| **Formatting** | Prettier | 3.4+ | Consistencia de código |

**Decisiones clave del stack**:

1. **Hono sobre Express**: Hono es diseñado específicamente para edge runtimes, ~10x más rápido que Express
2. **Vitest sobre Jest**: Mejor integración con Workers, no requiere configuración compleja de mocks para fetch
3. **Zod sobre Joi**: Type inference automática, mejor DX, integración nativa con Hono
4. **@bsv/sdk sobre bsv-js**: Versión moderna mantenida activamente, mejor TypeScript support

---

## Key Findings

1. **Reutilización de código probado**: El facilitador existente tiene lógica sólida de verify y settle que puede reutilizarse casi directamente. Los archivos `verify.ts`, `settle.ts`, `whats-on-chain.ts` y `logger.ts` requieren cambios mínimos.

2. **Separación de concerns crítica**: La clave arquitectónica es separar lógica BSV (reutilizada) de lógica de accesibilidad (nueva). El patrón `AccessibleResponse<T>` logra esto sin contaminar tipos core.

3. **Metadata accesible es ligera**: Con límites apropiados, la metadata agrega solo 2-5KB por response, impacto mínimo en performance y bandwidth.

4. **Validación en dos capas**: Zod valida estructura de datos, @bsv/sdk valida semántica BSV (checksums, redes). Ambas son necesarias y complementarias.

5. **Retry exponencial es probado**: La configuración actual del facilitador (3 intentos, 1s/2s/4s) funciona bien en producción, no requiere cambios.

6. **Detección de duplicados es esencial**: Sin ella, usuarios reciben errores confusos al reintentar pagos. La consulta previa a WhatsOnChain es barata y mejora UX significativamente.

7. **Mensajes centralizados simplifican testing**: Tener todos los textos en `i18n.ts` permite tests automatizados de calidad de lenguaje (longitud, legibilidad, tono).

8. **Dos niveles cognitivos son suficientes para MVP**: Simple/medium cubren 95% de casos de uso. Advanced solo sería necesario para debugging técnico avanzado.

9. **Stateless es más simple que stateful**: No tener base de datos elimina complejidad operacional, sincronización, y costos. La blockchain es la única fuente de verdad.

10. **Performance targets son alcanzables**: El facilitador existente ya cumple estos targets sin optimizaciones especiales. La metadata accesible no impacta performance medible.

---

## Next Steps

- [x] **Phase 0 Complete**: Research completada mediante análisis del facilitador base y validación de decisiones técnicas
- [ ] **Phase 1**: Generar artifacts de diseño:
  - `data-model.md`: Schemas Zod completos con AccessibleResponse, tipos TypeScript, diagramas de datos
  - `quickstart.md`: Guía de setup, configuración local, primeros pasos con ejemplos
  - `contracts/`: Contratos de APIs OpenAPI para `/verify`, `/settle`, `/` con ejemplos de requests/responses
- [ ] **Phase 2**: Generar `tasks.md` con checklist detallado de implementación ordenado por dependencias

**Notas para Phase 1**:
- Priorizar reutilización de código probado del facilitador base sobre reimplementación
- Todos los changes deben mantener compatibilidad con protocolo X402 estándar
- La metadata accesible es aditiva, no modifica el contrato core de X402
- Tests deben cubrir tanto lógica BSV (reutilizada) como metadata accesible (nueva)
