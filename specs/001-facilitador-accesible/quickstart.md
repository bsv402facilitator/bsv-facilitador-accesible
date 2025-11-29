# Quickstart: Facilitador X402 BSV Accesible

**Feature**: Facilitador X402 para Bitcoin SV con accesibilidad universal
**Branch**: `001-facilitador-accesible`
**Tiempo estimado de setup**: < 5 minutos

## Descripción General

Este facilitador implementa el protocolo X402 para pagos HTTP en Bitcoin SV (testnet), diseñado específicamente para accesibilidad universal. Permite que usuarios con discapacidades cognitivas y visuales realicen pagos blockchain a través de clientes LLM (Claude Desktop, ChatGPT) con metadata accesible en todos los responses.

**Características principales**:
- Verificación de transacciones BSV (`/verify`)
- Settlement y broadcast a blockchain (`/settle`)
- Metadata accesible en español con niveles cognitivos
- Compatibilidad con TTS (text-to-speech)
- Mensajes de error accionables con hints de resolución
- Arquitectura stateless sin base de datos

---

## Prerequisites

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** ≥18.0.0 ([Descargar](https://nodejs.org/))
- **npm** ≥9.0.0 o **pnpm** ≥8.0.0
- **Wrangler CLI** (Cloudflare Workers):
  ```bash
  npm install -g wrangler
  ```
- **(Opcional)** Cuenta de Cloudflare para deploy a producción ([Crear cuenta](https://dash.cloudflare.com/sign-up))

**Verificar instalación**:
```bash
node --version  # Debe mostrar v18.0.0 o superior
npm --version   # Debe mostrar 9.0.0 o superior
wrangler --version  # Debe mostrar wrangler instalado
```

---

## Setup (< 5 minutos)

### 1. Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/mcp-wallet-accesible.git
cd mcp-wallet-accesible

# Cambiar a la branch del feature
git checkout 001-facilitador-accesible

# Instalar dependencias
npm install
```

**Dependencias principales instaladas**:
- `hono@4.0+` - Framework HTTP para Cloudflare Workers
- `@bsv/sdk@1.0+` - Operaciones criptográficas BSV
- `zod@3.22+` - Validación de schemas
- `@hono/zod-validator@0.4+` - Integración Zod con Hono
- `vitest@2.1+` - Testing framework

### 2. Configuración

El proyecto incluye `wrangler.toml` preconfigurado para desarrollo local:

```toml
# wrangler.toml (ya incluido en el repositorio)
name = "facilitador-bsv-x402-accesible"
main = "src/facilitator/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat_v2"]  # Requerido para @bsv/sdk

[observability]
enabled = true  # Logs y métricas en Cloudflare dashboard
```

**No se requiere configuración adicional** para desarrollo local. El facilitador es stateless y no usa environment variables ni secrets.

**Nota**: Para deploy a producción, configura tu cuenta de Cloudflare:
```bash
wrangler login
```

### 3. Development Local

Ejecutar servidor de desarrollo:

```bash
npm run dev
# Equivalente a: wrangler dev

# Salida esperada:
# ⛅️ wrangler 3.x.x
# ------------------
# Your worker has access to the following bindings:
# - Vars: (none)
# ⎔ Starting local server...
# [wrangler:inf] Ready on http://localhost:8787
```

El servidor estará disponible en **http://localhost:8787**

**Scripts disponibles**:
```bash
npm run dev         # Desarrollo local con hot reload
npm run build       # Build de producción
npm run deploy      # Deploy a Cloudflare Workers
npm test            # Tests unitarios e integración
npm run test:coverage  # Tests con reporte de cobertura
npm run lint        # ESLint
npm run format      # Prettier
```

### 4. Testing

Ejecutar suite de tests completa:

```bash
npm test

# Para ver cobertura de código:
npm run test:coverage

# Salida esperada:
# ✓ tests/unit/verify.test.ts (15 tests)
# ✓ tests/unit/settle.test.ts (12 tests)
# ✓ tests/integration/verify-flow.test.ts (8 tests)
# ✓ tests/integration/settle-flow.test.ts (10 tests)
#
# Test Files  4 passed (4)
#      Tests  45 passed (45)
#   Coverage  Lines: 85.2% | Branches: 82.3% | Functions: 88.1%
```

**Coverage threshold**: >80% en lines, branches, functions, y statements (enforced automáticamente).

### 5. Deploy a Cloudflare Workers

Una vez probado localmente, deployar a producción:

```bash
# 1. Login a Cloudflare (solo la primera vez)
wrangler login

# 2. Deploy
npm run deploy
# Equivalente a: wrangler deploy

# Salida esperada:
# Uploaded facilitador-bsv-x402-accesible (x.xx sec)
# Published facilitador-bsv-x402-accesible (x.x sec)
#   https://facilitador-bsv-x402-accesible.your-subdomain.workers.dev
# Current Deployment ID: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx
```

Tu facilitador estará disponible en la URL proporcionada por Cloudflare.

---

## Quick Examples

### Health Check

Verificar que el facilitador está operativo:

```bash
curl http://localhost:8787/
```

**Response esperado**:
```json
{
  "data": {
    "status": "ok",
    "facilitator": "BSV X402 Accesible",
    "version": "1.0.0",
    "endpoints": {
      "verify": "/verify",
      "settle": "/settle"
    }
  },
  "accessibility": {
    "plainLanguage": "El facilitador está funcionando correctamente",
    "explanation": "Este facilitador procesa pagos X402 en Bitcoin SV testnet con accesibilidad universal",
    "stepByStep": [
      "Usa /verify para validar transacciones",
      "Usa /settle para hacer broadcast a la blockchain"
    ],
    "hints": {
      "nextSteps": "Consulta EXAMPLES.md para ver casos de uso completos"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Verificar Transacción (POST /verify)

Validar que una transacción BSV cumple con los requisitos de pago:

```bash
curl -X POST http://localhost:8787/verify \
  -H "Content-Type: application/json" \
  -d '{
    "rawTx": "0100000001a15d6f00c7c48c5f3e23a3a6d0e7c4b8f9e5d2c1a0b8c7d6e5f4a3b2c1a0b8c70000000000ffffffff0210270000000000001976a914c3f8e5d2c1a0b8c7d6e5f4a3b2c1a0b8c7d688ac50c30000000000001976a914a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f888ac00000000",
    "requirements": {
      "recipientAddress": "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r",
      "amountSatoshis": 10000
    }
  }'
```

**Parámetros**:
- `rawTx`: Transacción BSV serializada en hexadecimal
- `requirements.recipientAddress`: Dirección BSV testnet destino (prefijo 'm' o 'n')
- `requirements.amountSatoshis`: Monto exacto en satoshis (1 BSV = 100,000,000 satoshis)

**Response exitoso**:
```json
{
  "data": {
    "valid": true,
    "txid": "a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0",
    "details": {
      "recipientAddress": "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r",
      "amountSatoshis": 10000,
      "outputIndex": 0
    }
  },
  "accessibility": {
    "plainLanguage": "El pago se verificó correctamente",
    "explanation": "Tu transacción cumple con todos los requisitos: monto de 10000 satoshis enviados a mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r",
    "stepByStep": [
      "Recibimos tu transacción",
      "Validamos el monto y la dirección de destino",
      "La transacción está lista para ser procesada",
      "Puedes proceder con el paso de settlement"
    ],
    "hints": {
      "nextSteps": "Usa el endpoint /settle con el mismo rawTx para hacer broadcast a la blockchain"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Response con error (monto incorrecto)**:
```json
{
  "data": {
    "valid": false,
    "reason": "AMOUNT_MISMATCH",
    "expected": 10000,
    "actual": 5000
  },
  "accessibility": {
    "plainLanguage": "El monto del pago es incorrecto",
    "explanation": "La transacción enviada no tiene el monto requerido de 10000 satoshis. El monto actual es 5000 satoshis.",
    "stepByStep": [
      "Verifica el monto requerido en los payment requirements",
      "Crea una nueva transacción con el monto exacto",
      "Vuelve a enviar la transacción al facilitador"
    ],
    "hints": {
      "ifError": "Crea una nueva transacción con 10000 satoshis exactos",
      "commonMistakes": [
        "Confundir satoshis con BSV (1 BSV = 100,000,000 satoshis)",
        "Olvidar incluir fees en el cálculo del monto"
      ],
      "nextSteps": "Consulta EXAMPLES.md sección 'Crear transacción con monto exacto'"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Hacer Settlement (POST /settle)

Hacer broadcast de la transacción a la blockchain BSV testnet:

```bash
curl -X POST http://localhost:8787/settle \
  -H "Content-Type: application/json" \
  -d '{
    "rawTx": "0100000001a15d6f00c7c48c5f3e23a3a6d0e7c4b8f9e5d2c1a0b8c7d6e5f4a3b2c1a0b8c70000000000ffffffff0210270000000000001976a914c3f8e5d2c1a0b8c7d6e5f4a3b2c1a0b8c7d688ac50c30000000000001976a914a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f888ac00000000"
  }'
```

**Parámetros**:
- `rawTx`: Transacción BSV serializada en hexadecimal (la misma que en /verify)

**Response exitoso**:
```json
{
  "data": {
    "settled": true,
    "txid": "a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0",
    "broadcasted": true,
    "alreadyBroadcasted": false
  },
  "accessibility": {
    "plainLanguage": "El pago se procesó exitosamente",
    "explanation": "Tu transacción fue enviada a la blockchain BSV testnet. TXID: a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0",
    "stepByStep": [
      "Recibimos tu transacción firmada",
      "Hicimos broadcast a la red BSV testnet",
      "La transacción fue aceptada por los nodos",
      "El pago será confirmado en los próximos bloques"
    ],
    "hints": {
      "nextSteps": "Puedes verificar el estado de tu transacción en https://test.whatsonchain.com/tx/a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

**Response con transacción ya broadcasted**:
```json
{
  "data": {
    "settled": true,
    "txid": "a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0",
    "broadcasted": false,
    "alreadyBroadcasted": true
  },
  "accessibility": {
    "plainLanguage": "Esta transacción ya fue procesada anteriormente",
    "explanation": "La transacción con TXID a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0 ya existe en la blockchain",
    "stepByStep": [
      "Consultamos la blockchain para verificar el estado",
      "Encontramos que esta transacción ya fue broadcasted",
      "No es necesario reenviarla",
      "El pago ya está en proceso de confirmación"
    ],
    "hints": {
      "nextSteps": "Verifica el estado actual en https://test.whatsonchain.com/tx/a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0b8c7d6e5f4a3b2c1a0"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "medium"
  }
}
```

---

## Ejemplos de Uso Completo

### Flujo típico: Verificar + Settlement

```bash
# 1. Verificar que la transacción es válida
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:8787/verify \
  -H "Content-Type: application/json" \
  -d '{
    "rawTx": "0100000001...",
    "requirements": {
      "recipientAddress": "mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r",
      "amountSatoshis": 10000
    }
  }')

echo "Verify Response:"
echo $VERIFY_RESPONSE | jq .

# 2. Si valid=true, proceder con settlement
if [ "$(echo $VERIFY_RESPONSE | jq -r '.data.valid')" = "true" ]; then
  echo -e "\n✓ Transacción válida, procediendo con settlement...\n"

  SETTLE_RESPONSE=$(curl -s -X POST http://localhost:8787/settle \
    -H "Content-Type: application/json" \
    -d '{
      "rawTx": "0100000001..."
    }')

  echo "Settle Response:"
  echo $SETTLE_RESPONSE | jq .

  TXID=$(echo $SETTLE_RESPONSE | jq -r '.data.txid')
  echo -e "\n✓ Pago completado! TXID: $TXID"
  echo "Ver en blockchain: https://test.whatsonchain.com/tx/$TXID"
else
  echo -e "\n✗ Transacción inválida"
  echo $VERIFY_RESPONSE | jq -r '.accessibility.explanation'
fi
```

### Crear transacción BSV para testing

Si necesitas una transacción BSV de prueba, usa `@bsv/sdk`:

```typescript
import { PrivateKey, Transaction, P2PKH } from '@bsv/sdk';

// Generar claves de prueba
const privateKey = PrivateKey.fromRandom();
const sourceAddress = privateKey.toAddress('testnet');

// Crear transacción simple
const tx = new Transaction();
tx.addInput({
  sourceTXID: 'a15d6f00c7c48c5f3e23a3a6d0e7c4b8f9e5d2c1a0b8c7d6e5f4a3b2c1a0b8c7',
  sourceOutputIndex: 0,
  unlockingScript: new P2PKH().unlock(privateKey),
  sequence: 0xffffffff,
});

// Output al facilitador (10,000 satoshis)
tx.addOutput({
  lockingScript: new P2PKH().lock('mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r'),
  satoshis: 10000,
});

// Output de cambio
tx.addOutput({
  lockingScript: new P2PKH().lock(sourceAddress),
  satoshis: 50000,
});

// Firmar y serializar
const rawTx = tx.toHex();
console.log('Raw Transaction:', rawTx);
```

---

## Troubleshooting

### Issue 1: Error "nodejs_compat_v2 not supported"

**Síntomas**:
```
Error: Unknown compatibility flag: nodejs_compat_v2
```

**Causa**: Versión antigua de Wrangler que no soporta el flag necesario para @bsv/sdk.

**Solución**:
```bash
# Actualizar Wrangler a la última versión
npm install -g wrangler@latest

# Verificar versión (debe ser ≥3.0.0)
wrangler --version
```

### Issue 2: Tests fallan con "Cannot find module @bsv/sdk"

**Síntomas**:
```
Error: Cannot find module '@bsv/sdk'
```

**Causa**: Dependencias no instaladas o node_modules corrupto.

**Solución**:
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar que @bsv/sdk está instalado
npm list @bsv/sdk
```

### Issue 3: Error "Address is mainnet, testnet required"

**Síntomas**:
```json
{
  "accessibility": {
    "plainLanguage": "La dirección de destino no es válida para testnet"
  }
}
```

**Causa**: La dirección proporcionada en `requirements.recipientAddress` es de mainnet (prefijo '1') en lugar de testnet (prefijo 'm' o 'n').

**Solución**:
```bash
# Usar dirección testnet válida (comienza con 'm' o 'n')
# Ejemplo válido: mrCDrCybB6J1vRfbwM5hemdJz73FwDBC8r
# Ejemplo inválido: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (mainnet)

# Generar nueva dirección testnet con @bsv/sdk:
import { PrivateKey } from '@bsv/sdk';
const addr = PrivateKey.fromRandom().toAddress('testnet').toString();
console.log('Testnet address:', addr);
```

### Issue 4: Timeout en /settle con error de red

**Síntomas**:
```json
{
  "accessibility": {
    "plainLanguage": "No se pudo conectar con la blockchain",
    "explanation": "El servicio WhatsOnChain no responde. Esto puede ser temporal."
  }
}
```

**Causa**: WhatsOnChain API está temporalmente inaccesible o hay problemas de red.

**Solución**:
1. Verificar estado de WhatsOnChain: https://test.whatsonchain.com/
2. Reintentar el request después de unos segundos:
   ```bash
   # El facilitador ya incluye retry automático (3 intentos)
   # Si falla, esperar 30 segundos y reintentar
   sleep 30
   curl -X POST http://localhost:8787/settle -d '...'
   ```
3. Si el problema persiste, verificar conexión a internet:
   ```bash
   curl https://test.whatsonchain.com/api/v1/bsv/test/chain/info
   ```

### Issue 5: Coverage de tests por debajo del threshold

**Síntomas**:
```
ERROR: Coverage for lines (78.5%) does not meet threshold (80%)
```

**Causa**: Código nuevo agregado sin tests correspondientes.

**Solución**:
```bash
# Ver reporte detallado de coverage
npm run test:coverage

# Identificar archivos sin cobertura suficiente
# Abrir el reporte HTML en coverage/index.html
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows

# Agregar tests para las líneas no cubiertas
# Los archivos de test están en tests/unit/ y tests/integration/
```

### Issue 6: ESLint reporta errores de tipo `any`

**Síntomas**:
```
error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Causa**: Uso de tipo `any` que viola las reglas de calidad del código.

**Solución**:
```typescript
// ❌ Incorrecto
function process(data: any) {
  return data.value;
}

// ✅ Correcto - usar unknown con type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data format');
}

// ✅ Correcto - definir tipo específico
interface ProcessData {
  value: string;
}
function process(data: ProcessData) {
  return data.value;
}
```

---

## Next Steps

Una vez que tengas el facilitador funcionando localmente, puedes:

1. **Leer la documentación detallada**:
   - `ARCHITECTURE.md`: Arquitectura del sistema, decisiones de diseño
   - `EXAMPLES.md`: Casos de uso completos con clientes LLM
   - `API.md`: Referencia completa de la API con todos los endpoints

2. **Explorar el código fuente**:
   - `src/facilitator/index.ts`: Entrypoint, routes, middleware
   - `src/facilitator/types.ts`: Schemas Zod y tipos TypeScript
   - `src/facilitator/accessibility/i18n.ts`: Mensajes en español
   - `src/facilitator/accessibility/metadata.ts`: Helpers de metadata

3. **Ejecutar tests específicos**:
   ```bash
   # Tests de verificación únicamente
   npm test -- tests/unit/verify.test.ts

   # Tests de settlement únicamente
   npm test -- tests/unit/settle.test.ts

   # Tests de integración completos
   npm test -- tests/integration/
   ```

4. **Integrar con tu aplicación**:
   - Ver `EXAMPLES.md` para ejemplos de integración con Claude Desktop
   - Revisar `contracts/` para los contratos OpenAPI de cada endpoint
   - Consultar `data-model.md` para la estructura completa de datos

5. **Contribuir al proyecto**:
   - Fork del repositorio
   - Crear feature branch: `git checkout -b mi-feature`
   - Hacer cambios con tests correspondientes
   - Verificar quality: `npm test && npm run lint`
   - Submit pull request

---

## Recursos Adicionales

- **Protocolo X402**: https://x402.org/
- **Bitcoin SV Documentation**: https://docs.bsvblockchain.org/
- **@bsv/sdk Reference**: https://docs.bsvblockchain.org/sdk/
- **WhatsOnChain API**: https://developers.whatsonchain.com/
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Hono Framework**: https://hono.dev/
- **Zod Documentation**: https://zod.dev/

---

## Soporte

Si encuentras problemas no documentados aquí:

1. Revisa los [Issues abiertos](https://github.com/tu-usuario/mcp-wallet-accesible/issues)
2. Busca en las [Discussions](https://github.com/tu-usuario/mcp-wallet-accesible/discussions)
3. Crea un nuevo issue con:
   - Descripción detallada del problema
   - Pasos para reproducirlo
   - Versión de Node.js, npm, y Wrangler
   - Logs relevantes (usa `wrangler dev --log-level debug`)

Para preguntas de accesibilidad, contacta al equipo de diseño inclusivo.

---

**Última actualización**: 2025-11-27
**Versión del facilitador**: 1.0.0 (MVP testnet)
