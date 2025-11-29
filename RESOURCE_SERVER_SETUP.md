# Resource Server X402 - Setup Completo

Este documento describe el resource server X402 que ha sido añadido al proyecto.

## 📁 Estructura de Archivos Creados

```
src/resource-server/
├── index.ts              # Código principal del resource server
├── wrangler.toml         # Configuración de Cloudflare Workers
├── README.md             # Documentación completa
└── QUICKSTART.md         # Guía rápida de inicio

scripts/
└── test-resource-server.sh  # Script para probar el resource server

package.json              # Actualizado con scripts nuevos
```

## 🎯 ¿Qué es el Resource Server?

El resource server es un **servidor de demostración** que muestra cómo proteger recursos (endpoints) usando el protocolo X402 y pagos BSV.

**Características principales**:
- ✅ Implementa el flujo completo X402 (verify + settle)
- ✅ Protege un endpoint `/api/data` que requiere pago BSV
- ✅ Integrado con el facilitador accesible (español + metadata)
- ✅ Listo para deploy a Cloudflare Workers
- ✅ Documentación completa en español

## 🔄 Cómo Funciona

### Flujo Básico

1. **Cliente hace request sin pago**:
   ```bash
   GET http://localhost:8788/api/data
   ```

2. **Resource server retorna 402 con PaymentRequirements**:
   ```json
   {
     "scheme": "exact",
     "network": "bsv-testnet",
     "maxAmountRequired": "1000",
     "payTo": "mnLd5sVxHETdJqZJ6m3FepXGYPG8Z1WDWV",
     ...
   }
   ```

3. **Cliente crea transacción BSV** que paga a la dirección especificada

4. **Cliente hace request con pago**:
   ```bash
   GET http://localhost:8788/api/data
   X-PAYMENT: <base64-encoded-payment-payload>
   ```

5. **Resource server valida el pago**:
   - Llama a `POST /verify` del facilitador
   - Llama a `POST /settle` del facilitador
   - Retorna los datos protegidos si el pago es válido

### Integración con el Facilitador

El resource server **depende** del facilitador para:
- Validar transacciones BSV (endpoint `/verify`)
- Transmitir transacciones a la blockchain (endpoint `/settle`)
- Obtener metadata accesible en español

## 🚀 Cómo Usarlo

### Desarrollo Local

#### Terminal 1: Iniciar el facilitador
```bash
npm run dev
```
El facilitador estará en `http://localhost:8787`

#### Terminal 2: Iniciar el resource server
```bash
npm run dev:resource
```
El resource server estará en `http://localhost:8788`

#### Terminal 3: Probar
```bash
# Health check
curl http://localhost:8788/

# Endpoint protegido (debería retornar 402)
curl http://localhost:8788/api/data

# O usar el script de test
bash scripts/test-resource-server.sh
```

### Deploy a Producción

```bash
# Deploy del facilitador (si no lo has hecho)
npm run deploy

# Deploy del resource server
npm run deploy:resource
```

**IMPORTANTE**: Antes de hacer deploy, configura tu dirección BSV testnet en `src/resource-server/wrangler.toml`:

```toml
[env.production.vars]
PAYOUT_ADDRESS = "tu-direccion-bsv-testnet-aqui"
```

## 📚 Documentación

### Documentos Disponibles

1. **[src/resource-server/README.md](src/resource-server/README.md)**
   - Documentación completa del resource server
   - Arquitectura y flujo detallado
   - Configuración de service bindings
   - Ejemplos de integración con cliente web
   - Troubleshooting completo

2. **[src/resource-server/QUICKSTART.md](src/resource-server/QUICKSTART.md)**
   - Guía rápida para empezar en 5 minutos
   - Setup local paso a paso
   - Deploy a producción en 10 minutos
   - Comandos útiles

3. **[src/resource-server/wrangler.toml](src/resource-server/wrangler.toml)**
   - Configuración de Cloudflare Workers
   - Variables de entorno
   - Service bindings

### Scripts NPM Añadidos

```json
{
  "dev:resource": "Iniciar resource server en desarrollo",
  "deploy:resource": "Deployer resource server a producción"
}
```

## 🔧 Configuración

### Variables de Entorno

El resource server usa estas variables de entorno:

| Variable | Descripción | Default | Requerido |
|----------|-------------|---------|-----------|
| `FACILITATOR_URL` | URL del facilitador | `http://localhost:8787` | No |
| `PAYOUT_ADDRESS` | Dirección BSV testnet para pagos | (ejemplo incluido) | **Sí** |

### Service Binding (Producción)

Para mejor rendimiento en producción, configura un service binding al facilitador:

1. Despliega ambos workers (facilitador + resource server)
2. En Cloudflare dashboard:
   - Workers & Pages → `x402-resource-server-accesible-prod`
   - Settings → Bindings → Add Service Binding
   - Variable name: `FACILITATOR`
   - Service: `facilitador-bsv-x402-accesible`

**Ventajas**:
- ⚡ Menor latencia (comunicación interna en Cloudflare)
- 🔒 Mayor seguridad (no sale a internet)
- 💰 Menor costo (no cuenta como request HTTP externo)

## 🧪 Testing

### Test Básico (sin transacciones reales)

```bash
bash scripts/test-resource-server.sh
```

Este script verifica:
- ✅ Resource server responde correctamente
- ✅ Retorna 402 cuando no hay pago
- ✅ PaymentRequirements son válidos
- ✅ Facilitador está accesible

### Test End-to-End (con transacciones reales)

```bash
npm run test:e2e
```

Este test:
- ✅ Crea transacciones BSV reales
- ✅ Llama al resource server con pago válido
- ✅ Verifica que se reciban los datos protegidos
- ✅ Valida la metadata accesible

**Requisito**: Wallet BSV testnet con fondos en `wallet-imported.json`

## 🎨 Personalización

### Cambiar el Monto del Pago

Edita `src/resource-server/index.ts`, línea ~217:

```typescript
const requirements = generatePaymentRequirements(
  resourceUrl,
  payoutAddress,
  '1000',  // ← Cambia esto (satoshis)
  'Acceso al endpoint de datos protegidos'
);
```

### Agregar Más Endpoints Protegidos

Copia el patrón de `/api/data`:

```typescript
app.get('/api/premium-content', async (c) => {
  const paymentHeader = c.req.header('X-PAYMENT');

  if (!paymentHeader) {
    // Retornar 402 con requirements
    return c.json(generatePaymentRequirements(...), 402);
  }

  // Verificar y liquidar pago
  // ...

  // Retornar contenido premium
  return c.json({ premium: 'data' });
});
```

### Cambiar el Contenido Protegido

Edita `src/resource-server/index.ts`, línea ~294:

```typescript
return c.json({
  message: 'Tu mensaje personalizado',
  data: {
    // Tu contenido aquí
    miDato: 'valor',
    otroDato: 123
  },
  payment: {
    txid: settleResult.transaction,
    ...
  }
});
```

## 🔗 Integración con MCP Wallet

El resource server está diseñado para trabajar con el MCP wallet:

1. Cliente (Claude Desktop) usa el MCP wallet para crear transacciones
2. MCP wallet genera el `PaymentPayload` en el formato correcto
3. Cliente envía request con header `X-PAYMENT`
4. Resource server valida y retorna datos

Ver `docs/MCP_SETUP.md` para configurar el MCP wallet.

## 📊 Arquitectura del Sistema Completo

```
┌─────────────────────────────────────────────────────┐
│                  Claude Desktop                     │
│  (con MCP wallet para crear transacciones BSV)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP requests con X-PAYMENT header
                   │
┌──────────────────▼──────────────────────────────────┐
│              Resource Server                        │
│  - Valida X-PAYMENT header                          │
│  - Llama a facilitador /verify                      │
│  - Llama a facilitador /settle                      │
│  - Retorna datos protegidos                         │
│                                                      │
│  Endpoints:                                          │
│  GET /           - Health check                     │
│  GET /api/data   - Recurso protegido (requiere $)   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ POST /verify, POST /settle
                   │
┌──────────────────▼──────────────────────────────────┐
│         Facilitador X402 Accesible                  │
│  - Valida transacciones BSV                         │
│  - Verifica montos y direcciones                    │
│  - Transmite a blockchain (settle)                  │
│  - Retorna metadata accesible (español claro)       │
│                                                      │
│  Endpoints:                                          │
│  POST /verify    - Validar transacción              │
│  POST /settle    - Transmitir a blockchain          │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Broadcast transaction
                   │
┌──────────────────▼──────────────────────────────────┐
│            BSV Testnet Blockchain                   │
│  - WhatsOnChain API                                 │
└─────────────────────────────────────────────────────┘
```

## 🆘 Troubleshooting

### Error: "Cannot find module 'hono'"

**Solución**:
```bash
npm install
```

### Error: "Facilitator verification failed"

**Causa**: El facilitador no está corriendo o no es accesible.

**Solución**:
1. Verifica que el facilitador esté corriendo: `curl http://localhost:8787/`
2. Revisa `FACILITATOR_URL` en `wrangler.toml`
3. Revisa los logs del facilitador: `wrangler tail`

### Error: "Service binding not configured"

**Causa**: Solo afecta en producción cuando no hay service binding.

**Solución**:
- El resource server usará `FACILITATOR_URL` como fallback
- Para mejor rendimiento, configura el service binding en Cloudflare dashboard

### Puerto 8788 ya en uso

**Solución**:
```bash
wrangler dev --config src/resource-server/wrangler.toml --port 8789
```

## 🔐 Seguridad

El resource server implementa:

- ✅ Validación estricta de transacciones BSV
- ✅ Verificación de montos y direcciones de pago
- ✅ CORS configurado correctamente
- ✅ No expone private keys ni información sensible
- ✅ Logs estructurados sin datos confidenciales

**IMPORTANTE**: En producción:
- Usa HTTPS siempre (Cloudflare lo proporciona automáticamente)
- Configura tu propia dirección BSV testnet en `PAYOUT_ADDRESS`
- Considera agregar rate limiting para prevenir abuso

## 🎓 Próximos Pasos

1. **Prueba local**: Inicia el facilitador y el resource server localmente
2. **Test el flujo**: Usa el script de test o el MCP wallet
3. **Personaliza**: Ajusta montos, endpoints, contenido
4. **Deploy**: Despliega a Cloudflare Workers
5. **Integra**: Conecta con tu aplicación web o CLI

## 📖 Referencias

- [README del Resource Server](src/resource-server/README.md) - Documentación completa
- [QUICKSTART](src/resource-server/QUICKSTART.md) - Guía rápida
- [Documentación del Facilitador](docs/EXAMPLES.md) - Ejemplos del facilitador
- [Especificación X402](https://github.com/bitcoin-sv/x402) - Protocolo X402
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Plataforma de deploy

---

**¿Necesitas ayuda?** Revisa la documentación completa en `src/resource-server/README.md` o abre un issue en el repositorio.
