# Plan de Mejoras del Sistema de Accesibilidad Universal V3
## Análisis y Roadmap de Implementación

> **Fecha**: 2025-11-30
> **Versión Actual**: V3 con AI + Templates
> **Rating Actual**: 4.25/5
> **Rating Objetivo**: 4.7+/5

---

## 📋 RESUMEN EJECUTIVO

El sistema V3 actual es innovador pero tiene áreas críticas que necesitan mejora inmediata. Este plan organiza **14 mejoras** en 4 niveles de prioridad con un roadmap de 3 meses.

### Arquitectura Actual
- ✅ AI-powered metadata generation (OpenAI GPT-4o-mini)
- ✅ 5 niveles cognitivos (beginner → expert)
- ✅ Soporte multilingüe (español + inglés base)
- ✅ Template fallback automático
- ✅ KV cache (24h para V3)
- ⚠️ Campos estructurales incompletos (stepByStep, checkpoints, glossary)
- ⚠️ Sin personalización basada en preferencias del usuario
- ⚠️ Formatos alternativos no implementados

---

## 🎯 PRIORIDADES Y ROADMAP

### 🔴 PRIORIDAD CRÍTICA (Semana 1) - IMPACTO INMEDIATO
**Objetivo**: Restaurar funcionalidad perdida y establecer base sólida

#### 1. Restaurar stepByStep con Timestamps e Iconos
**Problema**: Se perdió en commits recientes, antes era útil
**Impacto**: ⭐⭐⭐⭐⭐ (Crítico para comprensión del flujo)

```typescript
// NUEVO TIPO: src/facilitator/types.ts
interface StepWithContext {
  step: number;
  text: string;
  icon?: string;          // ✓, 🔐, 📡, ⏳
  timestamp?: string;     // ISO 8601
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTime?: string; // "~10 minutos"
  context?: string;       // Por qué es importante este paso
}

// MODIFICAR CognitiveContentV3
interface CognitiveContentV3 {
  // ... campos existentes
  stepByStep: StepWithContext[];  // ← Cambiar de string[] simple
}
```

**Ubicación**: `src/facilitator/accessibility/ai-metadata-v3.ts:379`
**Implementación**:
- Extender tipo `StepWithContext` en types.ts
- Modificar `createTemplateContent()` para generar steps con contexto
- Actualizar prompts de OpenAI para incluir timestamps/iconos
- Añadir lógica en `buildUniversalMetadataV3()` para calcular timestamps relativos

**Test**:
```typescript
// tests/unit/accessibility/step-by-step.test.ts
test('stepByStep incluye timestamps e iconos', () => {
  const steps = metadata.content.byLevel.simple.stepByStep;
  expect(steps[0]).toHaveProperty('timestamp');
  expect(steps[0]).toHaveProperty('icon');
  expect(steps[0].status).toBe('completed');
});
```

---

#### 2. Poblar checkpoints de Comprensión
**Problema**: Campo existe pero siempre vacío (`checkpoints: []`)
**Impacto**: ⭐⭐⭐⭐⭐ (Valida comprensión y previene errores)

```typescript
// YA EXISTE: src/facilitator/types.ts
interface ComprehensionCheckpointV3 {
  question: string;
  expectedAnswer?: string;
  hint?: string;
  glossaryRef?: string;      // Referencia a término del glosario
  actionLink?: string;        // Link para verificar (ej: WoC explorer)
  importance?: 'low' | 'medium' | 'high';
  safeguard?: string;         // Advertencia de seguridad
}
```

**Ubicación**: `src/facilitator/accessibility/ai-metadata-v3.ts:903`
**Mejoras necesarias**:
- ✅ Función `createCheckpoints()` ya existe y funciona bien
- ❌ AI no está generando checkpoints (solo templates)
- 🔧 **Acción**: Enriquecer prompts de AI para incluir checkpoints

**Implementación**:
1. Modificar `buildSystemPromptForLevel()` línea 1226 para pedir checkpoints
2. Modificar `buildUserPromptV3()` línea 1336 con ejemplos de checkpoints
3. Validar en `generateCognitiveLevelWithAI()` línea 254 que checkpoints existan

**Checkpoints Contextuales por Escenario**:
```typescript
// src/facilitator/accessibility/checkpoint-generator.ts (NUEVO)
export function generateCheckpointsForScenario(
  scenario: string,
  context: MetadataContext,
  level: CognitiveLevelV3
): ComprehensionCheckpointV3[] {
  const checkpoints: ComprehensionCheckpointV3[] = [];

  if (scenario.includes('verify')) {
    checkpoints.push({
      question: level === 'beginner'
        ? '¿Qué significa que el pago fue "verificado"?'
        : '¿Cuál es la diferencia entre verificar y broadcast?',
      hint: level === 'beginner'
        ? 'Piensa en revisar un sobre antes de echarlo al buzón'
        : 'Verificar valida, broadcast envía',
      importance: 'high',
      safeguard: 'Verificar NO envía el pago, solo lo valida'
    });
  }

  if (scenario.includes('settle')) {
    checkpoints.push({
      question: '¿Entiendes qué es un txid?',
      hint: 'Es el identificador único de tu transacción',
      glossaryRef: 'txid',
      actionLink: context.txid
        ? `https://whatsonchain.com/tx/${context.txid}`
        : undefined,
      importance: 'high'
    });

    checkpoints.push({
      question: '¿Guardaste tu txid?',
      importance: 'high',
      safeguard: 'Siempre guarda el txid para futuras referencias'
    });
  }

  return checkpoints;
}
```

---

#### 3. Estabilizar Glosario (4 Términos Base + Contextuales)
**Problema**: Oscila entre 0-4 términos, txid desaparece
**Impacto**: ⭐⭐⭐⭐ (Educación del usuario)

**Ubicación**: `src/facilitator/accessibility/ai-metadata-v3.ts:953`
**Solución**:
```typescript
// src/facilitator/accessibility/glossary-base.ts (NUEVO)
export const BASE_GLOSSARY_ES = {
  'transacción': 'Transferencia de dinero digital de una persona a otra',
  'blockchain': 'Libro de contabilidad público donde se registran todos los pagos',
  'liquidado': 'Pago enviado exitosamente a la red Bitcoin',
  'txid': 'Identificador único de la transacción (como un número de seguimiento)',
} as const;

export const CONTEXTUAL_GLOSSARY_ES: Record<string, Record<string, string>> = {
  verify: {
    'verificar': 'Comprobar que todo esté correcto antes de enviar el pago',
    'firma digital': 'Como tu firma en un cheque, pero imposible de falsificar',
  },
  settle: {
    'broadcast': 'Enviar la transacción a la red Bitcoin para que sea procesada',
    'mempool': 'Sala de espera donde las transacciones esperan ser confirmadas',
    'confirmación': 'Cuando la transacción se incluye en un bloque de la blockchain',
  },
  error: {
    'satoshis': 'La unidad más pequeña de Bitcoin (0.00000001 BTC)',
  }
};

// Modificar createGlossary() línea 953
function createGlossary(
  content: CognitiveContentV3,
  scenario?: string
): Record<string, string> {
  // SIEMPRE incluir base
  const glossary = { ...BASE_GLOSSARY_ES };

  // Agregar contextuales según escenario
  if (scenario) {
    const contextual = CONTEXTUAL_GLOSSARY_ES[scenario] || {};
    Object.assign(glossary, contextual);
  }

  // Agregar términos detectados en el contenido
  const detectedTerms = detectTermsInContent(content);
  Object.assign(glossary, detectedTerms);

  return glossary;
}
```

**Garantía**: Mínimo 4 términos (base) + hasta 3 contextuales = 7 términos siempre

---

### 🟠 PRIORIDAD ALTA (Semanas 2-3) - PERSONALIZACIÓN

#### 4. voiceCommandHints para Accesibilidad Motora
**Problema**: No existe
**Impacto**: ⭐⭐⭐⭐ (Accesibilidad para discapacidad motora)

```typescript
// NUEVO TIPO: src/facilitator/types.ts
interface VoiceCommandHints {
  commands: Array<{
    trigger: string;      // "verificar pago"
    action: string;       // "ver el estado de la transacción"
    context?: string;     // Cuándo usar este comando
  }>;
  examples: string[];     // "Di 'verificar pago' para..."
  wakePhrases?: string[]; // ["Hey Bitcoin", "Ok BSV"]
}

interface CognitiveContentV3 {
  // ... campos existentes
  voiceCommandHints?: VoiceCommandHints;
}
```

**Implementación**:
```typescript
// src/facilitator/accessibility/voice-commands.ts (NUEVO)
export function generateVoiceCommands(
  scenario: string,
  level: CognitiveLevelV3
): VoiceCommandHints {
  const baseCommands = [
    {
      trigger: 'repetir información',
      action: 'Escuchar los detalles de nuevo',
      context: 'Cuando no entendiste algo'
    },
    {
      trigger: 'ayuda',
      action: 'Ver más opciones disponibles',
      context: 'Cuando necesites orientación'
    }
  ];

  if (scenario.includes('verify')) {
    baseCommands.push({
      trigger: 'verificar pago',
      action: 'Ver el estado de la transacción',
      context: 'Para confirmar que todo está correcto'
    });
  }

  if (scenario.includes('settle')) {
    baseCommands.push({
      trigger: 'siguiente paso',
      action: 'Saber qué hacer ahora',
      context: 'Después de que el pago se confirmó'
    });
    baseCommands.push({
      trigger: 'ver txid',
      action: 'Escuchar el identificador de transacción',
      context: 'Para guardar o verificar el pago'
    });
  }

  return {
    commands: baseCommands,
    examples: baseCommands.map(c => `Di '${c.trigger}' para ${c.action}`),
    wakePhrases: level === 'beginner' ? ['Hey Bitcoin'] : undefined
  };
}
```

---

#### 5. Detección de Preferencias vía HTTP Headers
**Problema**: `userPreferencesApplied: false` siempre
**Impacto**: ⭐⭐⭐⭐⭐ (Personalización real vs teórica)

```typescript
// src/facilitator/accessibility/preference-detector.ts (NUEVO)
export interface DetectedPreferences {
  language?: string;
  contrast?: 'high' | 'normal' | 'low';
  fontSize?: 'small' | 'medium' | 'large' | 'x-large';
  cognitiveLevel?: CognitiveLevelV3;
  darkMode?: boolean;
  colorBlindType?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  motorInput?: 'keyboard' | 'voice' | 'switch' | 'eye';
  ttsEnabled?: boolean;
  source: 'http-headers' | 'query-params' | 'default';
}

export function detectPreferencesFromRequest(
  request: Request
): DetectedPreferences {
  const headers = request.headers;

  return {
    language: parseAcceptLanguage(headers.get('accept-language')),
    contrast: headers.get('x-prefer-contrast') as 'high' | 'normal' | 'low' || 'normal',
    fontSize: headers.get('x-prefer-fontsize') as any || 'medium',
    cognitiveLevel: headers.get('x-cognitive-level') as CognitiveLevelV3 || 'simple',
    darkMode: headers.get('x-prefer-darkmode') === 'true',
    colorBlindType: headers.get('x-colorblind-type') as any || 'none',
    motorInput: headers.get('x-motor-input') as any || 'keyboard',
    ttsEnabled: headers.get('x-tts-enabled') === 'true',
    source: 'http-headers'
  };
}

function parseAcceptLanguage(header: string | null): string {
  if (!header) return 'es';

  // Parsear "es-ES,es;q=0.9,en;q=0.8" → "es"
  const primary = header.split(',')[0]?.split(';')[0]?.split('-')[0];
  return primary || 'es';
}
```

**Integración en endpoints**:
```typescript
// src/facilitator/verify.ts y settle.ts
import { detectPreferencesFromRequest } from './accessibility/preference-detector';

export async function verifyHandler(request: Request, env: Env) {
  // ... validación existente

  // NUEVO: Detectar preferencias del request
  const detectedPrefs = detectPreferencesFromRequest(request);

  // Merge con preferencias explícitas del body
  const preferences: AccessibilityPreferencesV3 = {
    ...detectedPrefs,
    ...body.accessibility, // Preferencias explícitas override headers
    primaryLanguage: body.accessibility?.primaryLanguage || detectedPrefs.language
  };

  // Generar metadata con preferencias combinadas
  const metadata = await createMetadataWithAIV3(
    'success.verifyValid',
    context,
    preferences,
    env
  );

  // Actualizar metadata para reflejar que se aplicaron preferencias
  metadata.metadata.userPreferences = preferences;
  metadata.metadata.userPreferencesApplied = true;

  // ...
}
```

---

#### 6. Sistema adaptiveComplexity con Behavioral Tracking
**Problema**: No implementado
**Impacto**: ⭐⭐⭐⭐ (Personalización inteligente)

```typescript
// NUEVO: src/facilitator/accessibility/adaptive-complexity.ts
export interface BehaviorTracking {
  averageReadingTime?: string;
  glossaryTermsClicked?: string[];
  checkpointsAnswered?: number;
  checkpointsCorrect?: number;
  preferredComplexity?: CognitiveLevelV3;
  confidenceLevel?: number; // 0-1
  sessionHistory?: Array<{
    timestamp: string;
    level: CognitiveLevelV3;
    completedSuccessfully: boolean;
  }>;
}

export interface PersonalizationV3 {
  userPreferencesApplied: boolean;
  detectedPreferences?: DetectedPreferences;
  adaptiveComplexity: boolean;
  behaviorTracking?: BehaviorTracking;
  recommendations?: {
    suggestedLevel: CognitiveLevelV3;
    reason: string;
    confidence: number;
  };
}

// Algoritmo adaptativo simple
export function suggestComplexityLevel(
  tracking: BehaviorTracking,
  currentLevel: CognitiveLevelV3
): { level: CognitiveLevelV3; confidence: number; reason: string } {
  let score = 0;

  // Factor 1: Checkpoints
  if (tracking.checkpointsAnswered && tracking.checkpointsCorrect) {
    const accuracy = tracking.checkpointsCorrect / tracking.checkpointsAnswered;
    if (accuracy > 0.9) score += 2; // Puede subir
    else if (accuracy < 0.5) score -= 2; // Debería bajar
  }

  // Factor 2: Términos del glosario consultados
  const glossaryUse = tracking.glossaryTermsClicked?.length || 0;
  if (glossaryUse > 5) score -= 1; // Necesita más explicaciones
  if (glossaryUse === 0) score += 1; // No necesita ayuda

  // Factor 3: Tiempo de lectura
  // (simplificado - en producción parsear duration)

  // Factor 4: Historial de sesión
  const recentSuccesses = tracking.sessionHistory
    ?.slice(-5)
    .filter(s => s.completedSuccessfully).length || 0;
  if (recentSuccesses >= 4) score += 1;

  // Decidir nivel
  const levels: CognitiveLevelV3[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  let newIndex = currentIndex;

  if (score >= 3) newIndex = Math.min(currentIndex + 1, 4); // Subir
  else if (score <= -3) newIndex = Math.max(currentIndex - 1, 0); // Bajar

  return {
    level: levels[newIndex]!,
    confidence: Math.abs(score) / 5, // Normalizar a 0-1
    reason: score > 0
      ? 'Alto rendimiento en checkpoints y poca necesidad de ayuda'
      : 'Dificultades con el contenido actual, simplificar'
  };
}
```

**Integración con KV para persistencia**:
```typescript
// KV key: `user-tracking:${userId}` o usar session ID
async function loadBehaviorTracking(
  userId: string,
  env: EnvV3
): Promise<BehaviorTracking | null> {
  if (!env.METADATA_CACHE) return null;
  return await env.METADATA_CACHE.get(`tracking:${userId}`, 'json');
}

async function saveBehaviorTracking(
  userId: string,
  tracking: BehaviorTracking,
  env: EnvV3
): Promise<void> {
  if (!env.METADATA_CACHE) return;
  await env.METADATA_CACHE.put(
    `tracking:${userId}`,
    JSON.stringify(tracking),
    { expirationTtl: 86400 * 30 } // 30 días
  );
}
```

---

#### 7. Ejemplos con Datos Reales del Pago Actual
**Problema**: Ejemplos genéricos, no personalizados
**Impacto**: ⭐⭐⭐ (Educación más efectiva)

```typescript
// Modificar: src/facilitator/accessibility/ai-metadata-v3.ts:983
function createExamples(
  content: CognitiveContentV3,
  level: 'beginner' | 'simple',
  context?: MetadataContext  // ← NUEVO parámetro
): Array<{ scenario: string; input: any; output: string; explanation: string; visualization?: string; relatable?: string }> {
  const examples = [];

  // EJEMPLO 1: Con datos REALES del pago actual (si disponibles)
  if (context?.txid && context?.amount && context?.address) {
    examples.push({
      scenario: 'Tu pago actual',
      input: {
        amount: `${context.amount} satoshis`,
        to: context.address,
        txid: context.txid
      },
      output: `Enviaste ${context.amount} satoshis exitosamente`,
      explanation: 'Tu pago está confirmado en la blockchain BSV',
      visualization: `https://whatsonchain.com/tx/${context.txid}`,
      relatable: level === 'beginner'
        ? 'Es como enviar un email, pero con dinero'
        : 'Transferencia blockchain verificable públicamente'
    });
  }

  // EJEMPLO 2: Genérico educativo
  examples.push({
    scenario: 'Ejemplo: Compra de café',
    input: { amount: '2000 satoshis (~$1 USD)' },
    output: 'Pago confirmado',
    explanation: 'Suficiente para pagar un café',
    relatable: 'Micropagos instantáneos sin intermediarios'
  });

  // ... ejemplos existentes según verificación/settlement

  return examples;
}
```

**Actualizar llamadas**:
```typescript
// Línea 351, 552, etc.
if (content.examples.length === 0 && (level === 'beginner' || level === 'simple')) {
  content.examples = createExamples(content, level, context); // ← Pasar context
}
```

---

### 🟡 PRIORIDAD MEDIA (Semanas 4-6) - EXPERIENCIA AVANZADA

#### 8. Soporte Visual Completo (Daltonismo, Dark Mode, Contraste)
**Problema**: Estructura existe pero no se personaliza
**Impacto**: ⭐⭐⭐ (WCAG AAA compliance)

```typescript
// MEJORAR: src/facilitator/accessibility/ai-metadata-v3.ts:664
function buildVisualSection(
  preferences: AccessibilityPreferencesV3  // ← Añadir parámetro
): VisualSectionV3 {
  // Estructura existente...
  const visual = { /* ... estructura actual ... */ };

  // NUEVO: Añadir recomendación basada en preferencias
  return {
    ...visual,
    recommended: {
      contrast: preferences.contrastMode || 'normal',
      colorBlindMode: preferences.colorBlindType || 'none',
      fontSize: preferences.fontSize || 'medium',
      theme: preferences.darkMode ? 'dark' : 'light',
      reason: 'Basado en preferencias del usuario'
    },
    // NUEVO: Añadir altTexts reales
    altTexts: {
      successIcon: 'Marca de verificación verde indicando éxito',
      warningIcon: 'Triángulo amarillo de advertencia',
      errorIcon: 'Círculo rojo con X indicando error',
      txidIcon: 'Icono de llave representando identificador único',
      blockchainIcon: 'Cadena de bloques conectados'
    }
  };
}
```

---

#### 9. Sistema de Iconos de Apoyo Cognitivo
**Problema**: No implementado
**Impacto**: ⭐⭐⭐ (Comprensión visual)

```typescript
// NUEVO: src/facilitator/accessibility/icon-support.ts
export const ICON_LIBRARY = {
  status: {
    success: '✅',
    pending: '⏳',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  },
  concept: {
    txid: '🔑',
    blockchain: '⛓️',
    payment: '💳',
    money: '💰',
    verification: '🔐',
    broadcast: '📡',
    network: '🌐',
    time: '⏰'
  },
  action: {
    next: '▶️',
    back: '◀️',
    help: '❓',
    save: '💾',
    copy: '📋'
  }
} as const;

export const MEMORY_AIDS_ES = [
  '🔑 txid = Tu llave única de transacción',
  '⛓️ blockchain = Registro público permanente',
  '⏳ mempool = Sala de espera para transacciones',
  '💰 satoshis = La moneda más pequeña de Bitcoin',
  '🔐 firma digital = Tu autorización criptográfica',
  '📡 broadcast = Enviar a toda la red'
] as const;

export function addIconsToContent(content: CognitiveContentV3): CognitiveContentV3 {
  // Añadir iconos a stepByStep
  const stepsWithIcons = content.stepByStep.map((step, i) => {
    let icon = step.icon;

    if (!icon) {
      // Auto-detectar icono según texto
      const text = step.text.toLowerCase();
      if (text.includes('verif') || text.includes('valid')) icon = ICON_LIBRARY.concept.verification;
      else if (text.includes('broadcast') || text.includes('envía')) icon = ICON_LIBRARY.concept.broadcast;
      else if (text.includes('confirm')) icon = ICON_LIBRARY.status.success;
      else if (text.includes('esper')) icon = ICON_LIBRARY.status.pending;
      else icon = ICON_LIBRARY.status.info;
    }

    return { ...step, icon };
  });

  return {
    ...content,
    stepByStep: stepsWithIcons,
    memoryAids: content.memoryAids?.length
      ? content.memoryAids
      : [...MEMORY_AIDS_ES].slice(0, 3) // Top 3 relevantes
  };
}
```

---

#### 10. Formatos Alternativos REALES
**Problema**: Placeholders, no implementación real
**Impacto**: ⭐⭐⭐ (Accesibilidad multi-formato)

```typescript
// NUEVO: src/facilitator/accessibility/format-converters.ts

export function convertToXML(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  return `<?xml version="1.0" encoding="UTF-8"?>
<accessibility>
  <plainLanguage>${escapeXML(simple.plainLanguage)}</plainLanguage>
  <explanation>${escapeXML(simple.explanation)}</explanation>
  <steps>
    ${simple.stepByStep.map((s, i) => `
    <step number="${i + 1}">
      <text>${escapeXML(s.text)}</text>
      ${s.icon ? `<icon>${s.icon}</icon>` : ''}
      ${s.status ? `<status>${s.status}</status>` : ''}
    </step>`).join('')}
  </steps>
  ${simple.glossary ? `
  <glossary>
    ${Object.entries(simple.glossary).map(([term, def]) => `
    <term name="${escapeXML(term)}">${escapeXML(def)}</term>`).join('')}
  </glossary>` : ''}
</accessibility>`;
}

export function convertToMarkdown(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  let md = `# ${simple.plainLanguage}\n\n`;
  md += `${simple.explanation}\n\n`;

  if (simple.stepByStep.length) {
    md += `## Pasos\n\n`;
    simple.stepByStep.forEach((s, i) => {
      md += `${i + 1}. ${s.icon || ''} ${s.text}\n`;
    });
    md += '\n';
  }

  if (simple.glossary && Object.keys(simple.glossary).length) {
    md += `## Glosario\n\n`;
    Object.entries(simple.glossary).forEach(([term, def]) => {
      md += `- **${term}**: ${def}\n`;
    });
    md += '\n';
  }

  if (simple.hints?.nextSteps) {
    md += `## Siguiente Paso\n\n${simple.hints.nextSteps}\n`;
  }

  return md;
}

export function convertToHTML(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${simple.plainLanguage}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .step { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .glossary { background: #e8f4f8; padding: 15px; border-radius: 5px; }
    .glossary dt { font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>${escapeHTML(simple.plainLanguage)}</h1>
  <p>${escapeHTML(simple.explanation)}</p>

  <h2>Pasos</h2>
  ${simple.stepByStep.map((s, i) => `
  <div class="step">
    <strong>${i + 1}. ${s.icon || ''}</strong> ${escapeHTML(s.text)}
    ${s.status ? `<span class="status">(${s.status})</span>` : ''}
  </div>`).join('')}

  ${simple.glossary && Object.keys(simple.glossary).length ? `
  <div class="glossary">
    <h2>Glosario</h2>
    <dl>
      ${Object.entries(simple.glossary).map(([term, def]) => `
      <dt>${escapeHTML(term)}</dt>
      <dd>${escapeHTML(def)}</dd>`).join('')}
    </dl>
  </div>` : ''}
</body>
</html>`;
}

export function convertToPlaintext(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  let text = `${simple.plainLanguage}\n\n`;
  text += `${simple.explanation}\n\n`;

  if (simple.stepByStep.length) {
    text += 'PASOS:\n';
    simple.stepByStep.forEach((s, i) => {
      text += `  ${i + 1}. ${s.text}\n`;
    });
    text += '\n';
  }

  if (simple.glossary && Object.keys(simple.glossary).length) {
    text += 'GLOSARIO:\n';
    Object.entries(simple.glossary).forEach(([term, def]) => {
      text += `  - ${term}: ${def}\n`;
    });
  }

  return text;
}

export function convertToSSML(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  return `<speak>
  <p>${escapeSSML(simple.plainLanguage)}</p>
  <break time="500ms"/>
  <p>${escapeSSML(simple.explanation)}</p>
  <break time="1s"/>
  ${simple.stepByStep.length ? `
  <p>Los pasos son:</p>
  ${simple.stepByStep.map((s, i) => `
  <p><say-as interpret-as="ordinal">${i + 1}</say-as>. ${escapeSSML(s.text)}</p>
  <break time="300ms"/>`).join('')}` : ''}
</speak>`;
}

export function convertToBraille(data: ContentSectionV3): string {
  const simple = data.byLevel.simple;

  // Simplificar texto para Braille
  let text = simple.plainLanguage + '\n\n' + simple.explanation;

  // Remover emojis y caracteres especiales
  text = text.replace(/[^\w\s.,;:!?-áéíóúñÁÉÍÓÚÑ]/g, '');

  // Simplificar puntuación múltiple
  text = text.replace(/\.{2,}/g, '.');

  return text.trim();
}

// Helpers
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeSSML(str: string): string {
  return escapeXML(str);
}
```

**Actualizar buildFormatsSection**:
```typescript
// src/facilitator/accessibility/ai-metadata-v3.ts:771
import {
  convertToXML,
  convertToMarkdown,
  convertToHTML,
  convertToPlaintext,
  convertToSSML,
  convertToBraille
} from './format-converters';

async function buildFormatsSection(
  content: ContentSectionV3,
  languages: Record<string, LanguageContentV3>,
  _env: EnvV3
): Promise<FormatsSectionV3> {
  return {
    json: JSON.stringify({ content, languages }, null, 2),
    xml: convertToXML(content),
    plaintext: convertToPlaintext(content),
    markdown: convertToMarkdown(content),
    html: convertToHTML(content),
    jsonld: buildJSONLD(content),
    braille: convertToBraille(content),
    ssml: convertToSSML(content),
  };
}

function buildJSONLD(content: ContentSectionV3): string {
  const simple = content.byLevel.simple;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: simple.plainLanguage,
    description: simple.explanation,
    step: simple.stepByStep.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.text,
      text: s.text
    }))
  }, null, 2);
}
```

---

#### 11. Sistema de Feedback del Usuario
**Problema**: No existe
**Impacto**: ⭐⭐⭐ (Mejora continua)

```typescript
// NUEVO: src/facilitator/accessibility/feedback-system.ts
export interface FeedbackQuestionV3 {
  id: string;
  text: string;
  type: 'rating' | 'boolean' | 'text' | 'multiselect';
  scale?: number;        // Para rating: 1-5
  options?: string[];    // Para multiselect
  optional?: boolean;
}

export interface FeedbackSectionV3 {
  enabled: boolean;
  methods: Array<'inline' | 'survey' | 'analytics'>;
  questions: FeedbackQuestionV3[];
  submitEndpoint?: string;
  analytics?: {
    trackReadingTime: boolean;
    trackScrollDepth: boolean;
    trackGlossaryClicks: boolean;
  };
}

export function buildFeedbackSection(
  scenario: string
): FeedbackSectionV3 {
  const questions: FeedbackQuestionV3[] = [
    {
      id: 'comprehension',
      text: '¿La explicación fue clara?',
      type: 'rating',
      scale: 5
    },
    {
      id: 'helpful',
      text: '¿Los ejemplos te ayudaron?',
      type: 'boolean'
    }
  ];

  // Preguntas específicas por escenario
  if (scenario.includes('verify')) {
    questions.push({
      id: 'verify-understanding',
      text: '¿Entiendes la diferencia entre verificar y enviar (broadcast)?',
      type: 'boolean'
    });
  }

  if (scenario.includes('error')) {
    questions.push({
      id: 'error-resolution',
      text: '¿Pudiste resolver el error con las instrucciones?',
      type: 'boolean'
    });
    questions.push({
      id: 'improvements',
      text: '¿Qué mejorarías en la explicación del error?',
      type: 'text',
      optional: true
    });
  }

  return {
    enabled: true,
    methods: ['inline', 'analytics'],
    questions,
    submitEndpoint: '/api/feedback',
    analytics: {
      trackReadingTime: true,
      trackScrollDepth: true,
      trackGlossaryClicks: true
    }
  };
}
```

**Añadir a metadata V3**:
```typescript
// src/facilitator/types.ts
interface UniversalAccessibilityMetadataV3 {
  // ... campos existentes
  feedback?: FeedbackSectionV3;
}

// src/facilitator/accessibility/ai-metadata-v3.ts:657
return {
  content,
  languages: languageContent,
  visual,
  motor,
  audio,
  formats,
  feedback: buildFeedbackSection(messageType), // ← NUEVO
  recommendations,
  metadata: { /* ... */ }
};
```

---

### 🟢 PRIORIDAD BAJA (Meses 2-3) - FUTURO

#### 12. WCAG 2.2 AA/AAA Compliance Tracking
**Implementación**: Sistema de auditoría automática
**Archivo**: `src/facilitator/accessibility/wcag-compliance.ts`

#### 13. Machine Learning para Personalización
**Implementación**: Modelo predictivo de complejidad preferida
**Requiere**: Dataset de comportamiento de usuarios

#### 14. Internacionalización Completa
**Implementación**: Soporte para 8+ idiomas con adaptación cultural
**Archivo**: `src/facilitator/accessibility/i18n/` (expandir)

---

## 📊 ESTRUCTURA DE ARCHIVOS NUEVA

```
src/facilitator/accessibility/
├── ai-metadata-v3.ts                    # (MODIFICAR - core)
├── reading-level.ts                     # (existente)
├── i18n/
│   ├── v3/
│   │   ├── es.ts                       # (existente)
│   │   └── en.ts                       # (existente)
│   └── glossary-base.ts                # NUEVO - glosarios estables
├── checkpoint-generator.ts              # NUEVO - generación de checkpoints
├── voice-commands.ts                    # NUEVO - comandos de voz
├── preference-detector.ts               # NUEVO - detección HTTP headers
├── adaptive-complexity.ts               # NUEVO - sistema adaptativo
├── icon-support.ts                      # NUEVO - biblioteca de iconos
├── format-converters.ts                 # NUEVO - conversiones XML/MD/HTML/etc
├── feedback-system.ts                   # NUEVO - feedback del usuario
└── wcag-compliance.ts                   # NUEVO (futuro) - auditoría WCAG
```

---

## 🧪 ESTRATEGIA DE TESTING

### Tests Unitarios Nuevos
```typescript
// tests/unit/accessibility/
├── step-by-step.test.ts              # Timestamps, iconos, estados
├── checkpoints.test.ts               # Generación contextual
├── glossary.test.ts                  # Estabilidad 4 términos base
├── voice-commands.test.ts            # Comandos de voz
├── preference-detection.test.ts      # Parseo de headers
├── adaptive-complexity.test.ts       # Algoritmo de sugerencia
├── format-converters.test.ts         # XML, MD, HTML, SSML, Braille
└── feedback-system.test.ts           # Generación de preguntas
```

### Tests de Integración
```typescript
// tests/integration/accessibility/
├── full-flow-with-preferences.test.ts   # Request → preferencias → metadata
├── adaptive-learning.test.ts            # Múltiples requests, tracking
└── format-endpoints.test.ts             # /api/data?format=xml
```

---

## 🚀 DEPLOYMENT STRATEGY

### Feature Flags (wrangler.toml)
```toml
[env.production.vars]
# Existentes
ACCESSIBILITY_V3_ENABLED = "true"
AI_ROLLOUT_PERCENTAGE = "100"

# NUEVOS Feature Flags
FEATURE_STEP_BY_STEP_V2 = "true"         # Prioridad Crítica #1
FEATURE_CHECKPOINTS = "true"             # Prioridad Crítica #2
FEATURE_STABLE_GLOSSARY = "true"         # Prioridad Crítica #3
FEATURE_VOICE_COMMANDS = "false"         # Prioridad Alta #4 (gradual)
FEATURE_ADAPTIVE_COMPLEXITY = "false"    # Prioridad Alta #6 (gradual)
FEATURE_PREFERENCE_DETECTION = "true"    # Prioridad Alta #5 (safe)
FEATURE_REAL_EXAMPLES = "true"           # Prioridad Alta #7 (safe)
FEATURE_FORMAT_CONVERTERS = "false"      # Prioridad Media #10 (gradual)
FEATURE_FEEDBACK_SYSTEM = "false"        # Prioridad Media #11 (gradual)
```

### Rollout Plan
1. **Semana 1**: Deploy prioridades críticas con flags=true
2. **Semana 2**: Monitor logs, ajustar, activar prioridades altas seguras
3. **Semana 3**: Gradual rollout (20% → 50% → 100%) de prioridades altas complejas
4. **Semanas 4-6**: Deploy prioridades medias con flags gradual

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs Técnicos
- ✅ **stepByStep populated**: 100% de responses (actualmente ~0%)
- ✅ **checkpoints populated**: ≥2 por response (actualmente 0)
- ✅ **glossary stable**: 4-7 términos siempre (actualmente 0-4)
- ✅ **userPreferencesApplied**: true cuando headers presentes (actualmente false)
- ✅ **Format conversion time**: <100ms por formato
- ✅ **AI generation time**: <10s para 5 niveles en paralelo

### KPIs de Usuario
- 📊 **Rating promedio**: 4.25 → **4.7+**
- 📊 **Accesibilidad visual**: 60% → **85%+**
- 📊 **Accesibilidad cognitiva**: 85% → **95%+**
- 📊 **Personalización efectiva**: 20% → **80%+**
- 📊 **WCAG coverage**: ~50% → **90%+**

---

## ⚠️ RIESGOS Y MITIGACIÓN

### Riesgo 1: Aumento de latencia por features
**Mitigación**:
- Feature flags para activar gradualmente
- Paralelizar generación AI (ya implementado)
- Cache agresivo para formatos (7 días)

### Riesgo 2: Costos de OpenAI aumentan
**Mitigación**:
- Prompts optimizados (focus on core fields)
- KV cache hit rate >70%
- Template fallback siempre disponible

### Riesgo 3: Complejidad del código
**Mitigación**:
- Módulos pequeños y testeables
- Type safety estricto (TypeScript)
- Coverage >80% obligatorio

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana (Prioridad Crítica)
1. ✅ Crear archivos nuevos con estructura base
2. ✅ Implementar `StepWithContext` type
3. ✅ Restaurar stepByStep con timestamps
4. ✅ Implementar checkpoint-generator.ts
5. ✅ Implementar glossary-base.ts con 4 términos estables
6. ✅ Tests unitarios para los 3 cambios críticos
7. ✅ Deploy a production con feature flags

### Próximas 2 Semanas (Prioridad Alta)
8. ✅ Implementar preference-detector.ts
9. ✅ Implementar voice-commands.ts
10. ✅ Implementar adaptive-complexity.ts
11. ✅ Modificar createExamples() para datos reales
12. ✅ Tests de integración end-to-end
13. ✅ Gradual rollout 20% → 100%

---

## 📚 REFERENCIAS

- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **Cognitive Accessibility**: https://www.w3.org/WAI/WCAG2/supplemental/#cognitiveaccessibilityguidance
- **Voice UI Best Practices**: https://www.w3.org/WAI/perspectives/voice.html
- **Braille Standards**: https://www.brailleauthority.org/

---

**Autor**: Claude Code
**Versión Plan**: 1.0
**Última Actualización**: 2025-11-30
