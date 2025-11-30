# Facilitador X402 BSV con Accesibilidad Universal V3

Facilitador X402 para Bitcoin SV diseñado específicamente para **accesibilidad universal**. Permite que usuarios con discapacidades cognitivas y visuales realicen pagos blockchain a través de clientes LLM (Claude Desktop, ChatGPT) con metadata accesible optimizada para TTS y screen readers.

**Principio V3**: *"El servidor provee TODO, el cliente elige lo que necesita"*

**Estado:** ✅ **Production Ready V3** | **Tests:** 354/354 pasando | **WCAG:** 2.2 AAA Compliant | **Deploy:** https://facilitador-bsv-x402-accesible.andresleontest.workers.dev

---

## 🎉 Novedades V3 (2025-11-30)

### ¿Qué cambió en V3?

**Antes (V1/V2)**: El servidor enviaba UNA respuesta adaptada al nivel del usuario.
- Cliente solicita nivel "simple" → recibe solo contenido "simple"
- Para cambiar de nivel → nueva request al servidor
- No puede comparar niveles o explorar otros idiomas

**Ahora (V3)**: El servidor envía TODO, el cliente elige dinámicamente.
- Una sola respuesta contiene **5 niveles cognitivos completos**
- Cliente LLM puede cambiar de nivel instantáneamente sin nueva request
- Soporta **múltiples idiomas simultáneos** (ES + EN + otros)
- Incluye **accesibilidad visual/motora/auditiva completa**
- **8 formatos de salida** diferentes en la misma respuesta

### Ventajas de V3

✅ **Adaptación dinámica**: El LLM puede empezar con "simple" y cambiar a "beginner" si el usuario no entiende
✅ **Offline-first**: Una sola request contiene todo, sin round-trips adicionales
✅ **Multilingüe real**: Puede mostrar traducción lado a lado (ES + EN + PT)
✅ **Accesibilidad universal**: Soporta todas las discapacidades en una respuesta
✅ **Menor latencia**: No necesita múltiples requests para cambiar nivel/idioma
✅ **Mejor UX**: Cliente decide qué mostrar según contexto en tiempo real

### Ejemplo Concreto

**Usuario con discapacidad visual severa**:
```javascript
// El LLM detecta: baja visión + daltonismo + usa screen reader
const response = await fetch('/verify', {...});
const data = response.json();

// Aplica automáticamente:
applyCss(data.accessibility.visual.contrast.high.cssHints);
applyCss(data.accessibility.visual.fontSize['x-large'].cssHints);
applyColorPalette(data.accessibility.visual.colorBlind.deuteranopia.colorPalette);
speakText(data.accessibility.audio.ttsOptimized.ssml);
showContent(data.accessibility.content.byLevel.beginner);
```

Todo esto con **una sola request** al servidor. 🚀

---

## ¿Qué hace este servidor?

Este servidor es un **facilitador de pagos X402** que actúa como intermediario entre clientes (aplicaciones, LLMs, wallets) y la blockchain de Bitcoin SV. Su función principal es:

1. **Validar transacciones BSV** antes de ser transmitidas a la blockchain
2. **Transmitir (broadcast)** transacciones válidas a la red BSV
3. **Generar metadata accesible** en múltiples idiomas y formatos para personas con discapacidades
4. **Proveer explicaciones comprensibles** de operaciones blockchain complejas

### Caso de uso principal

Imagina a una persona con discapacidad visual que usa un screen reader y quiere pagar por un recurso digital usando Bitcoin SV. Sin este servidor, recibiría respuestas técnicas como:

```json
{
  "error": "Invalid UTXO",
  "code": "0x2A"
}
```

Con este servidor, recibe:

```json
{
  "accessibility": {
    "plainLanguage": "La transacción no pudo procesarse porque los fondos no son válidos",
    "explanation": "Esto significa que las monedas que intentas gastar ya fueron usadas o no existen. Es como intentar usar un billete que ya gastaste.",
    "stepByStep": [
      "Verifica el saldo de tu wallet",
      "Asegúrate de no haber gastado estos fondos antes",
      "Intenta crear una nueva transacción con fondos disponibles"
    ],
    "hints": {
      "ifError": "Contacta al soporte de tu wallet si el problema persiste",
      "commonMistakes": ["Usar la misma transacción dos veces", "No sincronizar el wallet"]
    }
  }
}
```

---

## 🆕 Características V3 - Accesibilidad Universal

### **Principio Fundamental**
> El servidor provee **TODA** la información en **TODOS** los formatos y niveles.
> El cliente (LLM) elige lo que necesita según el contexto del usuario.

### 📚 Contenido Multi-Nivel (NUEVO EN V3)

- ✅ **5 niveles cognitivos**: `beginner`, `simple`, `medium`, `advanced`, `expert`
  - Cada nivel con contenido diferenciado y contextual (no solo ajuste de longitud)
  - `beginner`: Iconos, ejemplos visuales, pasos mínimos
  - `simple`: Metáforas cotidianas, sin jerga técnica
  - `medium`: Balance teoría-práctica con contexto blockchain
  - `advanced`: Detalles técnicos, flujos de retry, manejo de errores
  - `expert`: Stack traces, código fuente, decisiones arquitecturales
- ✅ **3 niveles de abstracción**: `concrete` (ejemplos con valores reales), `mixed` (teoría+práctica), `abstract` (conceptos del protocolo)
- ✅ **Contenido rico**: Glosarios técnicos, ejemplos contextuales, checkpoints de validación, memory aids, hints extendidos con troubleshooting

### 🌍 Multilingüe Total

- ✅ **Mínimo 2 idiomas**: Español + Inglés siempre incluidos
- ✅ **Idiomas adicionales**: Según preferencias del cliente
- ✅ **Mismo contenido en todos los idiomas**: Todos los niveles en cada idioma
- ✅ **Soporte RTL**: Preparado para árabe/hebreo

### 👁️ Accesibilidad Visual Completa

- ✅ **Contraste**: Alto, Normal, Bajo (3 variantes con paletas de colores)
- ✅ **Daltonismo**: Deuteranopia, Protanopia, Tritanopia, None (4 tipos)
- ✅ **Tamaños de fuente**: Small, Medium, Large, X-Large (4 tamaños con CSS hints)
- ✅ **Temas**: Light, Dark (2 temas)

### 🦾 Accesibilidad Motora Universal

- ✅ **Teclado**: Instrucciones, shortcuts, timing
- ✅ **Voz**: Comandos de voz con ejemplos
- ✅ **Switch**: Para discapacidades severas
- ✅ **Eye-tracking**: Navegación por mirada

### 🔊 Accesibilidad Auditiva

- ✅ **TTS Optimizado**: Con SSML, pausas, velocidad ajustable
- ✅ **TTS Estándar**: Sin optimizaciones
- ✅ **Con/Sin pausas**: Control de timing para comprensión

### 📄 8 Formatos de Salida

- ✅ **JSON**: Nativo
- ✅ **XML**: Estructurado
- ✅ **PlainText**: Sin markup
- ✅ **Markdown**: Formateado
- ✅ **HTML**: Semántico con ARIA
- ✅ **JSON-LD**: Con schema.org
- ✅ **Braille**: Optimizado
- ✅ **SSML**: Para síntesis de voz

### 🎯 Recomendaciones Inteligentes

- ✅ **Servidor sugiere**: Nivel cognitivo, idioma, formato más apropiado
- ✅ **Cliente decide**: El LLM puede ignorar y elegir libremente
- ✅ **Confidence score**: 0-1 indicando confianza en las recomendaciones

### 🚀 Protocolo X402

- ✅ **Validación BSV**: Verificación completa de transacciones Bitcoin SV
- ✅ **Network Support**: Mainnet y Testnet
- ✅ **Broadcast con reintentos**: Exponential backoff (1s, 2s, 4s)
- ✅ **Detección de duplicados**: Prevención de double-spend
- ✅ **WhatsOnChain Integration**: API blockchain con timeout 10s

### 🧪 Calidad

- ✅ **354 tests unitarios e integración** (100% pasando)
  - 21 tests específicos de V3 Universal Accessibility
  - 333 tests de funcionalidad core (V1/V2)
- ✅ **80% code coverage** (lines, branches, functions)
- ✅ **TypeScript strict mode** con validación Zod
- ✅ **No `any` types** (ESLint enforced)
- ✅ **Cloudflare Workers optimizado** (< 30KB gzip con V3 completo)

---

## Quickstart

### Instalación rápida

```bash
# Clonar repositorio
git clone https://github.com/tu-repo/mcp-wallet-accesible.git
cd mcp-wallet-accesible

# Instalar dependencias
npm install

# Configurar secrets (solo una vez)
npx wrangler secret put OPENAI_API_KEY
# Pegar tu API key de OpenAI

# Ejecutar en modo desarrollo (testnet)
npm run dev
# Servidor disponible en http://localhost:8787
```

### Primer request

```bash
# Validar una transacción BSV
curl -X POST http://localhost:8787/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "0100000001f292fd5e700f48414e0424921dce4316cd675ce21a23be40db92433de25ce0a001000000...",
    "requirements": {
      "address": "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
      "amount": "1000",
      "network": "bsv-testnet"
    },
    "preferences": {
      "language": "es",
      "cognitiveLevel": "simple",
      "outputFormat": "json"
    }
  }'
```

**Respuesta V3 (simplificada - ver respuesta completa más abajo):**
```json
{
  "data": {
    "isValid": true,
    "txid": "8ee1a3901325c09c7c1be8d340ac829fd6d4ab94b998df15fec2c18e021df0e0",
    "payer": "mvccm4ByPmH8baS...",
    "amount": "1000",
    "network": "testnet"
  },
  "accessibility": {
    "content": {
      "byLevel": {
        "beginner": {
          "plainLanguage": "✅ Pago válido",
          "explanation": "Tu pago de Bitcoin es correcto y está listo",
          "stepByStep": [
            { "text": "Tu pago fue verificado", "icon": "✅" },
            { "text": "Ahora se enviará a la red Bitcoin", "icon": "📡" }
          ],
          "glossary": {
            "Bitcoin": "Moneda digital que puedes usar para pagar en internet",
            "Verificado": "Comprobado que todo está correcto"
          }
        },
        "simple": {
          "plainLanguage": "Transacción válida por 1000 satoshis",
          "explanation": "Tu transacción fue verificada exitosamente. El pago se realizará desde mvccm4... hacia mhSDV8... por 1000 satoshis.",
          "stepByStep": [
            "Se validó el formato de la transacción",
            "Se verificó la dirección del destinatario",
            "Se confirmó el monto correcto"
          ]
        },
        "expert": {
          "plainLanguage": "TX validation passed: UTXO verified, signature valid",
          "explanation": "validateBsvTransaction() completed successfully. ECDSA signature validated against input scriptPubKey. Output matches PaymentRequirements: address=mhSDV8..., amount=1000 sats.",
          "stepByStep": [
            "Transaction.fromHex() parsed raw transaction successfully",
            "ECDSA signature validation: passed",
            "UTXO verification against WhatsOnChain API: confirmed",
            "Output validation: address + amount match requirements"
          ]
        }
      }
    },
    "languages": {
      "es": { /* Contenido completo en español */ },
      "en": { /* Contenido completo en inglés */ }
    },
    "visual": {
      "contrast": { "high": {...}, "normal": {...}, "low": {...} },
      "colorBlind": { "deuteranopia": {...}, "protanopia": {...} },
      "fontSize": { "small": {...}, "x-large": {...} },
      "theme": { "light": {...}, "dark": {...} }
    },
    "motor": {
      "keyboard": { "instructions": ["Tab para navegar"], "shortcuts": {...} },
      "voice": { "instructions": ["Di 'confirmar' para continuar"] }
    },
    "formats": {
      "json": "...",
      "markdown": "# Pago válido\n\nTu transacción...",
      "plaintext": "Pago válido. Tu transacción fue verificada...",
      "braille": "...",
      "ssml": "<speak><prosody rate='slow'>Pago válido...</prosody></speak>"
    },
    "recommendations": {
      "cognitiveLevel": "simple",
      "language": "es",
      "confidence": 0.85
    },
    "metadata": {
      "version": 3,
      "generatedBy": "ai",
      "wcagLevel": "AAA"
    }
  }
}
```

Ver más ejemplos en [docs/EXAMPLES.md](./docs/EXAMPLES.md)

---

## Componentes del Proyecto

### 🔧 Facilitador X402 (Principal)

El facilitador que valida y transmite transacciones BSV con metadata accesible.

**Endpoints**:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Health check con redes soportadas |
| `/verify` | POST | Validar transacción BSV sin broadcast |
| `/settle` | POST | Transmitir transacción a blockchain |
| `/preferences` | GET/POST/DELETE | Gestión de preferencias de usuario |

**Código fuente**: `src/facilitator/`

**Documentación**:
- [Quickstart](./specs/001-facilitador-accesible/quickstart.md) - Guía de setup
- [Plan](./specs/001-facilitador-accesible/plan.md) - Arquitectura técnica
- [Data Model](./specs/001-facilitador-accesible/data-model.md) - Schemas Zod
- [Examples](./docs/EXAMPLES.md) - Ejemplos completos
- [**ACCESSIBILITY V2**](./docs/ACCESSIBILITY-V2.md) - Guía completa V2
- [WCAG Compliance](./docs/WCAG-COMPLIANCE.md) - Matriz WCAG 2.2
- [Migration Guide](./docs/MIGRATION-GUIDE.md) - Migración V1 → V2

### 🛡️ Resource Server (Demo)

Servidor de demostración que muestra cómo proteger recursos usando X402 y pagos BSV.

**Endpoints**:
- `GET /api/data` - Recurso protegido que requiere pago BSV (1000 satoshis)

**Documentación**:
- [Setup Completo](./RESOURCE_SERVER_SETUP.md)
- [README](./src/resource-server/README.md)
- [Quickstart](./src/resource-server/QUICKSTART.md)

**Iniciar en desarrollo**:
```bash
# Terminal 1: Facilitador
npm run dev

# Terminal 2: Resource Server
npm run dev:resource
```

---

## Arquitectura V2

### Flujo de Request

```
Cliente (LLM/Wallet)
    ↓
POST /verify con preferences
    ↓
1. Validar transacción BSV (@bsv/sdk)
2. Verificar address + amount + network
3. Consultar KV cache de preferencias
4. Generar metadata accesible:
   ├─ Si AI_ENABLED: OpenAI GPT-3.5/4
   ├─ Si cache hit: Usar cached
   └─ Fallback: Templates ES/EN
5. Validar WCAG 2.2 AAA (78 criterios)
6. Analizar reading level (Flesch-Kincaid)
7. Convertir a formato solicitado (XML/HTML/etc)
    ↓
Response en formato preferido
```

### Tech Stack

| Componente | Tecnología | Versión |
|-----------|------------|---------|
| **Runtime** | Cloudflare Workers | Latest |
| **Framework** | Hono | 4.0+ |
| **BSV SDK** | @bsv/sdk | 1.0+ |
| **Validación** | Zod | 3.22+ |
| **AI** | OpenAI API | GPT-3.5/4 |
| **Cache** | Workers KV | Native |
| **Testing** | Vitest | 2.1+ |
| **Language** | TypeScript | 5.6 (strict) |

### Storage (KV Namespaces)

```toml
# METADATA_CACHE: Cache de respuestas AI
TTL: 7 días (genérico) / 24 horas (específico)
Keys: md5(language:cognitiveLevel:messageType:context)

# USER_PREFERENCES: Preferencias de usuario
TTL: 30 días
Keys: userId
```

---

## Niveles Cognitivos

El sistema adapta las explicaciones según el nivel cognitivo del usuario:

| Nivel | Palabras | Audiencia | Ejemplo |
|-------|----------|-----------|---------|
| **minimal** | ≤50 | Discapacidad cognitiva severa | "Error: Dirección incorrecta. Verifica la dirección." |
| **simple** | ≤100 | Usuario general sin conocimientos técnicos | "La dirección de Bitcoin no es correcta. Verifica que sea una dirección de BSV mainnet." |
| **medium** | ≤200 | Usuario con conocimientos básicos | "La transacción fue rechazada porque la dirección del destinatario es inválida. Una dirección BSV debe empezar con '1' o '3'..." |
| **detailed** | ≤400 | Profesional con contexto técnico | "Error de validación: La dirección falló la verificación Base58Check. Version byte esperado: 0x00 (mainnet)..." |
| **expert** | Sin límite | Desarrollador/experto | "AddressValidationError: Base58Check checksum validation failed. Stack trace: validateBsvAddress() in verify.ts:142..." |

Ver ejemplos completos en [docs/ACCESSIBILITY-V2.md](./docs/ACCESSIBILITY-V2.md#niveles-cognitivos)

---

## Idiomas Soportados

### Pre-validados en Producción

- 🇪🇸 **Español (es)** - Templates + AI
- 🇬🇧 **English (en)** - Templates + AI
- 🇧🇷 **Português (pt)** - AI generado
- 🇫🇷 **Français (fr)** - AI generado
- 🇩🇪 **Deutsch (de)** - AI generado

### Ilimitados via AI

El sistema soporta **190+ idiomas ISO 639-1** mediante generación dinámica con OpenAI:

```bash
curl -X POST /verify \
  -d '{
    "preferences": {
      "language": "ja"  # Japonés
    }
  }'
```

**Respuesta:**
```json
{
  "accessibility": {
    "plainLanguage": "1000サトシの有効なトランザクション",
    "language": "ja"
  }
}
```

---

## Formatos de Salida

### Soportados

| Formato | Content-Type | Caso de Uso |
|---------|-------------|-------------|
| **JSON** | `application/json` | APIs, aplicaciones modernas (default) |
| **XML** | `application/xml` | Sistemas legacy, SOAP, interoperabilidad |
| **HTML** | `text/html` | Navegadores, screen readers con ARIA |
| **Markdown** | `text/markdown` | Documentación, lectores humanos |
| **PlainText** | `text/plain` | TTS, terminales, máxima accesibilidad |
| **JSON-LD** | `application/ld+json` | Semantic web, Schema.org, SEO |

### Ejemplo: Mismo contenido en múltiples formatos

```bash
# JSON (default)
POST /verify { "preferences": { "outputFormat": "json" } }

# HTML con ARIA roles
POST /verify { "preferences": { "outputFormat": "html" } }

# PlainText optimizado para TTS
POST /verify { "preferences": { "outputFormat": "plaintext" } }
```

Ver ejemplos completos en [docs/ACCESSIBILITY-V2.md](./docs/ACCESSIBILITY-V2.md#formatos-de-salida)

---

## Feature Flags V2/V3

El sistema usa feature flags para activar/desactivar funcionalidades:

```toml
# wrangler.toml [env.production.vars]

# V3 Flags (NUEVO)
ACCESSIBILITY_V3_ENABLED = "true"        # Sistema V3 Universal Accessibility
V3_ROLLOUT_PERCENTAGE = "100"            # Rollout gradual 0-100%

# V2 Flags (Activos)
WCAG_COMPLIANCE_ENABLED = "true"         # Validación WCAG 2.2 AAA
MULTILANG_ENABLED = "true"               # Idiomas ilimitados via AI
FORMAT_CONVERSION_ENABLED = "true"       # 8 formatos de salida
READING_LEVEL_ANALYSIS = "true"          # Análisis Flesch-Kincaid
ADAPTIVE_COMPLEXITY_ENABLED = "false"    # Experimental (V2.1)

# AI Configuration
AI_ENABLED = "true"                      # Generación AI de metadata
AI_ROLLOUT_PERCENTAGE = "100"            # 100% tráfico usa AI
OPENAI_MODEL_DEFAULT = "gpt-3.5-turbo"   # Modelo para simple/English
OPENAI_MODEL_COMPLEX = "gpt-4o-mini"     # Modelo para complex/Spanish
OPENAI_MODEL_SIMPLE = "gpt-3.5-turbo"    # V3: Beginner/Simple
OPENAI_MODEL_EXPERT = "gpt-4o"           # V3: Advanced/Expert

# Cache Configuration
CACHE_TTL_GENERIC = "604800"             # 7 días para mensajes genéricos
CACHE_TTL_SPECIFIC = "86400"             # 24 horas para específicos
USER_PREFERENCES_TTL = "2592000"         # 30 días para preferencias

# Network Configuration
NETWORK = "mainnet"                      # bsv-mainnet
WALLET_ADDRESS = "1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86"
```

### Estado Actual (Production - Actualizado 2025-11-30)

| Flag | Estado | Descripción |
|------|--------|-------------|
| `ACCESSIBILITY_V3_ENABLED` | ✅ Active | Sistema completo V3 Universal Accessibility |
| `V3_ROLLOUT_PERCENTAGE` | ✅ 100% | Todo el tráfico usa V3 |
| `AI_ENABLED` | ✅ Active | Metadata generada con OpenAI GPT |
| `AI_ROLLOUT_PERCENTAGE` | ✅ 100% | Todo el tráfico usa AI (fallback a templates) |
| `WCAG_COMPLIANCE_ENABLED` | ✅ Active | Incluye `wcagCompliance` en responses |
| `MULTILANG_ENABLED` | ✅ Active | Permite cualquier idioma ISO 639-1 |
| `FORMAT_CONVERSION_ENABLED` | ✅ Active | 8 formatos: JSON, XML, HTML, MD, Text, JSON-LD, Braille, SSML |
| `READING_LEVEL_ANALYSIS` | ✅ Active | Análisis Flesch-Kincaid en tiempo real |
| `ADAPTIVE_COMPLEXITY_ENABLED` | ⏸️ Disabled | Ajuste automático de nivel (roadmap V3.1) |

---

## Desarrollo

### Comandos disponibles

```bash
# Desarrollo local con hot reload
npm run dev                     # Facilitador en localhost:8787
npm run dev:resource            # Resource server en localhost:8788

# Build de producción
npm run build                   # Dry-run deploy

# Deploy a Cloudflare Workers
npm run deploy                  # Deploy facilitador a production
npm run deploy:resource         # Deploy resource server

# Testing
npm test                        # Run all tests (333)
npm run test:watch              # Watch mode
npm run test:coverage           # Coverage report (80% required)
npm run test:resource           # Test resource server (bash)

# Code Quality
npm run lint                    # ESLint + TypeScript
npm run lint:fix                # Auto-fix issues
npm run format                  # Prettier format
npm run format:check            # Check without changes
npm run typecheck               # TypeScript only
```

### Tests específicos

```bash
# Unit tests
npx vitest run tests/unit/

# Integration tests
npx vitest run tests/integration/

# Archivo específico
npx vitest run tests/unit/verify.test.ts

# Test específico
npx vitest run -t "validates BSV transaction format"
```

### Configurar secrets

```bash
# OpenAI API Key (requerido para AI metadata)
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put OPENAI_API_KEY --env development
```

---

## Deployment

### Producción (Mainnet)

```bash
# Deploy facilitador
npm run deploy

# Verificar deployment
curl https://facilitador-bsv-x402-accesible.tu-cuenta.workers.dev/
```

### Development (Testnet)

```bash
# Deploy a environment development
npx wrangler deploy --env development

# Verificar
curl https://facilitador-bsv-x402-accesible-dev.tu-cuenta.workers.dev/
```

### Environments

| Environment | Network | Wallet Address | AI Rollout | V3 Rollout | URL |
|-------------|---------|----------------|------------|------------|-----|
| **development** | Testnet | `mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk` | 20% | 50% | - |
| **production** | Mainnet | `1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86` | 100% | 100% | [facilitador-bsv-x402-accesible.andresleontest.workers.dev](https://facilitador-bsv-x402-accesible.andresleontest.workers.dev) |

---

## WCAG 2.2 AAA Compliance

El servidor valida automáticamente **78 criterios WCAG 2.2** en cada respuesta:

- ✅ **Nivel A**: 25 criterios
- ✅ **Nivel AA**: 20 criterios
- ✅ **Nivel AAA**: 28 criterios adicionales

**Total**: 78 criterios validados en tiempo real

```json
{
  "wcagCompliance": {
    "version": "2.2",
    "level": "AAA",
    "overall": {
      "totalCriteria": 78,
      "passedCriteria": 78,
      "compliancePercentage": 100
    }
  }
}
```

Ver matriz completa en [docs/WCAG-COMPLIANCE.md](./docs/WCAG-COMPLIANCE.md)

---

## Reading Level Analysis

Análisis automático de legibilidad usando escalas estándar:

```json
{
  "readingLevel": {
    "fleschReadingEase": 85.2,        // 0-100 (100 = más fácil)
    "fleschKincaidGrade": 5.3,        // Años de educación requeridos
    "interpretation": "Fácil de leer para estudiantes de 5to-6to grado",
    "wcagCompliant": true              // AAA requiere ≤9 grado
  }
}
```

### WCAG AAA Requirement

WCAG 2.2 Success Criterion 3.1.5 (AAA):
> "Texto que requiere nivel de lectura superior a educación secundaria básica debe incluir contenido suplementario."

**Límite**: Grado 9 (14-15 años) según Flesch-Kincaid

---

## Estado del Proyecto

**Branch actual**: `feature/universal-accessibility-phase1`
**Branch principal**: `main`

**Fase actual**: ✅ **V3 Production Ready** (Actualizado 2025-11-30)

### Checklist V3 (100% Completado)

- [x] ✅ **Tipos y schemas V3** - `UniversalAccessibilityMetadataV3`
- [x] ✅ **AI Metadata V3** - Generación contextual para todos los niveles
- [x] ✅ **Templates V3 fallback** - ES/EN completos con contenido diferenciado
- [x] ✅ **5 niveles cognitivos** - Beginner, Simple, Medium, Advanced, Expert
- [x] ✅ **3 niveles de abstracción** - Concrete, Mixed, Abstract
- [x] ✅ **Multi-idioma simultáneo** - ES + EN + idiomas adicionales
- [x] ✅ **Accesibilidad visual completa** - Contraste, daltonismo, fuentes, temas
- [x] ✅ **Accesibilidad motora universal** - Teclado, voz, switch, eye-tracking
- [x] ✅ **Accesibilidad auditiva** - TTS optimizado, SSML, pausas
- [x] ✅ **8 formatos de salida** - JSON, XML, HTML, MD, Text, JSON-LD, Braille, SSML
- [x] ✅ **Recomendaciones inteligentes** - Servidor sugiere, cliente decide
- [x] ✅ **Tests V3**: 354/354 pasando (21 tests específicos V3)
- [x] ✅ **Deploy production**: V3 100% activo en mainnet
- [x] ✅ **Documentación V3**: DESIGN, MIGRATION, SUMMARY

### Checklist V2 (100% Completado - Base de V3)

- [x] ✅ Tipos y schemas V2
- [x] ✅ AI Metadata V2 con 5 niveles cognitivos
- [x] ✅ Convertidores de formato (6 formatos)
- [x] ✅ Sistema de caché de preferencias (30 días)
- [x] ✅ Validador WCAG 2.2 AAA (78 criterios)
- [x] ✅ Analizador de reading level (Flesch-Kincaid)
- [x] ✅ Endpoints `/preferences` (GET/POST/DELETE)
- [x] ✅ Infraestructura KV (2 namespaces)
- [x] ✅ Feature flags V2 activados en producción
- [x] ✅ Soporte multilingüe ilimitado vía AI

### Roadmap V3.1 (Próximas versiones)

- [ ] **Adaptive Complexity** - Ajuste automático de nivel cognitivo basado en feedback
- [ ] **Lazy Loading** - Endpoint para solicitar solo niveles/idiomas específicos
- [ ] **Streaming Responses** - Para respuestas muy grandes (>100KB)
- [ ] **Voice Output Nativo** - TTS nativo con AWS Polly / Google Cloud TTS
- [ ] **Más idiomas pre-validados** - Francés, Alemán, Árabe (RTL), Japonés
- [ ] **Advanced Analytics** - User behavior tracking, nivel cognitivo óptimo
- [ ] **Performance Monitoring** - Cache hit rate, tamaño respuestas, latencia AI

---

## Documentación

### Guías Principales V3 (NUEVO)

- 🚀 [**ACCESSIBILITY V3 DESIGN**](./docs/ACCESSIBILITY-V3-DESIGN.md) - Diseño arquitectural V3 completo
- 📖 [**ACCESSIBILITY V3 SUMMARY**](./docs/ACCESSIBILITY-V3-SUMMARY.md) - Resumen ejecutivo V3
- 🔄 [**ACCESSIBILITY V3 MIGRATION**](./docs/ACCESSIBILITY-V3-MIGRATION.md) - Migración V2 → V3
- 📘 [ACCESSIBILITY V2](./docs/ACCESSIBILITY-V2.md) - Guía completa del sistema V2 (base de V3)
- 📋 [WCAG Compliance](./docs/WCAG-COMPLIANCE.md) - Matriz de 78 criterios WCAG 2.2 AAA
- 📝 [Examples](./docs/EXAMPLES.md) - Ejemplos de uso completos
- 🧪 [Testing Guide](./TESTING_GUIDE.md) - Guía de testing

### Specs Técnicas

- [Quickstart](./specs/001-facilitador-accesible/quickstart.md) - Setup inicial
- [Plan](./specs/001-facilitador-accesible/plan.md) - Arquitectura
- [Data Model](./specs/001-facilitador-accesible/data-model.md) - Schemas Zod
- [Research](./specs/001-facilitador-accesible/research.md) - Decisiones de diseño
- [Tasks](./specs/001-facilitador-accesible/tasks.md) - Task breakdown

### Resource Server

- [Setup Completo](./RESOURCE_SERVER_SETUP.md) - Instalación
- [README](./src/resource-server/README.md) - Documentación detallada
- [Quickstart](./src/resource-server/QUICKSTART.md) - Inicio rápido

---

## Ejemplos de Uso

### Caso 1: Validar transacción con preferencias guardadas

```bash
# 1. Guardar preferencias de usuario
curl -X POST http://localhost:8787/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alice@example.com",
    "preferences": {
      "language": "es",
      "cognitiveLevel": "simple",
      "outputFormat": "html",
      "audioOptimized": true,
      "readingLevel": 6,
      "wcagLevel": "AAA"
    }
  }'

# 2. Validar transacción (preferencias se cargan automáticamente)
curl -X POST http://localhost:8787/verify \
  -d '{
    "transaction": "0100000001...",
    "requirements": { ... },
    "userId": "alice@example.com"
  }'
```

### Caso 2: Broadcast en múltiples idiomas

```bash
# Español
POST /settle { "preferences": { "language": "es" } }

# Português
POST /settle { "preferences": { "language": "pt" } }

# 日本語
POST /settle { "preferences": { "language": "ja" } }
```

### Caso 3: Formato PlainText para TTS

```bash
curl -X POST http://localhost:8787/verify \
  -d '{
    "preferences": {
      "outputFormat": "plaintext",
      "audioOptimized": true,
      "cognitiveLevel": "simple"
    }
  }'
```

**Respuesta optimizada para screen readers:**
```
Transacción válida por 1000 satoshis.

La transacción fue verificada exitosamente.
Se realizaron los siguientes pasos:

Paso 1: Se validó el formato de la transacción.
Paso 2: Se verificó la dirección del destinatario.
Paso 3: Se confirmó el monto correcto.

Próximo paso: Transmitir la transacción usando /settle.
```

Ver más en [docs/EXAMPLES.md](./docs/EXAMPLES.md) y [docs/ACCESSIBILITY-V2.md](./docs/ACCESSIBILITY-V2.md#ejemplos-de-uso)

---

## Soporte y Contribuciones

### Reportar Issues

Para reportar bugs o solicitar features:

- **GitHub Issues**: https://github.com/anthropics/claude-code/issues
- **Documentación**: Consultar [CLAUDE.md](./CLAUDE.md)

### Contribuir

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/mi-feature`
3. Commit cambios: `git commit -m 'feat: agregar mi feature'`
4. Push: `git push origin feature/mi-feature`
5. Abrir Pull Request

**Importante:**
- Tests deben pasar: `npm test`
- Coverage ≥80%: `npm run test:coverage`
- Lint sin errores: `npm run lint`
- TypeScript strict mode

---

## Licencia

MIT License - Ver [LICENSE](./LICENSE) para detalles

---

## Links Útiles

- 🌐 **Production (Mainnet)**: https://facilitador-bsv-x402-accesible.andresleontest.workers.dev
- 📚 **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- 🔗 **BSV SDK**: https://docs.bsvblockchain.org/
- ♿ **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- 🤖 **OpenAI API**: https://platform.openai.com/docs/
- 💰 **X402 Protocol**: https://x402.org/
- 🔍 **WhatsOnChain API**: https://developers.whatsonchain.com/

---

**Última actualización:** 2025-11-30
**Versión:** 3.0 (Universal Accessibility)
**Deploy ID:** da1a851b-fa85-426b-86eb-5498b5135c47
**Mantenido por:** Andrés León
