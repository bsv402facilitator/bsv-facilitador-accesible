# X402 Accessibility - Complete End-to-End Example

This document shows a complete payment flow using the X402 Accessibility Extension.

## Scenario

María is a Spanish-speaking user with visual impairment who wants to access protected content. She uses a screen reader and needs simple explanations.

---

## Step 1: Client Requests Resource (Without Payment)

```http
GET /api/data HTTP/1.1
Host: resource-server.example.com
Accept-Language: es
```

### Response: 402 Payment Required

```json
{
  "scheme": "exact",
  "network": "bsv-testnet",
  "maxAmountRequired": "1000",
  "resource": "https://resource-server.example.com/api/data",
  "description": "Acceso al endpoint de datos protegidos",
  "payTo": "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
  "maxTimeoutSeconds": 300
}
```

---

## Step 2: Client Creates Payment with Accessibility Preferences

María's MCP wallet creates a payment with her preferences:

```typescript
// In MCP Wallet
const payment = await createX402Payment({
  walletId: "maria-wallet",
  payTo: "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
  amount: 1000,
  network: "testnet",
  // Accessibility preferences
  accessibilityPrefs: {
    language: "es",
    cognitiveLevel: "simple",
    format: "audio-friendly"
  }
});
```

### Generated Payment Payload

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "bsv-testnet",
  "payload": {
    "transaction": "0100000001cadc11f61b..."
  },
  "accessibility": {
    "language": "es",
    "cognitiveLevel": "simple",
    "format": "audio-friendly"
  }
}
```

Encoded as base64: `eyJ4NDAyVmVyc2lvbiI6MSw...`

---

## Step 3: Client Retries with Payment

```http
GET /api/data HTTP/1.1
Host: resource-server.example.com
X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSw...
```

---

## Step 4: Resource Server → Facilitator (Verify)

Resource server extracts preferences and forwards to facilitator:

```http
POST /verify HTTP/1.1
Host: facilitator.example.com
Content-Type: application/json

{
  "payload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "bsv-testnet",
    "payload": {
      "transaction": "0100000001cadc11f61b..."
    },
    "accessibility": {
      "language": "es",
      "cognitiveLevel": "simple",
      "format": "audio-friendly"
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "bsv-testnet",
    "maxAmountRequired": "1000",
    "payTo": "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
    "resource": "https://resource-server.example.com/api/data",
    "maxTimeoutSeconds": 300
  },
  "accessibilityPreferences": {
    "language": "es",
    "cognitiveLevel": "simple",
    "format": "audio-friendly"
  }
}
```

---

## Step 5: Facilitator Verifies and Responds

Facilitator validates the transaction and generates accessible metadata:

```json
{
  "data": {
    "isValid": true,
    "payer": "mjBHBLkSqeGbNf4JJrwUvPkSWTxTSQWUYG",
    "payee": "mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk",
    "amount": "1000",
    "network": "bsv-testnet"
  },
  "accessibility": {
    "plainLanguage": "El pago fue verificado correctamente",
    "explanation": "Tu transacción BSV es válida. Pagaste 1000 satoshis desde tu dirección mjBHBLkS... a la dirección mhSDV8SP...",
    "stepByStep": [
      "Verificamos que la transacción esté firmada correctamente",
      "Confirmamos que el monto sea exactamente 1000 satoshis",
      "Validamos que el pago vaya a la dirección correcta",
      "Comprobamos que estés usando BSV testnet"
    ],
    "hints": {
      "nextSteps": "Ahora transmitiremos tu transacción a la blockchain para confirmarla"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

---

## Step 6: Resource Server → Facilitator (Settle)

Resource server asks facilitator to broadcast the transaction:

```http
POST /settle HTTP/1.1
Host: facilitator.example.com
Content-Type: application/json

{
  "payload": { ... },
  "paymentRequirements": { ... },
  "accessibilityPreferences": {
    "language": "es",
    "cognitiveLevel": "simple",
    "format": "audio-friendly"
  }
}
```

### Facilitator Settle Response

```json
{
  "data": {
    "success": true,
    "transaction": "6b64a3dc076f00061a339bbcb73ae385bfc8240e4abc8bb48dd86eaf1f06a9cc",
    "payer": "mjBHBLkSqeGbNf4JJrwUvPkSWTxTSQWUYG",
    "network": "bsv-testnet"
  },
  "accessibility": {
    "plainLanguage": "El pago se completó exitosamente",
    "explanation": "Tu transacción fue transmitida a la blockchain BSV testnet con ID 6b64a3dc076f00061a339bbcb73ae385bfc8240e4abc8bb48dd86eaf1f06a9cc",
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

---

## Step 7: Resource Server → Client (Success)

Resource server returns protected content with accessibility metadata:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "¡Pago exitoso! Aquí están tus datos protegidos.",
  "data": {
    "timestamp": "2025-11-28T11:27:31.572Z",
    "content": "Este es contenido protegido accesible solo con pago BSV válido",
    "funFact": "¡Bitcoin SV puede manejar más de 50,000 transacciones por segundo!"
  },
  "payment": {
    "txid": "6b64a3dc076f00061a339bbcb73ae385bfc8240e4abc8bb48dd86eaf1f06a9cc",
    "payer": "mjBHBLkSqeGbNf4JJrwUvPkSWTxTSQWUYG",
    "network": "bsv-testnet",
    "amount": "1000"
  },
  "accessibility": {
    "plainLanguage": "El pago se completó exitosamente",
    "explanation": "Tu transacción fue transmitida a la blockchain BSV testnet con ID 6b64a3dc076f00061a339bbcb73ae385bfc8240e4abc8bb48dd86eaf1f06a9cc",
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

---

## Step 8: Screen Reader Output

María's screen reader narrates:

> **El pago se completó exitosamente.**
>
> Tu transacción fue transmitida a la blockchain BSV testnet con ID 6 b 6 4 a 3 d c 0 7 6 f 0 0 0 6 1 a 3 3 9 b b c b 7 3 a e 3 8 5 b f c 8 2 4 0 e 4 a b c 8 b b 4 8 d d 8 6 e a f 1 f 0 6 a 9 c c.
>
> Pasos realizados:
> 1. Recibimos tu transacción firmada.
> 2. La validamos contra la red BSV.
> 3. La transmitimos a la blockchain.
> 4. La transacción está confirmada en la red.
>
> Siguiente paso: Puedes verificar tu transacción en WhatsOnChain con el ID proporcionado.

---

## Error Example: Insufficient Funds

If María didn't have enough funds:

### Facilitator Response

```json
{
  "data": {
    "isValid": false,
    "invalidReason": "insufficient_funds"
  },
  "accessibility": {
    "plainLanguage": "No hay fondos suficientes en tu wallet",
    "explanation": "Tu wallet tiene 500 satoshis pero necesitas 1113 satoshis. Esto incluye 1000 satoshis para el pago y 113 satoshis de comisión para los mineros.",
    "stepByStep": [
      "Verifica cuántos satoshis tienes en tu wallet",
      "Obtén más fondos de un faucet de BSV testnet",
      "Espera a que los fondos se confirmen en la blockchain",
      "Intenta hacer el pago nuevamente"
    ],
    "hints": {
      "nextSteps": "Obtén fondos gratuitos de testnet en https://faucet.bitcoincloud.net/",
      "common": "La comisión de minería se calcula según el tamaño de tu transacción. Transacciones más grandes tienen comisiones más altas."
    },
    "analogies": [
      "Es como intentar comprar algo de $11.13 cuando solo tienes $5 en tu billetera. Necesitas agregar más dinero antes de poder comprarlo."
    ],
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Screen Reader Output

> **No hay fondos suficientes en tu wallet.**
>
> Tu wallet tiene 500 satoshis pero necesitas 1113 satoshis. Esto incluye 1000 satoshis para el pago y 113 satoshis de comisión para los mineros.
>
> Pasos para resolver:
> 1. Verifica cuántos satoshis tienes en tu wallet.
> 2. Obtén más fondos de un faucet de BSV testnet.
> 3. Espera a que los fondos se confirmen en la blockchain.
> 4. Intenta hacer el pago nuevamente.
>
> Consejo: Obtén fondos gratuitos de testnet en h t t p s dos puntos barra barra faucet punto bitcoincloud punto net.
>
> Analogía: Es como intentar comprar algo de $11.13 cuando solo tienes $5 en tu billetera. Necesitas agregar más dinero antes de poder comprarlo.

---

## Technical Level Example

If a developer requested `cognitiveLevel: "technical"`:

```json
{
  "accessibility": {
    "plainLanguage": "Transaction validation successful",
    "explanation": "Transaction 6b64a3dc... validated successfully. Input: 1 UTXO from cadc11f6:1 (99791 sats). Outputs: P2PKH(mhSDV8SP..., 1000 sats), P2PKH(n2CazoRP..., 98678 sats). Fee: 113 sats (0.50 sat/byte). Signature: ECDSA secp256k1 valid.",
    "stepByStep": [
      "Parsed raw transaction from hex using @bsv/sdk",
      "Validated ECDSA signature using secp256k1 curve",
      "Verified output[0] script matches required P2PKH(mhSDV8SP...)",
      "Confirmed UTXO availability via WhatsOnChain API",
      "Calculated fee: 113 sats (226 bytes × 0.50 sat/byte)"
    ],
    "hints": {
      "nextSteps": "Transaction will be broadcast to BSV testnet nodes",
      "technical": "Fee rate: 0.50 sat/byte. Typical testnet confirmation time: ~10 minutes (next block)"
    },
    "language": "en",
    "audioFriendly": false,
    "cognitiveLevel": "technical"
  }
}
```

---

## Summary

This example demonstrates:

1. ✅ **Client specifies preferences** (language, cognitive level, format)
2. ✅ **Facilitator generates appropriate metadata** (simple Spanish, audio-friendly)
3. ✅ **Resource server propagates metadata** to client
4. ✅ **Screen reader compatibility** (linear narrative, no symbols)
5. ✅ **Error handling with actionable guidance**
6. ✅ **Flexibility** (technical users get technical details)

The entire flow is accessible to users with:
- Visual impairments (screen reader compatible)
- Language barriers (Spanish, with support for more languages)
- Cognitive differences (simple explanations with analogies)
- Technical expertise (can request technical details)
