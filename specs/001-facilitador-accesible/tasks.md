# Tasks: Facilitador X402 BSV con Accesibilidad Universal

**Feature Branch**: `001-facilitador-accesible`
**Input**: Design documents from `/specs/001-facilitador-accesible/`
**Prerequisites**: spec.md, plan.md, data-model.md, research.md, quickstart.md, contracts/openapi.yaml

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] TID [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure: src/facilitator/, tests/unit/, tests/integration/, docs/
- [X] T002 Initialize package.json with dependencies: hono@4.0+, @bsv/sdk@1.0+, zod@3.22+, @hono/zod-validator@0.4+
- [X] T003 [P] Initialize package.json devDependencies: vitest@2.1+, @vitest/coverage-v8, typescript@5.6+, eslint@9, prettier@3.4+
- [X] T004 [P] Create tsconfig.json with strict mode enabled (strict: true, noUncheckedIndexedAccess: true, target: ES2022)
- [X] T005 [P] Create wrangler.toml for Cloudflare Workers (compatibility_date: 2024-11-01, nodejs_compat_v2 flag)
- [X] T006 [P] Create eslint.config.js with flat config and @typescript-eslint/eslint-plugin@8
- [X] T007 [P] Create .prettierrc with project formatting rules
- [X] T008 [P] Create vitest.config.ts with coverage thresholds (lines: 80%, branches: 80%, functions: 80%)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create src/facilitator/types.ts with Zod schemas: PaymentRequirementsSchema, PaymentPayloadSchema, AccessibleMetadataSchema, HintsSchema
- [X] T010 Define TypeScript types in src/facilitator/types.ts: PaymentRequirements, PaymentPayload, AccessibleMetadata, Hints, AccessibleResponse<T>
- [X] T011 Create src/facilitator/types.ts error code constants: VerifyErrorCodes (invalid_format, invalid_amount, invalid_address)
- [X] T012 Create src/facilitator/types.ts error code constants: SettleErrorCodes (broadcast_failed, already_broadcast, network_error)
- [X] T013 Configure Zod customErrorMap in src/facilitator/types.ts for Spanish error messages
- [X] T014 [P] Create src/facilitator/logger.ts with structured JSON logging to stderr (levels: info, warn, error)
- [X] T015 [P] Create src/facilitator/accessibility/i18n.ts with centralized Spanish messages (errors.verify, errors.settle, success)
- [X] T016 Create src/facilitator/accessibility/metadata.ts with helper: createAccessibleResponse<T>(data, metadata)
- [X] T017 Create src/facilitator/accessibility/metadata.ts with helper: buildMetadata(type, context) for constructing AccessibleMetadata
- [X] T018 Create src/facilitator/whats-on-chain.ts with retry configuration: RetryConfig (maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000)
- [X] T019 Implement getBackoffDelay(attempt, config) in src/facilitator/whats-on-chain.ts for exponential backoff (1s, 2s, 4s)
- [X] T020 Implement fetchWithTimeout(url, options) in src/facilitator/whats-on-chain.ts with 10 second timeout using AbortController
- [X] T021 Implement isAlreadyBroadcast(errorMessage) in src/facilitator/whats-on-chain.ts to detect duplicate transaction errors

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Verificar Pago BSV con Metadata Accesible (Priority: P1) 🎯 MVP

**Goal**: Validar transacciones BSV sin broadcast y retornar metadata accesible completa

**Independent Test**: POST /verify con transacción válida debe retornar isValid: true con metadata en español claro

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [P] [US1] Create tests/unit/verify.test.ts with test: valid transaction returns isValid true with simple cognitiveLevel
- [X] T023 [P] [US1] Add test to tests/unit/verify.test.ts: invalid amount returns isValid false with invalid_amount error code
- [X] T024 [P] [US1] Add test to tests/unit/verify.test.ts: invalid address returns isValid false with invalid_address error code
- [X] T025 [P] [US1] Add test to tests/unit/verify.test.ts: invalid format returns isValid false with invalid_format error code
- [X] T026 [P] [US1] Add test to tests/unit/verify.test.ts: metadata has all required fields (plainLanguage, explanation, stepByStep, hints, language, audioFriendly, cognitiveLevel)
- [X] T027 [P] [US1] Add test to tests/unit/verify.test.ts: plainLanguage is ≤100 chars
- [X] T028 [P] [US1] Add test to tests/unit/verify.test.ts: explanation is ≤300 chars
- [X] T029 [P] [US1] Add test to tests/unit/verify.test.ts: stepByStep has ≤5 items, each ≤80 chars
- [X] T030 [P] [US1] Create tests/integration/verify-flow.test.ts with test: POST /verify endpoint returns 200 with AccessibleResponse structure
- [X] T031 [P] [US1] Add test to tests/integration/verify-flow.test.ts: POST /verify with mainnet address returns error with clear Spanish explanation
- [X] T032 [P] [US1] Add test to tests/integration/verify-flow.test.ts: POST /verify with invalid Zod schema returns 400 with Spanish validation message

### Implementation for User Story 1

- [X] T033 [US1] Create src/facilitator/verify.ts with function: validateBsvAddress(address, requireTestnet) using @bsv/sdk Address.fromString()
- [X] T034 [US1] Implement isP2PKHToAddress(output, address) in src/facilitator/verify.ts to check if output pays to specific address
- [X] T035 [US1] Implement extractPayerAddress(tx) in src/facilitator/verify.ts to extract payer address from transaction inputs
- [X] T036 [US1] Implement verifyTransaction(payload, requirements) in src/facilitator/verify.ts: validate format, amount, address
- [X] T037 [US1] Add messages to src/facilitator/accessibility/i18n.ts: errors.verify.invalidAmount with all metadata fields
- [X] T038 [US1] Add messages to src/facilitator/accessibility/i18n.ts: errors.verify.invalidAddress with all metadata fields
- [X] T039 [US1] Add messages to src/facilitator/accessibility/i18n.ts: errors.verify.invalidFormat with all metadata fields
- [X] T040 [US1] Add messages to src/facilitator/accessibility/i18n.ts: success.verifyValid with all metadata fields
- [X] T041 [US1] Create src/facilitator/types.ts schemas: VerifyRequestSchema, VerifyResponseSchema with Zod validation
- [X] T042 [US1] Create POST /verify endpoint in src/facilitator/index.ts using Hono with @hono/zod-validator middleware
- [X] T043 [US1] Implement /verify handler in src/facilitator/index.ts: call verifyTransaction(), wrap in AccessibleResponse<VerifyResponse>
- [X] T044 [US1] Add error handling in /verify endpoint to return 400 with Spanish Zod validation errors
- [X] T045 [US1] Add logging in verify.ts for validation results (log txid, isValid, invalidReason to stderr)

**Checkpoint**: At this point, User Story 1 should be fully functional - POST /verify validates transactions with accessible metadata

---

## Phase 4: User Story 2 - Broadcast con Explicación Accesible (Priority: P1) 🎯 MVP

**Goal**: Realizar broadcast de transacciones a blockchain BSV con metadata paso a paso accesible

**Independent Test**: POST /settle con transacción válida debe broadcastear a BSV testnet y retornar txid con metadata

### Tests for User Story 2

- [X] T046 [P] [US2] Create tests/unit/settle.test.ts with test: successful broadcast returns success true with txid and simple cognitiveLevel
- [X] T047 [P] [US2] Add test to tests/unit/settle.test.ts: already broadcast transaction returns success false with already_broadcast error code
- [X] T048 [P] [US2] Add test to tests/unit/settle.test.ts: network timeout returns success false with network_error and medium cognitiveLevel
- [X] T049 [P] [US2] Add test to tests/unit/settle.test.ts: broadcast rejected by blockchain returns success false with broadcast_failed error code
- [X] T050 [P] [US2] Add test to tests/unit/settle.test.ts: metadata includes stepByStep explaining broadcast process
- [X] T051 [P] [US2] Add test to tests/unit/settle.test.ts: audioFriendly is true for all settle responses
- [X] T052 [P] [US2] Create tests/unit/whats-on-chain.test.ts with test: getTransaction() returns found: true if txid exists
- [X] T053 [P] [US2] Add test to tests/unit/whats-on-chain.test.ts: broadcastTransaction() retries 3 times with exponential backoff on network error
- [X] T054 [P] [US2] Add test to tests/unit/whats-on-chain.test.ts: isAlreadyBroadcast() detects all duplicate transaction error patterns
- [X] T055 [P] [US2] Create tests/integration/settle-flow.test.ts with test: POST /settle endpoint broadcasts to testnet and returns 200 with txid
- [X] T056 [P] [US2] Add test to tests/integration/settle-flow.test.ts: POST /settle with duplicate tx returns already_broadcast with original txid
- [X] T057 [P] [US2] Add test to tests/integration/settle-flow.test.ts: POST /settle handles WhatsOnChain API downtime gracefully with network_error

### Implementation for User Story 2

- [X] T058 [US2] Implement getTransaction(txid) in src/facilitator/whats-on-chain.ts: GET /tx/{txid}/hex to check if tx exists
- [X] T059 [US2] Implement broadcastTransaction(txHex) in src/facilitator/whats-on-chain.ts: POST /tx/raw with retry logic and timeout
- [X] T060 [US2] Create src/facilitator/settle.ts with function: settleTransaction(payload, requirements) that calls broadcastTransaction()
- [X] T061 [US2] Implement duplicate detection in settle.ts: call getTransaction() before broadcast, return already_broadcast if found
- [X] T062 [US2] Add error handling in settle.ts: catch network errors, detect already_broadcast from error message, retry on transient failures
- [X] T063 [US2] Add messages to src/facilitator/accessibility/i18n.ts: success.settleSuccess with stepByStep explaining broadcast process
- [X] T064 [US2] Add messages to src/facilitator/accessibility/i18n.ts: errors.settle.alreadyBroadcast with simple cognitiveLevel
- [X] T065 [US2] Add messages to src/facilitator/accessibility/i18n.ts: errors.settle.networkError with medium cognitiveLevel and troubleshooting hints
- [X] T066 [US2] Add messages to src/facilitator/accessibility/i18n.ts: errors.settle.broadcastFailed with medium cognitiveLevel
- [X] T067 [US2] Create src/facilitator/types.ts schemas: SettleRequestSchema, SettleResponseSchema with Zod validation
- [X] T068 [US2] Create POST /settle endpoint in src/facilitator/index.ts using Hono with @hono/zod-validator middleware
- [X] T069 [US2] Implement /settle handler in src/facilitator/index.ts: call settleTransaction(), wrap in AccessibleResponse<SettleResponse>
- [X] T070 [US2] Add logging in settle.ts for broadcast results (log txid, success, errorReason, network to stderr)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - full verify + settle flow functional

---

## Phase 5: User Story 3 - Consultar Redes Soportadas (Priority: P2)

**Goal**: Proporcionar endpoint informativo de redes soportadas con metadata accesible

**Independent Test**: GET / debe retornar networks: ["bsv-testnet"] con metadata explicando testnet vs mainnet

### Tests for User Story 3

- [X] T071 [P] [US3] Create tests/integration/supported-networks.test.ts with test: GET / returns 200 with networks array
- [X] T072 [P] [US3] Add test to tests/integration/supported-networks.test.ts: GET / response includes bsv-testnet in networks array
- [X] T073 [P] [US3] Add test to tests/integration/supported-networks.test.ts: GET / metadata has simple cognitiveLevel
- [X] T074 [P] [US3] Add test to tests/integration/supported-networks.test.ts: GET / metadata explains difference between testnet and mainnet

### Implementation for User Story 3

- [X] T075 [US3] Add messages to src/facilitator/accessibility/i18n.ts: success.supportedNetworks explaining testnet vs mainnet in Spanish
- [X] T076 [US3] Create src/facilitator/types.ts schema: SupportedNetworksResponseSchema with Zod validation
- [X] T077 [US3] Create GET / endpoint in src/facilitator/index.ts returning networks: ["bsv-testnet"]
- [X] T078 [US3] Wrap GET / response in AccessibleResponse<SupportedNetworksResponse> with metadata from i18n

**Checkpoint**: All user stories (US1, US2, US3) should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deployment

- [X] T079 [P] Create tests/unit/accessibility/metadata.test.ts with tests for createAccessibleResponse() and buildMetadata() helpers
- [X] T080 [P] Create tests/unit/accessibility/i18n.test.ts with tests validating all messages: length limits, Spanish language, no jargon
- [X] T081 [P] Add test to tests/unit/accessibility/i18n.test.ts: verify all plainLanguage messages are ≤100 chars
- [X] T082 [P] Add test to tests/unit/accessibility/i18n.test.ts: verify all explanation messages are ≤300 chars
- [X] T083 [P] Add test to tests/unit/accessibility/i18n.test.ts: verify all stepByStep arrays have ≤5 items, each ≤80 chars
- [X] T084 [P] Create tests/integration/error-handling.test.ts with tests for Zod validation errors, 500 errors, network failures
- [X] T085 [P] Add global error handler in src/facilitator/index.ts to catch unhandled errors and return 500 with Spanish error message
- [X] T086 [P] Add CORS middleware in src/facilitator/index.ts to allow requests from LLM clients (Claude Desktop, ChatGPT)
- [X] T087 [P] Create docs/EXAMPLES.md with complete usage examples: verify flow, settle flow, error handling, integration with Claude Desktop
- [X] T088 [P] Add API examples to docs/EXAMPLES.md: curl commands for /verify, /settle, / with real transaction hex
- [X] T089 Run npm test to verify all tests pass with >80% coverage (lines, branches, functions, statements)
- [X] T090 Run npm run lint to verify ESLint passes with no errors (strict rules, no `any` types)
- [X] T091 Run npm run format to ensure consistent code formatting with Prettier
- [ ] T092 Validate quickstart.md: follow setup instructions end-to-end and verify facilitator starts on localhost:8787
- [X] T093 Manual accessibility validation: verify all error messages in i18n.ts are in clear Spanish without jargon
- [X] T094 Manual accessibility validation: verify all metadata includes actionable hints (ifError, commonMistakes, nextSteps)
- [ ] T095 Performance testing: verify /verify responds in <200ms p95 (run 100 requests locally)
- [ ] T096 Performance testing: verify /settle responds in <2s p95 including mock WhatsOnChain broadcast
- [X] T097 Security review: verify no WIFs or private keys are logged in logger.ts (only txids and addresses)
- [ ] T098 Deploy to Cloudflare Workers: run npm run deploy and verify production URL is accessible
- [ ] T099 Smoke test production: POST /verify to production URL with test transaction and verify response
- [ ] T100 Smoke test production: GET / to production URL and verify health check returns bsv-testnet

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independent broadcast logic)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (simple health endpoint)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (T022-T032 before T033-T045 for US1)
- Types and schemas before business logic (T041 before T036 for US1)
- Business logic before endpoints (T036 before T042 for US1)
- i18n messages before endpoint handlers (T037-T040 before T043 for US1)
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks T001-T008 can run in parallel (different config files)
- Foundational tasks: T009-T013 (types), T014 (logger), T015-T017 (accessibility), T018-T021 (WhatsOnChain) can run in parallel
- Within US1 tests: T022-T029 (unit tests) and T030-T032 (integration tests) can run in parallel
- Within US1 implementation: T037-T040 (i18n messages) can run in parallel with T033-T036 (business logic)
- Within US2 tests: T046-T051 (settle tests), T052-T054 (WhatsOnChain tests), T055-T057 (integration tests) can run in parallel
- Within US2 implementation: T063-T066 (i18n messages) can run in parallel with T058-T062 (business logic)
- Within US3: T071-T074 (tests) can run in parallel with T075-T076 (messages + schema)
- Polish phase: T079-T088 (tests and docs) can all run in parallel
- Once Foundational phase completes, all user stories (US1, US2, US3) can start in parallel by different team members

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T021) - CRITICAL blocker
3. Complete Phase 3: User Story 1 (T022-T045) - Verify functionality
4. Complete Phase 4: User Story 2 (T046-T070) - Settle functionality
5. **STOP and VALIDATE**: Test /verify + /settle flow end-to-end
6. Deploy MVP with US1 + US2 to production

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001-T021)
2. Add User Story 1 → Test independently → Deploy/Demo (T022-T045) - Verify works
3. Add User Story 2 → Test independently → Deploy/Demo (T046-T070) - Full payment flow works
4. Add User Story 3 → Test independently → Deploy/Demo (T071-T078) - Health endpoint ready
5. Polish and production hardening (T079-T100)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T021)
2. Once Foundational is done:
   - Developer A: User Story 1 (T022-T045) - Verify endpoint
   - Developer B: User Story 2 (T046-T070) - Settle endpoint
   - Developer C: User Story 3 (T071-T078) - Health endpoint
3. Stories complete and integrate independently
4. Team collaborates on Polish phase (T079-T100)

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [US1], [US2], [US3] labels map tasks to specific user stories for traceability
- Each user story should be independently completable and testable
- **CRITICAL**: Write tests FIRST, verify they FAIL, then implement to make them PASS
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All metadata MUST include: plainLanguage, explanation, stepByStep, hints, language: "es", audioFriendly, cognitiveLevel
- All error messages MUST be in clear Spanish without blockchain jargon
- All file paths are absolute relative to repository root
- Total tasks: 100 (Setup: 8, Foundational: 13, US1: 24, US2: 25, US3: 8, Polish: 22)
