# Fases de Implementación V2 - Accesibilidad Universal

**Proyecto:** Facilitador X402 BSV Accesible
**Versión:** 2.0
**Fecha:** 2025-11-29
**Estado Actual:** 85% completado

---

## 📊 Estado Global del Proyecto

### Progreso por Componente

| Componente | Estado | Progreso | Archivo(s) |
|------------|--------|----------|------------|
| Tipos V2 | ✅ Completado | 100% | `src/facilitator/types.ts` |
| Templates ES | ✅ Completado | 100% | `src/facilitator/accessibility/i18n/v2/es.ts` |
| Templates EN | ✅ Completado | 100% | `src/facilitator/accessibility/i18n/v2/en.ts` |
| Templates PT | ❌ Pendiente | 0% | `src/facilitator/accessibility/i18n/v2/pt.ts` |
| Templates FR | ❌ Pendiente | 0% | `src/facilitator/accessibility/i18n/v2/fr.ts` |
| Templates DE | ❌ Pendiente | 0% | `src/facilitator/accessibility/i18n/v2/de.ts` |
| AI Metadata V2 | ✅ Completado | 100% | `src/facilitator/accessibility/ai-metadata-v2.ts` |
| Format Converters (código) | ✅ Completado | 100% | `src/facilitator/accessibility/format-converters.ts` |
| Format Converters (integración) | ❌ Pendiente | 0% | `src/facilitator/index.ts` |
| Preference Cache | ✅ Completado | 100% | `src/facilitator/accessibility/preference-cache.ts` |
| WCAG Validator | ✅ Completado | 100% | `src/facilitator/accessibility/wcag-validator.ts` |
| Reading Level | ✅ Completado | 100% | `src/facilitator/accessibility/reading-level.ts` |
| Endpoints `/preferences` | ✅ Completado | 100% | `src/facilitator/index.ts:287-370` |
| Tests Unitarios | ✅ Completado | 95% | `tests/unit/accessibility/*` |
| Tests Integración | ⚠️ Parcial | 90% | `tests/integration/*` (5 fallando) |
| Documentación V2 | ❌ Pendiente | 0% | N/A |

**Progreso Total:** 85%

---

# FASE 1: Integración de Convertidores de Formato

**🎯 Objetivo:** Permitir que usuarios soliciten responses en XML, HTML, Markdown, Plain Text y JSON-LD

**⏱️ Tiempo Estimado:** 2-3 horas
**🔴 Prioridad:** CRÍTICA
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Definir]

---

## 1.1. Modificar Endpoint `/verify`

**Archivo:** `src/facilitator/index.ts` (aprox. línea 100-180)

### Tareas:

#### ✅ T1.1.1: Importar funciones de conversión
```typescript
// Agregar al inicio del archivo (después de imports existentes)
import {
  toXML,
  toPlainText,
  toMarkdown,
  toHTML,
  toJSONLD
} from './accessibility/format-converters';
```

**Ubicación:** Línea ~35 (después de otros imports)
**Tiempo:** 2 minutos

---

#### ✅ T1.1.2: Implementar switch de formato en `/verify`

**Ubicación:** Después de crear `AccessibleResponseV2` (línea ~180)

**Código a agregar:**
```typescript
app.post('/verify', zValidator('json', VerifyRequestSchema), async (c) => {
  // ... código existente de verificación ...

  // Obtener preferencias finales (ya existe)
  const finalPreferences = /* ... código existente ... */;

  // Crear response V2 (ya existe)
  const response: AccessibleResponseV2<VerifyResponse> = {
    data: verifyResult,
    accessibility: metadata,
    wcag: wcagCompliance
  };

  // ============== CÓDIGO NUEVO ==============
  const outputFormat = finalPreferences.outputFormat || 'json';

  // Verificar feature flag
  const formatConversionEnabled = c.env.FORMAT_CONVERSION_ENABLED === 'true';

  if (!formatConversionEnabled || outputFormat === 'json') {
    return c.json(response);
  }

  // Convertir según formato solicitado
  try {
    switch (outputFormat) {
      case 'xml':
        return c.text(toXML(response), 200, {
          'Content-Type': 'application/xml; charset=utf-8'
        });

      case 'plaintext':
        return c.text(toPlainText(response), 200, {
          'Content-Type': 'text/plain; charset=utf-8'
        });

      case 'markdown':
        return c.text(toMarkdown(response), 200, {
          'Content-Type': 'text/markdown; charset=utf-8'
        });

      case 'html':
        return c.html(toHTML(response));

      case 'jsonld':
        const jsonldStr = toJSONLD(response);
        return c.json(JSON.parse(jsonldStr), 200, {
          'Content-Type': 'application/ld+json; charset=utf-8'
        });

      default:
        // Fallback a JSON si formato desconocido
        logger.warn('Unknown output format requested, falling back to JSON', {
          requestedFormat: outputFormat
        });
        return c.json(response);
    }
  } catch (conversionError) {
    // Si la conversión falla, log y retornar JSON
    logger.error('Format conversion failed', {
      format: outputFormat,
      error: conversionError instanceof Error ? conversionError.message : String(conversionError)
    });
    return c.json(response);
  }
  // ============== FIN CÓDIGO NUEVO ==============
});
```

**Tiempo:** 20 minutos
**Testing manual:**
```bash
# Test XML
curl -X POST http://localhost:8787/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {...},
    "paymentRequirements": {...},
    "accessibilityPreferences": {
      "outputFormat": "xml"
    }
  }'

# Test HTML
# ... (cambiar outputFormat a "html")

# Test Markdown
# ... (cambiar outputFormat a "markdown")
```

---

#### ✅ T1.1.3: Agregar logging de formato usado

**Código a agregar** (dentro del switch, antes de return):
```typescript
logger.info('Response converted to requested format', {
  format: outputFormat,
  contentType: /* según caso */,
  userId: finalPreferences.userId || 'anonymous'
});
```

**Tiempo:** 5 minutos

---

## 1.2. Modificar Endpoint `/settle`

**Archivo:** `src/facilitator/index.ts` (aprox. línea 200-280)

### Tareas:

#### ✅ T1.2.1: Copiar lógica de conversión de `/verify`

**Instrucciones:**
1. Localizar el handler de `app.post('/settle', ...)`
2. Copiar el switch de formato completo de `/verify`
3. Adaptar para usar `SettleResponse` en vez de `VerifyResponse`
4. Mantener misma lógica de feature flag y error handling

**Tiempo:** 15 minutos

**Código:**
```typescript
app.post('/settle', zValidator('json', SettleRequestSchema), async (c) => {
  // ... código existente de settlement ...

  const response: AccessibleResponseV2<SettleResponse> = {
    data: settleResult,
    accessibility: metadata,
    wcag: wcagCompliance
  };

  // MISMO SWITCH QUE EN /verify
  const outputFormat = finalPreferences.outputFormat || 'json';
  const formatConversionEnabled = c.env.FORMAT_CONVERSION_ENABLED === 'true';

  if (!formatConversionEnabled || outputFormat === 'json') {
    return c.json(response);
  }

  try {
    switch (outputFormat) {
      // ... mismo código que /verify ...
    }
  } catch (conversionError) {
    // ... mismo error handling ...
  }
});
```

---

## 1.3. Testing Automatizado

**Archivo:** `tests/integration/format-conversion.test.ts` (puede que ya exista)

### Tareas:

#### ✅ T1.3.1: Tests para cada formato

**Crear/actualizar test file:**
```typescript
import { describe, it, expect } from 'vitest';
import app from '../../src/facilitator/index';

describe('Format Conversion - /verify endpoint', () => {
  it('should return JSON by default', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { /* valid payload */ },
        paymentRequirements: { /* valid requirements */ },
        accessibilityPreferences: {} // sin outputFormat
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('should return XML when outputFormat is xml', async () => {
    const res = await app.request('/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { /* valid payload */ },
        paymentRequirements: { /* valid requirements */ },
        accessibilityPreferences: { outputFormat: 'xml' }
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/xml');

    const text = await res.text();
    expect(text).toContain('<?xml version="1.0"');
    expect(text).toContain('<AccessibleResponse>');
  });

  it('should return HTML when outputFormat is html', async () => {
    // ... similar test
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(text).toContain('<!DOCTYPE html>');
  });

  it('should return Plain Text when outputFormat is plaintext', async () => {
    // ... similar test
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(text).not.toContain('<'); // no HTML tags
  });

  it('should return Markdown when outputFormat is markdown', async () => {
    // ... similar test
    expect(res.headers.get('Content-Type')).toContain('text/markdown');
    expect(text).toContain('#'); // markdown headers
  });

  it('should return JSON-LD when outputFormat is jsonld', async () => {
    // ... similar test
    expect(res.headers.get('Content-Type')).toContain('application/ld+json');
    const json = await res.json();
    expect(json['@context']).toBeDefined();
  });

  it('should fallback to JSON on conversion error', async () => {
    // Mock para forzar error de conversión
    // ...
  });

  it('should respect FORMAT_CONVERSION_ENABLED flag', async () => {
    // Test con flag = false
    // Debe retornar JSON incluso si se pide XML
    // ...
  });
});

describe('Format Conversion - /settle endpoint', () => {
  // Tests idénticos para /settle
  // ...
});
```

**Tiempo:** 30-40 minutos

---

#### ✅ T1.3.2: Ejecutar tests

```bash
npx vitest run tests/integration/format-conversion.test.ts
```

**Criterios de éxito:**
- ✅ Todos los tests pasan
- ✅ Content-Type correcto para cada formato
- ✅ Estructura válida para cada formato (XML parseable, HTML válido, etc.)

**Tiempo:** 10 minutos (si todo pasa a la primera)

---

## 1.4. Validación Manual

### Tareas:

#### ✅ T1.4.1: Test en desarrollo local

```bash
# 1. Levantar servidor dev
npm run dev

# 2. En otra terminal, ejecutar curl tests
curl -X POST http://localhost:8787/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "x402Version": 1,
      "scheme": "exact",
      "network": "bsv-testnet",
      "payload": {
        "transaction": "0100000001..."
      }
    },
    "paymentRequirements": {
      "scheme": "exact",
      "network": "bsv-testnet",
      "maxAmountRequired": "5000",
      "resource": "https://example.com/data",
      "payTo": "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
      "maxTimeoutSeconds": 300
    },
    "accessibilityPreferences": {
      "outputFormat": "xml",
      "language": "es",
      "cognitiveLevel": "simple"
    }
  }'
```

**Validaciones:**
- ✅ Response es XML válido
- ✅ Contiene todos los datos de accessibility metadata
- ✅ No hay caracteres mal escapados
- ✅ Parseable con `xmllint` o similar

**Tiempo:** 15 minutos

---

#### ✅ T1.4.2: Test de cada formato

Repetir T1.4.1 para:
- [ ] `outputFormat: "xml"`
- [ ] `outputFormat: "html"`
- [ ] `outputFormat: "plaintext"`
- [ ] `outputFormat: "markdown"`
- [ ] `outputFormat: "jsonld"`

**Validar:**
- Estructura correcta
- Encoding UTF-8 correcto (caracteres especiales españoles)
- Content-Type header correcto
- Sin errores en logs

**Tiempo:** 20 minutos

---

## 1.5. Actualizar Feature Flag

**Archivo:** `wrangler.toml`

### Tareas:

#### ✅ T1.5.1: Activar flag en development

```toml
[env.development.vars]
FORMAT_CONVERSION_ENABLED = "true"  # Cambiar de "false" a "true"
```

**Tiempo:** 1 minuto

---

#### ✅ T1.5.2: Deploy a development

```bash
npm run deploy # Asegurarse que use env development
# O específicamente:
wrangler deploy --env development
```

**Validaciones post-deploy:**
- ✅ Request con `outputFormat: "xml"` retorna XML
- ✅ Request sin `outputFormat` retorna JSON (default)
- ✅ Logs en Cloudflare muestran conversiones exitosas

**Tiempo:** 10 minutos

---

#### ✅ T1.5.3: Activar flag en production (DESPUÉS de validar dev)

```toml
[env.production.vars]
FORMAT_CONVERSION_ENABLED = "true"
```

```bash
wrangler deploy --env production
```

**⚠️ IMPORTANTE:** Solo hacer esto después de 24-48h de testing en dev sin issues.

**Tiempo:** 5 minutos (+ 24-48h de espera)

---

## 1.6. Documentación

### Tareas:

#### ✅ T1.6.1: Actualizar README.md

**Agregar sección:**
```markdown
## Formatos de Salida Soportados

El facilitador soporta múltiples formatos de respuesta para maximizar accesibilidad:

| Formato | `outputFormat` | Content-Type | Uso Recomendado |
|---------|----------------|--------------|-----------------|
| JSON | `"json"` (default) | `application/json` | APIs, aplicaciones web |
| XML | `"xml"` | `application/xml` | Sistemas legacy, enterprise |
| HTML | `"html"` | `text/html` | Navegadores, visualización directa |
| Markdown | `"markdown"` | `text/markdown` | Documentación, LLMs |
| Plain Text | `"plaintext"` | `text/plain` | Screen readers, TTS, Braille |
| JSON-LD | `"jsonld"` | `application/ld+json` | SEO, structured data, Schema.org |

### Ejemplo de Uso

\`\`\`bash
curl -X POST https://facilitador.example.com/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "payload": {...},
    "paymentRequirements": {...},
    "accessibilityPreferences": {
      "outputFormat": "xml",
      "language": "es",
      "cognitiveLevel": "simple"
    }
  }'
\`\`\`
```

**Tiempo:** 10 minutos

---

## 1.7. Checklist de Fase 1

- [ ] T1.1.1: Imports agregados a `index.ts`
- [ ] T1.1.2: Switch de formato en `/verify`
- [ ] T1.1.3: Logging agregado
- [ ] T1.2.1: Switch de formato en `/settle`
- [ ] T1.3.1: Tests automatizados creados
- [ ] T1.3.2: Tests ejecutados y pasando
- [ ] T1.4.1: Validación manual en dev
- [ ] T1.4.2: Validación de cada formato
- [ ] T1.5.1: Flag activado en development
- [ ] T1.5.2: Deploy a development exitoso
- [ ] T1.5.3: Flag activado en production (después de validar dev)
- [ ] T1.6.1: README actualizado

**Criterios de Aceptación:**
- ✅ Todos los 6 formatos funcionan correctamente
- ✅ Content-Type headers correctos
- ✅ Feature flag respetado
- ✅ Error handling robusto (fallback a JSON)
- ✅ Tests de integración pasando
- ✅ Documentación actualizada

---

# FASE 2: Templates Multilingües

**🎯 Objetivo:** Agregar soporte para Portugués, Francés y Alemán

**⏱️ Tiempo Estimado:** 18-24 horas (6-8h por idioma)
**🟡 Prioridad:** ALTA
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Definir]

---

## 2.1. Template Portugués

**Archivo a crear:** `src/facilitator/accessibility/i18n/v2/pt.ts`

### Tareas:

#### ✅ T2.1.1: Copiar estructura base de español

```bash
cp src/facilitator/accessibility/i18n/v2/es.ts src/facilitator/accessibility/i18n/v2/pt.ts
```

**Tiempo:** 1 minuto

---

#### ✅ T2.1.2: Traducir mensajes de error - `errors.verify`

**Mensajes a traducir:**
- `invalidAmount` (5 niveles: beginner, simple, medium, advanced, expert)
- `invalidAddress` (5 niveles)
- `invalidFormat` (5 niveles)

**Estructura por nivel:**
```typescript
beginner: {
  plainLanguage: string,          // ≤100 chars
  explanation: string,             // ≤300 chars
  detailedExplanation: string,     // ≤1000 chars
  stepByStep: string[],            // ≤10 pasos, ≤80 chars cada uno
  hints: {
    ifError?: string,
    commonMistakes?: string[],
    nextSteps?: string
  },
  examples: ConcreteExampleV2[],   // ≥3 ejemplos
  memoryAids: string[]             // ≥2 recordatorios
}
```

**Ejemplo - `invalidAmount.beginner`:**
```typescript
beginner: {
  plainLanguage: 'Você não enviou dinheiro suficiente',
  explanation: 'O pagamento requer mais dinheiro do que você enviou. É como tentar pagar R$5 com apenas R$2.',
  detailedExplanation: 'Cada pagamento precisa de um valor mínimo específico. Sua transação inclui menos dinheiro do que o necessário. Isso acontece quando o valor é menor que o exigido ou quando você esquece de incluir as taxas de rede.',
  stepByStep: [
    'Verifique quanto dinheiro o pagamento exige',
    'Confira quanto você incluiu na sua transação',
    'Some a diferença que falta',
    'Crie uma nova transação com o valor correto'
  ],
  hints: {
    ifError: 'Verifique se o valor inclui também as taxas de rede (fees)',
    commonMistakes: [
      'Esquecer de somar as taxas de rede ao valor',
      'Confundir satoshis com BSV (1 BSV = 100 milhões de satoshis)',
      'Copiar errado o número do valor exigido'
    ],
    nextSteps: 'Verifique o valor exigido e crie um novo pagamento com a quantia correta'
  },
  examples: [
    {
      scenario: 'Comprar um café com BSV',
      input: 'Você envia 1000 satoshis mas são necessários 5000 satoshis',
      output: 'Erro: valor insuficiente',
      explanation: 'É como pagar R$1 por um café de R$5. Você precisa enviar mais 4000 satoshis'
    }
  ],
  memoryAids: [
    '💡 Sempre verifique o valor ANTES de enviar',
    '💡 Valor total = preço + taxa de rede'
  ]
}
```

**Tiempo:** 3-4 horas

---

#### ✅ T2.1.3: Traducir mensajes de error - `errors.settle`

**Mensajes:**
- `alreadyBroadcast` (5 niveles)
- `networkError` (5 niveles)
- `broadcastFailed` (5 niveles)

**Tiempo:** 2-3 horas

---

#### ✅ T2.1.4: Traducir mensajes de éxito

**Mensajes:**
- `success.verifyValid` (5 niveles)
- `success.settleSuccess` (5 niveles)
- `success.supportedNetworks` (5 niveles)

**Tiempo:** 1-2 horas

---

#### ✅ T2.1.5: Crear glosario de términos técnicos

```typescript
glossary: {
  satoshi: "Unidade mínima do Bitcoin SV. 1 BSV = 100.000.000 satoshis",
  txid: "Identificador único de 64 caracteres hexadecimais de uma transação",
  output: "Saída de uma transação que especifica quem recebe os fundos",
  input: "Entrada de uma transação que referencia fundos anteriores",
  address: "Endereço BSV (começa com '1' na mainnet, 'm' ou 'n' na testnet)",
  fee: "Taxa de rede paga aos mineradores para processar a transação",
  broadcast: "Enviar a transação para a rede blockchain",
  blockchain: "Livro-razão distribuído que registra todas as transações",
  mainnet: "Rede principal do BSV (dinheiro real)",
  testnet: "Rede de testes do BSV (dinheiro fictício para desenvolvimento)",
  p2pkh: "Pay-to-Public-Key-Hash - tipo padrão de script de bloqueio",
  script: "Código que define as condições para gastar fundos",
  wallet: "Carteira digital que armazena suas chaves privadas",
  wif: "Wallet Import Format - formato de chave privada"
}
```

**Tiempo:** 30 minutos

---

#### ✅ T2.1.6: Implementar variantes de dialecto

```typescript
export const portugueseDialects = {
  'pt-BR': {
    // Variaciones brasileñas
    currencySymbol: 'R$',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    dateFormat: 'DD/MM/YYYY',
    culturalNotes: {
      // Adaptaciones culturales para Brasil
      paymentExample: 'Pagar um cafézinho de R$5',
      commonAmounts: ['R$10', 'R$50', 'R$100']
    }
  },
  'pt-PT': {
    // Variaciones portuguesas
    currencySymbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    dateFormat: 'DD/MM/YYYY',
    culturalNotes: {
      paymentExample: 'Pagar um café de €2',
      commonAmounts: ['€5', '€20', '€50']
    }
  }
};
```

**Tiempo:** 20 minutos

---

#### ✅ T2.1.7: Agregar iconos y recursos

```typescript
icons: {
  verify: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  success: '✅',
  failure: '❌',
  money: '💰',
  network: '🌐',
  clock: '⏱️',
  key: '🔑'
}
```

**Tiempo:** 10 minutos

---

#### ✅ T2.1.8: Testing del template portugués

```typescript
// tests/unit/accessibility/i18n-pt.test.ts
import { portugueseTemplatesV2 } from '../../../src/facilitator/accessibility/i18n/v2/pt';

describe('Portuguese Templates V2', () => {
  it('should have all required error messages', () => {
    expect(portugueseTemplatesV2.errors.verify.invalidAmount.beginner).toBeDefined();
    // ... test all messages
  });

  it('should respect character limits', () => {
    const msg = portugueseTemplatesV2.errors.verify.invalidAmount.simple;
    expect(msg.plainLanguage.length).toBeLessThanOrEqual(100);
    expect(msg.explanation.length).toBeLessThanOrEqual(300);
    // ... test all levels
  });

  it('should have glossary with technical terms', () => {
    expect(portugueseTemplatesV2.glossary.satoshi).toContain('BSV');
    expect(portugueseTemplatesV2.glossary.txid).toBeDefined();
  });

  it('should support Brazilian and European Portuguese dialects', () => {
    expect(portugueseDialects['pt-BR']).toBeDefined();
    expect(portugueseDialects['pt-PT']).toBeDefined();
    expect(portugueseDialects['pt-BR'].currencySymbol).toBe('R$');
    expect(portugueseDialects['pt-PT'].currencySymbol).toBe('€');
  });
});
```

**Tiempo:** 30 minutos

---

### Checklist Template Portugués
- [ ] T2.1.1: Archivo creado desde base
- [ ] T2.1.2: Errores de verify traducidos (15 mensajes × 5 niveles)
- [ ] T2.1.3: Errores de settle traducidos (15 mensajes × 5 niveles)
- [ ] T2.1.4: Mensajes de éxito traducidos (15 mensajes × 5 niveles)
- [ ] T2.1.5: Glosario creado (≥15 términos)
- [ ] T2.1.6: Dialectos pt-BR y pt-PT implementados
- [ ] T2.1.7: Iconos agregados
- [ ] T2.1.8: Tests unitarios pasando

**Tiempo Total:** 6-8 horas

---

## 2.2. Template Francés

**Archivo a crear:** `src/facilitator/accessibility/i18n/v2/fr.ts`

### Tareas:

Seguir misma estructura que Template Portugués (T2.1.1 - T2.1.8), pero para francés:

#### ✅ T2.2.1: Copiar estructura base
#### ✅ T2.2.2: Traducir `errors.verify`
#### ✅ T2.2.3: Traducir `errors.settle`
#### ✅ T2.2.4: Traducir `success`
#### ✅ T2.2.5: Crear glosario en francés

**Ejemplos de términos:**
```typescript
glossary: {
  satoshi: "Unité minimale du Bitcoin SV. 1 BSV = 100.000.000 satoshis",
  txid: "Identifiant unique de 64 caractères hexadécimaux d'une transaction",
  output: "Sortie d'une transaction qui spécifie qui reçoit les fonds",
  // ...
}
```

#### ✅ T2.2.6: Dialectos (solo estándar, sin variantes)
```typescript
export const frenchDialects = {
  'fr': {
    currencySymbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    dateFormat: 'DD/MM/YYYY'
  }
};
```

#### ✅ T2.2.7: Iconos
#### ✅ T2.2.8: Tests unitarios

**Tiempo Total:** 6-8 horas

---

## 2.3. Template Alemán

**Archivo a crear:** `src/facilitator/accessibility/i18n/v2/de.ts`

### Tareas:

Idéntica estructura a Francés y Portugués:

#### ✅ T2.3.1: Copiar estructura base
#### ✅ T2.3.2: Traducir `errors.verify`
#### ✅ T2.3.3: Traducir `errors.settle`
#### ✅ T2.3.4: Traducir `success`
#### ✅ T2.3.5: Crear glosario en alemán

**Ejemplos:**
```typescript
glossary: {
  satoshi: "Kleinste Einheit von Bitcoin SV. 1 BSV = 100.000.000 Satoshis",
  txid: "Eindeutige 64-stellige Hexadezimal-ID einer Transaktion",
  output: "Ausgabe einer Transaktion, die angibt, wer die Mittel erhält",
  // ...
}
```

#### ✅ T2.3.6: Dialectos (solo estándar)
```typescript
export const germanDialects = {
  'de': {
    currencySymbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    dateFormat: 'DD.MM.YYYY'
  }
};
```

#### ✅ T2.3.7: Iconos
#### ✅ T2.3.8: Tests unitarios

**Tiempo Total:** 6-8 horas

---

## 2.4. Integración en Sistema i18n

**Archivo:** `src/facilitator/accessibility/i18n/index.ts`

### Tareas:

#### ✅ T2.4.1: Importar nuevos templates

```typescript
// Agregar al inicio del archivo
import { portugueseTemplatesV2 } from './v2/pt';
import { frenchTemplatesV2 } from './v2/fr';
import { germanTemplatesV2 } from './v2/de';
```

**Tiempo:** 2 minutos

---

#### ✅ T2.4.2: Actualizar función `getMessagesByLanguageV2`

```typescript
export function getMessagesByLanguageV2(
  language: LanguageCodeV2
): MessageCatalogV2 {
  switch (language) {
    case 'es':
      return spanishTemplatesV2;
    case 'en':
      return englishTemplatesV2;
    case 'pt':
      return portugueseTemplatesV2;  // NUEVO
    case 'fr':
      return frenchTemplatesV2;      // NUEVO
    case 'de':
      return germanTemplatesV2;      // NUEVO
    default:
      // Fallback a español
      return spanishTemplatesV2;
  }
}
```

**Tiempo:** 5 minutos

---

#### ✅ T2.4.3: Agregar tests de integración

```typescript
// tests/integration/multilang-v2.test.ts
describe('Multilingual Support V2', () => {
  it('should support all 5 languages', () => {
    const languages: LanguageCodeV2[] = ['es', 'en', 'pt', 'fr', 'de'];

    for (const lang of languages) {
      const messages = getMessagesByLanguageV2(lang);
      expect(messages).toBeDefined();
      expect(messages.errors.verify.invalidAmount.simple).toBeDefined();
    }
  });

  it('should return responses in requested language', async () => {
    // Test /verify con cada idioma
    for (const lang of ['es', 'en', 'pt', 'fr', 'de']) {
      const res = await app.request('/verify', {
        method: 'POST',
        body: JSON.stringify({
          // ... payload válido
          accessibilityPreferences: { language: lang }
        })
      });

      const json = await res.json();
      expect(json.accessibility.language.code).toBe(lang);
    }
  });
});
```

**Tiempo:** 20 minutos

---

## 2.5. Actualizar Feature Flag

**Archivo:** `wrangler.toml`

#### ✅ T2.5.1: Activar flag en development (después de T2.4)

```toml
[env.development.vars]
MULTILANG_ENABLED = "true"  # Cambiar de "false" a "true"
```

```bash
wrangler deploy --env development
```

**Tiempo:** 5 minutos

---

#### ✅ T2.5.2: Testing manual de cada idioma

```bash
# Test Portugués
curl -X POST http://localhost:8787/verify \
  -d '{"accessibilityPreferences": {"language": "pt"}}'

# Test Francés
curl -X POST http://localhost:8787/verify \
  -d '{"accessibilityPreferences": {"language": "fr"}}'

# Test Alemán
curl -X POST http://localhost:8787/verify \
  -d '{"accessibilityPreferences": {"language": "de"}}'
```

**Validaciones:**
- ✅ Mensajes en idioma correcto
- ✅ Glosario en idioma correcto
- ✅ Ejemplos culturalmente relevantes

**Tiempo:** 30 minutos

---

#### ✅ T2.5.3: Activar flag en production

```toml
[env.production.vars]
MULTILANG_ENABLED = "true"
```

```bash
wrangler deploy --env production
```

**⚠️ Solo después de 24-48h de testing en dev**

**Tiempo:** 5 minutos (+ espera)

---

## 2.6. Checklist de Fase 2

- [ ] T2.1: Template Portugués completo (6-8h)
- [ ] T2.2: Template Francés completo (6-8h)
- [ ] T2.3: Template Alemán completo (6-8h)
- [ ] T2.4: Integración en sistema i18n (30min)
- [ ] T2.5: Feature flag activado (10min + validación)
- [ ] Tests unitarios para 3 idiomas pasando
- [ ] Tests de integración multilingüe pasando
- [ ] Validación manual de cada idioma
- [ ] Deploy a production exitoso

**Criterios de Aceptación:**
- ✅ 5 idiomas completos (ES, EN, PT, FR, DE)
- ✅ 40+ mensajes por idioma
- ✅ Glosarios con ≥15 términos cada uno
- ✅ Ejemplos culturalmente relevantes
- ✅ Tests 100% pasando
- ✅ Feature flag `MULTILANG_ENABLED = true` en producción

---

# FASE 3: Fix Integration Tests

**🎯 Objetivo:** Resolver 5 tests fallando en integration tests

**⏱️ Tiempo Estimado:** 2-4 horas
**🟡 Prioridad:** ALTA
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Definir]

---

## 3.1. Análisis de Fallos

### Tests Fallando:

1. **`tests/integration/cors.test.ts`**
   - `should allow requests from any origin` (status 500 vs 200)

2. **`tests/integration/verify-flow.test.ts`**
   - `POST /verify returns 200 with AccessibleResponse structure` (status 500 vs 200)
   - `POST /verify with mainnet address returns error with clear Spanish explanation` (status 500 vs 200)
   - `POST /verify metadata respects length limits` (TypeError: Cannot read 'plainLanguage')

### Root Cause:
Tests esperan estructura V1 pero código genera V2. Faltan bindings V2 en mocks.

---

## 3.2. Fix CORS Test

**Archivo:** `tests/integration/cors.test.ts`

### Tareas:

#### ✅ T3.2.1: Actualizar mock de environment

```typescript
// Antes
const mockEnv = {
  OPENAI_API_KEY: 'test-key',
  METADATA_CACHE: mockKV,
  // ...
};

// Después
const mockEnv = {
  OPENAI_API_KEY: 'test-key',
  METADATA_CACHE: mockKV,
  USER_PREFERENCES: mockKV,  // AGREGAR ESTO
  AI_ENABLED: 'false',       // Deshabilitar AI en tests
  FORMAT_CONVERSION_ENABLED: 'false',
  MULTILANG_ENABLED: 'true',
  // ... resto de vars
};
```

**Tiempo:** 10 minutos

---

#### ✅ T3.2.2: Actualizar assertions para V2

```typescript
// Si el test verifica estructura de response:
// Antes
expect(json.accessibility.plainLanguage).toBeDefined();

// Después
expect(json.accessibility.content.plainLanguage).toBeDefined();
expect(json.wcag).toBeDefined(); // V2 incluye WCAG metadata
```

**Tiempo:** 10 minutos

---

## 3.3. Fix Verify Flow Tests

**Archivo:** `tests/integration/verify-flow.test.ts`

### Tareas:

#### ✅ T3.3.1: Actualizar mocks de environment (igual que T3.2.1)

**Tiempo:** 10 minutos

---

#### ✅ T3.3.2: Actualizar estructura de requests

```typescript
// Agregar accessibilityPreferences V2 en todos los requests de test
const testRequest = {
  payload: { /* ... */ },
  paymentRequirements: { /* ... */ },
  accessibilityPreferences: {
    language: 'es',
    cognitiveLevel: 'simple',
    outputFormat: 'json',
    // ... otros campos V2 según necesidad
  }
};
```

**Tiempo:** 15 minutos

---

#### ✅ T3.3.3: Actualizar assertions para estructura V2

**Antes:**
```typescript
expect(json.accessibility.plainLanguage).toBeDefined();
expect(json.accessibility.explanation).toBeDefined();
expect(json.accessibility.stepByStep).toBeInstanceOf(Array);
```

**Después:**
```typescript
expect(json.accessibility.content.plainLanguage).toBeDefined();
expect(json.accessibility.content.explanation).toBeDefined();
expect(json.accessibility.content.stepByStep).toBeInstanceOf(Array);
expect(json.accessibility.visual).toBeDefined();
expect(json.accessibility.cognitive).toBeDefined();
expect(json.accessibility.language).toBeDefined();
expect(json.wcag).toBeDefined();
expect(json.wcag.version).toBe('2.2');
```

**Tiempo:** 20 minutos

---

#### ✅ T3.3.4: Fix test de length limits

**Problema:** `Cannot read properties of undefined (reading 'plainLanguage')`

**Causa:** Ruta cambiada de `accessibility.plainLanguage` a `accessibility.content.plainLanguage`

**Solución:**
```typescript
// Antes
expect(json.accessibility.plainLanguage.length).toBeLessThanOrEqual(100);
expect(json.accessibility.explanation.length).toBeLessThanOrEqual(300);

// Después
expect(json.accessibility.content.plainLanguage.length).toBeLessThanOrEqual(100);
expect(json.accessibility.content.explanation.length).toBeLessThanOrEqual(300);
expect(json.accessibility.content.detailedExplanation?.length || 0).toBeLessThanOrEqual(1000);

// Agregar validaciones V2
expect(json.accessibility.cognitive.readingLevel.fleschKincaidGrade).toBeGreaterThanOrEqual(0);
expect(json.wcag.successCriteria).toBeInstanceOf(Array);
```

**Tiempo:** 15 minutos

---

## 3.4. Ejecutar y Validar Tests

### Tareas:

#### ✅ T3.4.1: Ejecutar tests corregidos

```bash
# Run specific test files
npx vitest run tests/integration/cors.test.ts
npx vitest run tests/integration/verify-flow.test.ts

# Run all integration tests
npx vitest run tests/integration/
```

**Criterios de éxito:**
- ✅ 0 tests fallando
- ✅ Todos los assertions pasan
- ✅ No errores de tipo (TypeScript)

**Tiempo:** 10 minutos

---

#### ✅ T3.4.2: Ejecutar test suite completo

```bash
npm test
```

**Objetivo:** 316/316 tests pasando

**Tiempo:** 5 minutos

---

#### ✅ T3.4.3: Verificar cobertura

```bash
npm run test:coverage
```

**Objetivo:** ≥80% cobertura en todas las áreas

**Tiempo:** 5 minutos

---

## 3.5. Checklist de Fase 3

- [ ] T3.2.1: CORS test - mocks actualizados
- [ ] T3.2.2: CORS test - assertions V2
- [ ] T3.3.1: Verify flow - mocks actualizados
- [ ] T3.3.2: Verify flow - requests V2
- [ ] T3.3.3: Verify flow - assertions V2
- [ ] T3.3.4: Length limits test corregido
- [ ] T3.4.1: Tests específicos pasando
- [ ] T3.4.2: Test suite completo pasando (316/316)
- [ ] T3.4.3: Cobertura ≥80%

**Criterios de Aceptación:**
- ✅ 316/316 tests pasando (0 failed)
- ✅ Cobertura ≥80% mantenida
- ✅ No errores de tipo TypeScript
- ✅ Todos los mocks correctos para V2

---

# FASE 4: Activación de Feature Flags

**🎯 Objetivo:** Activar flags en producción después de validación

**⏱️ Tiempo Estimado:** 30 minutos + validación
**🟢 Prioridad:** MEDIA
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Definir]

---

## 4.1. Estrategia de Activación

### Orden de Activación:
1. ✅ `WCAG_COMPLIANCE_ENABLED` (ya activo)
2. `FORMAT_CONVERSION_ENABLED` (después de Fase 1)
3. `READING_LEVEL_ANALYSIS` (ready to enable)
4. `MULTILANG_ENABLED` (después de Fase 2)
5. `ADAPTIVE_COMPLEXITY_ENABLED` (experimental, dejar false)

---

## 4.2. Activación en Development

**Archivo:** `wrangler.toml`

### Tareas:

#### ✅ T4.2.1: Actualizar flags en development

```toml
[env.development.vars]
# Ya activos
WCAG_COMPLIANCE_ENABLED = "true"

# Activar después de Fase 1
FORMAT_CONVERSION_ENABLED = "true"

# Activar ahora (ya implementado)
READING_LEVEL_ANALYSIS = "true"

# Activar después de Fase 2
MULTILANG_ENABLED = "true"

# Dejar desactivado (experimental)
ADAPTIVE_COMPLEXITY_ENABLED = "false"
```

**Tiempo:** 2 minutos

---

#### ✅ T4.2.2: Deploy a development

```bash
wrangler deploy --env development
```

**Tiempo:** 3 minutos

---

#### ✅ T4.2.3: Testing post-deploy en development

```bash
# Test 1: Format conversion
curl -X POST https://facilitador-dev.workers.dev/verify \
  -d '{"accessibilityPreferences": {"outputFormat": "xml"}}'

# Test 2: Reading level
curl -X POST https://facilitador-dev.workers.dev/verify \
  -d '{"accessibilityPreferences": {"language": "es"}}' | jq '.accessibility.cognitive.readingLevel'

# Test 3: Multilingual
curl -X POST https://facilitador-dev.workers.dev/verify \
  -d '{"accessibilityPreferences": {"language": "pt"}}'
```

**Validaciones:**
- ✅ Format conversion funciona
- ✅ Reading level aparece en response
- ✅ Idiomas funcionan correctamente

**Tiempo:** 15 minutos

---

## 4.3. Activación en Production

**⚠️ IMPORTANTE:** Solo proceder después de 24-48h de testing en development sin issues.

### Tareas:

#### ✅ T4.3.1: Actualizar flags en production

```toml
[env.production.vars]
WCAG_COMPLIANCE_ENABLED = "true"
FORMAT_CONVERSION_ENABLED = "true"
READING_LEVEL_ANALYSIS = "true"
MULTILANG_ENABLED = "true"
ADAPTIVE_COMPLEXITY_ENABLED = "false"
```

**Tiempo:** 2 minutos

---

#### ✅ T4.3.2: Deploy a production

```bash
wrangler deploy --env production
```

**Tiempo:** 3 minutos

---

#### ✅ T4.3.3: Monitoring post-deploy (primeras 4 horas)

```bash
# Ver logs en tiempo real
wrangler tail --env production --format pretty

# Monitorear métricas en Cloudflare Dashboard:
# - Request rate
# - Error rate
# - Latency p50, p95, p99
# - CPU utilization
```

**Alertas a monitorear:**
- ⚠️ Error rate > 1%
- ⚠️ Latency p95 > 500ms
- ⚠️ CPU utilization > 80%

**Tiempo:** 10 minutos cada hora × 4 horas = 40 minutos

---

#### ✅ T4.3.4: Rollback plan (si es necesario)

**Si hay issues críticos:**
```bash
# 1. Revertir feature flags problemáticos
# Edit wrangler.toml, cambiar flags a "false"

# 2. Redeploy
wrangler deploy --env production

# 3. Verificar rollback exitoso
curl https://facilitador.workers.dev/ | jq
```

**Tiempo:** 5 minutos (solo si es necesario)

---

## 4.4. Checklist de Fase 4

- [ ] T4.2.1: Flags actualizados en development
- [ ] T4.2.2: Deploy a dev exitoso
- [ ] T4.2.3: Testing post-deploy en dev (todas las features funcionando)
- [ ] **ESPERAR 24-48h** de testing en dev
- [ ] T4.3.1: Flags actualizados en production
- [ ] T4.3.2: Deploy a prod exitoso
- [ ] T4.3.3: Monitoring post-deploy (4 horas)
- [ ] T4.3.4: Rollback plan documentado y testeado

**Criterios de Aceptación:**
- ✅ Todas las features activas en production
- ✅ Error rate < 1%
- ✅ Latency p95 < 300ms
- ✅ No errores críticos en logs
- ✅ Tests de smoke pasando en production

---

# FASE 5: Documentación V2

**🎯 Objetivo:** Crear documentación completa para sistema V2

**⏱️ Tiempo Estimado:** 4-6 horas
**🟢 Prioridad:** MEDIA
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Definir]

---

## 5.1. Documento: ACCESSIBILITY-V2.md

**Archivo:** `docs/ACCESSIBILITY-V2.md`

### Contenido:

#### ✅ T5.1.1: Sección Overview

```markdown
# Accesibilidad Universal V2

## Overview

El sistema de Accesibilidad Universal V2 expande el facilitador X402 BSV para cumplir con **WCAG 2.2 Nivel AAA**, el estándar más alto de accesibilidad web.

### Mejoras vs V1

| Característica | V1 | V2 |
|----------------|----|----|
| Idiomas | 2 (ES, EN) | 5 (ES, EN, PT, FR, DE) |
| Niveles cognitivos | 3 (simple, medium, advanced) | 5 (beginner, simple, medium, advanced, expert) |
| Formatos de salida | 1 (JSON) | 6 (JSON, XML, HTML, Markdown, Plain Text, JSON-LD) |
| Compliance WCAG | Informal | Formal 2.2 AAA con audit trail |
| Reading level analysis | No | Sí (Flesch-Kincaid) |
| Caché de preferencias | No | Sí (30 días en KV) |
| Dimensiones de accesibilidad | 3 (content, language, cognitive) | 7 (content, visual, cognitive, language, motor, format, personalization) |

### Principios de Diseño

1. **Universal Access First**: El sistema default es accesible, no es opt-in
2. **Personalization**: Preferencias persistentes por usuario
3. **Progressive Enhancement**: Funcionalidad core sin degradar experiencia
4. **Standards Compliance**: WCAG 2.2 AAA con auditoría formal
```

**Tiempo:** 30 minutos

---

#### ✅ T5.1.2: Sección Preferencias de Usuario

```markdown
## Preferencias de Usuario (AccessibilityPreferencesV2)

### Categorías de Preferencias

#### 1. Lingüísticas
- `language`: Idioma del contenido (es, en, pt, fr, de)
- `dialect`: Variante regional (ej: pt-BR, pt-PT, es-ES, es-MX)

#### 2. Cognitivas
- `cognitiveLevel`: Nivel de complejidad (beginner, simple, medium, advanced, expert)
- `abstractionLevel`: Tipo de ejemplos (concrete, mixed, abstract)
- `includeExamples`: Incluir ejemplos concretos (boolean)
- `includeGlossary`: Incluir glosario de términos (boolean)
- `includeCheckpoints`: Incluir preguntas de comprensión (boolean)

#### 3. Visuales
- `contrastMode`: Modo de contraste (high, normal, low)
- `colorBlindType`: Tipo de daltonismo (deuteranopia, protanopia, tritanopia, none)
- `fontSize`: Tamaño de fuente (small, medium, large, x-large)
- `darkMode`: Modo oscuro (boolean)
- `screenReaderOptimized`: Optimizar para lectores de pantalla (boolean)

#### 4. Motoras
- `includeKeyboardHints`: Incluir atajos de teclado (boolean)
- `includeVoiceHints`: Incluir comandos de voz (boolean)

#### 5. Formato
- `outputFormat`: Formato de salida (json, xml, html, markdown, plaintext, jsonld)
- `brailleOptimized`: Optimizar para Braille (boolean)
- `includeSemanticMarkup`: Incluir marcado semántico (boolean)

#### 6. Audio
- `audioFriendly`: Optimizar para TTS (boolean)

#### 7. Personalización
- `userId`: ID para caché de preferencias (string)
- `adaptiveComplexity`: Ajustar nivel automáticamente (boolean, experimental)

#### 8. WCAG
- `wcagLevel`: Nivel de conformidad (A, AA, AAA)

### Ejemplo de Request

\`\`\`json
{
  "payload": { /* ... */ },
  "paymentRequirements": { /* ... */ },
  "accessibilityPreferences": {
    "language": "pt",
    "dialect": "pt-BR",
    "cognitiveLevel": "simple",
    "outputFormat": "html",
    "darkMode": true,
    "fontSize": "large",
    "includeExamples": true,
    "includeGlossary": true,
    "userId": "user-12345",
    "wcagLevel": "AAA"
  }
}
\`\`\`
```

**Tiempo:** 45 minutos

---

#### ✅ T5.1.3: Sección Formatos de Salida

```markdown
## Formatos de Salida Soportados

### JSON (default)
- **Content-Type**: `application/json`
- **Uso**: APIs, aplicaciones web, integración programática
- **Estructura**: `AccessibleResponseV2<T>`

### XML
- **Content-Type**: `application/xml`
- **Uso**: Sistemas legacy, enterprise, SOAP services
- **Schema**: Compatible con parsers estándar

### HTML
- **Content-Type**: `text/html`
- **Uso**: Visualización directa en navegadores
- **Características**:
  - ARIA labels completos
  - Semantic HTML5
  - CSS inline para accesibilidad
  - Lang attributes correctos

### Markdown
- **Content-Type**: `text/markdown`
- **Uso**: Documentación, LLMs (Claude, ChatGPT), GitHub
- **Formato**: CommonMark compatible

### Plain Text
- **Content-Type**: `text/plain`
- **Uso**: Screen readers, TTS, Braille displays, consola
- **Optimizaciones**:
  - Sin markup
  - Estructura lineal
  - Caracteres Braille-safe

### JSON-LD
- **Content-Type**: `application/ld+json`
- **Uso**: SEO, structured data, Schema.org
- **Schema**: https://schema.org/Action, https://schema.org/PaymentChargeSpecification
```

**Tiempo:** 30 minutos

---

#### ✅ T5.1.4: Secciones restantes

- Idiomas Soportados
- Niveles Cognitivos (cuándo usar cada uno)
- WCAG 2.2 AAA Compliance
- Reading Level Analysis
- Ejemplos Completos de Uso
- Feature Flags

**Tiempo:** 1-2 horas

**Tiempo Total T5.1:** 3-4 horas

---

## 5.2. Documento: WCAG-COMPLIANCE.md

**Archivo:** `docs/WCAG-COMPLIANCE.md`

### Contenido:

#### ✅ T5.2.1: Matriz de Criterios WCAG 2.2

```markdown
# WCAG 2.2 AAA Compliance Matrix

## Resumen de Conformidad

El Facilitador X402 BSV Accesible cumple con **WCAG 2.2 Nivel AAA** en todos los criterios aplicables a contenido generado por API.

- **Criterios Nivel A**: 25/25 aplicables (100%)
- **Criterios Nivel AA**: 20/20 aplicables (100%)
- **Criterios Nivel AAA**: 23/28 aplicables (82% - 5 N/A)
- **Total**: 68/73 aplicables (93% overall)

## Tabla de Criterios

| ID | Nombre | Nivel | Estado | Implementación |
|----|--------|-------|--------|----------------|
| 1.1.1 | Non-text Content | A | ✅ Pass | Alt text provided via metadata |
| 1.3.1 | Info and Relationships | A | ✅ Pass | Semantic structure in all formats |
| 1.4.1 | Use of Color | A | ✅ Pass | colorBlindSafe flag |
| ... | ... | ... | ... | ... |
| 3.1.5 | Reading Level | AAA | ✅ Pass | Flesch-Kincaid ≤ 9th grade |

(Tabla completa con 78 criterios)
```

**Tiempo:** 1-2 horas

---

## 5.3. Documento: MIGRATION-GUIDE.md

**Archivo:** `docs/MIGRATION-GUIDE.md`

### Contenido:

#### ✅ T5.3.1: Breaking Changes

```markdown
# Guía de Migración V1 → V2

## Breaking Changes

### 1. Estructura de Response Cambiada

**V1:**
\`\`\`typescript
{
  data: T,
  accessibility: {
    plainLanguage: string,
    explanation: string,
    stepByStep: string[],
    hints: {...},
    language: 'es' | 'en',
    audioFriendly: boolean,
    cognitiveLevel: 'simple' | 'medium' | 'advanced'
  }
}
\`\`\`

**V2:**
\`\`\`typescript
{
  data: T,
  accessibility: {
    content: {
      plainLanguage: string,
      explanation: string,
      detailedExplanation?: string,
      stepByStep: AccessibleStepV2[],
      hints: ExtendedHintsV2,
      glossary?: Record<string, string>,
      examples?: ConcreteExampleV2[]
    },
    visual: {...},
    cognitive: {...},
    language: LanguageConfigV2,
    motor: {...},
    format: {...},
    personalization: {...},
    metadata: {...}
  },
  wcag: WCAGComplianceMetadataV2
}
\`\`\`

### 2. Campos Movidos

| V1 Path | V2 Path |
|---------|---------|
| `accessibility.plainLanguage` | `accessibility.content.plainLanguage` |
| `accessibility.explanation` | `accessibility.content.explanation` |
| `accessibility.stepByStep` | `accessibility.content.stepByStep` |
| `accessibility.hints` | `accessibility.content.hints` |
| `accessibility.language` | `accessibility.language.code` |
| `accessibility.cognitiveLevel` | `accessibility.cognitive.level` |

### 3. Campos Nuevos (no existían en V1)

- `accessibility.wcag` - Metadata de compliance WCAG 2.2
- `accessibility.cognitive.readingLevel` - Análisis Flesch-Kincaid
- `accessibility.content.glossary` - Glosario de términos
- `accessibility.content.examples` - Ejemplos concretos
```

**Tiempo:** 30-45 minutos

---

#### ✅ T5.3.2: Guía Paso a Paso

```markdown
## Pasos de Migración

### Paso 1: Actualizar Tipos TypeScript

\`\`\`typescript
// Antes (V1)
import type { AccessibleResponse } from './types';

// Después (V2)
import type { AccessibleResponseV2 } from './types';
```

### Paso 2: Actualizar Parseo de Responses

```typescript
// Antes (V1)
const plainLanguage = response.accessibility.plainLanguage;
const explanation = response.accessibility.explanation;

// Después (V2)
const plainLanguage = response.accessibility.content.plainLanguage;
const explanation = response.accessibility.content.explanation;

// Acceso a nuevas features V2
const readingLevel = response.accessibility.cognitive.readingLevel;
const wcagCompliance = response.wcag;
```

(Guía completa con ejemplos de código)
```

**Tiempo:** 45 minutos

**Tiempo Total T5.3:** 1-1.5 horas

---

## 5.4. Actualizar README y CLAUDE.md

### Tareas:

#### ✅ T5.4.1: Agregar sección V2 en README.md

```markdown
## Accessibility V2 Features

This facilitator implements **WCAG 2.2 Level AAA** universal accessibility:

- 🌍 **5 Languages**: Spanish, English, Portuguese, French, German
- 🧠 **5 Cognitive Levels**: Beginner → Expert
- 📄 **6 Output Formats**: JSON, XML, HTML, Markdown, Plain Text, JSON-LD
- ♿ **7 Accessibility Dimensions**: Content, Visual, Cognitive, Language, Motor, Format, Personalization
- 📊 **Reading Level Analysis**: Flesch-Kincaid metrics
- 💾 **User Preferences Cache**: 30-day persistent preferences

See [docs/ACCESSIBILITY-V2.md](docs/ACCESSIBILITY-V2.md) for full documentation.
```

**Tiempo:** 15 minutos

---

#### ✅ T5.4.2: Actualizar CLAUDE.md con tipos V2

```markdown
## V2 Type System

All responses now follow `AccessibleResponseV2<T>` pattern:

\`\`\`typescript
{
  data: T,
  accessibility: UniversalAccessibilityMetadataV2,
  wcag: WCAGComplianceMetadataV2
}
\`\`\`

See `src/facilitator/types.ts` lines 244-570 for complete V2 type definitions.

### Feature Flags

- `WCAG_COMPLIANCE_ENABLED`: Enable WCAG 2.2 audit trail
- `MULTILANG_ENABLED`: Enable 5-language support
- `FORMAT_CONVERSION_ENABLED`: Enable non-JSON output formats
- `READING_LEVEL_ANALYSIS`: Enable Flesch-Kincaid analysis
- `ADAPTIVE_COMPLEXITY_ENABLED`: Enable automatic level adjustment (experimental)
```

**Tiempo:** 15 minutos

---

## 5.5. Checklist de Fase 5

- [ ] T5.1: `ACCESSIBILITY-V2.md` creado (3-4h)
- [ ] T5.2: `WCAG-COMPLIANCE.md` creado (1-2h)
- [ ] T5.3: `MIGRATION-GUIDE.md` creado (1-1.5h)
- [ ] T5.4.1: README.md actualizado (15min)
- [ ] T5.4.2: CLAUDE.md actualizado (15min)
- [ ] Todos los docs revisados por peer
- [ ] Links cruzados funcionando
- [ ] Ejemplos de código testeados

**Criterios de Aceptación:**
- ✅ 3 documentos nuevos completos y detallados
- ✅ README menciona V2 features con link a docs
- ✅ CLAUDE.md actualizado con tipos V2
- ✅ Ejemplos de código ejecutables
- ✅ Documentación clara sobre breaking changes

---

# FASE 6: Adaptive Complexity (Experimental)

**🎯 Objetivo:** Ajustar nivel cognitivo automáticamente basado en interacciones

**⏱️ Tiempo Estimado:** 6-8 horas
**⚪ Prioridad:** BAJA (Experimental, no bloquea producción)
**👤 Asignado:** [Pendiente]
**📅 Fecha Límite:** [Backlog - V2.1]

---

## 6.1. Diseño del Algoritmo

### Métricas a Rastrear:

1. **Número de interacciones totales del usuario**
2. **Ratio de errores** (requests con isValid: false o success: false)
3. **Tiempo promedio entre requests** (proxy para dificultad)
4. **Override explícito del usuario** (usuario cambió cognitiveLevel manualmente)

### Reglas de Ajuste:

```typescript
function recommendNextLevel(
  currentLevel: CognitiveLevelV2,
  previousInteractions: number,
  errorRate: number,
  avgTimeBetweenRequests: number,
  userOverride: boolean
): CognitiveLevelV2 | null {
  // No recomendar si usuario tiene override explícito
  if (userOverride) return null;

  // Principiante: 0-5 interacciones
  if (previousInteractions < 5) {
    return 'beginner';
  }

  // Si error rate alto (>30%), bajar nivel
  if (errorRate > 0.3) {
    const levels: CognitiveLevelV2[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : 'beginner';
  }

  // Si error rate bajo (<5%) y muchas interacciones (>20), subir nivel
  if (errorRate < 0.05 && previousInteractions > 20) {
    const levels: CognitiveLevelV2[] = ['beginner', 'simple', 'medium', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < 4 ? levels[currentIndex + 1] : 'expert';
  }

  // No cambiar
  return null;
}
```

---

## 6.2. Tracking de Interacciones

**Archivo:** `src/facilitator/accessibility/interaction-tracker.ts` (crear)

### Tareas:

#### ✅ T6.2.1: Crear schema de interacción

```typescript
interface UserInteraction {
  userId: string;
  timestamp: string;
  endpoint: '/verify' | '/settle';
  cognitiveLevel: CognitiveLevelV2;
  success: boolean;
  errorType?: string;
}

interface UserStats {
  userId: string;
  totalInteractions: number;
  successfulInteractions: number;
  errorRate: number;
  avgTimeBetweenRequests: number; // milliseconds
  currentLevel: CognitiveLevelV2;
  hasOverride: boolean;
  lastInteraction: string; // ISO timestamp
}
```

**Tiempo:** 20 minutos

---

#### ✅ T6.2.2: Implementar tracking functions

```typescript
export async function trackInteraction(
  interaction: UserInteraction,
  env: EnvV2
): Promise<void> {
  if (!interaction.userId || !env.USER_PREFERENCES) return;

  const statsKey = `user-stats:${interaction.userId}`;
  const cachedStats = await env.USER_PREFERENCES.get(statsKey, { type: 'json' }) as UserStats | null;

  const now = new Date(interaction.timestamp);
  const lastTime = cachedStats ? new Date(cachedStats.lastInteraction) : now;
  const timeDiff = now.getTime() - lastTime.getTime();

  const updatedStats: UserStats = {
    userId: interaction.userId,
    totalInteractions: (cachedStats?.totalInteractions || 0) + 1,
    successfulInteractions: (cachedStats?.successfulInteractions || 0) + (interaction.success ? 1 : 0),
    errorRate: 0, // Calcular después
    avgTimeBetweenRequests: cachedStats
      ? (cachedStats.avgTimeBetweenRequests + timeDiff) / 2
      : 0,
    currentLevel: interaction.cognitiveLevel,
    hasOverride: cachedStats?.hasOverride || false,
    lastInteraction: interaction.timestamp
  };

  updatedStats.errorRate = 1 - (updatedStats.successfulInteractions / updatedStats.totalInteractions);

  // Store con TTL de 30 días
  await env.USER_PREFERENCES.put(
    statsKey,
    JSON.stringify(updatedStats),
    { expirationTtl: 30 * 24 * 60 * 60 }
  );
}

export async function getUserStats(
  userId: string,
  env: EnvV2
): Promise<UserStats | null> {
  if (!userId || !env.USER_PREFERENCES) return null;

  const statsKey = `user-stats:${userId}`;
  return await env.USER_PREFERENCES.get(statsKey, { type: 'json' }) as UserStats | null;
}
```

**Tiempo:** 45 minutos

---

## 6.3. Integración en Endpoints

### Tareas:

#### ✅ T6.3.1: Agregar tracking a `/verify` y `/settle`

```typescript
// En ambos endpoints, después de generar response:
if (finalPreferences.userId && finalPreferences.adaptiveComplexity) {
  try {
    await trackInteraction({
      userId: finalPreferences.userId,
      timestamp: new Date().toISOString(),
      endpoint: c.req.path as '/verify' | '/settle',
      cognitiveLevel: finalPreferences.cognitiveLevel,
      success: verifyResult.isValid || settleResult.success, // según endpoint
      errorType: verifyResult.invalidReason || settleResult.errorReason
    }, c.env);
  } catch (trackError) {
    logger.warn('Failed to track interaction', { error: trackError });
    // No fallar el request por esto
  }
}
```

**Tiempo:** 30 minutos

---

#### ✅ T6.3.2: Agregar recomendación en metadata

```typescript
// Al construir UniversalAccessibilityMetadataV2:
let recommendedNextLevel: CognitiveLevelV2 | undefined;

if (finalPreferences.userId && finalPreferences.adaptiveComplexity) {
  const stats = await getUserStats(finalPreferences.userId, c.env);
  if (stats) {
    recommendedNextLevel = recommendNextLevel(
      stats.currentLevel,
      stats.totalInteractions,
      stats.errorRate,
      stats.avgTimeBetweenRequests,
      stats.hasOverride
    ) || undefined;
  }
}

// Incluir en metadata:
personalization: {
  userPreferencesApplied: true,
  adaptiveComplexity: finalPreferences.adaptiveComplexity,
  previousInteractions: stats?.totalInteractions,
  recommendedNextLevel
}
```

**Tiempo:** 45 minutos

---

## 6.4. Testing

### Tareas:

#### ✅ T6.4.1: Tests unitarios de algoritmo

```typescript
describe('Adaptive Complexity Algorithm', () => {
  it('should recommend beginner for new users', () => {
    const next = recommendNextLevel('simple', 0, 0, 0, false);
    expect(next).toBe('beginner');
  });

  it('should lower level on high error rate', () => {
    const next = recommendNextLevel('medium', 30, 0.4, 10000, false);
    expect(next).toBe('simple');
  });

  it('should raise level on low error rate and many interactions', () => {
    const next = recommendNextLevel('simple', 50, 0.02, 5000, false);
    expect(next).toBe('medium');
  });

  it('should not recommend if user has override', () => {
    const next = recommendNextLevel('simple', 50, 0.02, 5000, true);
    expect(next).toBeNull();
  });
});
```

**Tiempo:** 1 hora

---

#### ✅ T6.4.2: Tests de integración

Verificar que el tracking funciona end-to-end con requests reales.

**Tiempo:** 1 hora

---

## 6.5. Documentación

#### ✅ T6.5.1: Agregar sección en ACCESSIBILITY-V2.md

```markdown
## Adaptive Complexity (Experimental)

Cuando `adaptiveComplexity: true`, el sistema ajusta automáticamente el nivel cognitivo basado en:

- Número de interacciones previas
- Ratio de errores
- Tiempo entre requests

### Algoritmo

- **0-5 interacciones**: Recomendar 'beginner'
- **Error rate > 30%**: Bajar un nivel
- **Error rate < 5% + 20+ interacciones**: Subir un nivel
- **Usuario con override manual**: No ajustar

### Ejemplo

\`\`\`json
{
  "accessibilityPreferences": {
    "userId": "user-123",
    "cognitiveLevel": "simple",
    "adaptiveComplexity": true
  }
}
\`\`\`

Response incluirá:
\`\`\`json
{
  "accessibility": {
    "personalization": {
      "previousInteractions": 25,
      "recommendedNextLevel": "medium"
    }
  }
}
\`\`\`
```

**Tiempo:** 30 minutos

---

## 6.6. Feature Flag

#### ✅ T6.6.1: Activar flag (solo después de testing exhaustivo)

```toml
[env.development.vars]
ADAPTIVE_COMPLEXITY_ENABLED = "true"
```

**⚠️ NO activar en production hasta V2.1**

---

## 6.7. Checklist de Fase 6

- [ ] T6.2.1: Schema de interacciones definido
- [ ] T6.2.2: Tracking functions implementadas
- [ ] T6.3.1: Tracking integrado en endpoints
- [ ] T6.3.2: Recomendaciones en metadata
- [ ] T6.4.1: Tests unitarios del algoritmo
- [ ] T6.4.2: Tests de integración
- [ ] T6.5.1: Documentación agregada
- [ ] T6.6.1: Feature flag activado en dev (solo dev)
- [ ] Validación con usuarios reales (A/B testing)

**Criterios de Aceptación:**
- ✅ Algoritmo funciona correctamente
- ✅ Tracking no afecta performance
- ✅ Recomendaciones son apropiadas
- ✅ Feature flag respetado
- ✅ Tests completos pasando
- ✅ Documentado como experimental

**Nota:** Esta fase es opcional y puede posponerse para V2.1.

---

# Resumen y Timeline

## Progreso Actual

| Fase | Descripción | Tiempo | Estado |
|------|-------------|--------|--------|
| ✅ Base | Tipos, AI V2, WCAG, Reading Level, Cache | ~40h | 100% COMPLETADO |
| 🔴 Fase 1 | Integración de Convertidores | 2-3h | PENDIENTE |
| 🟡 Fase 2 | Templates PT/FR/DE | 18-24h | PENDIENTE (0%) |
| 🟡 Fase 3 | Fix Integration Tests | 2-4h | PENDIENTE |
| 🟢 Fase 4 | Feature Flags | 30min + validación | PENDIENTE |
| 🟢 Fase 5 | Documentación | 4-6h | PENDIENTE |
| ⚪ Fase 6 | Adaptive Complexity | 6-8h | BACKLOG (Experimental) |

**Total para MVP (Fase 1 + 3):** 4-7 horas
**Total para Feature-Complete (Fase 1-5):** 26-37 horas
**Total para V2.1 (Fase 1-6):** 32-45 horas

---

## Timeline Recomendado

### Opción A: MVP Rápido (1 semana part-time)
```
Día 1-2: Fase 1 (Convertidores) - 2-3h
Día 3: Fase 3 (Tests) - 2-4h
Día 4: Fase 4 (Flags en dev) + Testing - 4h
Día 5: Deploy a production + Monitoring

RESULTADO: ES/EN + 6 formatos + WCAG AAA en producción
```

### Opción B: Feature-Complete (3-4 semanas part-time)
```
Semana 1: Fase 1 + 3 (MVP)
Semana 2: Fase 2.1 (Template PT) - 6-8h
Semana 3: Fase 2.2 + 2.3 (Templates FR/DE) - 12-16h
Semana 4: Fase 5 (Documentación) + Deploy final - 4-6h

RESULTADO: 5 idiomas + 6 formatos + WCAG AAA + Docs completos
```

### Opción C: Con Experimental (5-6 semanas)
```
Semanas 1-4: Opción B
Semana 5: Fase 6 (Adaptive Complexity) - 6-8h
Semana 6: Testing con usuarios reales + refinamiento

RESULTADO: Feature-complete + adaptive complexity experimental
```

---

## Próximos Pasos Inmediatos

1. ✅ **Aprobar este plan**
2. ✅ **Asignar recursos** (quién hace qué fase)
3. ✅ **Definir fechas límite** para cada fase
4. 🔴 **EJECUTAR FASE 1** (Integración de convertidores) - 2-3 horas
5. 🟡 **EJECUTAR FASE 3** (Fix tests) - 2-4 horas
6. 🚀 **Deploy MVP a producción**

---

## Contacto y Soporte

Para preguntas sobre implementación de este plan:
- Ver issues en GitHub
- Revisar docs existentes en `docs/`
- Consultar CLAUDE.md para guías de desarrollo

---

**Fin del Plan de Fases**
