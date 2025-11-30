# Facilitador X402 BSV con Accesibilidad Universal V3

Facilitador X402 para Bitcoin SV diseñado específicamente para **accesibilidad universal**. Permite que usuarios con discapacidades cognitivas y visuales realicen pagos blockchain a través de clientes LLM (Claude Desktop, ChatGPT) con metadata accesible optimizada para TTS y screen readers.

**Principio V3**: *"El servidor provee TODO, el cliente elige lo que necesita"*

**Estado:** ✅ **Production Ready V3** | **Tests:** 354/354 pasando | **WCAG:** 2.2 AAA Compliant

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

### 📚 Contenido Multi-Nivel

- ✅ **5 niveles cognitivos**: `beginner`, `simple`, `medium`, `advanced`, `expert`
- ✅ **3 niveles de abstracción**: `concrete` (ejemplos), `mixed` (teoría+práctica), `abstract` (conceptos)
- ✅ **Contenido rico**: Glosarios, ejemplos, checkpoints, memory aids, hints extendidos

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

- ✅ **333 tests unitarios e integración** (100% pasando)
- ✅ **80% code coverage** (lines, branches, functions)
- ✅ **TypeScript strict mode** con validación Zod
- ✅ **No `any` types** (ESLint enforced)
- ✅ **Cloudflare Workers optimizado**

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

**Respuesta:**
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
    "plainLanguage": "Transacción válida por 1000 satoshis",
    "explanation": "La transacción fue verificada exitosamente. El pago se realizará desde la dirección mvccm4... hacia mhSDV8... por un monto de 1000 satoshis.",
    "stepByStep": [
      "Se validó el formato de la transacción",
      "Se verificó la dirección del destinatario",
      "Se confirmó el monto correcto"
    ],
    "hints": {
      "nextSteps": "Procede a transmitir la transacción usando /settle"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  },
  "wcagCompliance": {
    "level": "AAA",
    "passedCriteria": 78,
    "totalCriteria": 78,
    "compliancePercentage": 100
  },
  "readingLevel": {
    "fleschReadingEase": 85.2,
    "fleschKincaidGrade": 5.3,
    "wcagCompliant": true
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

## Feature Flags V2

El sistema usa feature flags para activar/desactivar funcionalidades:

```toml
# wrangler.toml [env.production.vars]

WCAG_COMPLIANCE_ENABLED = "true"      # Validación WCAG 2.2 AAA
MULTILANG_ENABLED = "true"            # Idiomas ilimitados via AI
FORMAT_CONVERSION_ENABLED = "true"    # 6 formatos de salida
READING_LEVEL_ANALYSIS = "true"       # Análisis Flesch-Kincaid
ADAPTIVE_COMPLEXITY_ENABLED = "false" # Experimental (V2.1)
```

### Estado Actual (Production)

| Flag | Estado | Descripción |
|------|--------|-------------|
| `WCAG_COMPLIANCE_ENABLED` | ✅ Active | Incluye `wcagCompliance` en responses |
| `MULTILANG_ENABLED` | ✅ Active | Permite cualquier idioma ISO 639-1 |
| `FORMAT_CONVERSION_ENABLED` | ✅ Active | Habilita conversión a XML/HTML/etc |
| `READING_LEVEL_ANALYSIS` | ✅ Active | Incluye análisis Flesch-Kincaid |
| `ADAPTIVE_COMPLEXITY_ENABLED` | ⏸️ Disabled | Ajuste automático de nivel (V2.1) |

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

| Environment | Network | Wallet Address | AI Rollout |
|-------------|---------|----------------|------------|
| **development** | Testnet | `mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk` | 20% |
| **production** | Mainnet | `1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86` | 100% |

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

**Fase actual**: ✅ **V2 Production Ready**

### Checklist V2 (100% Completado)

- [x] ✅ Tipos y schemas V2
- [x] ✅ AI Metadata V2 con 5 niveles cognitivos
- [x] ✅ Convertidores de formato (JSON, XML, HTML, MD, Text, JSON-LD)
- [x] ✅ Sistema de caché de preferencias (30 días)
- [x] ✅ Validador WCAG 2.2 AAA (78 criterios)
- [x] ✅ Analizador de reading level (Flesch-Kincaid)
- [x] ✅ Endpoints `/preferences` (GET/POST/DELETE)
- [x] ✅ Tests: 333/333 pasando
- [x] ✅ Infraestructura KV (2 namespaces)
- [x] ✅ Feature flags V2 activados en producción
- [x] ✅ Soporte multilingüe ilimitado vía AI
- [x] ✅ Documentación V2

### Backlog V2.1 (Próximas versiones)

- [ ] Adaptive Complexity (ajuste automático nivel cognitivo)
- [ ] Voice Output (TTS nativo con AWS Polly / Google Cloud TTS)
- [ ] Visual Customization (themes, dark mode, font size)
- [ ] Advanced Analytics (user behavior tracking)
- [ ] Templates estáticos PT/FR/DE (opcional, AI ya cubre esto)

---

## Documentación

### Guías Principales

- 📘 [**ACCESSIBILITY V2**](./docs/ACCESSIBILITY-V2.md) - Guía completa del sistema V2
- 📋 [WCAG Compliance](./docs/WCAG-COMPLIANCE.md) - Matriz de 78 criterios
- 🔄 [Migration Guide](./docs/MIGRATION-GUIDE.md) - Migración V1 → V2
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

- 🌐 **Production**: https://facilitador-bsv-x402-accesible.tu-cuenta.workers.dev
- 🧪 **Development**: https://facilitador-bsv-x402-accesible-dev.tu-cuenta.workers.dev
- 📚 **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- 🔗 **BSV SDK**: https://docs.bsvblockchain.org/
- ♿ **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- 🤖 **OpenAI API**: https://platform.openai.com/docs/

---

**Última actualización:** 2025-11-30
**Versión:** 2.0
**Mantenido por:** [Tu Nombre/Organización]
