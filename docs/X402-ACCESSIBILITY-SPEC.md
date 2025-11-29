# X402 Accessibility Extension Specification

**Version**: 1.0.0
**Status**: Draft
**Authors**: Andrés León, Claude (Anthropic)
**Date**: 2025-11-28

## Abstract

This specification extends the X402 HTTP Payment Protocol to include accessibility features that make payment flows universally accessible to users with disabilities, language barriers, or varying cognitive abilities. The extension maintains full backward compatibility with existing X402 implementations while adding optional accessibility metadata and preferences.

## Motivation

The current X402 protocol focuses on payment mechanics but lacks provisions for:

1. **Multilingual support** - Users who don't speak English
2. **Cognitive accessibility** - Users who need simple explanations
3. **Screen reader compatibility** - Visually impaired users
4. **Contextual help** - Users new to blockchain/cryptocurrencies
5. **Error explanation** - Users who need actionable guidance

This extension addresses these gaps while maintaining the protocol's simplicity and elegance.

## Design Principles

1. **Backward Compatibility**: Non-accessible clients continue working
2. **Optional**: Servers MAY implement, clients MAY request
3. **Language-Agnostic**: Not tied to any specific language
4. **AI-Ready**: Structure supports both templates and LLM generation
5. **Semantic**: Machine-readable for assistive technologies

---

## Specification

### 1. Client Accessibility Preferences

Clients MAY include accessibility preferences in the payment payload or HTTP headers.

#### 1.1 In Payment Payload (Recommended)

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "bsv-testnet",
  "payload": {
    "transaction": "0100000001..."
  },
  "accessibility": {
    "language": "es",
    "cognitiveLevel": "simple",
    "format": "audio-friendly",
    "features": ["step-by-step", "analogies", "hints"]
  }
}
```

#### 1.2 In HTTP Headers (Alternative)

```http
X-PAYMENT: <base64-payload>
X-ACCESSIBILITY-LANGUAGE: es
X-ACCESSIBILITY-LEVEL: simple
X-ACCESSIBILITY-FORMAT: audio-friendly
```

#### 1.3 Accessibility Preferences Schema

```typescript
interface AccessibilityPreferences {
  language?: string;          // ISO 639-1 code (default: "en")
  cognitiveLevel?: string;    // "simple" | "intermediate" | "technical"
  format?: string;            // "text" | "audio-friendly" | "visual"
  features?: string[];        // ["step-by-step", "analogies", "hints", "examples"]
}
```

**Field Descriptions**:

- `language`: ISO 639-1 language code for response messages
- `cognitiveLevel`: Complexity of explanations
  - `simple`: ELI5-style, plain language, <100 chars
  - `intermediate`: Technical but accessible
  - `technical`: Full technical details
- `format`: Optimization for output medium
  - `text`: Standard text format
  - `audio-friendly`: Optimized for screen readers (no symbols, linear)
  - `visual`: May include diagrams/emojis
- `features`: Optional enhancements requested

---

### 2. Server Accessibility Metadata

Servers that support accessibility MUST include an `accessibility` field in responses.

#### 2.1 Response Structure

All X402 responses (verify, settle, errors) SHOULD wrap data in:

```typescript
interface AccessibleResponse<T> {
  data: T;                           // Original response data
  accessibility?: AccessibilityMetadata;  // Optional metadata
}
```

#### 2.2 Accessibility Metadata Schema

```typescript
interface AccessibilityMetadata {
  plainLanguage: string;      // Simple one-line summary (max 100 chars)
  explanation: string;        // Detailed explanation (max 300 chars)
  stepByStep?: string[];      // Ordered steps (max 5 items, 80 chars each)
  hints?: {                   // Contextual hints
    nextSteps?: string;       // What to do next
    common?: string;          // Common mistakes
    technical?: string;       // Technical details
  };
  analogies?: string[];       // Real-world analogies
  examples?: string[];        // Concrete examples
  language: string;           // Language of this metadata (ISO 639-1)
  audioFriendly: boolean;     // Optimized for screen readers
  cognitiveLevel: string;     // "simple" | "intermediate" | "technical"
}
```

#### 2.3 Example: Successful Payment

```json
{
  "data": {
    "success": true,
    "transaction": "abc123...",
    "payer": "mxyz...",
    "network": "bsv-testnet"
  },
  "accessibility": {
    "plainLanguage": "El pago se completó exitosamente",
    "explanation": "Tu transacción fue transmitida a la blockchain BSV testnet con ID abc123...",
    "stepByStep": [
      "Recibimos tu transacción firmada",
      "La validamos contra la red BSV",
      "La transmitimos a la blockchain",
      "La transacción está confirmada en la red"
    ],
    "hints": {
      "nextSteps": "Puedes verificar tu transacción en WhatsOnChain con el ID proporcionado"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

#### 2.4 Example: Payment Error

```json
{
  "data": {
    "isValid": false,
    "invalidReason": "insufficient_funds"
  },
  "accessibility": {
    "plainLanguage": "No hay fondos suficientes en tu wallet",
    "explanation": "Tu wallet tiene 500 satoshis pero necesitas 1113 satoshis (1000 para el pago + 113 de fee de minería)",
    "stepByStep": [
      "Verifica tu balance en un explorador de blockchain",
      "Obtén más fondos de un faucet o exchange",
      "Intenta de nuevo cuando tengas suficientes fondos"
    ],
    "hints": {
      "nextSteps": "Obtén fondos de prueba en https://faucet.bitcoincloud.net/",
      "common": "El fee de minería se calcula según el tamaño de la transacción (~100-200 sats)"
    },
    "analogies": [
      "Es como intentar comprar algo de $11 cuando solo tienes $5 en tu billetera"
    ],
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

---

### 3. Resource Server Requirements

Resource servers that want to provide accessible experiences SHOULD:

1. **Extract preferences** from client payload or headers
2. **Pass preferences** to the facilitator in verify/settle requests
3. **Propagate accessibility metadata** from facilitator to client
4. **Preserve metadata** through the entire payment flow

#### 3.1 Modified Verify Request

```typescript
interface VerifyRequest {
  payload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
  accessibilityPreferences?: AccessibilityPreferences;  // NEW
}
```

#### 3.2 Example Flow

```http
# 1. Client → Resource Server
GET /api/data
X-PAYMENT: <payload-with-accessibility-prefs>

# 2. Resource Server → Facilitator
POST /verify
{
  "payload": {...},
  "paymentRequirements": {...},
  "accessibilityPreferences": {
    "language": "es",
    "cognitiveLevel": "simple"
  }
}

# 3. Facilitator → Resource Server
{
  "data": { "isValid": true, ... },
  "accessibility": { "plainLanguage": "...", ... }
}

# 4. Resource Server → Client
{
  "message": "¡Pago exitoso!",
  "data": {...},
  "accessibility": { ... }  // Propagated from facilitator
}
```

---

### 4. AI-Enhanced Accessibility (Optional)

Facilitators MAY use LLM APIs (OpenAI, Anthropic, etc.) to generate dynamic accessibility metadata.

#### 4.1 When to Use AI

- **Standard errors**: Use templates (fast, consistent, free)
- **Complex errors**: Use AI (contextual, adaptive)
- **Multilingual**: Use AI (automatic translation)
- **Custom explanations**: Use AI (personalized)

#### 4.2 Hybrid Approach (Recommended)

```typescript
async function generateAccessibility(
  eventType: string,
  context: any,
  preferences: AccessibilityPreferences
): Promise<AccessibilityMetadata> {
  // Use cache for common cases
  const cacheKey = `${eventType}:${preferences.language}:${preferences.cognitiveLevel}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Use templates for standard cases
  if (hasTemplate(eventType)) {
    return generateFromTemplate(eventType, context, preferences);
  }

  // Use AI for complex/rare cases
  const aiMetadata = await generateWithAI(eventType, context, preferences);
  await cache.set(cacheKey, aiMetadata, { ttl: 3600 });
  return aiMetadata;
}
```

#### 4.3 AI Prompt Template

```typescript
const prompt = `
Generate accessibility metadata for a blockchain payment error:

Error: ${errorCode}
Context: ${JSON.stringify(context)}
Language: ${preferences.language}
Cognitive Level: ${preferences.cognitiveLevel}

Return JSON with:
1. plainLanguage: Simple summary (max 100 chars)
2. explanation: Detailed explanation (max 300 chars)
3. stepByStep: Array of 3-5 action steps (80 chars each)
4. hints: Object with nextSteps, common mistakes
5. analogies: Array of 1-2 real-world analogies

Format: audio-friendly (no symbols, linear narrative)
`;
```

---

### 5. Error Codes and Templates

Standard error codes SHOULD have predefined accessibility templates:

| Error Code | Plain Language (ES) | Plain Language (EN) |
|------------|---------------------|---------------------|
| `invalid_address` | La dirección no es válida | The address is invalid |
| `insufficient_funds` | No hay fondos suficientes | Insufficient funds |
| `invalid_amount` | El monto es incorrecto | The amount is incorrect |
| `invalid_network` | Red incorrecta (mainnet vs testnet) | Wrong network |
| `already_broadcast` | Transacción ya transmitida | Transaction already broadcast |
| `broadcast_failed` | No se pudo transmitir | Broadcast failed |
| `parse_error` | Error al leer la transacción | Transaction parse error |

---

### 6. Discovery and Capability Negotiation

#### 6.1 Facilitator Capabilities

Facilitators SHOULD advertise accessibility support in their root endpoint:

```http
GET / HTTP/1.1
```

```json
{
  "data": {
    "networks": ["bsv-testnet"],
    "accessibility": {
      "supported": true,
      "languages": ["es", "en", "fr", "pt"],
      "cognitiveLevels": ["simple", "intermediate", "technical"],
      "formats": ["text", "audio-friendly", "visual"],
      "aiEnhanced": true,
      "version": "1.0.0"
    }
  },
  "accessibility": {
    "plainLanguage": "Este facilitador soporta Bitcoin SV testnet",
    "explanation": "Procesamos pagos X402 en la red de prueba de Bitcoin SV...",
    "language": "es",
    "cognitiveLevel": "simple"
  }
}
```

---

### 7. Security Considerations

1. **Privacy**: Accessibility preferences may reveal user characteristics (language, disability)
   - Servers SHOULD NOT log preferences
   - Use HTTPS always

2. **AI Data**: When using AI, avoid sending sensitive transaction data
   - Hash/anonymize addresses
   - Redact amounts if possible

3. **Cache Poisoning**: If caching AI responses
   - Use secure cache keys
   - Validate cached content

4. **Injection Attacks**: When using AI
   - Sanitize error messages before sending to LLM
   - Validate AI responses before returning

---

### 8. Implementation Checklist

#### Facilitator Implementation

- [ ] Parse `accessibilityPreferences` from verify/settle requests
- [ ] Generate `AccessibilityMetadata` for all responses
- [ ] Support at least 2 languages (e.g., English + Spanish)
- [ ] Implement templates for common errors
- [ ] Return `AccessibleResponse<T>` wrapper
- [ ] Advertise capabilities in root endpoint
- [ ] (Optional) Integrate AI for complex cases

#### Resource Server Implementation

- [ ] Extract accessibility preferences from client
- [ ] Pass preferences to facilitator
- [ ] Propagate `accessibility` metadata to client
- [ ] Preserve metadata in error responses
- [ ] Handle missing metadata gracefully

#### Client (MCP/Wallet) Implementation

- [ ] Allow users to specify language preference
- [ ] Allow users to specify cognitive level
- [ ] Parse and display `accessibility` metadata
- [ ] Support screen readers (ARIA labels)
- [ ] Cache user preferences

---

### 9. Examples and Reference Implementation

See the reference implementation at:
- **Facilitator**: https://github.com/andresleon/facilitador-bsv-x402-accesible
- **Resource Server**: (same repo) `/src/resource-server`
- **MCP Client**: https://github.com/andresleon/mcp-wallet

---

### 10. Future Enhancements

Potential future additions to this specification:

1. **Visual Accessibility**: Diagrams, flowcharts for visual learners
2. **Video Tutorials**: Links to explainer videos
3. **Interactive Guides**: Step-by-step wizards
4. **Personalization**: Learning from user feedback
5. **Compliance**: WCAG 2.1 AA certification
6. **Voice Commands**: Integration with voice assistants

---

## Appendix A: Complete Example

See `docs/ACCESSIBILITY-EXAMPLE.md` for a complete end-to-end example.

## Appendix B: Language Templates

See `src/facilitator/accessibility/languages/` for template implementations.

## Appendix C: AI Integration Guide

See `docs/AI-INTEGRATION.md` for detailed AI integration patterns.

---

## License

This specification is released under CC0 1.0 Universal (Public Domain).

## Contributing

Contributions welcome! Please submit issues and PRs to the reference implementation repository.
