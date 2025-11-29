# Facilitador X402 BSV con Accesibilidad Universal

Facilitador X402 para Bitcoin SV (testnet) diseñado específicamente para accesibilidad universal. Permite que usuarios con discapacidades cognitivas y visuales realicen pagos blockchain a través de clientes LLM (Claude Desktop, ChatGPT) con metadata accesible en español.

## Características

- ✅ Verificación de transacciones BSV (`/verify`)
- ✅ Settlement y broadcast a blockchain (`/settle`)
- ✅ Metadata accesible en español con niveles cognitivos
- ✅ Compatibilidad con TTS (text-to-speech)
- ✅ Mensajes de error accionables con hints de resolución
- ✅ Arquitectura stateless sin base de datos

## Quickstart

Consulta [specs/001-facilitador-accesible/quickstart.md](./specs/001-facilitador-accesible/quickstart.md) para instrucciones completas de setup y uso.

### Instalación rápida

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test
```

El servidor estará disponible en `http://localhost:8787`

## Componentes del Proyecto

### 🔧 Facilitador X402
El facilitador principal que valida y transmite transacciones BSV con metadata accesible.

**Endpoints**:
- `POST /verify` - Validar transacción BSV
- `POST /settle` - Transmitir transacción a blockchain
- `GET /` - Health check

**Documentación**:
- **[Quickstart](./specs/001-facilitador-accesible/quickstart.md)**: Guía de setup y primeros pasos
- **[Plan](./specs/001-facilitador-accesible/plan.md)**: Arquitectura y decisiones técnicas
- **[Data Model](./specs/001-facilitador-accesible/data-model.md)**: Schemas y tipos de datos
- **[Research](./specs/001-facilitador-accesible/research.md)**: Investigación y decisiones de diseño
- **[Examples](./docs/EXAMPLES.md)**: Ejemplos de uso completos

### 🛡️ Resource Server (Demo)
Servidor de demostración que muestra cómo proteger recursos usando X402 y pagos BSV.

**Endpoints**:
- `GET /api/data` - Recurso protegido que requiere pago BSV

**Documentación**:
- **[Setup Completo](./RESOURCE_SERVER_SETUP.md)**: Guía de instalación y configuración
- **[README](./src/resource-server/README.md)**: Documentación detallada
- **[Quickstart](./src/resource-server/QUICKSTART.md)**: Inicio rápido en 5 minutos

**Iniciar en desarrollo**:
```bash
# Terminal 1: Facilitador
npm run dev

# Terminal 2: Resource Server
npm run dev:resource
```

## Documentación General

- **[Tasks](./specs/001-facilitador-accesible/tasks.md)**: Lista de tareas de implementación
- **[Testing Guide](./TESTING_GUIDE.md)**: Guía completa de testing
- **[Implementation Report](./IMPLEMENTATION_REPORT.md)**: Reporte de implementación

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono 4.0
- **BSV SDK**: @bsv/sdk 1.0
- **Validación**: Zod 3.22
- **Testing**: Vitest 2.1
- **Language**: TypeScript 5.6 (strict mode)

## Desarrollo

```bash
# Desarrollo local con hot reload
npm run dev

# Build de producción
npm run build

# Deploy a Cloudflare Workers
npm run deploy

# Tests con coverage
npm run test:coverage

# Linting
npm run lint

# Formateo de código
npm run format
```

## Estado del Proyecto

**Branch**: `001-facilitador-accesible`
**Estado**: ✅ Fase 1 completada (Setup)
**Siguiente**: Fase 2 (Foundational - Core Infrastructure)

## Licencia

MIT
