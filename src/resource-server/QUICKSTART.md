# Quick Start - Resource Server X402

Guía rápida para poner en marcha el resource server en **5 minutos**.

## ⚡ Setup Rápido (Desarrollo Local)

### Paso 1: Instalar dependencias

```bash
# Desde el directorio raíz del proyecto
npm install
```

### Paso 2: Iniciar el facilitador (en una terminal)

```bash
npm run dev
```

El facilitador estará en `http://localhost:8787`

### Paso 3: Iniciar el resource server (en otra terminal)

```bash
cd src/resource-server
wrangler dev
```

El resource server estará en `http://localhost:8788`

### Paso 4: Probar el endpoint protegido

```bash
# Debería retornar 402 con PaymentRequirements
curl http://localhost:8788/api/data
```

**Respuesta esperada**:
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

✅ **¡Listo!** El resource server está funcionando.

## 🧪 Probar con Pago Real

### Opción 1: Usando MCP Wallet (Recomendado)

1. Configura el MCP wallet según `docs/MCP_SETUP.md`
2. Importa una wallet BSV testnet con fondos
3. Usa Claude Desktop para hacer requests al resource server
4. El MCP wallet creará y firmará la transacción automáticamente

### Opción 2: Usando el script de test end-to-end

```bash
# Asegúrate de tener una wallet con fondos en wallet-imported.json
npm run test:e2e
```

Este script:
1. Hace request sin pago (debería retornar 402)
2. Crea una transacción BSV válida
3. Hace request con pago
4. Verifica que se reciban los datos protegidos

## 🌐 Deploy a Producción (10 minutos)

### Paso 1: Login a Cloudflare

```bash
wrangler login
```

### Paso 2: Configurar tu dirección BSV testnet

Edita `src/resource-server/wrangler.toml`:

```toml
[env.production.vars]
PAYOUT_ADDRESS = "tu-direccion-bsv-testnet-aqui"
```

### Paso 3: Deploy

```bash
cd src/resource-server
wrangler deploy --env production
```

Copia la URL del deploy:
```
https://x402-resource-server-accesible-prod.tu-subdomain.workers.dev
```

### Paso 4: Configurar service binding (opcional pero recomendado)

1. Ve a Cloudflare dashboard
2. Workers & Pages → `x402-resource-server-accesible-prod`
3. Settings → Bindings → Add Service Binding
4. Variable name: `FACILITATOR`
5. Service: `facilitador-bsv-x402-accesible` (tu facilitador desplegado)

### Paso 5: Smoke test

```bash
# Health check
curl https://tu-url.workers.dev/

# Endpoint protegido (debería retornar 402)
curl https://tu-url.workers.dev/api/data
```

✅ **¡Desplegado!** Tu resource server está en producción.

## 📊 Arquitectura del Sistema

```
┌───────────────────────────────────────────────────────────┐
│                    Cliente (Browser/CLI)                  │
└────────────────┬──────────────────────────────────────────┘
                 │
                 │ 1. GET /api/data (sin pago)
                 │ ← 402 Payment Required
                 │
                 │ 2. Crear transacción BSV
                 │
                 │ 3. GET /api/data + X-PAYMENT header
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Resource Server (localhost:8788)              │
│  - Valida X-PAYMENT header                                 │
│  - Llama a facilitador /verify                             │
│  - Llama a facilitador /settle                             │
│  - Retorna datos protegidos                                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ POST /verify, POST /settle
                 ▼
┌────────────────────────────────────────────────────────────┐
│           Facilitador X402 (localhost:8787)                │
│  - Valida transacción BSV                                  │
│  - Verifica montos y direcciones                           │
│  - Transmite a blockchain (settle)                         │
│  - Retorna metadata accesible                              │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Broadcast transaction
                 ▼
┌────────────────────────────────────────────────────────────┐
│              BSV Testnet Blockchain                        │
│  - WhatsOnChain API                                        │
└────────────────────────────────────────────────────────────┘
```

## 🎯 Próximos Pasos

1. **Personalizar el endpoint protegido**: Edita `src/resource-server/index.ts` para servir tu propio contenido
2. **Ajustar el monto del pago**: Cambia `maxAmountRequired` en `generatePaymentRequirements()`
3. **Agregar más endpoints**: Copia el patrón de `/api/data` para proteger otros recursos
4. **Integrar con tu app**: Usa el cliente web de ejemplo en `README.md`
5. **Monitorear en producción**: Usa `wrangler tail` para ver logs en tiempo real

## 🔧 Comandos Útiles

```bash
# Desarrollo
wrangler dev                    # Iniciar servidor local
wrangler dev --port 8788        # Especificar puerto

# Deploy
wrangler deploy                 # Deploy a dev
wrangler deploy --env production # Deploy a producción

# Logs
wrangler tail                   # Ver logs en tiempo real
wrangler tail --env production  # Ver logs de producción

# Debugging
wrangler dev --local            # Modo local (sin Cloudflare)
```

## 🆘 Problemas Comunes

**Error: "Cannot find module 'hono'"**
```bash
npm install
```

**Error: "Facilitator verification failed"**
- Verifica que el facilitador esté corriendo en `localhost:8787`
- Revisa `FACILITATOR_URL` en `wrangler.toml`

**Error: "Service binding not configured"**
- Solo afecta en producción
- Configura el service binding en el dashboard de Cloudflare

**Puerto 8788 ya en uso**
```bash
wrangler dev --port 8789
```

## 📖 Más Información

- [README completo](./README.md) - Documentación detallada
- [Ejemplos de uso](../../docs/EXAMPLES.md) - Ejemplos del facilitador
- [Guía de testing](../../TESTING_GUIDE.md) - Cómo testear el sistema completo

¡Disfruta construyendo con X402! 🚀
