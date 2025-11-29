# Plan: Integración de IA para Generación de Metadata Accesible

## Resumen Ejecutivo

Integrar OpenAI GPT (3.5-turbo/4o-mini) para generar dinámicamente metadata de accesibilidad en el facilitador BSV X402, manteniendo templates estáticos como fallback y usando caché KV para optimizar costos.

**Esfuerzo estimado**: 30-43 horas
**Riesgo**: Medio (dependencia API externa, gestión de costos)
**Rollout**: Gradual con feature flags (20% → 50% → 100%)

## Decisiones Clave del Usuario

- **Proveedor IA**: OpenAI (GPT-4/GPT-3.5-turbo)
- **Prioridad**: Balance costo-calidad
- **Fallback**: Sí, usar templates si IA falla
- **Caché**: Por idioma/nivel cognitivo

## Arquitectura Propuesta

### 1. Nuevo Servicio: `src/facilitator/accessibility/ai-metadata.ts`

**Función principal**:
```typescript
async function createMetadataWithAI(
  messageType: string,        // 'success.verifyValid', 'errors.verify.invalidAmount', etc.
  context: MetadataContext,    // { amount?, address?, txid?, ... }
  preferences: AccessibilityPreferences,  // { language, cognitiveLevel, audioFriendly }
  env: Env                     // Cloudflare bindings (KV, secrets)
): Promise<AccessibleMetadata>
```

**Flujo de ejecución**:
1. Verificar feature flags (AI_ENABLED, AI_ROLLOUT_PERCENTAGE)
2. Buscar en caché KV (clave: `ai-meta:{language}:{cognitiveLevel}:{messageType}:{contextHash}`)
3. Si cache hit → retornar inmediatamente
4. Si cache miss → llamar OpenAI API con timeout 5s
5. Validar respuesta JSON (schema, límites de caracteres)
6. Si éxito → cachear y retornar
7. Si fallo → fallback a templates estáticos (i18n.ts)

**Componentes**:
- `generateFromOpenAI()`: Llamada a OpenAI Chat Completions
- `getCachedMetadata()`: Lookup en KV
- `setCachedMetadata()`: Almacenar en KV con TTL
- `fallbackToTemplate()`: Usar i18n templates existentes
- `selectModel()`: Elegir modelo según complejidad
- `hashContext()`: Generar hash FNV-1a para cache key

### 2. Estrategia de Caché

**Cloudflare KV** con estructura de claves:
```
ai-meta:{language}:{cognitiveLevel}:{messageType}:{contextHash}
```

**Ejemplos**:
- `ai-meta:es:simple:success.verifyValid:generic`
- `ai-meta:en:medium:errors.verify.invalidAmount:a3f2b1c9`

**TTL**:
- Mensajes genéricos: 7 días (604800s)
- Mensajes específicos (con txid/montos): 24 horas (86400s)

**Impacto esperado**: 60-80% cache hit rate después de 24 horas

### 3. Selección de Modelo OpenAI

**Árbol de decisión**:
```
if (success message && cognitiveLevel === 'simple' && language === 'en')
  → gpt-3.5-turbo ($0.50-$1.50 per 1M tokens)

else if (error message && cognitiveLevel === 'advanced')
  → env.OPENAI_MODEL_COMPLEX (configurable: gpt-4o-mini o gpt-4)

else if (language === 'en')
  → gpt-3.5-turbo

else
  → env.OPENAI_MODEL_DEFAULT (gpt-4o-mini recomendado para español)
```

**Costos estimados** (1000 requests/día):
- Con 70% cache hit: $5-10/mes
- Sin cache: $50-150/mes
- Peor caso (todo GPT-4): $300/mes

### 4. Prompt Engineering

**System prompt** (condensado):
```
You are an accessibility expert for blockchain payments.
Language: {language}
Cognitive Level: {cognitiveLevel} (simple=6th grade, medium=high school, advanced=college)
Audio Friendly: {audioFriendly}

CONSTRAINTS:
- plainLanguage: ≤100 chars
- explanation: ≤300 chars
- stepByStep: ≤5 items, each ≤80 chars
- hints.ifError: ≤150 chars
- hints.nextSteps: ≤150 chars
- hints.commonMistakes: ≤3 items, each ≤100 chars

OUTPUT: Valid JSON only, no markdown, no comments
{
  "plainLanguage": "...",
  "explanation": "...",
  "stepByStep": ["...", "..."],
  "hints": { "ifError": "...", "commonMistakes": [...], "nextSteps": "..." }
}
```

**User prompt**:
```
Message Type: {messageType}
Scenario: {hardcodedScenarioDescription}
Context: {contextJSON}

Generate accessibility metadata in {language} at {cognitiveLevel} complexity.
```

### 5. Cambios en Código Existente

#### `src/facilitator/types.ts` (AGREGAR ~20 líneas)
```typescript
export interface Env {
  // Secrets
  OPENAI_API_KEY: string;

  // Config
  AI_ENABLED: string;
  AI_ROLLOUT_PERCENTAGE: string;
  OPENAI_MODEL_DEFAULT: string;
  OPENAI_MODEL_COMPLEX: string;
  CACHE_TTL_GENERIC: string;
  CACHE_TTL_SPECIFIC: string;

  // KV
  METADATA_CACHE: KVNamespace;

  // Existing
  WALLET_ADDRESS: string;
  NETWORK: 'mainnet' | 'testnet';
}
```

#### `src/facilitator/index.ts` (MODIFICAR 16 líneas)

**Patrón de cambio** (repetir en 8 call sites):
```typescript
// ANTES
const metadata = createMetadataFromTemplate(
  msgs.success.verifyValid,
  { amount: '1000', address: 'mfW...' },
  cognitiveLevel,
  audioFriendly,
  language
);

// DESPUÉS
const metadata = await createMetadataWithAI(
  'success.verifyValid',
  { amount: '1000', address: 'mfW...' },
  { language, cognitiveLevel, audioFriendly },
  c.env
);
```

**Call sites** (líneas aproximadas):
- GET /: línea 75
- POST /verify: líneas 125, 141, 154, 168 (4 casos)
- POST /settle: líneas 231, 246, 258, 269 (4 casos)

**Nota**: Agregar `async` a handler de GET / (actualmente sync)

#### `wrangler.toml` (AGREGAR configuración)

```toml
# KV Namespace
[[kv_namespaces]]
binding = "METADATA_CACHE"
id = "YOUR_PRODUCTION_KV_ID"  # crear con wrangler

[env.development.vars]
AI_ENABLED = "true"
AI_ROLLOUT_PERCENTAGE = "20"  # empezar bajo
OPENAI_MODEL_DEFAULT = "gpt-4o-mini"
OPENAI_MODEL_COMPLEX = "gpt-4o-mini"
CACHE_TTL_GENERIC = "604800"
CACHE_TTL_SPECIFIC = "86400"

[[env.development.kv_namespaces]]
binding = "METADATA_CACHE"
id = "YOUR_DEV_KV_ID"

[env.production.vars]
AI_ENABLED = "true"
AI_ROLLOUT_PERCENTAGE = "100"  # gradual: 20→50→100
OPENAI_MODEL_DEFAULT = "gpt-3.5-turbo"
OPENAI_MODEL_COMPLEX = "gpt-4o-mini"
CACHE_TTL_GENERIC = "604800"
CACHE_TTL_SPECIFIC = "86400"

[[env.production.kv_namespaces]]
binding = "METADATA_CACHE"
id = "YOUR_PRODUCTION_KV_ID"
```

### 6. Testing

#### `tests/helpers/ai-mocks.ts` (NUEVO)
- `createMockEnv()`: Mock Env con valores de prueba
- `createMockKV()`: Mock KVNamespace en memoria
- `mockOpenAISuccess()`: Mock fetch exitoso
- `mockOpenAIError()`: Mock fetch con error
- `mockOpenAITimeout()`: Mock timeout

#### `tests/unit/accessibility/ai-metadata.test.ts` (NUEVO, ~30 tests)
**Categorías**:
1. Feature flags (AI_ENABLED, rollout percentage)
2. Caching (hit, miss, TTL)
3. OpenAI integration (success, error, timeout)
4. Fallback logic
5. Model selection
6. Context hashing
7. Schema validation

#### `tests/integration/ai-metadata-flow.test.ts` (NUEVO, ~5 tests)
- GET / con IA habilitada
- POST /verify con IA
- POST /settle con caché
- Fallback en fallo de IA
- Rendimiento bajo carga

### 7. Comandos de Setup

```bash
# 1. Crear KV namespaces
wrangler kv:namespace create "METADATA_CACHE"  # producción
wrangler kv:namespace create "METADATA_CACHE" --preview  # desarrollo

# 2. Configurar secret
wrangler secret put OPENAI_API_KEY --env development
wrangler secret put OPENAI_API_KEY --env production

# 3. Instalar dependencias (si no están)
npm install --save-dev @cloudflare/workers-types

# 4. Ejecutar tests
npm run test

# 5. Deploy development
wrangler deploy --env development

# 6. Deploy production (gradual)
wrangler deploy --env production
```

### 8. Plan de Rollout

**Fase 1: Desarrollo (Semana 1)**
- [ ] Crear `ai-metadata.ts` (~500 líneas)
- [ ] Modificar `index.ts` (8 call sites → async)
- [ ] Agregar `Env` interface en `types.ts`
- [ ] Configurar `wrangler.toml`
- [ ] Escribir tests (~30 unit + 5 integration)
- [ ] Testing local con `wrangler dev`

**Fase 2: Staging (Semana 2)**
- [ ] Crear KV namespaces dev
- [ ] Configurar OPENAI_API_KEY dev
- [ ] Deploy a development env
- [ ] Monitorear performance:
  - Latency P95 < 4s
  - Cache hit rate > 50% después 24h
  - Costos < $1/día
  - Error rate < 1%

**Fase 3A: Producción 20% (Semana 3)**
- [ ] Crear KV namespaces prod
- [ ] Configurar OPENAI_API_KEY prod
- [ ] Set `AI_ROLLOUT_PERCENTAGE = "20"`
- [ ] Deploy a production
- [ ] Monitorear 2-3 días:
  - Comparar calidad IA vs templates
  - Verificar costos ($5/día máx)
  - Revisar errores

**Fase 3B: Producción 50% (Semana 4)**
- [ ] Aumentar a `AI_ROLLOUT_PERCENTAGE = "50"`
- [ ] Redeploy
- [ ] Monitorear 3-5 días
- [ ] Ajustar prompts si necesario

**Fase 3C: Producción 100% (Semana 5)**
- [ ] Aumentar a `AI_ROLLOUT_PERCENTAGE = "100"`
- [ ] Redeploy
- [ ] Monitoreo continuo

**Rollback instantáneo** (en cualquier momento):
```toml
AI_ENABLED = "false"  # Volver a templates 100%
```

## Archivos Críticos a Modificar

| Archivo | Tipo | Líneas | Complejidad |
|---------|------|--------|-------------|
| `src/facilitator/accessibility/ai-metadata.ts` | NUEVO | ~500 | Alta |
| `src/facilitator/index.ts` | MODIFICAR | ~30 | Media |
| `src/facilitator/types.ts` | MODIFICAR | ~20 | Baja |
| `wrangler.toml` | MODIFICAR | ~40 | Baja |
| `tests/helpers/ai-mocks.ts` | NUEVO | ~100 | Media |
| `tests/unit/accessibility/ai-metadata.test.ts` | NUEVO | ~400 | Media |
| `tests/integration/ai-metadata-flow.test.ts` | NUEVO | ~150 | Media |

## Mitigación de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Timeout de OpenAI (>5s) | Media | Alto | Timeout 5s + fallback a templates |
| Costos excesivos | Baja | Alto | Cache 60-80% + rollout gradual + alertas |
| Mala calidad de IA | Media | Medio | Validación schema + revisión manual en fase 20% |
| Workers timeout (>30s) | Baja | Alto | Timeout OpenAI 5s max garantiza < 30s total |
| Cache envenenado | Baja | Bajo | Validación JSON antes de cachear |

## Estructura del Nuevo Archivo `ai-metadata.ts`

```typescript
// Imports
import type { AccessibleMetadata, MetadataContext, Env } from '../types';
import { messages, messagesEN, createMetadataFromTemplate } from './i18n';

// Constants
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT = 5000; // 5s
const SCENARIO_DESCRIPTIONS = { /* ... */ };

// Types
interface AIOptions { /* ... */ }

// Main export
export async function createMetadataWithAI(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferences,
  env: Env
): Promise<AccessibleMetadata> {
  // 1. Check feature flags
  if (!shouldUseAI(env)) {
    return fallbackToTemplate(messageType, context, preferences);
  }

  // 2. Check cache
  const cached = await getCachedMetadata(messageType, context, preferences, env);
  if (cached) return cached;

  // 3. Try OpenAI
  try {
    const metadata = await generateFromOpenAI(messageType, context, preferences, env);
    if (metadata) {
      await setCachedMetadata(messageType, context, preferences, metadata, env);
      return metadata;
    }
  } catch (error) {
    logger.warn('OpenAI generation failed, falling back to template', { error });
  }

  // 4. Fallback
  return fallbackToTemplate(messageType, context, preferences);
}

// Helper functions
function shouldUseAI(env: Env): boolean { /* rollout % logic */ }
async function getCachedMetadata(...): Promise<AccessibleMetadata | null> { /* KV get */ }
async function setCachedMetadata(...): Promise<void> { /* KV put with TTL */ }
async function generateFromOpenAI(...): Promise<AccessibleMetadata | null> { /* OpenAI call */ }
function fallbackToTemplate(...): AccessibleMetadata { /* use i18n */ }
function selectModel(...): string { /* decision tree */ }
function buildSystemPrompt(...): string { /* prompt template */ }
function buildUserPrompt(...): string { /* context injection */ }
function hashContext(context: MetadataContext): string { /* FNV-1a */ }
function validateMetadata(data: any): boolean { /* schema check */ }
```

## Estimación de Esfuerzo

| Fase | Tareas | Horas |
|------|--------|-------|
| Desarrollo | ai-metadata.ts + modificaciones + types | 10-12 |
| Testing | Mocks + unit tests + integration tests | 7-11 |
| Setup | KV + secrets + wrangler.toml | 1-2 |
| Staging | Deploy + monitor + ajustes | 4-6 |
| Producción | Rollout gradual (20→50→100) + monitoring | 8-12 |
| **TOTAL** | | **30-43 horas** |

**Timeline recomendado**: 3-4 semanas (part-time) o 1.5-2 semanas (full-time)

## Próximos Pasos Inmediatos

1. ✅ Revisar y aprobar este plan
2. Obtener API key de OpenAI (https://platform.openai.com)
3. Comenzar Fase 1 (Desarrollo):
   - Implementar `ai-metadata.ts`
   - Modificar archivos existentes
   - Escribir tests completos
4. Testing exhaustivo local
5. Deploy a staging
6. Rollout gradual a producción

## Notas de Implementación

- **No eliminar templates existentes**: Mantener `i18n.ts` completo como fallback
- **Async conversion**: Todos los handlers que llaman metadata deben ser async
- **Error handling**: Nunca dejar que fallo de IA rompa flujo de pago
- **Logging**: Log todas las llamadas OpenAI para análisis de costos
- **Testing**: Mockear agresivamente OpenAI en tests (no hacer llamadas reales)
- **Secrets**: NUNCA commitear OPENAI_API_KEY en git (usar `wrangler secret`)
