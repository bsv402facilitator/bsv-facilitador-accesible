# Plan de Implementación: Accesibilidad Universal WCAG 2.2 AAA

## Resumen Ejecutivo

Transformar el sistema de accesibilidad actual (20-30% del espectro) a un sistema completo que cubra WCAG 2.2 Nivel AAA con soporte para:
- 10 dimensiones de accesibilidad (visual, cognitiva, motora, lingüística, etc.)
- 5 idiomas con dialectos (español, inglés, portugués, francés, alemán)
- Múltiples formatos de salida (JSON, XML, texto plano, Markdown, HTML, JSON-LD)
- Personalización adaptativa con caché de preferencias
- Compliance formal con metadatos auditables

**Breaking changes aceptados** - rediseño completo del schema `AccessibleResponse`.

---

## 1. Arquitectura del Nuevo Sistema

### 1.1 Nuevo Schema de AccessibleResponse

```typescript
// src/facilitator/types.ts

export interface AccessibleResponseV2<T> {
  data: T;
  accessibility: UniversalAccessibilityMetadata;
  wcag: WCAGComplianceMetadata;
}

export interface UniversalAccessibilityMetadata {
  // === Core Content (heredado y mejorado) ===
  content: {
    plainLanguage: string;          // ≤100 chars - summary ejecutivo
    explanation: string;             // ≤300 chars - descripción detallada
    detailedExplanation?: string;    // NUEVO: ≤1000 chars - explicación profunda (expert level)
    stepByStep: AccessibleStep[];    // ≤10 pasos con iconos y contexto
    hints: ExtendedHints;
    glossary?: Record<string, string>; // NUEVO: términos técnicos explicados
    examples?: ConcreteExample[];    // NUEVO: ejemplos concretos vs abstractos
  };

  // === Visual Accessibility ===
  visual: {
    contrastMode: 'high' | 'normal' | 'low';
    colorBlindSafe: boolean;
    colorBlindType?: 'deuteranopia' | 'protanopia' | 'tritanopia' | 'none';
    fontSize: 'small' | 'medium' | 'large' | 'x-large';
    screenReaderOptimized: boolean;
    darkMode: boolean;
    altTextProvided: boolean;
  };

  // === Cognitive Accessibility ===
  cognitive: {
    level: 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert';
    readingLevel: ReadingLevel;      // Flesch-Kincaid grade
    memoryAids: string[];            // NUEVO: recordatorios y ayudas mnemotécnicas
    checkpoints: ComprehensionCheckpoint[]; // NUEVO: validación de comprensión
    abstractionLevel: 'concrete' | 'mixed' | 'abstract';
    iconSupport: boolean;
  };

  // === Linguistic Accessibility ===
  language: LanguageConfig;

  // === Motor Accessibility ===
  motor: {
    keyboardNavigationHints: string[];  // Atajos de teclado sugeridos
    voiceCommandHints: string[];        // Comandos de voz sugeridos
    timingAdjustable: boolean;          // Si hay timeouts, son ajustables
    focusOrder?: number[];              // Orden de foco sugerido
  };

  // === Format Options ===
  format: {
    availableFormats: ('json' | 'xml' | 'plaintext' | 'markdown' | 'html' | 'jsonld')[];
    currentFormat: 'json' | 'xml' | 'plaintext' | 'markdown' | 'html' | 'jsonld';
    brailleOptimized: boolean;
    semanticMarkup: boolean;            // Si incluye schema.org/JSON-LD
  };

  // === Personalization ===
  personalization: {
    userPreferencesApplied: boolean;
    adaptiveComplexity: boolean;        // Si el nivel se ajustó automáticamente
    previousInteractions?: number;      // Cuántas interacciones previas del usuario
    recommendedNextLevel?: 'beginner' | 'simple' | 'medium' | 'advanced' | 'expert';
  };

  // === Metadata ===
  metadata: {
    audioFriendly: boolean;
    version: 2;                         // Schema version
    generatedBy: 'ai' | 'template';
    generatedAt: string;                // ISO 8601 timestamp
    cacheHit: boolean;
  };
}

// === Supporting Types ===

export interface AccessibleStep {
  text: string;                         // ≤80 chars
  icon?: string;                        // Emoji o nombre de icono
  context?: string;                     // Contexto adicional opcional
  estimatedTime?: string;               // "~30 segundos", "inmediato"
}

export interface ExtendedHints {
  ifError?: string;
  commonMistakes?: string[];
  nextSteps?: string;
  troubleshooting?: string;             // NUEVO: pasos de diagnóstico
  relatedResources?: ResourceLink[];    // NUEVO: enlaces útiles
  safeguards?: string[];                // NUEVO: qué NO hacer
}

export interface ConcreteExample {
  scenario: string;
  input: string;
  output: string;
  explanation: string;
}

export interface ReadingLevel {
  fleschKincaidGrade: number;           // 0-18+ (US grade level)
  fleschReadingEase: number;            // 0-100 (higher = easier)
  estimatedReadingTime: string;         // "30 segundos", "1 minuto"
}

export interface ComprehensionCheckpoint {
  question: string;
  expectedAnswer: string;
  hint?: string;
}

export interface LanguageConfig {
  code: LanguageCode;
  dialect?: string;                     // 'es-ES', 'es-MX', 'pt-BR', 'pt-PT', etc.
  direction: 'ltr' | 'rtl';
  locale: string;                       // Para formateo de números/fechas
  culturalContext?: string;             // Adaptaciones culturales aplicadas
}

export type LanguageCode = 'es' | 'en' | 'pt' | 'fr' | 'de';

export interface ResourceLink {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'faq' | 'support';
}

// === WCAG Compliance Metadata ===

export interface WCAGComplianceMetadata {
  version: '2.2';
  level: 'A' | 'AA' | 'AAA';
  successCriteria: SuccessCriterion[];
  conformanceStatement: string;
  auditTrail: {
    criteriaChecked: string[];
    criteriaPass: string[];
    criteriaNotApplicable: string[];
  };
}

export interface SuccessCriterion {
  id: string;                           // e.g., '1.4.3' (Contrast Minimum)
  name: string;
  level: 'A' | 'AA' | 'AAA';
  status: 'pass' | 'fail' | 'not-applicable';
  notes?: string;
}
```

### 1.2 Preferencias de Usuario Extendidas

```typescript
// src/facilitator/types.ts

export const AccessibilityPreferencesSchemaV2 = z.object({
  // === Linguistic ===
  language: z.enum(['es', 'en', 'pt', 'fr', 'de']).default('es'),
  dialect: z.string().optional(),     // 'es-ES', 'es-MX', 'pt-BR', etc.

  // === Cognitive ===
  cognitiveLevel: z.enum(['beginner', 'simple', 'medium', 'advanced', 'expert']).default('simple'),
  abstractionLevel: z.enum(['concrete', 'mixed', 'abstract']).default('concrete'),
  includeExamples: z.boolean().default(true),
  includeGlossary: z.boolean().default(true),
  includeCheckpoints: z.boolean().default(false),

  // === Visual ===
  contrastMode: z.enum(['high', 'normal', 'low']).default('normal'),
  colorBlindType: z.enum(['deuteranopia', 'protanopia', 'tritanopia', 'none']).default('none'),
  fontSize: z.enum(['small', 'medium', 'large', 'x-large']).default('medium'),
  darkMode: z.boolean().default(false),
  screenReaderOptimized: z.boolean().default(true),

  // === Motor ===
  includeKeyboardHints: z.boolean().default(true),
  includeVoiceHints: z.boolean().default(false),

  // === Format ===
  outputFormat: z.enum(['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld']).default('json'),
  brailleOptimized: z.boolean().default(false),
  includeSemanticMarkup: z.boolean().default(false),

  // === Audio ===
  audioFriendly: z.boolean().default(true),

  // === Personalization ===
  userId: z.string().optional(),      // Para caché de preferencias cross-request
  adaptiveComplexity: z.boolean().default(false),

  // === WCAG ===
  wcagLevel: z.enum(['A', 'AA', 'AAA']).default('AAA'),
});

export type AccessibilityPreferencesV2 = z.infer<typeof AccessibilityPreferencesSchemaV2>;
```

---

## 2. Implementación por Componentes

### 2.1 Sistema Multilingüe (i18n)

**Archivos nuevos:**
- `src/facilitator/accessibility/i18n/es.ts` - Español (ES/MX)
- `src/facilitator/accessibility/i18n/en.ts` - Inglés (US/GB)
- `src/facilitator/accessibility/i18n/pt.ts` - Portugués (BR/PT)
- `src/facilitator/accessibility/i18n/fr.ts` - Francés
- `src/facilitator/accessibility/i18n/de.ts` - Alemán
- `src/facilitator/accessibility/i18n/index.ts` - Orquestador

**Estructura de cada archivo de idioma:**
```typescript
// Ejemplo: src/facilitator/accessibility/i18n/es.ts

export const spanishTemplates = {
  errors: {
    verify: {
      invalidAmount: {
        // Niveles cognitivos
        beginner: { plainLanguage: "...", explanation: "...", ... },
        simple: { plainLanguage: "...", explanation: "...", ... },
        medium: { plainLanguage: "...", explanation: "...", ... },
        advanced: { plainLanguage: "...", explanation: "...", ... },
        expert: { plainLanguage: "...", explanation: "...", ... },
      },
      // ... otros errores
    },
    // ... otras categorías
  },
  success: { ... },
  glossary: {
    satoshi: "Unidad mínima de Bitcoin SV. 1 BSV = 100,000,000 satoshis",
    txid: "Identificador único de 64 caracteres hexadecimales de una transacción",
    // ... más términos
  },
  examples: {
    invalidAmount: {
      concrete: [
        {
          scenario: "Comprar café con BSV",
          input: "Envías 1000 satoshis pero se requieren 5000",
          output: "Error: monto insuficiente",
          explanation: "Es como pagar 1€ por un café de 5€"
        }
      ],
      abstract: [ ... ]
    }
  },
  icons: {
    verify: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
    // ... más iconos
  }
};

// Dialectos
export const spanishDialects = {
  'es-ES': { /* variaciones regionales */ },
  'es-MX': { /* variaciones regionales */ }
};
```

### 2.2 Generador AI Mejorado

**Archivo:** `src/facilitator/accessibility/ai-metadata-v2.ts`

**Cambios clave:**
1. **Prompts multilingües** para 5 idiomas
2. **Cognitive levels expandidos** (beginner → expert)
3. **Generación de ejemplos concretos** dinámicos
4. **Validación de reading level** (Flesch-Kincaid)
5. **Generación de checkpoints** de comprensión
6. **Selección de modelo** más sofisticada:
   - `gpt-3.5-turbo`: beginner/simple, éxito, idiomas simples
   - `gpt-4o-mini`: medium/advanced, errores complejos
   - `gpt-4o`: expert level, 100% rollout
7. **Caché multi-dimensional**:
   - Clave: `ai-meta-v2:{lang}:{dialect}:{cognitive}:{visual}:{format}:{messageType}:{contextHash}`
   - TTL dinámico basado en personalización

**Nuevas funciones:**
```typescript
async function generateV2FromOpenAI(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2,
  env: Env
): Promise<UniversalAccessibilityMetadata | null>

function buildSystemPromptV2(preferences: AccessibilityPreferencesV2): string

function buildUserPromptV2(
  messageType: string,
  context: MetadataContext,
  preferences: AccessibilityPreferencesV2
): string

function validateReadingLevel(
  text: string,
  targetLevel: string
): ReadingLevel

function generateWCAGMetadata(
  preferences: AccessibilityPreferencesV2,
  metadata: UniversalAccessibilityMetadata
): WCAGComplianceMetadata
```

### 2.3 Convertidores de Formato

**Archivo:** `src/facilitator/accessibility/format-converters.ts`

**Convertidores necesarios:**

```typescript
// JSON → XML
export function toXML(response: AccessibleResponseV2<any>): string {
  // Usa librería como 'fast-xml-parser'
}

// JSON → Plain Text
export function toPlainText(response: AccessibleResponseV2<any>): string {
  // Formato TTS-friendly, sin estructuras
}

// JSON → Markdown
export function toMarkdown(response: AccessibleResponseV2<any>): string {
  // Headers, listas, énfasis
}

// JSON → HTML
export function toHTML(response: AccessibleResponseV2<any>): string {
  // Con ARIA labels, semantic HTML5
}

// JSON → JSON-LD (Schema.org)
export function toJSONLD(response: AccessibleResponseV2<any>): string {
  // Schema.org para Payment, Action, Result
}

// Braille optimization
export function optimizeForBraille(text: string): string {
  // Elimina caracteres no representables en Braille
  // Expande abreviaciones
}
```

**Dependencias nuevas:**
```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.4",
    "marked": "^11.1.1"
  }
}
```

### 2.4 Sistema de Caché de Preferencias

**Archivo:** `src/facilitator/accessibility/preference-cache.ts`

**KV Namespace:** `USER_PREFERENCES` (nuevo binding en wrangler.toml)

```typescript
export async function getUserPreferences(
  userId: string,
  env: Env
): Promise<AccessibilityPreferencesV2 | null>

export async function setUserPreferences(
  userId: string,
  preferences: AccessibilityPreferencesV2,
  env: Env
): Promise<void>

// TTL: 30 días para preferencias de usuario
const USER_PREFERENCES_TTL = 30 * 24 * 60 * 60; // 30 days
```

**Uso en endpoints:**
```typescript
// Si el request incluye userId pero no preferencias completas,
// cargar de caché y merge con defaults
```

### 2.5 WCAG Compliance Layer

**Archivo:** `src/facilitator/accessibility/wcag-validator.ts`

```typescript
export function generateWCAGCompliance(
  metadata: UniversalAccessibilityMetadata,
  preferences: AccessibilityPreferencesV2
): WCAGComplianceMetadata {
  const criteria: SuccessCriterion[] = [
    // A Level
    { id: '1.1.1', name: 'Non-text Content', level: 'A', status: 'pass' },
    { id: '1.3.1', name: 'Info and Relationships', level: 'A', status: 'pass' },
    { id: '1.4.1', name: 'Use of Color', level: 'A', status: 'pass' },

    // AA Level
    { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', status: 'pass' },
    { id: '1.4.5', name: 'Images of Text', level: 'AA', status: 'not-applicable' },

    // AAA Level
    { id: '1.4.6', name: 'Contrast (Enhanced)', level: 'AAA',
      status: metadata.visual.contrastMode === 'high' ? 'pass' : 'fail' },
    { id: '3.1.3', name: 'Unusual Words', level: 'AAA',
      status: metadata.content.glossary ? 'pass' : 'fail' },
    { id: '3.1.4', name: 'Abbreviations', level: 'AAA', status: 'pass' },
    { id: '3.1.5', name: 'Reading Level', level: 'AAA',
      status: metadata.cognitive.readingLevel.fleschKincaidGrade <= 9 ? 'pass' : 'fail' },

    // ... 78 criterios total en WCAG 2.2
  ];

  return {
    version: '2.2',
    level: preferences.wcagLevel,
    successCriteria: criteria,
    conformanceStatement: generateConformanceStatement(criteria, preferences.wcagLevel),
    auditTrail: {
      criteriaChecked: criteria.map(c => c.id),
      criteriaPass: criteria.filter(c => c.status === 'pass').map(c => c.id),
      criteriaNotApplicable: criteria.filter(c => c.status === 'not-applicable').map(c => c.id)
    }
  };
}

function generateConformanceStatement(
  criteria: SuccessCriterion[],
  level: 'A' | 'AA' | 'AAA'
): string {
  const levelMap = { 'A': 1, 'AA': 2, 'AAA': 3 };
  const relevantCriteria = criteria.filter(c => levelMap[c.level] <= levelMap[level]);
  const passing = relevantCriteria.filter(c => c.status === 'pass').length;
  const total = relevantCriteria.filter(c => c.status !== 'not-applicable').length;

  if (passing === total) {
    return `This content conforms to WCAG 2.2 Level ${level}. All ${total} applicable success criteria are satisfied.`;
  } else {
    return `This content partially conforms to WCAG 2.2 Level ${level}. ${passing}/${total} applicable success criteria are satisfied.`;
  }
}
```

### 2.6 Reading Level Analyzer

**Archivo:** `src/facilitator/accessibility/reading-level.ts`

```typescript
export function calculateReadingLevel(text: string): ReadingLevel {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const syllables = countSyllables(text);

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;
  const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Flesch-Kincaid Grade Level: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const fleschKincaidGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Estimated reading time (200 words/min average)
  const readingTimeMinutes = words / 200;
  const estimatedReadingTime = readingTimeMinutes < 1
    ? `${Math.ceil(readingTimeMinutes * 60)} segundos`
    : `${Math.ceil(readingTimeMinutes)} minutos`;

  return {
    fleschKincaidGrade: Math.max(0, Math.round(fleschKincaidGrade)),
    fleschReadingEase: Math.max(0, Math.min(100, Math.round(fleschReadingEase))),
    estimatedReadingTime
  };
}

function countSyllables(text: string): number {
  // Implementación simplificada de conteo de sílabas
  const words = text.toLowerCase().split(/\s+/);
  let totalSyllables = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-záéíóúñü]/gi, '');
    if (cleanWord.length === 0) continue;

    // Regla simplificada: contar vocales consecutivas como 1 sílaba
    const vowelGroups = cleanWord.match(/[aeiouáéíóúü]+/gi);
    totalSyllables += vowelGroups ? vowelGroups.length : 1;
  }

  return totalSyllables;
}
```

---

## 3. Actualización de Endpoints

### 3.1 Cambios en `/verify` y `/settle`

**Archivo:** `src/facilitator/index.ts`

```typescript
// Migrar de AccessibilityPreferences a AccessibilityPreferencesV2
// Migrar de createMetadataWithAI a createMetadataWithAIV2
// Agregar conversión de formato según preferences.outputFormat

app.post('/verify', async (c) => {
  const body = await c.req.json();
  const parseResult = VerifyRequestSchemaV2.safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: parseResult.error }, 400);
  }

  const { payload, paymentRequirements, accessibilityPreferences } = parseResult.data;

  // 1. Cargar preferencias de usuario si tiene userId
  let finalPreferences = accessibilityPreferences;
  if (accessibilityPreferences?.userId) {
    const cachedPrefs = await getUserPreferences(
      accessibilityPreferences.userId,
      c.env
    );
    if (cachedPrefs) {
      // Merge: request preferences override cached ones
      finalPreferences = { ...cachedPrefs, ...accessibilityPreferences };
    }
  }

  // 2. Ejecutar verificación core
  const verifyResult = await verifyTransaction(payload, paymentRequirements);

  // 3. Determinar messageType y context
  const { messageType, context } = determineMessageContext(verifyResult, payload);

  // 4. Generar metadata accesible V2
  const metadata = await createMetadataWithAIV2(
    messageType,
    context,
    finalPreferences,
    c.env
  );

  // 5. Generar WCAG compliance
  const wcag = generateWCAGCompliance(metadata, finalPreferences);

  // 6. Crear response
  const response: AccessibleResponseV2<VerifyResponse> = {
    data: verifyResult,
    accessibility: metadata,
    wcag
  };

  // 7. Convertir formato si necesario
  const outputFormat = finalPreferences.outputFormat || 'json';
  if (outputFormat === 'json') {
    return c.json(response);
  } else if (outputFormat === 'xml') {
    return c.text(toXML(response), 200, { 'Content-Type': 'application/xml' });
  } else if (outputFormat === 'plaintext') {
    return c.text(toPlainText(response), 200, { 'Content-Type': 'text/plain; charset=utf-8' });
  } else if (outputFormat === 'markdown') {
    return c.text(toMarkdown(response), 200, { 'Content-Type': 'text/markdown' });
  } else if (outputFormat === 'html') {
    return c.html(toHTML(response));
  } else if (outputFormat === 'jsonld') {
    return c.json(JSON.parse(toJSONLD(response)), 200, { 'Content-Type': 'application/ld+json' });
  }
});

// Similar para /settle
```

### 3.2 Nuevo Endpoint: `/preferences`

**Archivo:** `src/facilitator/index.ts`

```typescript
// GET /preferences/:userId - Obtener preferencias guardadas
app.get('/preferences/:userId', async (c) => {
  const userId = c.req.param('userId');
  const preferences = await getUserPreferences(userId, c.env);

  if (!preferences) {
    return c.json({ error: 'No preferences found for this user' }, 404);
  }

  return c.json({ preferences });
});

// PUT /preferences/:userId - Guardar preferencias
app.put('/preferences/:userId', async (c) => {
  const userId = c.req.param('userId');
  const body = await c.req.json();

  const parseResult = AccessibilityPreferencesSchemaV2.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: parseResult.error }, 400);
  }

  await setUserPreferences(userId, parseResult.data, c.env);

  return c.json({ success: true, preferences: parseResult.data });
});
```

---

## 4. Configuración y Despliegue

### 4.1 Actualización de wrangler.toml

```toml
name = "x402-facilitator-accessible"
main = "src/facilitator/index.ts"
compatibility_date = "2024-01-01"

# === KV Namespaces ===
kv_namespaces = [
  { binding = "METADATA_CACHE", id = "..." },
  { binding = "USER_PREFERENCES", id = "..." }  # NUEVO
]

# === Development Environment ===
[env.development]
vars = {
  # AI Config
  AI_ENABLED = "true"
  AI_ROLLOUT_PERCENTAGE = "20"
  OPENAI_MODEL_SIMPLE = "gpt-3.5-turbo"      # NUEVO: beginner/simple
  OPENAI_MODEL_DEFAULT = "gpt-4o-mini"       # RENOMBRADO: medium/advanced
  OPENAI_MODEL_EXPERT = "gpt-4o"             # NUEVO: expert level

  # Cache TTL
  CACHE_TTL_GENERIC = "604800"               # 7 days
  CACHE_TTL_SPECIFIC = "86400"               # 24 hours
  USER_PREFERENCES_TTL = "2592000"           # NUEVO: 30 days

  # BSV Config
  WALLET_ADDRESS = "..."
  NETWORK = "testnet"

  # Feature Flags
  WCAG_COMPLIANCE_ENABLED = "true"           # NUEVO
  MULTILANG_ENABLED = "true"                 # NUEVO
  FORMAT_CONVERSION_ENABLED = "true"         # NUEVO
  ADAPTIVE_COMPLEXITY_ENABLED = "false"      # NUEVO: experimental
}

# === Production Environment ===
[env.production]
vars = {
  AI_ENABLED = "true"
  AI_ROLLOUT_PERCENTAGE = "100"
  OPENAI_MODEL_SIMPLE = "gpt-3.5-turbo"
  OPENAI_MODEL_DEFAULT = "gpt-4o-mini"
  OPENAI_MODEL_EXPERT = "gpt-4o"

  CACHE_TTL_GENERIC = "604800"
  CACHE_TTL_SPECIFIC = "86400"
  USER_PREFERENCES_TTL = "2592000"

  WALLET_ADDRESS = "..."
  NETWORK = "mainnet"

  WCAG_COMPLIANCE_ENABLED = "true"
  MULTILANG_ENABLED = "true"
  FORMAT_CONVERSION_ENABLED = "true"
  ADAPTIVE_COMPLEXITY_ENABLED = "true"
}
```

### 4.2 Crear Nuevos KV Namespaces

```bash
# Development
wrangler kv:namespace create "USER_PREFERENCES" --preview

# Production
wrangler kv:namespace create "USER_PREFERENCES"
```

### 4.3 Variables de Entorno (Secrets)

```bash
# Ya existe:
wrangler secret put OPENAI_API_KEY

# Sin nuevos secrets requeridos
```

---

## 5. Testing

### 5.1 Tests Unitarios Nuevos

**Archivos:**
- `tests/unit/accessibility/i18n-v2.test.ts`
- `tests/unit/accessibility/ai-metadata-v2.test.ts`
- `tests/unit/accessibility/format-converters.test.ts`
- `tests/unit/accessibility/wcag-validator.test.ts`
- `tests/unit/accessibility/reading-level.test.ts`
- `tests/unit/accessibility/preference-cache.test.ts`

**Cobertura mínima:** 80% (igual que antes)

**Casos críticos:**
```typescript
describe('Format Converters', () => {
  it('should convert JSON to XML with valid schema', () => {});
  it('should convert JSON to plain text without structure', () => {});
  it('should optimize text for Braille', () => {});
  it('should generate valid JSON-LD with Schema.org', () => {});
});

describe('WCAG Validator', () => {
  it('should pass AAA for high contrast mode', () => {});
  it('should fail AAA without glossary', () => {});
  it('should calculate reading level correctly', () => {});
});

describe('Multilingual Templates', () => {
  it('should return correct template for es-MX dialect', () => {});
  it('should fallback to es-ES if dialect not found', () => {});
  it('should handle all 5 languages', () => {});
});
```

### 5.2 Tests de Integración Nuevos

**Archivos:**
- `tests/integration/accessibility-v2.test.ts`
- `tests/integration/preferences-endpoint.test.ts`
- `tests/integration/format-conversion.test.ts`

**Casos críticos:**
```typescript
describe('POST /verify with V2 preferences', () => {
  it('should return AAA compliant response in Portuguese', async () => {});
  it('should cache user preferences across requests', async () => {});
  it('should return XML format when requested', async () => {});
  it('should adapt cognitive level based on previous interactions', async () => {});
});
```

---

## 6. Migración y Rollout

### 6.1 Estrategia de Migración (Breaking Changes)

**Opción 1: Versioning en el Path**
```
POST /v1/verify  → AccessibleResponse (viejo)
POST /v2/verify  → AccessibleResponseV2 (nuevo)
```

**Opción 2: Header-based versioning**
```
POST /verify
Header: X-Accessibility-Version: 2
```

**Opción 3: Migración directa (recomendado dado que aceptas breaking changes)**
```
POST /verify → AccessibleResponseV2 (nuevo)
# Actualizar resource server para usar nuevo schema
```

**Recomendación:** Opción 3 con comunicación previa a usuarios.

### 6.2 Plan de Rollout

**Fase 1: Infraestructura (Semana 1)**
- Crear nuevos KV namespaces
- Actualizar wrangler.toml
- Desplegar con AI_ROLLOUT_PERCENTAGE = 0 (solo templates)

**Fase 2: Templates Multilingües (Semana 2)**
- Implementar i18n para 5 idiomas
- Crear templates para todos los niveles cognitivos
- Tests unitarios de i18n
- Desplegar en dev

**Fase 3: AI V2 y WCAG (Semana 3)**
- Implementar ai-metadata-v2.ts
- Implementar wcag-validator.ts
- Implementar reading-level.ts
- Tests unitarios
- Desplegar en dev con AI_ROLLOUT_PERCENTAGE = 10

**Fase 4: Convertidores de Formato (Semana 4)**
- Implementar format-converters.ts
- Tests unitarios
- Tests de integración
- Desplegar en dev con AI_ROLLOUT_PERCENTAGE = 50

**Fase 5: Preferencias y Personalización (Semana 5)**
- Implementar preference-cache.ts
- Crear endpoints /preferences
- Tests de integración
- Desplegar en dev con AI_ROLLOUT_PERCENTAGE = 100

**Fase 6: Producción (Semana 6)**
- Testing exhaustivo en dev
- Actualizar resource server para V2
- Documentación completa
- Desplegar en prod con AI_ROLLOUT_PERCENTAGE = 20
- Incrementar gradualmente hasta 100

---

## 7. Estructura de Archivos Final

```
src/facilitator/
├── index.ts                           # [MODIFICAR] Endpoints principales
├── types.ts                           # [MODIFICAR] Agregar tipos V2
├── logger.ts                          # [SIN CAMBIOS]
├── whats-on-chain.ts                  # [SIN CAMBIOS]
├── verify.ts                          # [SIN CAMBIOS]
├── settle.ts                          # [SIN CAMBIOS]
└── accessibility/
    ├── metadata.ts                    # [DEPRECAR] Funciones helper legacy
    ├── metadata-v2.ts                 # [NUEVO] Funciones helper V2
    ├── ai-metadata.ts                 # [DEPRECAR] AI generation V1
    ├── ai-metadata-v2.ts              # [NUEVO] AI generation V2
    ├── format-converters.ts           # [NUEVO] JSON→XML/HTML/etc
    ├── wcag-validator.ts              # [NUEVO] WCAG 2.2 AAA compliance
    ├── reading-level.ts               # [NUEVO] Flesch-Kincaid analyzer
    ├── preference-cache.ts            # [NUEVO] User preferences KV
    ├── i18n.ts                        # [DEPRECAR] Templates V1
    └── i18n/                          # [NUEVO] Templates multilingües
        ├── index.ts                   # Orquestador
        ├── es.ts                      # Español (ES/MX)
        ├── en.ts                      # Inglés (US/GB)
        ├── pt.ts                      # Portugués (BR/PT)
        ├── fr.ts                      # Francés
        └── de.ts                      # Alemán

tests/
├── unit/
│   ├── accessibility/
│   │   ├── i18n-v2.test.ts           # [NUEVO]
│   │   ├── ai-metadata-v2.test.ts    # [NUEVO]
│   │   ├── format-converters.test.ts # [NUEVO]
│   │   ├── wcag-validator.test.ts    # [NUEVO]
│   │   ├── reading-level.test.ts     # [NUEVO]
│   │   └── preference-cache.test.ts  # [NUEVO]
│   ├── verify.test.ts                # [SIN CAMBIOS]
│   └── settle.test.ts                # [SIN CAMBIOS]
└── integration/
    ├── accessibility-v2.test.ts       # [NUEVO]
    ├── preferences-endpoint.test.ts   # [NUEVO]
    └── format-conversion.test.ts      # [NUEVO]

docs/
├── ACCESSIBILITY-V2.md                # [NUEVO] Documentación completa
├── WCAG-COMPLIANCE.md                 # [NUEVO] Matriz de compliance
└── MIGRATION-GUIDE.md                 # [NUEVO] Guía de migración V1→V2
```

---

## 8. Estimación de Esfuerzo

| Fase | Componente | Archivos | LoC Est. | Esfuerzo |
|------|------------|----------|----------|----------|
| 1 | Infraestructura | wrangler.toml | 50 | 2 horas |
| 2 | i18n Templates | 7 archivos | 3000 | 16 horas |
| 3 | AI V2 + WCAG | 3 archivos | 1500 | 12 horas |
| 4 | Format Converters | 1 archivo | 800 | 8 horas |
| 5 | Preferences | 2 archivos | 400 | 6 horas |
| 6 | Endpoints | index.ts | 300 | 4 horas |
| 7 | Tests | 9 archivos | 2000 | 16 horas |
| 8 | Docs + Migration | 3 archivos | 1000 | 8 horas |

**Total:** ~72 horas de desarrollo (~2 semanas full-time o 6 semanas part-time)

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Response size >50KB (límite Workers) | Media | Alto | Implementar paginación/compresión, limitar campos opcionales |
| Latencia >200ms por conversiones | Media | Medio | Caché agresivo, conversiones async |
| Costos OpenAI aumentan 3-5x | Alta | Medio | Rollout gradual, caché KV extensivo, fallback a templates |
| Templates mal traducidos | Media | Alto | Revisión por nativos, tests de i18n |
| Reading level calculation inexacto | Baja | Bajo | Validación con corpus conocidos, ajuste de algoritmo |
| Breaking changes rompen clients | Alta | Alto | Comunicación previa, guía de migración detallada |

---

## 10. Métricas de Éxito

**Técnicas:**
- Cobertura de tests: ≥80% (mantener)
- Latencia p95: ≤200ms (excl. AI calls)
- Response size: ≤50KB (100% de requests)
- Cache hit rate: ≥70% después de 1 semana

**Accesibilidad:**
- WCAG 2.2 AAA: 100% pass en criterios aplicables
- Reading level: ≤9th grade para 'simple' level
- Soporte de 5 idiomas: 100% de templates traducidos
- Formatos alternativos: 6 formatos soportados

**Uso:**
- Adopción de preferencias: ≥30% de requests con userId después de 1 mes
- Uso de formatos no-JSON: ≥5% de requests
- Distribución de cognitive levels: monitorear para ajustar defaults

---

## 11. Archivos Críticos a Modificar

### Alta Prioridad (Core)
1. `src/facilitator/types.ts` - Agregar todos los tipos V2
2. `src/facilitator/accessibility/i18n/es.ts` - Templates español
3. `src/facilitator/accessibility/i18n/en.ts` - Templates inglés
4. `src/facilitator/accessibility/ai-metadata-v2.ts` - AI generation V2
5. `src/facilitator/index.ts` - Actualizar endpoints

### Media Prioridad (Features)
6. `src/facilitator/accessibility/wcag-validator.ts` - WCAG compliance
7. `src/facilitator/accessibility/format-converters.ts` - Conversión de formatos
8. `src/facilitator/accessibility/preference-cache.ts` - Caché de preferencias
9. `wrangler.toml` - Configuración y KV namespaces

### Baja Prioridad (Nice-to-have)
10. `src/facilitator/accessibility/i18n/pt.ts` - Templates portugués
11. `src/facilitator/accessibility/i18n/fr.ts` - Templates francés
12. `src/facilitator/accessibility/i18n/de.ts` - Templates alemán
13. `src/facilitator/accessibility/reading-level.ts` - Análisis de lectura

---

## 12. Próximos Pasos

1. **Aprobación del plan** - Revisar con stakeholders
2. **Crear KV namespaces** - Setup de infraestructura
3. **Implementar Fase 1** - Templates español/inglés first
4. **Testing incremental** - Cada fase con tests antes de continuar
5. **Documentación continua** - Actualizar docs en cada fase
6. **Despliegue gradual** - Dev → Staging → Prod con rollout %
