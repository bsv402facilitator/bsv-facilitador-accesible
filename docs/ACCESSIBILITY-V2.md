# Accesibilidad Universal V2

**Versión:** 2.0
**Fecha:** 2025-11-30
**Estado:** Production Ready

## Tabla de Contenidos

- [Overview](#overview)
- [Características Nuevas en V2](#características-nuevas-en-v2)
- [Comparación V1 vs V2](#comparación-v1-vs-v2)
- [Preferencias de Usuario](#preferencias-de-usuario)
- [Formatos de Salida](#formatos-de-salida)
- [Idiomas Soportados](#idiomas-soportados)
- [Niveles Cognitivos](#niveles-cognitivos)
- [WCAG 2.2 AAA Compliance](#wcag-22-aaa-compliance)
- [Reading Level Analysis](#reading-level-analysis)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Feature Flags](#feature-flags)

---

## Overview

El sistema de Accesibilidad Universal V2 es una evolución completa del facilitador X402 BSV que prioriza la accesibilidad cognitiva y visual. Está diseñado específicamente para usuarios con discapacidades mediante:

- **AI-Powered Metadata**: Generación dinámica de explicaciones adaptadas al contexto
- **Multi-Format Output**: 6 formatos de salida (JSON, XML, HTML, Markdown, PlainText, JSON-LD)
- **Unlimited Language Support**: Cualquier idioma ISO 639-1 vía OpenAI
- **Cognitive Adaptability**: 5 niveles de complejidad cognitiva
- **WCAG 2.2 AAA Compliance**: Validación automática de 78 criterios de accesibilidad
- **Reading Level Analysis**: Análisis Flesch-Kincaid integrado
- **Persistent Preferences**: Caché de preferencias de usuario por 30 días

---

## Características Nuevas en V2

### 🎯 Personalización Granular

- **User Preferences API**: Endpoints `/preferences` para guardar/recuperar configuraciones
- **Persistent Storage**: KV namespace con TTL de 30 días
- **Context-Aware Defaults**: Valores por defecto inteligentes basados en contexto

### 🧠 Niveles Cognitivos Expandidos

V1 tenía 3 niveles (`simple`, `medium`, `advanced`). V2 incluye 5:

1. **`minimal`**: Respuestas ultra concisas (≤50 palabras)
2. **`simple`**: Lenguaje básico sin jerga técnica (≤100 palabras)
3. **`medium`**: Balance entre detalle y simplicidad (≤200 palabras)
4. **`detailed`**: Explicaciones completas con contexto técnico (≤400 palabras)
5. **`expert`**: Detalles técnicos profundos para desarrolladores (sin límite)

### 🌍 Soporte Multilingüe Ilimitado

- **V1**: Solo Español (ES) e Inglés (EN) mediante templates estáticos
- **V2**: Cualquier idioma ISO 639-1 mediante OpenAI
- **Fallback**: Templates estáticos para ES/EN si AI falla

Idiomas pre-validados en producción:
- `es` - Español
- `en` - English
- `pt` - Português (via AI)
- `fr` - Français (via AI)
- `de` - Deutsch (via AI)
- `ja` - 日本語 (via AI)
- `zh` - 中文 (via AI)
- ... +190 idiomas ISO 639-1

### 📊 Formatos de Salida Múltiples

| Formato | Content-Type | Caso de Uso |
|---------|-------------|-------------|
| **JSON** | `application/json` | Default, APIs modernas |
| **XML** | `application/xml` | Sistemas legacy, interoperabilidad |
| **HTML** | `text/html` | Navegadores, screen readers |
| **Markdown** | `text/markdown` | Documentación, lectores humanos |
| **PlainText** | `text/plain` | TTS, terminales, accesibilidad máxima |
| **JSON-LD** | `application/ld+json` | Semantic web, Schema.org |

### ✅ WCAG 2.2 AAA Compliance

- **78 criterios** validados automáticamente
- **Compliance Matrix** en cada respuesta
- **Real-time Validation**: Nivel A, AA y AAA

Ver detalles en [WCAG-COMPLIANCE.md](./WCAG-COMPLIANCE.md).

### 📖 Reading Level Analysis

Análisis automático de legibilidad usando:

- **Flesch Reading Ease**: 0-100 (100 = más fácil)
- **Flesch-Kincaid Grade Level**: 0-18+ (años de educación requeridos)
- **WCAG Compliance**: Recomendación nivel AAA (≤9 grado escolar)

---

## Comparación V1 vs V2

| Feature | V1 | V2 |
|---------|----|----|
| **Niveles Cognitivos** | 3 (simple, medium, advanced) | 5 (minimal, simple, medium, detailed, expert) |
| **Idiomas** | 2 estáticos (ES, EN) | Ilimitados vía AI (190+ idiomas ISO 639-1) |
| **Formatos Salida** | JSON únicamente | 6 formatos (JSON, XML, HTML, MD, Text, JSON-LD) |
| **WCAG Compliance** | Parcial (solo AA) | Completo (78 criterios AAA) |
| **Reading Level** | No incluido | Análisis Flesch-Kincaid integrado |
| **Preferencias Usuario** | No persistente | KV cache 30 días |
| **AI Models** | 1 modelo (gpt-4o-mini) | 2 modelos (gpt-3.5-turbo, gpt-4o) |
| **Cache Strategy** | 7 días genérico | 7 días genérico + 30 días preferencias |
| **Feature Flags** | N/A | 5 flags configurables |
| **Response Type** | `AccessibleResponse<T>` | `AccessibleResponseV2<T>` |

---

## Preferencias de Usuario

### Estructura de Preferencias

```typescript
interface UserPreferencesV2 {
  language: string;              // ISO 639-1 code (e.g., "es", "en", "pt")
  cognitiveLevel: CognitiveLevel; // "minimal" | "simple" | "medium" | "detailed" | "expert"
  outputFormat: OutputFormat;    // "json" | "xml" | "html" | "markdown" | "plaintext" | "jsonld"
  audioOptimized: boolean;       // true para optimización TTS
  includeGlossary: boolean;      // Incluir glosario de términos técnicos
  includeExamples: boolean;      // Incluir ejemplos concretos
  readingLevel: number;          // Target Flesch-Kincaid grade (0-18)
  wcagLevel: "A" | "AA" | "AAA"; // Nivel de compliance requerido
}
```

### API de Preferencias

#### Guardar Preferencias

```bash
POST /preferences
Content-Type: application/json

{
  "userId": "user-123",
  "preferences": {
    "language": "es",
    "cognitiveLevel": "simple",
    "outputFormat": "html",
    "audioOptimized": true,
    "includeGlossary": true,
    "includeExamples": true,
    "readingLevel": 8,
    "wcagLevel": "AAA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "expiresAt": "2025-12-30T00:00:00.000Z"
}
```

#### Recuperar Preferencias

```bash
GET /preferences?userId=user-123
```

**Response:**
```json
{
  "userId": "user-123",
  "preferences": { ... },
  "createdAt": "2025-11-30T00:00:00.000Z",
  "expiresAt": "2025-12-30T00:00:00.000Z"
}
```

#### Eliminar Preferencias

```bash
DELETE /preferences?userId=user-123
```

---

## Formatos de Salida

### JSON (Default)

```bash
POST /verify
Content-Type: application/json

{
  "transaction": "0100000001...",
  "requirements": {
    "address": "1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86",
    "amount": "1000",
    "network": "bsv-mainnet"
  },
  "preferences": {
    "outputFormat": "json"
  }
}
```

### XML

```bash
POST /verify
Content-Type: application/json

{
  "transaction": "0100000001...",
  "requirements": { ... },
  "preferences": {
    "outputFormat": "xml"
  }
}
```

**Response (Content-Type: application/xml):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<AccessibleResponse>
  <data>
    <isValid>true</isValid>
    <txid>abc123...</txid>
    <payer>1Address...</payer>
    <amount>1000</amount>
  </data>
  <accessibility>
    <plainLanguage>Transacción válida por 1000 satoshis</plainLanguage>
    <explanation>La transacción fue verificada exitosamente...</explanation>
    <stepByStep>
      <step>Se validó el formato de la transacción</step>
      <step>Se verificó la dirección del destinatario</step>
      <step>Se confirmó el monto correcto</step>
    </stepByStep>
    <language>es</language>
    <audioFriendly>true</audioFriendly>
  </accessibility>
  <wcagCompliance level="AAA" passedCriteria="78" totalCriteria="78"/>
  <readingLevel flesch="85.2" gradeLevel="5.3"/>
</AccessibleResponse>
```

### HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Respuesta de Verificación</title>
</head>
<body role="main" aria-label="Resultado de verificación de transacción">
  <section aria-labelledby="summary">
    <h1 id="summary">Transacción válida por 1000 satoshis</h1>
    <p>La transacción fue verificada exitosamente...</p>
  </section>
  <section aria-labelledby="steps">
    <h2 id="steps">Pasos realizados:</h2>
    <ol>
      <li>Se validó el formato de la transacción</li>
      <li>Se verificó la dirección del destinatario</li>
      <li>Se confirmó el monto correcto</li>
    </ol>
  </section>
  <aside aria-label="Información técnica">
    <dl>
      <dt>TXID:</dt><dd>abc123...</dd>
      <dt>Pagador:</dt><dd>1Address...</dd>
      <dt>Monto:</dt><dd>1000 satoshis</dd>
    </dl>
  </aside>
</body>
</html>
```

### Markdown

```markdown
# Transacción válida por 1000 satoshis

La transacción fue verificada exitosamente...

## Pasos realizados

1. Se validó el formato de la transacción
2. Se verificó la dirección del destinatario
3. Se confirmó el monto correcto

## Información Técnica

- **TXID:** abc123...
- **Pagador:** 1Address...
- **Monto:** 1000 satoshis
```

### PlainText (TTS-optimized)

```
Transacción válida por 1000 satoshis.

La transacción fue verificada exitosamente. Se realizaron los siguientes pasos:

Paso 1: Se validó el formato de la transacción.
Paso 2: Se verificó la dirección del destinatario.
Paso 3: Se confirmó el monto correcto.

Información técnica:
TXID: abc123...
Pagador: 1Address...
Monto: 1000 satoshis.
```

### JSON-LD (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "PaymentAction",
  "actionStatus": "CompletedActionStatus",
  "description": "Transacción válida por 1000 satoshis",
  "object": {
    "@type": "MonetaryAmount",
    "value": "1000",
    "currency": "BSV"
  },
  "agent": {
    "@type": "Person",
    "identifier": "1Address..."
  }
}
```

---

## Idiomas Soportados

### Idiomas Pre-Validados

| Código ISO | Idioma | Método | Estado |
|------------|--------|--------|--------|
| `es` | Español | Templates + AI | ✅ Production |
| `en` | English | Templates + AI | ✅ Production |
| `pt` | Português | AI Only | ✅ Production |
| `fr` | Français | AI Only | ✅ Production |
| `de` | Deutsch | AI Only | ✅ Production |

### Idiomas Adicionales (AI-Generated)

El sistema soporta **cualquier idioma ISO 639-1** mediante generación dinámica con OpenAI:

```bash
POST /verify
{
  "preferences": {
    "language": "ja"  # Japonés
  }
}
```

**Response:**
```json
{
  "accessibility": {
    "plainLanguage": "1000サトシの有効なトランザクション",
    "explanation": "トランザクションが正常に検証されました...",
    "language": "ja"
  }
}
```

### Fallback Strategy

1. **Primary**: OpenAI genera el idioma solicitado
2. **Fallback 1**: Templates estáticos para ES/EN
3. **Fallback 2**: Inglés genérico si AI falla

---

## Niveles Cognitivos

### Matriz de Niveles

| Nivel | Palabras | Audiencia | Flesch Score | Grado Escolar |
|-------|----------|-----------|--------------|---------------|
| **minimal** | ≤50 | Discapacidad cognitiva severa | 90-100 | 0-3 |
| **simple** | ≤100 | Usuario general sin conocimientos técnicos | 80-90 | 4-6 |
| **medium** | ≤200 | Usuario con conocimientos básicos | 60-80 | 7-9 |
| **detailed** | ≤400 | Profesional con contexto técnico | 40-60 | 10-12 |
| **expert** | Sin límite | Desarrollador/experto blockchain | 0-40 | 13+ |

### Ejemplos por Nivel

**Caso**: Error de dirección inválida

#### Nivel: `minimal`

```
Error: Dirección incorrecta.
Solución: Verifica la dirección.
```

#### Nivel: `simple`

```
La dirección de Bitcoin no es correcta.

Esto significa que la dirección a donde quieres enviar el dinero
tiene un formato incorrecto o no pertenece a la red correcta.

Solución: Verifica que hayas copiado la dirección completa y
que sea una dirección de Bitcoin SV (debe empezar con "1" o "3").
```

#### Nivel: `medium`

```
La transacción fue rechazada porque la dirección del destinatario
es inválida.

Una dirección de Bitcoin SV debe:
1. Empezar con "1" (P2PKH) o "3" (P2SH)
2. Tener entre 26-35 caracteres
3. Incluir un checksum válido

Error detectado: La dirección proporcionada no cumple con el
formato Base58Check o pertenece a otra red (testnet/otra blockchain).

Solución: Solicita la dirección correcta al destinatario y verifica
que sea específicamente de Bitcoin SV mainnet.
```

#### Nivel: `detailed`

```
Error de validación: La dirección proporcionada falló la verificación
Base58Check checksum o pertenece a una red incompatible.

Detalles técnicos:
- Formato esperado: Base58Check encoding
- Version byte esperado: 0x00 (P2PKH mainnet) o 0x05 (P2SH mainnet)
- Version byte recibido: [detectado del input]
- Checksum válido: No

Posibles causas:
1. Dirección de testnet (version byte 0x6F) en entorno mainnet
2. Dirección de otra blockchain (BTC, BCH)
3. Error de transcripción (caracteres ambiguos: 0/O, 1/l)
4. Checksum corrupto durante copia/pega

Recomendación: Utiliza un validador de direcciones BSV o solicita
un nuevo address al destinatario usando un wallet certificado.
```

#### Nivel: `expert`

```
AddressValidationError: Base58Check checksum validation failed

Stack trace:
- validateBsvAddress() in verify.ts:142
- Expected version byte: 0x00 (P2PKH mainnet)
- Received version byte: 0x6F (indicates testnet address)
- Checksum algorithm: Double SHA-256
- Checksum expected: [hex value]
- Checksum received: [hex value]

Technical context:
The @bsv/sdk Address.fromString() method threw an error during
instantiation, indicating the provided string does not conform
to Bitcoin SV mainnet address encoding standards per BSV Technical
Standards (BRC-42).

Resolution:
1. Verify address network matches environment (mainnet vs testnet)
2. Validate address using: bsv.Address.fromString(address).toString()
3. Check for version byte mismatch in requirements.network field
4. Consider implementing address format conversion if cross-network
   compatibility is required

Related: validateBsvAddress(), isP2PKHToAddress(), PaymentRequirements.address
```

---

## WCAG 2.2 AAA Compliance

Cada respuesta incluye una matriz de compliance con 78 criterios WCAG 2.2:

```json
{
  "wcagCompliance": {
    "version": "2.2",
    "level": "AAA",
    "timestamp": "2025-11-30T00:00:00.000Z",
    "overall": {
      "totalCriteria": 78,
      "passedCriteria": 78,
      "failedCriteria": 0,
      "notApplicable": 0,
      "compliancePercentage": 100
    },
    "byLevel": {
      "A": { "total": 25, "passed": 25, "failed": 0 },
      "AA": { "total": 20, "passed": 20, "failed": 0 },
      "AAA": { "total": 28, "passed": 28, "failed": 0 }
    },
    "detailedResults": [
      {
        "criterion": "1.1.1",
        "name": "Non-text Content",
        "level": "A",
        "status": "pass",
        "notes": "All responses include text alternatives"
      },
      // ... 77 more criteria
    ]
  }
}
```

Ver [WCAG-COMPLIANCE.md](./WCAG-COMPLIANCE.md) para detalles completos.

---

## Reading Level Analysis

El sistema analiza automáticamente la legibilidad de cada respuesta:

```json
{
  "readingLevel": {
    "fleschReadingEase": 85.2,
    "fleschKincaidGrade": 5.3,
    "interpretation": "Fácil de leer para estudiantes de 5to-6to grado",
    "wcagCompliant": true,
    "recommendation": "PASS - Cumple AAA (nivel ≤9)"
  }
}
```

### Escalas de Flesch

#### Flesch Reading Ease (0-100)

| Score | Dificultad | Grado Escolar |
|-------|-----------|---------------|
| 90-100 | Muy fácil | 0-5 |
| 80-90 | Fácil | 6 |
| 70-80 | Relativamente fácil | 7 |
| 60-70 | Standard | 8-9 |
| 50-60 | Relativamente difícil | 10-12 |
| 30-50 | Difícil | 13-16 |
| 0-30 | Muy difícil | Universitario+ |

#### Flesch-Kincaid Grade Level

- **0-5**: Educación primaria
- **6-8**: Educación básica
- **9-12**: Educación media/preparatoria
- **13-16**: Universitario
- **17+**: Postgrado

### WCAG AAA Requirement

WCAG 2.2 Success Criterion 3.1.5 (AAA) requiere:

> "When text requires reading ability more advanced than the lower
> secondary education level [...], supplemental content [...] is available."

**Interpretación**: Nivel de lectura ≤ Grado 9 (14-15 años)

El sistema valida automáticamente y marca `wcagCompliant: false` si
Flesch-Kincaid Grade > 9.

---

## Ejemplos de Uso

### Ejemplo 1: Verificación Básica (JSON, Español, Simple)

**Request:**
```bash
curl -X POST https://facilitador-bsv.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "0100000001...",
    "requirements": {
      "address": "1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86",
      "amount": "1000",
      "network": "bsv-mainnet"
    },
    "preferences": {
      "language": "es",
      "cognitiveLevel": "simple"
    }
  }'
```

**Response:**
```json
{
  "data": {
    "isValid": true,
    "txid": "abc123...",
    "payer": "1Address...",
    "amount": "1000",
    "network": "mainnet"
  },
  "accessibility": {
    "plainLanguage": "Transacción válida por 1000 satoshis",
    "explanation": "La transacción fue verificada exitosamente. El pago de 1000 satoshis desde la dirección 1Address... hacia 1LiSSPcm... es correcto.",
    "stepByStep": [
      "Se validó el formato de la transacción",
      "Se verificó la dirección del destinatario",
      "Se confirmó el monto correcto"
    ],
    "hints": {
      "nextSteps": "Procede a transmitir la transacción con /settle"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  },
  "wcagCompliance": { ... },
  "readingLevel": {
    "fleschReadingEase": 85.2,
    "fleschKincaidGrade": 5.3,
    "wcagCompliant": true
  }
}
```

### Ejemplo 2: Error con HTML y Audio-Optimized

**Request:**
```bash
curl -X POST https://facilitador-bsv.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "invalid-hex",
    "requirements": {
      "address": "1LiSSPcm8tLjCDPqQxCR5oPqvTUkYCpJ86",
      "amount": "1000",
      "network": "bsv-mainnet"
    },
    "preferences": {
      "language": "en",
      "cognitiveLevel": "medium",
      "outputFormat": "html",
      "audioOptimized": true
    }
  }'
```

**Response (Content-Type: text/html):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Transaction Verification Error</title>
</head>
<body role="main" aria-label="Transaction verification error">
  <section role="alert" aria-labelledby="error-summary">
    <h1 id="error-summary">Invalid transaction format</h1>
    <p>The transaction could not be processed because it has an invalid format.</p>
  </section>

  <section aria-labelledby="what-happened">
    <h2 id="what-happened">What happened:</h2>
    <p>The transaction string provided does not match the expected hexadecimal format
    for Bitcoin SV transactions. This usually means the data was corrupted during
    copy/paste or the transaction was not properly serialized.</p>
  </section>

  <section aria-labelledby="how-to-fix">
    <h2 id="how-to-fix">How to fix:</h2>
    <ol>
      <li>Verify you copied the complete transaction hex</li>
      <li>Check that only characters 0-9 and a-f are present</li>
      <li>Try generating the transaction again from your wallet</li>
    </ol>
  </section>

  <aside aria-label="Technical details">
    <h3>Error code:</h3>
    <p><code>invalid_format</code></p>
  </aside>
</body>
</html>
```

### Ejemplo 3: Broadcast con Preferencias Guardadas

**Paso 1: Guardar preferencias**
```bash
curl -X POST https://facilitador-bsv.workers.dev/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "alice@example.com",
    "preferences": {
      "language": "pt",
      "cognitiveLevel": "simple",
      "outputFormat": "plaintext",
      "audioOptimized": true,
      "readingLevel": 6
    }
  }'
```

**Paso 2: Usar preferencias guardadas**
```bash
curl -X POST https://facilitador-bsv.workers.dev/settle \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "0100000001...",
    "userId": "alice@example.com"
  }'
```

**Response (Content-Type: text/plain):**
```
Transação transmitida com sucesso.

O pagamento foi enviado para a rede Bitcoin SV.
Seu identificador de transação é: abc123...

Próximos passos:
1. A transação será confirmada em aproximadamente 10 minutos.
2. Você pode rastrear o status usando um explorador de blockchain.
3. Guarde o ID da transação como comprovante de pagamento.

Informação técnica:
ID da Transação: abc123...
Rede: Bitcoin SV Mainnet
Status: Transmitida (aguardando confirmação)
```

---

## Feature Flags

El sistema V2 usa feature flags para activar/desactivar funcionalidades:

### Configuración Actual (Production)

```toml
# wrangler.toml [env.production.vars]

# V2 Feature Flags
WCAG_COMPLIANCE_ENABLED = "true"
MULTILANG_ENABLED = "true"
FORMAT_CONVERSION_ENABLED = "true"
READING_LEVEL_ANALYSIS = "true"
ADAPTIVE_COMPLEXITY_ENABLED = "false"  # Experimental - V2.1
```

### Descripción de Flags

| Flag | Función | Estado | Impacto |
|------|---------|--------|---------|
| `WCAG_COMPLIANCE_ENABLED` | Validación de 78 criterios WCAG 2.2 AAA | ✅ Active | Incluye `wcagCompliance` en responses |
| `MULTILANG_ENABLED` | Soporte ilimitado de idiomas vía AI | ✅ Active | Permite cualquier idioma ISO 639-1 |
| `FORMAT_CONVERSION_ENABLED` | Convertidores XML/HTML/MD/Text/JSON-LD | ✅ Active | Habilita `outputFormat` en preferences |
| `READING_LEVEL_ANALYSIS` | Análisis Flesch-Kincaid de legibilidad | ✅ Active | Incluye `readingLevel` en responses |
| `ADAPTIVE_COMPLEXITY_ENABLED` | Ajuste automático de nivel cognitivo | ⏸️ Disabled | Experimental - pospuesto a V2.1 |

### Comportamiento con Flags Desactivados

Si un flag está en `false`, el sistema:

1. **Ignora la configuración**: Si usuario solicita formato XML pero `FORMAT_CONVERSION_ENABLED=false`, retorna JSON
2. **No incluye metadata**: Si `WCAG_COMPLIANCE_ENABLED=false`, omite `wcagCompliance` del response
3. **Fallback a default**: Si `MULTILANG_ENABLED=false`, solo soporta ES/EN vía templates

### Rollout Gradual Recomendado

Para ambientes de alta carga, activar flags progresivamente:

```bash
# Week 1: Solo WCAG y Reading Level
WCAG_COMPLIANCE_ENABLED=true
READING_LEVEL_ANALYSIS=true

# Week 2: Agregar multilingüe (sin templates estáticos)
MULTILANG_ENABLED=true

# Week 3: Agregar formatos de salida
FORMAT_CONVERSION_ENABLED=true

# V2.1: Experimental features
ADAPTIVE_COMPLEXITY_ENABLED=true
```

---

## Monitoring y Analytics

### Métricas Clave

El sistema expone las siguientes métricas en logs:

```json
{
  "timestamp": "2025-11-30T00:00:00.000Z",
  "event": "verify_request",
  "userId": "alice@example.com",
  "language": "pt",
  "cognitiveLevel": "simple",
  "outputFormat": "html",
  "wcagLevel": "AAA",
  "aiGenerated": true,
  "cacheHit": false,
  "elapsedMs": 234
}
```

### Dashboards Recomendados

- **Language Distribution**: % de requests por idioma
- **Cognitive Level Usage**: Distribución de niveles cognitivos
- **Output Format Preference**: % por formato
- **AI vs Template Ratio**: Cache hit rate
- **WCAG Compliance Rate**: % responses AAA-compliant
- **Reading Level Distribution**: Histograma Flesch-Kincaid
- **Preference Cache Hit Rate**: Eficiencia del KV cache

---

## Próximos Pasos (Roadmap V2.1)

### Features Planeados

1. **Adaptive Complexity** (Experimental)
   - Ajuste automático de nivel cognitivo basado en historial
   - Machine learning para predecir preferencias

2. **Voice Output** (Audio nativo)
   - Integración con TTS engines (AWS Polly, Google Cloud TTS)
   - Streaming de audio optimizado para screen readers

3. **Visual Customization**
   - Themes para HTML output (high contrast, dark mode)
   - Font size control en preferencias

4. **Advanced Analytics**
   - User behavior tracking (con consentimiento)
   - A/B testing de niveles cognitivos

5. **Multilingual Templates Expansion**
   - Templates estáticos para PT/FR/DE
   - Reduce dependencia de AI para idiomas comunes

---

## Recursos Adicionales

- [WCAG-COMPLIANCE.md](./WCAG-COMPLIANCE.md) - Matriz completa de criterios WCAG 2.2
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Guía de migración V1 → V2
- [EXAMPLES.md](./EXAMPLES.md) - Ejemplos adicionales de uso
- [CLAUDE.md](../CLAUDE.md) - Documentación técnica del proyecto

---

## Soporte

Para reportar issues o solicitar features:

- **GitHub Issues**: https://github.com/anthropics/claude-code/issues
- **Documentación oficial**: Consultar CLAUDE.md en la raíz del proyecto

---

**Última actualización:** 2025-11-30
**Versión del documento:** 1.0
**Estado:** Production Ready ✅
