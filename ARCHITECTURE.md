# Arquitectura del Sistema X402 con Accesibilidad Universal

Este documento describe la arquitectura completa del sistema X402 BSV con accesibilidad universal, incluyendo el facilitador y el resource server.

## 📐 Visión General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE CLIENTE                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │Claude Desktop│  │  Browser     │  │  CLI Tool            │ │
│  │ (con MCP)    │  │  JavaScript  │  │  Node.js/Python/etc  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘ │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTP Request
                            │ X-PAYMENT header (base64)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   CAPA DE RESOURCE SERVER                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │        Resource Server (Cloudflare Worker)              │  │
│  │  - Protege recursos (/api/data)                         │  │
│  │  - Valida X-PAYMENT header                              │  │
│  │  - Coordina verify + settle con facilitador             │  │
│  │  - Retorna datos protegidos si pago válido              │  │
│  └───────────────┬─────────────────────────────────────────┘  │
│                  │                                             │
└──────────────────┼─────────────────────────────────────────────┘
                   │
                   │ Service Binding (prod) o
                   │ HTTP Fetch (dev)
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                   CAPA DE FACILITADOR                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │    Facilitador X402 Accesible (Cloudflare Worker)       │  │
│  │                                                          │  │
│  │  Endpoints:                                              │  │
│  │  • POST /verify  - Validar transacción BSV              │  │
│  │  • POST /settle  - Transmitir a blockchain              │  │
│  │  • GET  /        - Health check                         │  │
│  │                                                          │  │
│  │  Características:                                        │  │
│  │  • Validación BSV SDK                                   │  │
│  │  • Metadata accesible (español claro)                   │  │
│  │  • Hints accionables                                    │  │
│  │  • Guías paso a paso                                    │  │
│  └───────────────┬─────────────────────────────────────────┘  │
│                  │                                             │
└──────────────────┼─────────────────────────────────────────────┘
                   │
                   │ WhatsOnChain API
                   │ (broadcast transaction)
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                   CAPA DE BLOCKCHAIN                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              BSV Testnet Blockchain                      │  │
│  │  - Procesa transacciones                                │  │
│  │  - Valida pagos                                         │  │
│  │  - Proporciona confirmaciones                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo Detallado de una Transacción X402

### Fase 1: Discovery (Cliente descubre requisitos de pago)

```
┌────────┐                                    ┌──────────────┐
│Cliente │                                    │Resource      │
│        │                                    │Server        │
└───┬────┘                                    └──────┬───────┘
    │                                                │
    │  1. GET /api/data                              │
    │  (sin header X-PAYMENT)                        │
    │ ──────────────────────────────────────────────>│
    │                                                │
    │                                                │ 2. Genera
    │                                                │    PaymentRequirements
    │                                                │
    │  3. 402 Payment Required                       │
    │  + PaymentRequirements JSON                    │
    │ <──────────────────────────────────────────────│
    │                                                │
    │  {                                             │
    │    "scheme": "exact",                          │
    │    "network": "bsv-testnet",                   │
    │    "maxAmountRequired": "1000",                │
    │    "payTo": "mnLd5sVx...",                     │
    │    "resource": "http://...",                   │
    │    "maxTimeoutSeconds": 300                    │
    │  }                                             │
    │                                                │
```

### Fase 2: Payment Creation (Cliente crea transacción BSV)

```
┌────────┐                         ┌──────────────┐
│Cliente │                         │MCP Wallet    │
│        │                         │(@bsv/sdk)    │
└───┬────┘                         └──────┬───────┘
    │                                     │
    │  4. Crear transacción BSV           │
    │     que pague 1000 sat a            │
    │     mnLd5sVx...                     │
    │ ───────────────────────────────────>│
    │                                     │
    │                                     │ 5. Crea TX,
    │                                     │    firma con
    │                                     │    private key
    │                                     │
    │  6. PaymentPayload {                │
    │       x402Version: 1,               │
    │       scheme: "exact",              │
    │       network: "bsv-testnet",       │
    │       payload: {                    │
    │         transaction: "0100000..." │
    │       }                             │
    │     }                               │
    │ <───────────────────────────────────│
    │                                     │
    │  7. Codifica payload en base64      │
    │                                     │
```

### Fase 3: Verification (Resource server valida la transacción)

```
┌────────┐       ┌──────────────┐       ┌────────────┐
│Cliente │       │Resource      │       │Facilitador │
│        │       │Server        │       │            │
└───┬────┘       └──────┬───────┘       └─────┬──────┘
    │                   │                     │
    │  8. GET /api/data │                     │
    │     X-PAYMENT:    │                     │
    │     <base64>      │                     │
    │ ─────────────────>│                     │
    │                   │                     │
    │                   │ 9. POST /verify     │
    │                   │    {                │
    │                   │      payload,       │
    │                   │      requirements   │
    │                   │    }                │
    │                   │ ───────────────────>│
    │                   │                     │
    │                   │                     │ 10. Valida:
    │                   │                     │     - Formato TX
    │                   │                     │     - Outputs
    │                   │                     │     - Monto
    │                   │                     │     - Dirección
    │                   │                     │
    │                   │ 11. VerifyResponse  │
    │                   │     {               │
    │                   │       isValid: true,│
    │                   │       metadata: {   │
    │                   │         plainLang...│
    │                   │       }             │
    │                   │     }               │
    │                   │ <───────────────────│
    │                   │                     │
    │                   │ (si isValid false,  │
    │                   │  retorna 402)       │
    │                   │                     │
```

### Fase 4: Settlement (Transacción se transmite a blockchain)

```
┌────────┐       ┌──────────────┐       ┌────────────┐       ┌──────────┐
│Cliente │       │Resource      │       │Facilitador │       │BSV       │
│        │       │Server        │       │            │       │Blockchain│
└───┬────┘       └──────┬───────┘       └─────┬──────┘       └────┬─────┘
    │                   │                     │                    │
    │                   │ 12. POST /settle    │                    │
    │                   │     {               │                    │
    │                   │       payload,      │                    │
    │                   │       requirements  │                    │
    │                   │     }               │                    │
    │                   │ ───────────────────>│                    │
    │                   │                     │                    │
    │                   │                     │ 13. Broadcast TX   │
    │                   │                     │    via WhatsOnChain│
    │                   │                     │ ──────────────────>│
    │                   │                     │                    │
    │                   │                     │                    │ 14. TX en
    │                   │                     │                    │     mempool
    │                   │                     │                    │
    │                   │                     │ 15. TXID           │
    │                   │                     │ <──────────────────│
    │                   │                     │                    │
    │                   │ 16. SettleResponse  │                    │
    │                   │     {               │                    │
    │                   │       success: true,│                    │
    │                   │       transaction:  │                    │
    │                   │       "abc123...",  │                    │
    │                   │       metadata: {..}│                    │
    │                   │     }               │                    │
    │                   │ <───────────────────│                    │
    │                   │                     │                    │
```

### Fase 5: Data Delivery (Cliente recibe datos protegidos)

```
┌────────┐                         ┌──────────────┐
│Cliente │                         │Resource      │
│        │                         │Server        │
└───┬────┘                         └──────┬───────┘
    │                                     │
    │                                     │ 17. Genera respuesta
    │                                     │     con datos
    │                                     │     protegidos
    │                                     │
    │  18. 200 OK                         │
    │      {                              │
    │        message: "¡Pago exitoso!",   │
    │        data: { ... },               │
    │        payment: {                   │
    │          txid: "abc123...",         │
    │          payer: "mnLd5sVx...",      │
    │          ...                        │
    │        },                           │
    │        accessibility: {             │
    │          plainLanguage: "...",      │
    │          explanation: "...",        │
    │          stepByStep: [...],         │
    │          hints: [...]               │
    │        }                            │
    │      }                              │
    │ <───────────────────────────────────│
    │                                     │
    │  19. Cliente procesa datos          │
    │      y muestra al usuario           │
    │                                     │
```

## 🧩 Componentes del Sistema

### 1. Facilitador X402 Accesible

**Responsabilidades**:
- ✅ Validar transacciones BSV (formato, outputs, montos)
- ✅ Verificar que se pague a la dirección correcta
- ✅ Transmitir transacciones a BSV testnet blockchain
- ✅ Generar metadata accesible en español claro
- ✅ Proporcionar hints accionables para errores

**Endpoints**:
- `POST /verify` - Valida si una transacción cumple los requisitos
- `POST /settle` - Transmite la transacción a blockchain
- `GET /` - Health check

**Tecnología**:
- Cloudflare Workers (serverless)
- Hono framework
- @bsv/sdk para validación
- Zod para schemas

**Ubicación**: `src/facilitator/`

### 2. Resource Server (Demo)

**Responsabilidades**:
- ✅ Proteger recursos mediante pagos X402
- ✅ Generar PaymentRequirements
- ✅ Parsear y validar header X-PAYMENT
- ✅ Coordinar con facilitador (verify + settle)
- ✅ Retornar datos protegidos si pago válido

**Endpoints**:
- `GET /api/data` - Recurso protegido que requiere pago
- `GET /` - Health check

**Tecnología**:
- Cloudflare Workers (serverless)
- Hono framework
- Service binding al facilitador (producción)

**Ubicación**: `src/resource-server/`

### 3. MCP Wallet (Cliente)

**Responsabilidades**:
- ✅ Crear transacciones BSV
- ✅ Firmar transacciones con private keys
- ✅ Generar PaymentPayload en formato X402
- ✅ Interactuar con Claude Desktop

**Tecnología**:
- @bsv/sdk
- MCP protocol (Model Context Protocol)

**Ubicación**: Separado (puede ser cualquier cliente X402)

## 📊 Modelo de Datos

### PaymentRequirements

```typescript
{
  scheme: "exact",                    // Tipo de pago
  network: "bsv-testnet",             // Red BSV
  maxAmountRequired: "1000",          // Satoshis requeridos
  resource: "http://...",             // URL del recurso
  description: "Acceso a...",         // Descripción
  payTo: "mnLd5sVx...",               // Dirección BSV destino
  maxTimeoutSeconds: 300              // Timeout (5 min)
}
```

### PaymentPayload

```typescript
{
  x402Version: 1,                     // Versión del protocolo
  scheme: "exact",                    // Tipo de pago
  network: "bsv-testnet",             // Red BSV
  payload: {
    transaction: "0100000001...",     // TX hex completa
    rawTransaction?: Uint8Array       // TX bytes (opcional)
  }
}
```

### VerifyResponse

```typescript
{
  isValid: true,                      // ¿Es válida la TX?
  invalidReason?: string,             // Razón si inválida
  metadata: {                         // Metadata accesible
    plainLanguage: "...",             // ≤100 chars
    explanation: "...",               // ≤300 chars
    stepByStep: ["...", "..."],       // ≤5 pasos de 80 chars
    hints: ["...", "..."]             // Consejos accionables
  }
}
```

### SettleResponse

```typescript
{
  success: true,                      // ¿Transmitida a blockchain?
  transaction: "abc123...",           // TXID
  network: "bsv-testnet",             // Red
  payer: "mnLd5sVx...",               // Dirección del pagador
  errorReason?: string,               // Razón si falló
  metadata: {                         // Metadata accesible
    // ... (igual que VerifyResponse)
  }
}
```

## 🔒 Seguridad

### Validaciones Implementadas

1. **Formato de Transacción**:
   - ✅ Hex válido
   - ✅ Estructura BSV correcta
   - ✅ Firma digital válida

2. **Outputs de Pago**:
   - ✅ Existe output a dirección especificada
   - ✅ Monto cumple `maxAmountRequired`
   - ✅ Network correcto (bsv-testnet)

3. **Headers HTTP**:
   - ✅ X-PAYMENT debe ser base64 válido
   - ✅ PaymentPayload debe tener campos requeridos
   - ✅ Versión X402 soportada

4. **CORS**:
   - ✅ Configurado para permitir requests de navegador
   - ✅ Headers permitidos: Content-Type, X-PAYMENT

### Información NO Expuesta

- ❌ Private keys (nunca se transmiten ni loggean)
- ❌ WIFs (nunca se exponen)
- ❌ Información interna del facilitador
- ❌ Detalles de implementación de seguridad

## ⚡ Rendimiento

### Latencias Esperadas

| Operación | Latencia p50 | Latencia p95 |
|-----------|--------------|--------------|
| GET /api/data (402) | <50ms | <100ms |
| POST /verify | <100ms | <200ms |
| POST /settle | <1s | <2s |
| GET /api/data (con pago) | <1.5s | <3s |

### Optimizaciones

1. **Service Binding** (Producción):
   - Comunicación directa entre workers
   - Sin salir de la red de Cloudflare
   - ~50% reducción de latencia

2. **Stateless Design**:
   - Sin base de datos
   - Sin estado compartido
   - Escalado horizontal automático

3. **Cloudflare Edge**:
   - Desplegado en 275+ ubicaciones
   - Baja latencia global
   - CDN integrado

## ♿ Accesibilidad

### Niveles de Mensaje

1. **Plain Language** (≤100 chars):
   - Mensaje simple y directo
   - Compatible con TTS
   - Nivel cognitivo básico

2. **Explanation** (≤300 chars):
   - Contexto adicional
   - Por qué pasó esto
   - Nivel cognitivo medio

3. **Step by Step** (≤5 pasos de 80 chars):
   - Guía accionable
   - Pasos concretos
   - Nivel cognitivo básico

4. **Hints** (consejos accionables):
   - Tips prácticos
   - Prevención de errores futuros
   - Nivel cognitivo medio

### Ejemplo de Metadata Accesible

```json
{
  "plainLanguage": "El pago fue verificado correctamente",
  "explanation": "Tu transacción BSV es válida y cumple todos los requisitos de pago. El monto y la dirección son correctos.",
  "stepByStep": [
    "Tu transacción BSV fue recibida y validada",
    "Se verificó que pagas 1000 satoshis a la dirección correcta",
    "La transacción será transmitida a la blockchain de BSV testnet",
    "Recibirás acceso a los datos protegidos"
  ],
  "hints": [
    "Guarda el TXID para futuras referencias",
    "La transacción puede tardar unos segundos en confirmarse",
    "Puedes verificar el estado en WhatsOnChain"
  ]
}
```

## 🧪 Testing

### Niveles de Testing

1. **Unit Tests** (Vitest):
   - Tests de funciones individuales
   - Validación de schemas
   - Lógica de accesibilidad
   - **Coverage objetivo**: 80%

2. **Integration Tests** (Vitest):
   - Flujo verify + settle completo
   - Interacción entre componentes
   - Casos de error

3. **E2E Tests** (Scripts bash):
   - Flujo completo cliente → resource server → facilitador → blockchain
   - Transacciones BSV reales
   - Validación de metadata accesible

### Ejecutar Tests

```bash
# Unit + integration tests
npm test

# Con coverage
npm run test:coverage

# Test resource server
npm run test:resource

# Ejemplo de cliente
npm run example:client
```

## 🚀 Deployment

### Desarrollo Local

```bash
# Terminal 1: Facilitador
npm run dev          # → localhost:8787

# Terminal 2: Resource Server
npm run dev:resource # → localhost:8788
```

### Producción (Cloudflare Workers)

```bash
# Deploy facilitador
npm run deploy

# Deploy resource server
npm run deploy:resource
```

### Service Binding (Recomendado para Producción)

Después del deploy, configura el service binding en Cloudflare dashboard:

1. Workers & Pages → `x402-resource-server-accesible-prod`
2. Settings → Bindings → Add Service Binding
3. Variable name: `FACILITATOR`
4. Service: `facilitador-bsv-x402-accesible`

Esto permite comunicación directa entre workers sin HTTP público.

## 📈 Escalabilidad

### Limitaciones Actuales

- ⚠️ Sin cache de transacciones (stateless)
- ⚠️ Sin rate limiting (implementar si se usa en producción)
- ⚠️ Sin autenticación de usuarios (solo pago BSV)

### Mejoras Futuras Potenciales

1. **Cache de Transacciones**:
   - KV store para TXIDs verificadas
   - Evitar re-validación de misma TX
   - TTL de 5 minutos

2. **Rate Limiting**:
   - Cloudflare Rate Limiting
   - Por IP o por wallet address
   - Prevenir abuso

3. **Analytics**:
   - Cloudflare Analytics
   - Métricas de uso
   - Monitoreo de errores

4. **Multi-Network**:
   - Soporte para BSV mainnet
   - Configuración por entorno
   - Variables de network dinámicas

## 📚 Referencias

- [Especificación X402](https://github.com/bitcoin-sv/x402)
- [BSV SDK Documentation](https://docs.bsvblockchain.org/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

**Arquitectura diseñada para**: Accesibilidad universal, bajo costo, alta disponibilidad, y facilidad de uso.
