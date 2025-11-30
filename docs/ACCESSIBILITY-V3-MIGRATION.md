# Guía de Migración: V2 → V3 Universal Accessibility

## Resumen Ejecutivo

**V3** implementa el principio de **"El servidor provee TODO, el cliente elige"**.

En lugar de que el servidor decida qué nivel cognitivo o idioma enviar, V3 devuelve **TODOS los niveles**, **TODOS los idiomas**, y **TODAS las variantes**, permitiendo que el cliente LLM (Claude Desktop, ChatGPT, etc.) elija dinámicamente según el contexto del usuario.

---

## Cambios Fundamentales

### V2 (Restrictivo)

```json
{
  "data": { "isValid": true },
  "accessibility": {
    "content": {
      "plainLanguage": "Pago válido",  // Solo nivel "simple"
      "cognitiveLevel": "simple"        // Solo UNO
    },
    "language": {
      "code": "es"                      // Solo UNO
    }
  }
}
```

**Problema**: El cliente no puede adaptar el contenido si el usuario necesita otro nivel o idioma.

### V3 (Universal)

```json
{
  "data": { "isValid": true },
  "accessibility": {
    "content": {
      "byLevel": {
        "beginner": { "plainLanguage": "✅ Pago válido", ... },
        "simple": { "plainLanguage": "Transacción válida", ... },
        "medium": { "plainLanguage": "Transacción BSV verificada", ... },
        "advanced": { "plainLanguage": "Validación exitosa: exact scheme", ... },
        "expert": { "plainLanguage": "TX validation passed: UTXO verified", ... }
      }
    },
    "languages": {
      "es": { /* Todo el contenido en español */ },
      "en": { /* Todo el contenido en inglés */ },
      "pt": { /* Todo el contenido en portugués si lo pidió */ }
    },
    "visual": { /* Todas las variantes visuales */ },
    "motor": { /* Todas las opciones motoras */ },
    "audio": { /* Todas las variantes de audio */ },
    "formats": { /* Todos los formatos */ },
    "recommendations": {
      "cognitiveLevel": "simple",  // Sugerencia del servidor
      "confidence": 0.85
    }
  }
}
```

**Beneficio**: El cliente puede:
- Empezar con nivel `beginner` y escalar a `advanced` según comprensión
- Cambiar de idioma dinámicamente
- Mostrar múltiples opciones al usuario
- Funcionar offline con una sola respuesta

---

## Estructura V3 Completa

```typescript
interface UniversalAccessibilityMetadataV3 {
  // === CONTENIDO ===
  // TODOS los niveles cognitivos (5)
  content: {
    byLevel: {
      beginner: CognitiveContent;
      simple: CognitiveContent;
      medium: CognitiveContent;
      advanced: CognitiveContent;
      expert: CognitiveContent;
    };
    byAbstraction: {
      concrete: AbstractionContent;  // Ejemplos específicos
      mixed: AbstractionContent;      // Mezcla teoría + ejemplos
      abstract: AbstractionContent;   // Conceptos teóricos
    };
  };

  // === IDIOMAS ===
  // Mínimo: español, inglés, + idioma solicitado
  languages: {
    es: LanguageContent;  // Todo el contenido en español
    en: LanguageContent;  // Todo el contenido en inglés
    [userLang]: LanguageContent;  // Idioma adicional si lo pidió
  };

  // === VISUAL ===
  // TODAS las variantes de accesibilidad visual
  visual: {
    contrast: {
      high: VisualVariant;    // Alto contraste (baja visión)
      normal: VisualVariant;  // Contraste estándar WCAG AA
      low: VisualVariant;     // Bajo contraste (fotofobia)
    };
    colorBlind: {
      deuteranopia: VisualVariant;  // Rojo-verde (más común)
      protanopia: VisualVariant;    // Rojo-verde (severo)
      tritanopia: VisualVariant;    // Azul-amarillo
      none: VisualVariant;          // Visión normal
    };
    fontSize: {
      small: VisualVariant;   // 14px
      medium: VisualVariant;  // 16px
      large: VisualVariant;   // 20px
      'x-large': VisualVariant;  // 24px
    };
    theme: {
      light: VisualVariant;
      dark: VisualVariant;
    };
  };

  // === MOTOR ===
  // TODAS las opciones de entrada
  motor: {
    keyboard: MotorGuidance;  // Navegación por teclado
    voice: MotorGuidance;     // Comandos de voz
    switch: MotorGuidance;    // Switches (discapacidad severa)
    eye: MotorGuidance;       // Eye-tracking
  };

  // === AUDIO ===
  // TODAS las variantes de audio
  audio: {
    ttsOptimized: AudioContent;      // Optimizado para TTS
    ttsNonOptimized: AudioContent;   // Sin optimizar
    withPauses: AudioContent;        // Con pausas adicionales
    withoutPauses: AudioContent;     // Sin pausas
  };

  // === FORMATOS ===
  // Contenido en TODOS los formatos
  formats: {
    json: string;       // JSON estándar
    xml: string;        // XML
    plaintext: string;  // Texto plano sin markup
    markdown: string;   // Markdown formateado
    html: string;       // HTML semántico
    jsonld: string;     // JSON-LD con schema.org
    braille: string;    // Optimizado para Braille
    ssml: string;       // SSML para síntesis de voz
  };

  // === RECOMENDACIONES ===
  // Sugerencias del servidor (el cliente puede ignorarlas)
  recommendations: {
    cognitiveLevel: 'simple';
    language: 'es';
    visualMode: 'high-contrast-dark';
    motorMode: 'keyboard';
    format: 'json';
    confidence: 0.85;  // 0-1, confianza en las recomendaciones
  };

  // === METADATOS ===
  metadata: {
    version: 3;
    generatedBy: 'ai' | 'template' | 'hybrid';
    generatedAt: '2025-11-30T10:00:00Z';
    cacheHit: boolean;
    userPreferences: AccessibilityPreferencesV3;
    wcagLevel: 'AAA';
  };
}
```

---

## Uso desde el Cliente LLM

### Ejemplo 1: Adaptación Dinámica de Nivel

```javascript
// El LLM detecta que el usuario no entiende
const response = await fetch('/verify', { ... });
const data = await response.json();

// Empezar con nivel simple
showContent(data.accessibility.content.byLevel.simple);

// Usuario no entiende → cambiar a beginner
if (userDoesNotUnderstand()) {
  showContent(data.accessibility.content.byLevel.beginner);
}

// Usuario es experto → cambiar a expert
if (userIsExpert()) {
  showContent(data.accessibility.content.byLevel.expert);
}
```

### Ejemplo 2: Soporte Multilingüe

```javascript
// Mostrar en múltiples idiomas simultáneamente
const { languages } = data.accessibility;

console.log('Español:', languages.es.byLevel.simple.plainLanguage);
console.log('English:', languages.en.byLevel.simple.plainLanguage);
console.log('Português:', languages.pt?.byLevel.simple.plainLanguage);
```

### Ejemplo 3: Accesibilidad Visual

```javascript
// Usuario con daltonismo
const colorBlindPalette = data.accessibility.visual.colorBlind.deuteranopia.colorPalette;
applyColors(colorBlindPalette);

// Usuario con baja visión
const highContrastCSS = data.accessibility.visual.contrast.high.cssHints;
applyStyles(highContrastCSS);

// Usuario prefiere modo oscuro
const darkTheme = data.accessibility.visual.theme.dark.cssHints;
applyTheme(darkTheme);
```

### Ejemplo 4: Navegación por Voz

```javascript
// Usuario usa comandos de voz
const voiceCommands = data.accessibility.motor.voice.instructions;
const shortcuts = data.accessibility.motor.voice.shortcuts;

console.log('Instrucciones:', voiceCommands);
// ["Di 'continuar' para proceder", "Di 'ayuda' para asistencia"]

console.log('Shortcuts:', shortcuts);
// { proceed: 'continue', help: 'help', cancel: 'cancel' }
```

### Ejemplo 5: Conversión de Formato

```javascript
// Usuario con lector Braille
const brailleText = data.accessibility.formats.braille;
sendToBrailleDisplay(brailleText);

// Usuario con TTS
const ssml = data.accessibility.formats.ssml;
speakSSML(ssml);

// Usuario prefiere markdown
const markdown = data.accessibility.formats.markdown;
renderMarkdown(markdown);
```

---

## Request: AccessibilityPreferencesV3

El cliente puede especificar preferencias, pero el servidor **siempre devuelve TODO**:

```typescript
{
  "accessibilityPreferences": {
    // === Idiomas ===
    "languages": ["es", "en", "pt"],  // Pide estos idiomas
    "primaryLanguage": "es",          // Idioma principal

    // === Cognitivo ===
    "cognitiveLevel": "simple",       // Preferencia (opcional)
    "abstractionLevel": "concrete",   // Preferencia
    "includeExamples": true,
    "includeGlossary": true,

    // === Visual ===
    "contrastMode": "high",           // Preferencia
    "colorBlindType": "deuteranopia",
    "fontSize": "large",
    "darkMode": true,
    "screenReaderOptimized": true,

    // === Motor ===
    "motorInput": "keyboard",         // Preferencia
    "includeKeyboardHints": true,
    "includeVoiceHints": true,

    // === Formato ===
    "preferredFormats": ["json", "markdown"],
    "brailleOptimized": true,

    // === Audio ===
    "audioFriendly": true,
    "ttsOptimized": true,

    // === WCAG ===
    "wcagLevel": "AAA"
  }
}
```

**Importante**: Las preferencias son **sugerencias**. El servidor:
1. Usa las preferencias para generar **recomendaciones**
2. Pero **siempre devuelve TODO** (todos los niveles, idiomas, variantes)
3. El cliente elige qué usar

---

## Migración de Código

### Código V2 (Antes)

```typescript
import { createMetadataWithAIV2 } from './accessibility/ai-metadata-v2';

const metadata = await createMetadataWithAIV2(
  'success.verifyValid',
  { amount: '5000' },
  { language: 'es', cognitiveLevel: 'simple' },
  env
);

// Solo tienes UN nivel cognitivo
console.log(metadata.content.plainLanguage);
```

### Código V3 (Después)

```typescript
import { createMetadataWithAIV3 } from './accessibility/ai-metadata-v3';

const metadata = await createMetadataWithAIV3(
  'success.verifyValid',
  { amount: '5000' },
  { languages: ['es', 'en'], primaryLanguage: 'es', cognitiveLevel: 'simple' },
  env
);

// Tienes TODOS los niveles cognitivos
console.log(metadata.content.byLevel.beginner.plainLanguage);  // "✅ Pago válido"
console.log(metadata.content.byLevel.simple.plainLanguage);    // "Transacción válida"
console.log(metadata.content.byLevel.expert.plainLanguage);    // "TX validation passed"

// Tienes TODOS los idiomas
console.log(metadata.languages.es.byLevel.simple.plainLanguage);  // "Transacción válida"
console.log(metadata.languages.en.byLevel.simple.plainLanguage);  // "Valid transaction"

// Tienes TODAS las variantes visuales
console.log(metadata.visual.colorBlind.deuteranopia.colorPalette);  // ["#0173B2", "#DE8F05"]

// El servidor recomienda, pero tú decides
console.log(metadata.recommendations.cognitiveLevel);  // "simple"
console.log(metadata.recommendations.confidence);      // 0.85
```

---

## Feature Flags

### Habilitar V3

En `wrangler.toml`:

```toml
[env.production]
ACCESSIBILITY_V3_ENABLED = "true"
V3_ROLLOUT_PERCENTAGE = "100"  # 0-100
FORMAT_CONVERTERS_ENABLED = "true"
```

### Rollout Gradual

```toml
# Fase 1: 10% de tráfico
V3_ROLLOUT_PERCENTAGE = "10"

# Fase 2: 50% de tráfico
V3_ROLLOUT_PERCENTAGE = "50"

# Fase 3: 100% de tráfico
V3_ROLLOUT_PERCENTAGE = "100"
```

---

## Compatibilidad

### Backward Compatibility

- V3 es un **superset** de V2
- Clientes V2 pueden ignorar campos adicionales de V3
- Clientes V3 pueden leer respuestas V1/V2 (con funcionalidad reducida)

### Response Size

- **V1**: ~2 KB
- **V2**: ~8 KB
- **V3**: ~50-100 KB (sin compresión)
- **V3 comprimido**: ~15-30 KB (con gzip/brotli)

Cloudflare Workers aplica compresión automática, por lo que el tamaño real transmitido es ~15-30 KB.

### Caching

V3 usa caché KV para reducir llamadas a OpenAI:

```typescript
// Cache key incluye idiomas solicitados
const key = `v3:${messageType}:${languages.join(',')}:${contextHash}`;

// TTL: 24 horas (respuestas más grandes)
await env.METADATA_CACHE.put(key, JSON.stringify(metadata), {
  expirationTtl: 86400
});
```

---

## Lazy Loading (Futuro)

Para clientes que solo necesitan ciertos niveles:

```http
GET /verify?levels=beginner,simple&langs=es,en&formats=json,markdown
```

Responde solo con lo solicitado, reduciendo el tamaño.

---

## Casos de Uso

### Caso 1: Usuario Principiante

```javascript
// Usuario abre la app por primera vez
const level = 'beginner';
const content = response.accessibility.content.byLevel[level];
const lang = response.accessibility.languages.es;

display({
  title: lang.byLevel[level].plainLanguage,  // "✅ Pago válido"
  body: lang.byLevel[level].explanation,
  steps: lang.byLevel[level].stepByStep,
  glossary: lang.byLevel[level].glossary,     // Términos explicados
  examples: lang.byLevel[level].examples      // Ejemplos concretos
});
```

### Caso 2: Usuario Experto Multilingüe

```javascript
// Desarrollador que prefiere inglés técnico
const level = 'expert';
const content = response.accessibility.languages.en.byLevel[level];

console.log(content.plainLanguage);
// "TX validation passed: exact scheme, UTXO verified, sig valid"

// Pero puede comparar con español
const contentES = response.accessibility.languages.es.byLevel[level];
showDiff(content, contentES);
```

### Caso 3: Usuario con Discapacidad Visual

```javascript
// Usuario con deuteranopia + baja visión
const colorPalette = response.accessibility.visual.colorBlind.deuteranopia.colorPalette;
const highContrast = response.accessibility.visual.contrast.high.cssHints;
const largeFont = response.accessibility.visual.fontSize.large.cssHints;

applyStyles({
  colors: colorPalette,
  ...highContrast,
  ...largeFont
});

// TTS optimizado
const tts = response.accessibility.audio.ttsOptimized;
speak(tts.text, { rate: tts.rate, ssml: tts.ssml });
```

### Caso 4: Lector Braille

```javascript
// Usuario con lector Braille
const braille = response.accessibility.formats.braille;
sendToBrailleDisplay(braille);

// Navegación por teclado
const keyboardHints = response.accessibility.motor.keyboard;
console.log(keyboardHints.instructions);
// ["Use Tab to navigate", "Press Enter to confirm", "Press Esc to cancel"]
```

---

## Próximos Pasos

1. ✅ Diseño V3 completo
2. ✅ Tipos TypeScript V3
3. ✅ Generador AI V3
4. ✅ Templates fallback V3
5. ⏳ Tests de integración V3
6. ⏳ Actualizar endpoints para usar V3
7. ⏳ Feature flag + rollout gradual
8. ⏳ Documentación para clientes LLM

---

## Referencias

- [Diseño V3](./ACCESSIBILITY-V3-DESIGN.md)
- [Tipos V3](../src/facilitator/types.ts:573-962)
- [Generador AI V3](../src/facilitator/accessibility/ai-metadata-v3.ts)
- [Templates V3 ES](../src/facilitator/accessibility/i18n/v3/es.ts)
- [Templates V3 EN](../src/facilitator/accessibility/i18n/v3/en.ts)
