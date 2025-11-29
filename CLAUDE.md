# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

X402 BSV facilitator with universal accessibility features. This is a Cloudflare Workers service that implements the X402 payment protocol for Bitcoin SV, designed specifically for users with cognitive and visual disabilities. It validates and broadcasts BSV transactions while providing accessible metadata in Spanish optimized for LLM clients (Claude Desktop, ChatGPT) and TTS compatibility.

**Key Components:**
- **Facilitator** (`src/facilitator/`): Main X402 payment facilitator with accessible metadata
- **Resource Server** (`src/resource-server/`): Demo server showing X402 payment-protected endpoints
- **Accessibility Layer**: AI-powered metadata generation with KV caching and template fallback

## Development Commands

### Quick Start
```bash
npm install                      # Install dependencies
npm run dev                      # Start facilitator (localhost:8787)
npm run dev:resource            # Start resource server (localhost:8788)
```

### Testing
```bash
npm test                         # Run all tests
npm run test:watch              # Watch mode for development
npm run test:coverage           # Generate coverage report (requires 80% threshold)
npm run test:resource           # Test resource server with bash script
```

### Code Quality
```bash
npm run lint                    # Check TypeScript and code quality
npm run lint:fix                # Auto-fix linting issues
npm run format                  # Format with Prettier
npm run format:check            # Check formatting without changes
npm run typecheck               # TypeScript type checking only
```

### Deployment
```bash
npm run build                   # Build and dry-run deploy
npm run deploy                  # Deploy facilitator to Cloudflare Workers
npm run deploy:resource         # Deploy resource server to production
```

### Testing Individual Tests
```bash
npx vitest run tests/unit/verify.test.ts                    # Single test file
npx vitest run -t "validates BSV transaction format"        # Specific test case
```

## Architecture

### Accessibility-First Design

All HTTP responses follow the `AccessibleResponse<T>` pattern:
```typescript
{
  data: T,                          // Core response (VerifyResponse, SettleResponse, etc.)
  accessibility: {
    plainLanguage: string,          // ≤100 chars executive summary
    explanation: string,            // ≤300 chars detailed description
    stepByStep: string[],           // ≤5 items, ≤80 chars each
    hints: {
      ifError?: string,             // How to resolve errors
      commonMistakes?: string[],    // Common pitfalls to avoid
      nextSteps?: string            // What to do next
    },
    language: 'es' | 'en',
    audioFriendly: boolean,         // TTS optimization
    cognitiveLevel: 'simple' | 'medium' | 'advanced'
  }
}
```

### AI Metadata Generation

The facilitator uses a hybrid approach for generating accessible metadata:

1. **AI-Powered (Primary)**: OpenAI GPT generates contextual metadata with KV caching
   - Feature flags: `AI_ENABLED`, `AI_ROLLOUT_PERCENTAGE` (gradual rollout 0-100%)
   - Model selection: `gpt-3.5-turbo` for simple/English, `gpt-4o-mini` for complex/Spanish
   - KV cache: 7 days for generic messages, 24 hours for context-specific
   - Timeout: 5 seconds with automatic fallback

2. **Template Fallback**: Static i18n templates when AI fails/disabled
   - Messages centralized in `src/facilitator/accessibility/i18n.ts`
   - Support for Spanish (primary) and English
   - Template-based context substitution

Flow: Check feature flags → Check KV cache → Call OpenAI → Validate → Cache → Fallback to templates on any error

### Request Flow

**Facilitator Endpoints:**
- `GET /` - Health check with supported networks
- `POST /verify` - Validate BSV transaction without broadcast
- `POST /settle` - Broadcast transaction to blockchain

**Resource Server Flow:**
1. Client requests protected endpoint without payment → 402 with PaymentRequirements
2. Client creates BSV transaction and sends X-PAYMENT header
3. Resource server calls facilitator `/verify` to validate
4. Resource server calls facilitator `/settle` to broadcast
5. If successful, return protected resource with payment metadata

### Key Patterns

**Stateless Architecture**: No database or persistent state. All validation done against BSV blockchain via WhatsOnChain API.

**Error Handling**:
- Global error handler in `src/utils/error-handler.ts` sanitizes all errors
- All errors include actionable hints and resolution steps
- Spanish-first with English support via i18n

**Network Support**:
- Development: BSV testnet (`bsv-testnet`)
- Production: BSV mainnet (`bsv-mainnet`)
- Environment configured via `wrangler.toml` env vars

**Type Safety**:
- Zod schemas with custom Spanish error messages (`customErrorMap` in types.ts)
- No `any` types allowed (use `unknown` with type guards)
- Strict TypeScript mode with `noUncheckedIndexedAccess`

## Configuration Files

### wrangler.toml
Defines two environments:
- `development`: Testnet with testnet wallet address, AI enabled at 20% rollout
- `production`: Mainnet with mainnet wallet address, AI enabled at 100% rollout

KV namespace binding `METADATA_CACHE` required for AI caching.

### Environment Variables (Secrets)
```bash
# Required for AI metadata
wrangler secret put OPENAI_API_KEY

# Optional (configured in wrangler.toml)
AI_ENABLED=true
AI_ROLLOUT_PERCENTAGE=100
OPENAI_MODEL_DEFAULT=gpt-4o-mini
OPENAI_MODEL_COMPLEX=gpt-4o-mini
CACHE_TTL_GENERIC=604800        # 7 days
CACHE_TTL_SPECIFIC=86400        # 24 hours
WALLET_ADDRESS=<address>
NETWORK=mainnet|testnet
```

## Code Quality Standards

### TypeScript Configuration (tsconfig.json)
- Strict mode enabled with comprehensive type checking
- Target ES2022 with ESNext modules
- No unchecked indexed access, no implicit returns
- Cloudflare Workers types included

### ESLint Rules (eslint.config.js)
- No `any` types (error level)
- Maximum cyclomatic complexity: 10
- Maximum function length: 100 lines (excluding tests)
- No floating promises, await thenable enforcement
- Console logs only for errors/warnings (info logs use logger.ts)

### Test Coverage (vitest.config.ts)
Required thresholds (enforced):
- Lines: 80%
- Branches: 80%
- Functions: 80%
- Statements: 80%

## Important Implementation Notes

### BSV Transaction Validation
- Uses `@bsv/sdk` for all cryptographic operations
- Network detection via address prefix validation
- Amount validation in satoshis (string format to prevent precision loss)
- Address validation includes checksum verification

### WhatsOnChain Integration
- Client in `src/facilitator/whats-on-chain.ts`
- 10-second timeout per request
- Exponential backoff for broadcast: 1s, 2s, 4s (max 3 attempts)
- Duplicate detection via pre-broadcast txid lookup

### Accessibility Constraints
Character limits are ENFORCED by Zod schemas:
- `plainLanguage`: max 100 characters
- `explanation`: max 300 characters
- `stepByStep`: max 5 items × 80 characters each
- Response size must be <50KB (Cloudflare Workers limit)

### Logging
All logs go to stderr via `src/facilitator/logger.ts` using structured JSON format. Never log sensitive data (WIFs, private keys). Only log public info (txids, addresses, amounts).

## Documentation

Comprehensive specs in `specs/001-facilitador-accesible/`:
- `plan.md` - Architecture and technical decisions
- `quickstart.md` - Setup and first steps
- `data-model.md` - Schemas and data types
- `tasks.md` - Implementation task breakdown

Examples in `docs/EXAMPLES.md` and `src/resource-server/QUICKSTART.md`.

## Testing Approach

**Unit Tests** (`tests/unit/`): Test individual functions in isolation
- Mock external dependencies (WhatsOnChain API, OpenAI)
- Focus on business logic correctness
- Fast execution (<100ms per test)

**Integration Tests** (`tests/integration/`): Test complete request flows
- Mock Workers environment with bindings
- Verify end-to-end behavior
- Include error scenarios and edge cases

Run specific test suites:
```bash
npx vitest run tests/unit/                    # All unit tests
npx vitest run tests/integration/             # All integration tests
npx vitest run tests/unit/accessibility/      # Accessibility unit tests
```
