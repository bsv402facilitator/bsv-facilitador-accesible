# Guía de Testing - Facilitador X402 BSV

Esta guía te ayudará a probar el facilitador X402 BSV con transacciones reales en testnet.

## 🌐 URL de Producción

```
https://facilitador-bsv-x402-accesible.andresleontest.workers.dev
```

## 📋 Pasos para Probar con Transacciones Reales

### Paso 1: Generar Wallet de Testnet

Ejecuta el script para generar una wallet BSV testnet:

```bash
npx tsx scripts/create-test-transaction.ts
```

Este script:
- ✅ Genera un par de claves privada/pública
- ✅ Crea una dirección testnet (comienza con `m` o `n`)
- ✅ Guarda la información en `wallet-testnet.json`

**Output esperado:**
```
🔑 Generando par de claves BSV testnet...

✅ Claves generadas:
   Private Key (WIF): L5dtd...
   Public Key: 03b229...
   Address (testnet): mqWjQYPDLdsK9CouhTyAhQSJhFHpHZqWQx

💰 Para obtener fondos de testnet:
...
```

### Paso 2: Obtener Fondos del Faucet

1. **Abre el archivo `wallet-testnet.json`** para ver tu dirección testnet

2. **Visita un faucet de BSV testnet**:
   - 🔗 [https://faucet.bitcoincloud.net/](https://faucet.bitcoincloud.net/) (recomendado)
   - 🔗 [https://testnet.satoshisvision.network/](https://testnet.satoshisvision.network/)

3. **Envía fondos a tu dirección testnet**
   - Copia tu dirección desde `wallet-testnet.json` (campo `address`)
   - Pega la dirección en el faucet
   - Solicita los fondos

4. **Espera la confirmación** (1-2 bloques, ~10-20 minutos)

5. **Verifica tu balance** en el explorador:
   ```
   https://test.whatsonchain.com/address/TU_DIRECCION_AQUI
   ```

### Paso 3: Construir Transacción Real

Una vez que tengas fondos confirmados:

```bash
npx tsx scripts/build-real-transaction.ts
```

Este script:
- ✅ Carga tu wallet desde `wallet-testnet.json`
- ✅ Consulta tus UTXOs en WhatsOnChain API
- ✅ Construye una transacción que paga 50,000 satoshis
- ✅ Firma la transacción con tu private key
- ✅ Genera `verify-payload.json` y `settle-payload.json`

**Output esperado:**
```
✅ Wallet cargada desde wallet-testnet.json
📍 Dirección: mqWjQYPDLdsK9CouhTyAhQSJhFHpHZqWQx

🔍 Buscando UTXOs en WhatsOnChain...

✅ Se encontraron 1 UTXO(s):
   UTXO #1:
   - TXID: abc123...
   - Index: 0
   - Value: 1000000 satoshis
   - Confirmations: Confirmed

🔨 Construyendo transacción...
✅ Transacción creada y firmada:
   - TXID: def456...
   - Size: 192 bytes

💾 Payloads guardados:
   - verify-payload.json
   - settle-payload.json
```

### Paso 4: Probar Endpoint `/verify`

Verifica que la transacción es válida antes de hacer broadcast:

```bash
curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d @verify-payload.json
```

**Respuesta esperada (válida):**
```json
{
  "data": {
    "isValid": true,
    "payer": "mqWjQYPDLdsK9CouhTyAhQSJhFHpHZqWQx"
  },
  "accessibility": {
    "plainLanguage": "El pago es válido y puede procesarse",
    "explanation": "...",
    "stepByStep": [...],
    "hints": {...},
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Respuesta esperada (inválida):**
```json
{
  "data": {
    "isValid": false,
    "invalidReason": "invalid_amount"
  },
  "accessibility": {
    "plainLanguage": "El monto del pago es incorrecto",
    "explanation": "...",
    ...
  }
}
```

### Paso 5: Probar Endpoint `/settle`

⚠️ **ADVERTENCIA**: Este endpoint hace **broadcast REAL** de la transacción a la red BSV testnet. Solo puedes hacer broadcast de una transacción una vez.

```bash
curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/settle \
  -H "Content-Type: application/json" \
  -d @settle-payload.json
```

**Respuesta esperada (exitosa):**
```json
{
  "data": {
    "status": "settled",
    "txid": "abc123def456...",
    "note": "Pago procesado exitosamente"
  },
  "accessibility": {
    "plainLanguage": "El pago fue procesado exitosamente",
    "explanation": "Tu transacción ha sido enviada a la red Bitcoin SV y será confirmada en los próximos bloques.",
    "stepByStep": [
      "La transacción fue validada",
      "Se hizo broadcast a la red BSV",
      "Espera 1-2 bloques para confirmación"
    ],
    "hints": {
      "nextSteps": "Verifica el estado de tu transacción en WhatsOnChain usando el TXID",
      "estimatedTime": "10-20 minutos para confirmación"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Respuesta esperada (error):**
```json
{
  "error": "broadcast_failed",
  "metadata": {
    "accessible": {
      "plainLanguage": "No se pudo procesar el pago",
      "explanation": "...",
      ...
    }
  }
}
```

### Paso 6: Verificar Broadcast en Blockchain

Verifica que tu transacción fue incluida en la blockchain:

```bash
# Reemplaza TXID con el txid de la respuesta de /settle
curl https://test.whatsonchain.com/tx/TU_TXID_AQUI
```

O abre en el navegador:
```
https://test.whatsonchain.com/tx/TU_TXID_AQUI
```

---

## 🧪 Testing sin Fondos Reales

Si quieres probar la **validación** sin tener fondos, puedes usar transacciones de prueba inválidas:

### Test 1: Formato Inválido

```bash
curl -X POST https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "x402Version": 1,
      "scheme": "exact",
      "network": "bsv-testnet",
      "payload": {
        "transaction": "invalid_hex_here"
      }
    },
    "paymentRequirements": {
      "scheme": "exact",
      "network": "bsv-testnet",
      "maxAmountRequired": "100000",
      "resource": "https://example.com/api",
      "payTo": "mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk",
      "maxTimeoutSeconds": 3600
    }
  }'
```

**Respuesta esperada:**
```json
{
  "data": {
    "isValid": false,
    "invalidReason": "invalid_format"
  },
  "accessibility": {
    "plainLanguage": "El formato de la transacción es inválido",
    ...
  }
}
```

### Test 2: Health Check

Verifica que el facilitador está funcionando:

```bash
curl https://facilitador-bsv-x402-accesible.andresleontest.workers.dev/
```

**Respuesta esperada:**
```json
{
  "data": {
    "networks": ["bsv-testnet"]
  },
  "accessibility": {
    "plainLanguage": "Este facilitador soporta Bitcoin SV testnet",
    "explanation": "Procesamos pagos X402 en la red de prueba de Bitcoin SV...",
    ...
  }
}
```

---

## 🔧 Troubleshooting

### Error: "No se encontraron UTXOs"

**Causa**: No tienes fondos en tu dirección testnet.

**Solución**:
1. Verifica tu dirección en WhatsOnChain
2. Si no hay fondos, visita el faucet nuevamente
3. Espera 10-20 minutos para confirmación

### Error: "Number can only safely store up to 53 bits"

**Causa**: La transacción tiene valores muy grandes que exceden el límite de JavaScript.

**Solución**:
1. Este error puede ocurrir con transacciones malformadas
2. Regenera la transacción con `build-real-transaction.ts`
3. Asegúrate de usar valores razonables (<100M satoshis)

### Error: "broadcast_failed"

**Causa**: La transacción no pudo ser enviada a la red BSV.

**Posibles razones**:
- La transacción ya fue broadcast anteriormente (doble gasto)
- Los inputs de la transacción ya fueron gastados
- La transacción es inválida según las reglas de consenso

**Solución**:
1. Verifica que tus UTXOs aún están disponibles
2. Genera una nueva transacción con `build-real-transaction.ts`
3. Asegúrate de no haber hecho broadcast anteriormente

---

## 📊 Métricas de Testing

Al probar el facilitador, verifica:

- ✅ **Latency**: `/verify` debe responder en <200ms p95
- ✅ **Latency**: `/settle` debe responder en <2s p95 (incluyendo broadcast)
- ✅ **Accesibilidad**: Todas las respuestas incluyen metadata accesible en español
- ✅ **Error Handling**: Los errores retornan mensajes claros y accionables
- ✅ **CORS**: Los requests desde diferentes origins son permitidos

---

## 📝 Notas Importantes

1. **Esta es TESTNET**: Los fondos NO tienen valor real
2. **Private Keys**: Guarda tu `wallet-testnet.json` de forma segura
3. **Una sola vez**: Cada transacción solo puede hacer broadcast una vez
4. **Confirmaciones**: Espera 1-2 bloques (~10-20 min) para confirmación
5. **Límites del faucet**: Algunos faucets tienen límites por día/IP

---

## 🎯 Checklist de Testing Completo

- [ ] Generar wallet testnet
- [ ] Obtener fondos del faucet
- [ ] Verificar fondos en WhatsOnChain
- [ ] Construir transacción real
- [ ] Probar `/verify` con transacción válida
- [ ] Probar `/verify` con transacción inválida
- [ ] Probar `/settle` con transacción válida
- [ ] Verificar broadcast en blockchain
- [ ] Validar metadata de accesibilidad en todas las respuestas
- [ ] Verificar que los mensajes están en español claro
- [ ] Confirmar que los hints son accionables

---

## 🚀 Siguientes Pasos

Una vez que hayas probado exitosamente el facilitador:

1. **Integración con Claude Desktop** vía MCP
2. **Monitoreo de logs** en Cloudflare dashboard
3. **Performance testing** con herramientas como `wrk` o `ab`
4. **Feedback de usuarios** con discapacidades
5. **Iteración en mensajes** de accesibilidad según feedback

---

**¿Preguntas?** Abre un issue en el repositorio o contacta al equipo de desarrollo.
