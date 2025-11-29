# X402 Resource Server - Demo Accesible

Servidor de recursos demo que implementa el protocolo X402 para pagos HTTP nativos usando Bitcoin SV (BSV) testnet.

Este servidor protege un endpoint `/api/data` y requiere un pago válido de BSV para acceder al contenido. Utiliza el **facilitador accesible** que proporciona mensajes en español claro y metadata accesible para usuarios con discapacidades.

## 🎯 Características

- ✅ Implementación completa del flujo X402 (verify + settle)
- ✅ Protección de recursos mediante pagos BSV testnet
- ✅ Integración con facilitador accesible (español + metadata)
- ✅ CORS habilitado para requests de navegador
- ✅ Service binding support para producción
- ✅ Mensajes de error claros y accionables
- ✅ Soporte para usuarios con discapacidades visuales y cognitivas

## 📋 Requisitos Previos

1. **Node.js** 18+ y npm instalados
2. **Wrangler CLI** instalado globalmente:
   ```bash
   npm install -g wrangler
   ```
3. **Cuenta de Cloudflare** (para deploy)
4. **Facilitador X402 accesible** desplegado y funcionando

## 🚀 Instalación

### 1. Instalar dependencias

Desde el directorio raíz del proyecto:

```bash
npm install
```

### 2. Configurar variables de entorno

Edita `src/resource-server/wrangler.toml` y configura:

```toml
[env.production.vars]
FACILITATOR_URL = "https://tu-facilitador.workers.dev"
PAYOUT_ADDRESS = "tu-direccion-bsv-testnet"
```

**IMPORTANTE**: Reemplaza `PAYOUT_ADDRESS` con tu dirección BSV testnet real donde quieres recibir los pagos.

### 3. Configurar service binding (Producción)

Para mejor rendimiento en producción, configura el service binding al facilitador:

```toml
[[env.production.services]]
binding = "FACILITATOR"
service = "facilitador-bsv-x402-accesible"  # Nombre de tu worker facilitador
```

## 🧪 Desarrollo Local

### Iniciar servidor local

```bash
cd src/resource-server
wrangler dev
```

El servidor estará disponible en `http://localhost:8788` (puerto diferente al facilitador).

### Probar el flujo X402

#### 1. Request sin pago (debería retornar 402)

```bash
curl http://localhost:8788/api/data
```

**Respuesta esperada**: 402 con `PaymentRequirements`

```json
{
  "scheme": "exact",
  "network": "bsv-testnet",
  "maxAmountRequired": "1000",
  "resource": "http://localhost:8788/api/data",
  "description": "Acceso al endpoint de datos protegidos",
  "payTo": "mnLd5sVxHETdJqZJ6m3FepXGYPG8Z1WDWV",
  "maxTimeoutSeconds": 300
}
```

#### 2. Request con pago válido

Primero, necesitas crear un `PaymentPayload` válido usando el MCP wallet o el cliente CLI.

```bash
# Ejemplo con header X-PAYMENT (base64 encoded PaymentPayload)
curl http://localhost:8788/api/data \
  -H "X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoiYnN2LXRlc3RuZXQiLCJwYXlsb2FkIjp7InRyYW5zYWN0aW9uIjoiMDEwMDAwMDAuLi4ifX0="
```

**Respuesta esperada**: 200 con datos protegidos

```json
{
  "message": "¡Pago exitoso! Aquí están tus datos protegidos.",
  "data": {
    "timestamp": "2025-11-28T10:00:00.000Z",
    "content": "Este es contenido protegido accesible solo con pago BSV válido",
    "funFact": "¡Bitcoin SV puede manejar más de 50,000 transacciones por segundo!"
  },
  "payment": {
    "txid": "abc123...",
    "payer": "mnLd5sVxHETdJqZJ6m3FepXGYPG8Z1WDWV",
    "network": "bsv-testnet",
    "amount": "1000"
  },
  "accessibility": {
    "plainLanguage": "El pago fue verificado correctamente",
    "explanation": "Tu transacción BSV es válida y cumple todos los requisitos...",
    "stepByStep": ["Paso 1: ...", "Paso 2: ..."],
    "hints": ["Guarda el txid para futuras referencias"]
  }
}
```

## 🌐 Deploy a Producción

### 1. Login a Cloudflare

```bash
wrangler login
```

### 2. Deploy a producción

```bash
cd src/resource-server
wrangler deploy --env production
```

### 3. Configurar service binding

Después del primer deploy, configura el service binding en el dashboard de Cloudflare:

1. Ve a **Workers & Pages** → tu worker
2. **Settings** → **Bindings**
3. Agrega **Service Binding**:
   - Variable name: `FACILITATOR`
   - Service: `facilitador-bsv-x402-accesible`

### 4. Smoke test en producción

```bash
# Health check
curl https://x402-resource-server-accesible-prod.tu-subdomain.workers.dev/

# Endpoint protegido (debería retornar 402)
curl https://x402-resource-server-accesible-prod.tu-subdomain.workers.dev/api/data
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `FACILITATOR_URL` | URL del facilitador X402 | No | `http://localhost:8787` |
| `PAYOUT_ADDRESS` | Dirección BSV testnet para pagos | Sí | (ejemplo incluido) |

### Service Binding (Producción)

| Binding | Service | Descripción |
|---------|---------|-------------|
| `FACILITATOR` | `facilitador-bsv-x402-accesible` | Comunicación directa con facilitador |

**Ventajas del service binding**:
- ⚡ Menor latencia (sin salir de la red de Cloudflare)
- 🔒 Mayor seguridad (comunicación interna)
- 💰 Menor costo (sin requests HTTP públicos)

## 📊 Endpoints

### `GET /`

Health check del servidor.

**Respuesta**:
```json
{
  "service": "X402 Resource Server Demo - Accesible",
  "version": "1.0.0",
  "endpoints": ["/api/data"],
  "description": "Servidor de recursos con facilitador X402 accesible en español"
}
```

### `GET /api/data`

Endpoint protegido que requiere pago X402.

**Headers**:
- `X-PAYMENT`: (opcional) PaymentPayload codificado en base64

**Respuestas**:

| Status | Descripción |
|--------|-------------|
| 200 | Pago válido - retorna datos protegidos |
| 402 | Pago requerido o inválido - retorna PaymentRequirements |
| 500 | Error del servidor |

## 🔄 Flujo Completo X402

```
┌─────────┐         ┌──────────────┐         ┌────────────┐
│ Cliente │         │   Resource   │         │Facilitador │
│         │         │    Server    │         │ Accesible  │
└────┬────┘         └──────┬───────┘         └─────┬──────┘
     │                     │                       │
     │  GET /api/data      │                       │
     │ ─────────────────>  │                       │
     │                     │                       │
     │  402 Payment Req.   │                       │
     │ <─────────────────  │                       │
     │                     │                       │
     │ (Cliente crea TX)   │                       │
     │                     │                       │
     │  GET /api/data      │                       │
     │  X-PAYMENT: ...     │                       │
     │ ─────────────────>  │                       │
     │                     │                       │
     │                     │  POST /verify         │
     │                     │ ───────────────────>  │
     │                     │                       │
     │                     │  VerifyResponse       │
     │                     │ <───────────────────  │
     │                     │                       │
     │                     │  POST /settle         │
     │                     │ ───────────────────>  │
     │                     │                       │
     │                     │  SettleResponse       │
     │                     │ <───────────────────  │
     │                     │                       │
     │  200 + Data         │                       │
     │ <─────────────────  │                       │
     │                     │                       │
```

## 🧩 Integración con el Facilitador Accesible

Este resource server está diseñado para trabajar con el facilitador X402 accesible que:

1. **Mensajes en español claro**: Todos los mensajes de error y validación
2. **Metadata accesible**: Cada respuesta incluye:
   - `plainLanguage`: Mensaje simple (≤100 chars)
   - `explanation`: Explicación detallada (≤300 chars)
   - `stepByStep`: Guía paso a paso (≤5 pasos de 80 chars)
   - `hints`: Consejos accionables

3. **Soporte para discapacidades**:
   - Visual: Mensajes claros y estructurados
   - Cognitiva: Guías paso a paso simples
   - Compatible con lectores de pantalla

## 🎨 Ejemplo de Uso: Cliente Web

```javascript
// Cliente JavaScript que usa X402
async function fetchProtectedData() {
  const url = 'https://tu-resource-server.workers.dev/api/data';

  // 1. Primera request sin pago
  const response1 = await fetch(url);

  if (response1.status === 402) {
    const requirements = await response1.json();
    console.log('Pago requerido:', requirements);

    // 2. Crear transacción BSV usando MCP wallet
    // (código del wallet aquí)

    // 3. Segunda request con pago
    const paymentPayload = { /* ... */ };
    const base64Payload = btoa(JSON.stringify(paymentPayload));

    const response2 = await fetch(url, {
      headers: {
        'X-PAYMENT': base64Payload
      }
    });

    if (response2.ok) {
      const data = await response2.json();
      console.log('Datos protegidos:', data.data);
      console.log('Info de accesibilidad:', data.accessibility);
    }
  }
}
```

## 🔒 Seguridad

- ✅ Validación estricta de transacciones BSV
- ✅ Verificación de montos y direcciones
- ✅ CORS configurado correctamente
- ✅ No expone private keys ni WIFs
- ✅ Logs estructurados sin información sensible

## 🐛 Troubleshooting

### Error: "Verificación del facilitador falló"

**Causa**: El facilitador no está accesible o retornó error.

**Solución**:
1. Verifica que `FACILITATOR_URL` esté configurado correctamente
2. Verifica que el facilitador esté desplegado y funcionando
3. Revisa los logs del facilitador: `wrangler tail`

### Error: "Formato del header X-PAYMENT inválido"

**Causa**: El PaymentPayload no está correctamente codificado en base64.

**Solución**:
1. Verifica que el payload sea JSON válido
2. Verifica que esté codificado en base64
3. Verifica que tenga todos los campos requeridos (x402Version, scheme, network, payload.transaction)

### Service binding no funciona

**Causa**: El service binding no está configurado en Cloudflare.

**Solución**:
1. Despliega ambos workers (facilitador y resource server)
2. Ve al dashboard de Cloudflare → Workers → tu resource server
3. Settings → Bindings → Add Service Binding
4. Variable name: `FACILITATOR`, Service: `facilitador-bsv-x402-accesible`

## 📚 Referencias

- [Especificación X402](https://github.com/bitcoin-sv/x402)
- [Facilitador X402 Accesible](../README.md)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)

## 📝 Licencia

MIT

## 👥 Contribuciones

¡Las contribuciones son bienvenidas! Por favor abre un issue o pull request.

## 🤝 Soporte

Si tienes preguntas o necesitas ayuda:
1. Revisa la documentación del facilitador: `docs/EXAMPLES.md`
2. Revisa los logs: `wrangler tail`
3. Abre un issue en el repositorio
