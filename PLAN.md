# Plan: MCP Wallet Accesible

## Resumen Ejecutivo

Crear un nuevo servidor MCP (Model Context Protocol) para gestión de wallets BSV con **accesibilidad integrada desde el diseño**, basándose en:

- **Funcionalidad** del mcp-wallet original
- **Estándares de accesibilidad** del facilitador X402 (WCAG 2.1 Level AA)

**Enfoque**: Reescritura completa siguiendo mejores prácticas de accesibilidad.

**Audiencia objetivo**: Usuarios con discapacidades visuales, motrices y cognitivas.

**Entregable**: Servidor MCP con 5 tools para Claude Desktop, documentación accesible, testing manual.

---

## 1. Arquitectura del Proyecto

### 1.1 Estructura de Directorios

```
mcp-wallet-accesible/
├── .specify/
│   └── memory/
│       └── constitution.md          # Estándares WCAG 2.1 AA obligatorios
├── src/
│   ├── index.ts                     # Entry point
│   ├── server.ts                    # Registro de tools MCP
│   ├── config.ts                    # Config validada con Zod
│   ├── types/
│   │   ├── index.ts                # Tipos base con TSDoc completo
│   │   ├── tools.ts                # Schemas Zod de los 5 tools
│   │   └── errors.ts               # Errores tipados
│   ├── tools/
│   │   ├── manage-wallets.ts       # Create, list, import, export
│   │   ├── get-balance.ts          # Consultar balance
│   │   ├── sign-message.ts         # Firmar mensajes
│   │   ├── create-x402-payment.ts  # Crear pagos X402
│   │   ├── list-transactions.ts    # Historial
│   │   └── helpers/
│   │       ├── validation.ts       # Validaciones Zod reutilizables
│   │       └── formatting.ts       # Formateo de responses accesibles
│   ├── wallet/
│   │   ├── manager.ts              # API de alto nivel
│   │   ├── crypto.ts               # AES-256-GCM + Scrypt
│   │   ├── storage.ts              # Filesystem con permisos 600/700
│   │   └── validator.ts            # Validación de inputs
│   ├── bsv/
│   │   ├── transaction-builder.ts  # Construcción P2PKH
│   │   ├── network-client.ts       # WhatsOnChain API
│   │   ├── message-signer.ts       # Firma SHA-256
│   │   └── transaction-history.ts  # Historial blockchain
│   ├── x402/
│   │   ├── payment-creator.ts      # Payloads X402 en Base64
│   │   └── facilitator-client.ts   # Cliente HTTP facilitador
│   └── utils/
│       ├── logger.ts               # Logs JSON estructurados
│       ├── errors.ts               # Clases de error (WalletError, etc)
│       └── i18n.ts                 # Mensajes centralizados en español
├── tests/
│   ├── unit/                       # Tests unitarios por módulo
│   ├── integration/                # Flujos completos
│   └── fixtures/                   # Datos de prueba
├── docs/
│   ├── ARCHITECTURE.md             # Diagramas y decisiones
│   ├── ACCESSIBILITY.md            # Guía de accesibilidad
│   ├── EXAMPLES.md                 # Casos de uso paso a paso
│   └── API.md                      # Referencia completa de tools
├── scripts/
│   └── setup-claude-desktop.js     # Setup automático
├── package.json
├── tsconfig.json                   # Strict mode
├── vitest.config.ts                # Coverage >80%
├── eslint.config.js                # Flat config
└── README.md                       # Documentación principal
```

### 1.2 Separación de Responsabilidades

- **Server Layer**: Inicialización MCP, registro de tools
- **Tools Layer**: Validación Zod, responses estructurados, mensajes en español
- **Business Logic**: Wallet (crypto + storage), BSV (transacciones), X402 (pagos)
- **Utilities**: Logging, errores, i18n centralizado

---

## 2. Estrategia de Accesibilidad en Ecosistema X402

### 2.0 Análisis de Impacto: Cliente vs Facilitador vs Servidor de Recursos

En el contexto del protocolo X402, tenemos 3 componentes principales:

1. **Servidor de Recursos** - Provee el contenido protegido con 402 Payment Required
2. **Facilitador** - Verifica y liquida pagos BSV
3. **Cliente** - Consume recursos (en nuestro caso: Claude Desktop/ChatGPT con MCP)

**Pregunta estratégica**: ¿Dónde tiene más impacto la accesibilidad?

#### 2.0.1 Matriz de Impacto de Accesibilidad

| Componente | Impacto Accesibilidad | Razón | Prioridad |
|------------|----------------------|-------|-----------|
| **Cliente LLM** | 🟩 Máximo (delegado) | Ya tiene capacidades de accesibilidad integradas: voz, lectura simplificada, explicaciones paso a paso, alto contraste | ⭐⭐⭐ |
| **Facilitador BSV** | 🟩 Crítico | **Genera la metadata accesible** que el LLM interpreta y convierte en experiencia accesible | ⭐⭐⭐⭐⭐ |
| **Servidor de Recursos** | 🟧 Bajo | Solo provee contenido, no participa en la UX del flujo de pago | ⭐ |

#### 2.0.2 Por Qué el Facilitador es el Lugar Óptimo

**Cuando el cliente es un LLM (Claude Desktop/ChatGPT con MCP):**

✅ Los LLMs ya traen accesibilidad integrada de serie:
- Lectura por voz (TTS)
- Explicaciones en lenguaje sencillo
- Traducción automática
- Guía paso a paso
- Adaptación cognitiva
- Conversión de jerga técnica

✅ **El Facilitador debe proveer metadata estructurada accesible**, que el LLM interpretará automáticamente:

```typescript
{
  "chain": "BSV",
  "verified": true,
  "txid": "null-until-settled",

  "accessibility": {
    "plainLanguage": "El pago se verificó correctamente y puedes continuar.",

    "explanation": "Hemos recibido tu micropago en la red Bitcoin SV. La transacción es válida y cumple los requisitos. Todo está correcto.",

    "stepByStep": [
      "1. El cliente envió una transacción firmada.",
      "2. El facilitador la verificó usando la red BSV.",
      "3. La transacción coincide con la cantidad y dirección solicitadas.",
      "4. Ya puedes continuar al siguiente paso."
    ],

    "hints": {
      "ifError": "Si algo falla, normalmente es porque el monto es menor o la dirección no coincide. Puede corregirse fácilmente reenviando el pago correcto."
    },

    "language": "es",
    "audioFriendly": true
  }
}
```

✅ **El LLM convierte esta metadata en experiencia accesible conversacional**:

```
Usuario con discapacidad cognitiva:
"No entiendo qué pasó con mi pago"

Claude/ChatGPT (interpretando la metadata del facilitador):
"No te preocupes, todo está bien. Te explico paso a paso:

1️⃣ Enviaste tu micropago en BSV
2️⃣ Lo verificamos con la red blockchain
3️⃣ El monto y la dirección coinciden perfectamente
4️⃣ Ya puedes continuar

¿Quieres que te ayude con el siguiente paso?"
```

#### 2.0.3 Arquitectura Accesible Final

```
[Usuario con discapacidad]
    ↓
[Cliente LLM: Claude Desktop / ChatGPT con MCP]
    ↓ (interpreta metadata accesible automáticamente)
    ↓ (convierte a voz, pasos, lenguaje fácil)
    ↓
[Facilitador BSV con metadata accesible] ← 🎯 FOCO DE ACCESIBILIDAD
    ↓
[Servidor de recursos X402]
```

**Conclusión Estratégica:**

🔥 **La accesibilidad debe concentrarse en el Facilitador BSV**, porque:

1. El cliente LLM ya tiene capacidades de accesibilidad
2. El facilitador es el punto estratégico para **inyectar metadata accesible** en el flujo
3. Esta metadata es interpretada automáticamente por el LLM y convertida en experiencia accesible
4. No necesitamos programar UI accesible → el LLM actúa como "intérprete accesible universal"
5. Beneficia a **cualquier cliente LLM** sin código adicional

**Para el hackathon, esto significa:**

✨ "Hemos construido un facilitador X402 para pagos BSV que genera automáticamente una capa de accesibilidad universal. Cualquier cliente LLM (Claude, ChatGPT, etc.) puede interpretar esta metadata y ofrecer experiencias accesibles conversacionales sin programación adicional."

---

## 2.1 Adaptaciones de Accesibilidad para MCP

### 2.1.1 Responses Estructurados

**JSON schemas con campos semánticos y TSDoc completo:**

```typescript
/**
 * Respuesta de creación de wallet
 * Incluye toda la información necesaria para usar la wallet de forma segura
 */
export interface CreateWalletResponse {
  /** Indica si la operación fue exitosa */
  success: true;
  /** Operación realizada */
  operation: 'create';
  /** Identificador único de la wallet (16 bytes hex) */
  walletId: string;
  /** Dirección BSV pública para recibir pagos */
  address: string;
  /** Red BSV (mainnet o testnet) */
  network: Network;
  /** Frase mnemónica de 12 palabras - GUARDAR EN LUGAR SEGURO */
  mnemonic: string;
  /** Fecha y hora de creación en formato ISO 8601 */
  createdAt: string;
}
```

### 2.1.2 Mensajes en Español Centralizados

**`src/utils/i18n.ts`** contiene TODOS los mensajes del sistema:

```typescript
export const MESSAGES = {
  errors: {
    wallet: {
      PASSWORD_TOO_SHORT: 'El password debe tener al menos 8 caracteres para garantizar seguridad',
      WALLET_NOT_FOUND: (id: string) =>
        `No se encontró la wallet con ID ${id}. Verifica el ID o usa 'list'`,
      DECRYPT_FAILED: 'Password incorrecto. Verifica e intenta nuevamente',
      INSUFFICIENT_FUNDS: (needed: number, available: number) =>
        `Fondos insuficientes. Necesitas ${needed} satoshis pero tienes ${available} disponibles`,
    },
    validation: {
      INVALID_WIF: 'El formato WIF es inválido. Debe ser una clave privada BSV válida',
      INVALID_ADDRESS: 'La dirección BSV es inválida. Verifica el formato',
    },
  },
  success: {
    WALLET_CREATED: 'Wallet creada exitosamente. IMPORTANTE: Guarda el mnemonic en un lugar seguro',
  },
};
```

### 2.1.3 Validación con Zod

**Schemas con mensajes customizados:**

```typescript
export const CreateWalletSchema = z.object({
  operation: z.literal('create'),
  name: z
    .string()
    .min(1, 'El nombre de la wallet no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  network: z.enum(['mainnet', 'testnet'], {
    errorMap: () => ({ message: 'La red debe ser "mainnet" o "testnet"' }),
  }),
  password: z.string().min(8, 'El password debe tener al menos 8 caracteres'),
});
```

### 2.1.4 Documentación Accesible

- **README.md**: Headings jerárquicos, ejemplos claros, troubleshooting
- **EXAMPLES.md**: Casos de uso paso a paso numerados
- **API.md**: Referencia completa de cada tool con ejemplos
- **ACCESSIBILITY.md**: Guía para mantener WCAG 2.1 AA

### 2.1.5 Logs Estructurados

**JSON logs a stderr** (no contaminar stdout de MCP):

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  component: string;
  message: string;
  context?: Record<string, unknown>; // Sin passwords/WIFs
}
```

### 2.1.6 Metadata Accesible en Responses del Facilitador

**Todos los tools que interactúan con el facilitador X402 deben incluir campos de accesibilidad:**

```typescript
/**
 * Response extendida con metadata accesible
 * Compatible con interpretación automática por LLMs
 */
export interface AccessibleResponse<T> {
  /** Datos de respuesta */
  data: T;

  /** Metadata de accesibilidad interpretable por LLMs */
  accessibility: {
    /** Mensaje en lenguaje sencillo y claro */
    plainLanguage: string;

    /** Explicación detallada del resultado */
    explanation: string;

    /** Pasos ejecutados o próximos pasos */
    stepByStep: string[];

    /** Ayuda contextual en caso de errores o problemas */
    hints?: {
      ifError?: string;
      commonMistakes?: string[];
      nextSteps?: string[];
    };

    /** Idioma del contenido (ISO 639-1) */
    language: string;

    /** Indica si el contenido es óptimo para conversión a audio */
    audioFriendly: boolean;

    /** Nivel de complejidad cognitiva (simple, medium, advanced) */
    cognitiveLevel?: 'simple' | 'medium' | 'advanced';
  };
}
```

**Ejemplo de uso en create_x402_payment:**

```typescript
// Tool: create_x402_payment
const response: AccessibleResponse<X402PaymentData> = {
  data: {
    chain: 'BSV',
    verified: true,
    txid: tx.id,
    amount: paymentData.amount,
    address: paymentData.address
  },

  accessibility: {
    plainLanguage: `Pago de ${paymentData.amount} satoshis verificado correctamente.`,

    explanation: `Se ha verificado tu micropago en la red Bitcoin SV (BSV). La transacción con ID ${tx.id} cumple con todos los requisitos: monto correcto de ${paymentData.amount} satoshis y dirección de destino válida.`,

    stepByStep: [
      '1. Se creó la transacción firmada con tu wallet',
      '2. Se envió al facilitador para verificación',
      '3. El facilitador validó el monto y la dirección',
      '4. La transacción está lista para ser transmitida a la red BSV'
    ],

    hints: {
      ifError: 'Si encuentras un error, verifica que tu wallet tenga fondos suficientes y que la dirección de destino sea correcta.',
      nextSteps: [
        'Puedes consultar el estado de la transacción usando list_transactions',
        'El pago será visible en la blockchain en aproximadamente 10 segundos'
      ]
    },

    language: 'es',
    audioFriendly: true,
    cognitiveLevel: 'simple'
  }
};
```

**Beneficios para clientes LLM:**

✅ Claude/ChatGPT interpretan automáticamente `plainLanguage` y lo convierten en conversación natural
✅ `stepByStep` permite al LLM explicar procesos complejos de forma secuencial
✅ `hints` proporciona contexto para troubleshooting conversacional
✅ `audioFriendly` indica al LLM que el contenido es óptimo para TTS
✅ `cognitiveLevel` permite al LLM adaptar la complejidad de la explicación

---

## 3. Constitución del Proyecto

**`.specify/memory/constitution.md`** define estándares NO NEGOCIABLES:

### Principios Fundamentales

1. **Accesibilidad como Derecho**
   - WCAG 2.1 Level AA obligatorio
   - Mensajes claros y descriptivos en español
   - Errores accionables (qué pasó + cómo resolver)
   - Sin jerga técnica innecesaria

2. **Seguridad Sin Compromisos**
   - AES-256-GCM con Scrypt
   - Passwords nunca en logs
   - Permisos 600 (archivos) y 700 (directorios)

3. **Simplicidad y Claridad**
   - Código autoexplicativo
   - Una responsabilidad por función
   - Abstracciones solo cuando hay necesidad real

4. **Testing Riguroso**
   - Cobertura >80%
   - Tests de edge cases y errores
   - Tests independientes

5. **Documentación Exhaustiva**
   - TSDoc en todos los tipos públicos
   - README permite setup en <5 min
   - Ejemplos para todos los casos de uso

---

## 4. Stack Tecnológico

### Dependencies

| Librería                  | Versión | Propósito                      |
| ------------------------- | ------- | ------------------------------ |
| Node.js                   | 20+     | Runtime                        |
| TypeScript                | 5.7+    | Type safety, TSDoc             |
| @modelcontextprotocol/sdk | 1.0+    | MCP Server (obligatorio)       |
| @bsv/sdk                  | 1.1+    | Operaciones BSV (obligatorio)  |
| zod                       | 3.24+   | Validación con mensajes custom |
| axios                     | 1.7+    | WhatsOnChain API               |
| bip39                     | 3.1+    | Mnemonics BIP39                |

### Dev Dependencies

- **vitest** 2.1+ (testing)
- **eslint** 9.0+ (linting flat config)
- **prettier** 3.4+ (formatting)
- **@typescript-eslint/\*** (TS linting)

### Configuraciones Clave

- **tsconfig.json**: Strict mode habilitado
- **vitest.config.ts**: Coverage threshold 80%
- **eslint.config.js**: No any, max complexity 10

---

## 5. Mejoras sobre el Original

### 5.1 Errores Estructurados

**Antes:**

```typescript
throw new Error('Error al desencriptar');
```

**Ahora:**

```typescript
throw new WalletError('DECRYPT_FAILED', 'Password incorrecto. Verifica e intenta nuevamente', {
  walletId,
  suggestion: 'Si olvidaste tu password, usa el mnemonic guardado',
});
```

### 5.2 Validación Robusta

**Antes:** Validaciones manuales dispersas

**Ahora:** Schemas Zod centralizados en `src/types/tools.ts`

### 5.3 Types Documentados

**TSDoc completo** en todos los tipos públicos con:

- Descripción del tipo
- Explicación de cada campo
- Ejemplos de uso
- Links a documentación relevante

### 5.4 Configuración Validada

**Config con Zod** en vez de variables de entorno directas:

```typescript
const ConfigSchema = z.object({
  walletsDir: z.string().default(path.join(os.homedir(), '.bsv-wallets')),
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
  facilitatorUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
```

---

## 6. Plan de Implementación por Fases

### FASE 0: Setup del Proyecto (2-3h)

- Inicializar package.json
- Configurar TypeScript, Vitest, ESLint, Prettier
- Crear estructura de directorios
- Crear constitution.md
- Crear README.md base
- **Entregable**: Proyecto compila, tests corren

### FASE 1: Core Wallet (6-8h)

- Types + Schemas Zod (`src/types/`)
- Crypto: encryptWif, decryptWif (`src/wallet/crypto.ts`)
- Storage: saveWallet, loadWallet (`src/wallet/storage.ts`)
- WalletManager: createWallet, importWallet, loadWallet (`src/wallet/manager.ts`)
- Tool: manage_wallets (`src/tools/manage-wallets.ts`)
- **Entregable**: manage_wallets 100% funcional

### FASE 2: BSV Integration (6-8h)

- Network Client: WhatsOnChain API (`src/bsv/network-client.ts`)
- Transaction Builder: P2PKH (`src/bsv/transaction-builder.ts`)
- Message Signer (`src/bsv/message-signer.ts`)
- Tool: get_balance (`src/tools/get-balance.ts`)
- Tool: sign_message (`src/tools/sign-message.ts`)
- **Entregable**: get_balance y sign_message funcionales

### FASE 3: X402 Payment (5-6h)

- Payment Creator: Base64 payloads (`src/x402/payment-creator.ts`)
- Facilitator Client (opcional) (`src/x402/facilitator-client.ts`)
- Tool: create_x402_payment (`src/tools/create-x402-payment.ts`)
- **Entregable**: create_x402_payment funcional

### FASE 4: Transaction History (3-4h)

- Transaction History: WhatsOnChain (`src/bsv/transaction-history.ts`)
- Tool: list_transactions (`src/tools/list-transactions.ts`)
- **Entregable**: list_transactions funcional

### FASE 5: MCP Server Integration (2-3h)

- Config: Zod validation (`src/config.ts`)
- Utils: logger, errors, i18n (`src/utils/`)
- Server: Registro de tools (`src/server.ts`)
- Index: Entry point (`src/index.ts`)
- **Entregable**: Servidor MCP completo

### FASE 6: Testing & QA (4-5h)

- Tests unitarios (>80% coverage)
- Tests de integración (flujos completos)
- Tests manuales con Claude Desktop
- Linting y formatting
- **Entregable**: Suite de tests completa

### FASE 7: Documentación Final (3-4h)

- README.md completo
- ARCHITECTURE.md con diagramas
- EXAMPLES.md (10+ ejemplos)
- API.md (referencia completa)
- ACCESSIBILITY.md (guía)
- CONTRIBUTING.md
- **Entregable**: Documentación lista

### FASE 8: Deploy & Polish (2-3h)

- Setup script para Claude Desktop
- CHANGELOG.md
- Tag v1.0.0
- **Entregable**: Proyecto listo para usuarios

**Tiempo total estimado**: 33-44 horas (8-11 días a 4h/día)

---

## 7. Archivos Críticos

### Top 5 Archivos Más Importantes

1. **`.specify/memory/constitution.md`**
   - Define estándares de accesibilidad NO NEGOCIABLES
   - Sin esto, el proyecto pierde su propósito fundamental

2. **`src/types/tools.ts`**
   - Schemas Zod de los 5 tools
   - Contrato de API con Claude Desktop
   - Determina calidad de mensajes de error

3. **`src/wallet/manager.ts`**
   - Núcleo de la lógica de negocio
   - Usado por 4 de 5 tools
   - Determina seguridad y usabilidad

4. **`src/server.ts`**
   - Registro de tools MCP
   - Handler de requests
   - Manejo de errores a nivel servidor

5. **`src/utils/i18n.ts`**
   - Centraliza TODOS los mensajes en español
   - Crucial para consistencia de accesibilidad
   - Facilita mantenimiento y traducciones

---

## 8. Consideraciones Especiales

### Windows (Bash)

- El proyecto debe funcionar en Git Bash o WSL
- Usar rutas compatibles con Windows
- Testar permisos de archivos (chmod)

### Testing Manual

- No hay tests automatizados de accesibilidad web (no hay UI)
- Documentar cómo testear manualmente con screen readers
- Proveer checklist de accesibilidad

### Compatibilidad con Original

- Mantener los mismos 5 tools
- API backward-compatible
- Migration guide para usuarios del mcp-wallet original

---

## 9. Próximos Pasos

1. **Aprobar este plan** con el usuario
2. **Comenzar con Fase 0** (Setup del Proyecto)
3. **Ejecutar fases secuencialmente** para garantizar calidad incremental
4. **Testear cada fase** antes de avanzar a la siguiente
5. **Documentar decisiones** durante la implementación

---

## 10. Criterios de Éxito

### 10.1 Funcionalidad Core
- ✅ Servidor MCP funcional con 5 tools
- ✅ Cobertura de tests >80%
- ✅ Zero warnings en linting y compilación
- ✅ Ejemplos funcionan en Claude Desktop

### 10.2 Accesibilidad (Estrategia LLM-First)
- ✅ **Metadata accesible en todos los responses** (plainLanguage, explanation, stepByStep, hints)
- ✅ WCAG 2.1 Level AA cumplido en documentación y mensajes
- ✅ Todos los mensajes en español claros y descriptivos
- ✅ Interface `AccessibleResponse<T>` implementada en todos los tools
- ✅ Errores son accionables (qué pasó + cómo resolver + hints)
- ✅ `cognitiveLevel` especificado en responses complejos
- ✅ `audioFriendly: true` en todos los mensajes importantes

### 10.3 Documentación
- ✅ TSDoc completo en tipos públicos
- ✅ README permite setup en <5 minutos
- ✅ Constitution.md define estándares obligatorios
- ✅ ACCESSIBILITY.md explica estrategia LLM-first
- ✅ Ejemplos demuestran interpretación accesible por LLMs

### 10.4 Innovación (Diferenciador del Hackathon)
- ✅ **Facilitador X402 genera metadata accesible universal**
- ✅ Compatible con cualquier cliente LLM (Claude, ChatGPT, etc.)
- ✅ Accesibilidad conversacional sin programación de UI
- ✅ Arquitectura escalable a otros facilitadores X402

---

## 11. Pitch para el Hackathon

### El Problema
Los pagos en blockchain son técnicamente complejos y **excluyen a personas con discapacidades** cognitivas, visuales o de otro tipo. Las interfaces tradicionales requieren entender conceptos como "satoshis", "transacciones firmadas", "direcciones BSV", etc.

### Nuestra Solución
**MCP Wallet Accesible**: Un servidor MCP que integra pagos BSV con el protocolo X402, diseñado con **accesibilidad universal desde el núcleo**.

### La Innovación Clave
🔥 **No programamos UIs accesibles → Generamos metadata accesible que los LLMs interpretan automáticamente**

Cuando un usuario con discapacidad cognitiva interactúa con Claude Desktop:

```
Usuario: "No entiendo qué pasó con mi pago"

Claude (interpretando nuestra metadata accesible):
"No te preocupes, todo está bien. Te explico paso a paso:

1️⃣ Enviaste tu micropago en BSV
2️⃣ Lo verificamos con la red blockchain
3️⃣ El monto y la dirección coinciden perfectamente
4️⃣ Ya puedes continuar

¿Quieres que te ayude con el siguiente paso?"
```

**Esto sucede automáticamente** porque nuestro facilitador BSV devuelve:

```json
{
  "accessibility": {
    "plainLanguage": "El pago se verificó correctamente",
    "stepByStep": ["1. ...", "2. ...", "3. ...", "4. ..."],
    "hints": { "ifError": "..." },
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Impacto
✅ **Universal**: Funciona con cualquier cliente LLM (Claude, ChatGPT, futuros agentes)
✅ **Sin fricción**: Los desarrolladores no necesitan aprender sobre accesibilidad web
✅ **Escalable**: Cualquier facilitador X402 puede adoptar nuestra metadata
✅ **Real**: Cumple WCAG 2.1 Level AA en mensajes y documentación
✅ **Social**: Democratiza el acceso a pagos blockchain

### Diferenciadores Técnicos
1. **Estrategia LLM-First**: Aprovechamos que los LLMs ya tienen TTS, simplificación, traducción
2. **Metadata estructurada**: Interface TypeScript `AccessibleResponse<T>` reutilizable
3. **Protocolo X402**: Integramos micropagos HTTP-native con accesibilidad
4. **BSV**: Micropagos de baja latencia y bajo costo
5. **Open Source**: Código, documentación y estándares públicos

### Llamado a la Acción
"Hemos construido la primera wallet blockchain accesible diseñada para **la era de los agentes LLM**. Cualquier persona, independientemente de sus capacidades, puede gestionar pagos BSV conversando con Claude o ChatGPT."
