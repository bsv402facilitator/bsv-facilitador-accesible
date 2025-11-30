# Accessibility V3 Design: Universal Content Delivery

## Principio Fundamental

**El servidor provee TODA la información en TODOS los formatos y niveles posibles.**
**El cliente (LLM) elige lo que necesita según su contexto.**

## Por qué V3

### Problema V1/V2
- Servidor decide qué nivel cognitivo enviar → Cliente no puede ajustar
- Servidor decide qué idioma enviar → Cliente no puede ofrecer alternativas
- Servidor decide qué formato enviar → Cliente no puede convertir
- **Resultado**: Accesibilidad limitada por decisiones del servidor

### Solución V3
- Servidor envía TODOS los niveles cognitivos
- Servidor envía TODOS los idiomas (mínimo: es, en, + solicitado)
- Servidor envía metadatos para TODOS los formatos
- Servidor envía TODAS las variantes visuales/auditivas/motoras
- **Resultado**: Accesibilidad universal - el LLM cliente tiene contexto completo

---

## Estructura V3

```typescript
interface UniversalAccessibilityV3 {
  // ============================================================================
  // CONTENIDO - Todos los niveles cognitivos
  // ============================================================================
  content: {
    byLevel: {
      beginner: CognitiveContent;
      simple: CognitiveContent;
      medium: CognitiveContent;
      advanced: CognitiveContent;
      expert: CognitiveContent;
    };
    // Todos los niveles de abstracción
    byAbstraction: {
      concrete: AbstractionContent;
      mixed: AbstractionContent;
      abstract: AbstractionContent;
    };
  };

  // ============================================================================
  // IDIOMAS - Al menos es, en, más el solicitado por usuario
  // ============================================================================
  languages: {
    es: LanguageContent;
    en: LanguageContent;
    [userRequestedLang]: LanguageContent; // pt, fr, de, etc.
  };

  // ============================================================================
  // VISUAL - Todas las variantes para accesibilidad visual
  // ============================================================================
  visual: {
    contrast: {
      high: VisualVariant;
      normal: VisualVariant;
      low: VisualVariant;
    };
    colorBlind: {
      deuteranopia: VisualVariant;
      protanopia: VisualVariant;
      tritanopia: VisualVariant;
      none: VisualVariant;
    };
    fontSize: {
      small: VisualVariant;
      medium: VisualVariant;
      large: VisualVariant;
      xLarge: VisualVariant;
    };
    theme: {
      light: VisualVariant;
      dark: VisualVariant;
    };
  };

  // ============================================================================
  // MOTOR - Todas las opciones de interacción
  // ============================================================================
  motor: {
    keyboard: MotorGuidance;
    voice: MotorGuidance;
    switch: MotorGuidance;
    eye: MotorGuidance;
  };

  // ============================================================================
  // AUDIO - Todas las variantes de audio
  // ============================================================================
  audio: {
    ttsOptimized: AudioContent;
    ttsNonOptimized: AudioContent;
    withPauses: AudioContent;
    withoutPauses: AudioContent;
  };

  // ============================================================================
  // FORMATOS - Contenido en todos los formatos
  // ============================================================================
  formats: {
    json: string;          // El formato nativo
    xml: string;           // Conversión a XML
    plaintext: string;     // Texto plano sin markup
    markdown: string;      // Markdown formateado
    html: string;          // HTML semántico
    jsonld: string;        // JSON-LD con schema.org
    braille: string;       // Optimizado para Braille
    ssml: string;          // SSML para síntesis de voz
  };

  // ============================================================================
  // RECOMENDACIONES - Sugerencias basadas en preferencias del usuario
  // ============================================================================
  recommendations: {
    cognitiveLevel: CognitiveLevel;
    language: string;
    visualMode: string;
    motorMode: string;
    format: string;
    confidence: number; // 0-1, qué tan seguro está el servidor
  };

  // ============================================================================
  // METADATOS
  // ============================================================================
  metadata: {
    version: 3;
    generatedBy: 'ai' | 'template' | 'hybrid';
    generatedAt: string;
    cacheHit: boolean;
    userPreferences: AccessibilityPreferencesV3; // Las preferencias que envió
    wcagLevel: 'AAA';
  };
}
```

---

## Tipos Detallados

### CognitiveContent
```typescript
interface CognitiveContent {
  plainLanguage: string;      // Resumen ejecutivo (≤100 chars)
  explanation: string;        // Explicación detallada (≤300 chars)
  detailedExplanation: string; // Explicación extendida (sin límite)
  stepByStep: AccessibleStep[];
  hints: ExtendedHints;
  glossary: Record<string, string>;
  examples: ConcreteExample[];
  checkpoints: ComprehensionCheckpoint[];
  readingLevel: ReadingLevel;
  memoryAids: string[];
}
```

### LanguageContent
```typescript
interface LanguageContent {
  code: string;              // 'es', 'en', 'pt', etc.
  direction: 'ltr' | 'rtl';
  locale: string;            // 'es-ES', 'en-US', etc.
  content: CognitiveContent; // Todo el contenido en este idioma
  culturalContext?: string;  // Adaptaciones culturales
}
```

### VisualVariant
```typescript
interface VisualVariant {
  description: string;
  cssHints?: Record<string, string>; // Sugerencias CSS
  ariaLabels?: Record<string, string>;
  altTexts?: string[];
  colorPalette?: string[];
}
```

### MotorGuidance
```typescript
interface MotorGuidance {
  instructions: string[];
  shortcuts?: Record<string, string>;
  timing?: {
    estimatedTime: string;
    adjustable: boolean;
  };
  focusOrder?: number[];
}
```

### AudioContent
```typescript
interface AudioContent {
  text: string;
  ssml?: string;
  pauses?: number[]; // Posiciones de pausas en ms
  pronunciation?: Record<string, string>;
  rate?: 'slow' | 'normal' | 'fast';
}
```

---

## Ejemplo de Respuesta V3

```json
{
  "data": {
    "isValid": true,
    "payer": "1A1zP1..."
  },
  "accessibility": {
    "content": {
      "byLevel": {
        "beginner": {
          "plainLanguage": "Pago válido ✓",
          "explanation": "Tu pago de Bitcoin es correcto y puede procesarse.",
          "stepByStep": ["El pago fue verificado", "Todo está en orden"],
          ...
        },
        "simple": {
          "plainLanguage": "Transacción válida",
          "explanation": "La transacción BSV cumple con todos los requisitos de pago.",
          ...
        },
        "medium": {
          "plainLanguage": "Transacción BSV verificada exitosamente",
          "explanation": "La transacción cumple con el esquema 'exact', monto correcto, y dirección válida.",
          ...
        },
        "advanced": {
          "plainLanguage": "Validación exitosa: esquema exact, outputs verificados",
          "explanation": "Transacción BSV mainnet verificada: outputs coinciden con PaymentRequirements...",
          ...
        },
        "expert": {
          "plainLanguage": "TX validation passed: exact scheme, UTXO verified, sig valid",
          "explanation": "BSV transaction validated against PaymentRequirements: output[0] matches payTo address...",
          ...
        }
      },
      "byAbstraction": {
        "concrete": { ... }, // Con ejemplos específicos, números exactos
        "mixed": { ... },    // Mezcla de conceptos y ejemplos
        "abstract": { ... }  // Conceptos teóricos, sin ejemplos específicos
      }
    },
    "languages": {
      "es": { ... }, // Todo el contenido en español
      "en": { ... }, // Todo el contenido en inglés
      "pt": { ... }  // Todo el contenido en portugués (si lo pidió)
    },
    "visual": {
      "contrast": {
        "high": { description: "Alto contraste para baja visión", colorPalette: ["#000", "#FFF"] },
        "normal": { description: "Contraste estándar WCAG AA", colorPalette: ["#333", "#EEE"] },
        "low": { description: "Contraste reducido para fotofobia", colorPalette: ["#666", "#CCC"] }
      },
      "colorBlind": {
        "deuteranopia": { colorPalette: ["#0173B2", "#DE8F05"] }, // Verde-rojo
        "protanopia": { colorPalette: ["#0173B2", "#DE8F05"] },
        "tritanopia": { colorPalette: ["#E69F00", "#56B4E9"] }, // Azul-amarillo
        "none": { colorPalette: ["#28a745", "#dc3545"] } // Colores normales
      },
      "fontSize": { ... },
      "theme": { ... }
    },
    "motor": {
      "keyboard": {
        "instructions": ["Tab para navegar", "Enter para confirmar"],
        "shortcuts": { "retry": "Ctrl+R", "help": "F1" }
      },
      "voice": {
        "instructions": ["Di 'continuar' para proceder", "Di 'ayuda' para asistencia"]
      },
      ...
    },
    "audio": {
      "ttsOptimized": {
        "text": "Pago válido. Tu transacción de Bitcoin es correcta.",
        "ssml": "<speak><prosody rate='slow'>Pago válido...</prosody></speak>",
        "pauses": [500, 1000]
      },
      "ttsNonOptimized": {
        "text": "isValid: true, payer: 1A1zP1..."
      },
      ...
    },
    "formats": {
      "json": "{ \"data\": { \"isValid\": true } }",
      "xml": "<response><data><isValid>true</isValid></data></response>",
      "plaintext": "Pago válido\nTu transacción es correcta.",
      "markdown": "# Pago válido\n\nTu transacción es correcta.",
      "html": "<div role='alert'><h1>Pago válido</h1><p>Tu transacción es correcta.</p></div>",
      "jsonld": "{ \"@context\": \"https://schema.org\", \"@type\": \"PaymentStatusUpdate\" }",
      "braille": "⠏⠁⠛⠕ ⠧⠡⠇⠊⠙⠕",
      "ssml": "<speak>Pago válido</speak>"
    },
    "recommendations": {
      "cognitiveLevel": "simple",
      "language": "es",
      "visualMode": "high-contrast",
      "motorMode": "keyboard",
      "format": "markdown",
      "confidence": 0.85
    },
    "metadata": {
      "version": 3,
      "generatedBy": "ai",
      "generatedAt": "2025-11-30T10:00:00Z",
      "cacheHit": true,
      "userPreferences": { ... },
      "wcagLevel": "AAA"
    }
  }
}
```

---

## Ventajas de V3

### 1. **Máxima Flexibilidad del Cliente**
El LLM puede:
- Empezar con nivel `beginner` y escalar a `advanced` según comprensión del usuario
- Cambiar de idioma dinámicamente
- Adaptar formato según capacidades del display
- Ofrecer múltiples opciones al usuario

### 2. **Offline-First**
Una sola respuesta contiene TODO → el cliente puede:
- Cachear localmente
- Funcionar sin conectividad
- No necesita múltiples requests

### 3. **Accesibilidad Real**
- Usuario con baja visión → usa `visual.contrast.high` + `visual.fontSize.xLarge`
- Usuario con daltonismo → usa `visual.colorBlind.deuteranopia`
- Usuario con discapacidad motora → usa `motor.voice` o `motor.switch`
- Usuario con TTS → usa `audio.ttsOptimized` + `formats.ssml`

### 4. **Progressive Enhancement**
Cliente puede:
```javascript
// Cliente simple
const simple = response.accessibility.content.byLevel.beginner;

// Cliente avanzado
const expert = response.accessibility.content.byLevel.expert;

// Cliente adaptativo
const level = inferUserLevel(); // Detecta nivel del usuario
const content = response.accessibility.content.byLevel[level];
```

### 5. **Internacionalización Completa**
```javascript
// Usuario habla español
const spanish = response.accessibility.languages.es;

// Usuario habla inglés pero quiere comparar
const english = response.accessibility.languages.en;

// Usuario bilingüe → muestra ambos
show(spanish, english);
```

---

## Implementación

### Generación AI
```typescript
// El prompt de OpenAI genera TODOS los niveles de una vez
const prompt = `
Generate accessibility metadata in ALL cognitive levels (beginner to expert),
in ALL requested languages (es, en, ${userLang}),
with ALL visual variants, ALL motor guidance, ALL audio formats.

Return JSON with complete structure...
`;
```

### Templates Fallback
```typescript
// Los templates también proveen TODOS los niveles
const templates = {
  verify_success: {
    beginner: { plainLanguage: "...", ... },
    simple: { plainLanguage: "...", ... },
    medium: { plainLanguage: "...", ... },
    advanced: { plainLanguage: "...", ... },
    expert: { plainLanguage: "...", ... }
  }
};
```

### Conversión de Formatos
```typescript
// Conversores toman el contenido base y generan todos los formatos
const formats = {
  json: JSON.stringify(data),
  xml: convertToXML(data),
  plaintext: convertToPlaintext(data),
  markdown: convertToMarkdown(data),
  html: convertToHTML(data),
  jsonld: convertToJSONLD(data),
  braille: convertToBraille(data),
  ssml: convertToSSML(data)
};
```

---

## Migración V1/V2 → V3

### Compatibilidad
- V3 es un **superset** de V1/V2
- Clientes V1/V2 pueden ignorar campos extra
- Clientes V3 pueden usar clientes V1/V2 (con funcionalidad reducida)

### Feature Flag
```typescript
if (env.ACCESSIBILITY_V3_ENABLED === 'true') {
  return generateV3Response(...);
} else {
  return generateV2Response(...); // Fallback
}
```

---

## Tamaño de Respuesta

### Preocupación: Respuestas muy grandes
**Solución 1**: Compresión
- Cloudflare Workers soporta gzip/brotli automático
- Respuesta JSON comprimida ~70% más pequeña

**Solución 2**: Lazy Loading
```typescript
// Opción: Cliente puede pedir solo ciertos niveles
GET /verify?levels=beginner,simple&langs=es,en&formats=json,markdown

// Respuesta más pequeña con solo lo solicitado
```

**Solución 3**: Streaming
```typescript
// Para respuestas muy grandes, usar streaming
return streamResponse(accessibilityData);
```

### Estimación de Tamaño
- V1 response: ~2KB
- V3 response completa: ~50-100KB (antes de compresión)
- V3 response comprimida: ~15-30KB (gzip)
- **Aceptable** para workers (limite 25MB response)

---

## Próximos Pasos

1. ✅ Diseño V3 completo
2. ⏳ Implementar tipos TypeScript V3
3. ⏳ Actualizar generador AI para múltiples niveles
4. ⏳ Actualizar templates para múltiples niveles
5. ⏳ Implementar conversores de formato
6. ⏳ Tests de integración V3
7. ⏳ Feature flag + rollout gradual
