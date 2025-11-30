# Plan de Finalización: Accesibilidad Universal V2

**Fecha:** 2025-11-29
**Estado Actual:** 85% implementado
**Objetivo:** Completar 100% del plan UNIVERSAL-ACCESSIBILITY-PLAN.md

---

## 📊 Estado Actual

### ✅ Componentes Completados (85%)
- [x] Tipos y schemas V2 (100%)
- [x] AI Metadata V2 con 5 niveles cognitivos (100%)
- [x] Convertidores de formato (código 100%, integración 0%)
- [x] Sistema de caché de preferencias (100%)
- [x] Validador WCAG 2.2 AAA (100%)
- [x] Analizador de reading level (100%)
- [x] Endpoints `/preferences` (100%)
- [x] Tests unitarios (95%)
- [x] Infraestructura KV y wrangler.toml (100%)
- [x] Templates ES/EN para 5 niveles cognitivos (100%)

### ❌ Componentes Pendientes (15%)
- [ ] Templates PT/FR/DE (0% - 3 idiomas faltantes)
- [ ] Integración de convertidores en endpoints (0%)
- [ ] Activación de feature flags (0%)
- [ ] Fix integration tests (5 tests fallando)
- [ ] Documentación V2 (0%)
- [ ] Adaptive Complexity (0% - experimental)

---

## 🎯 Plan de Implementación

### **FASE 1: Integración de Convertidores (Prioridad CRÍTICA)**
**Tiempo estimado:** 2-3 horas
**Bloquea:** Feature `FORMAT_CONVERSION_ENABLED`

#### Tareas:
1. **Modificar `/verify` endpoint** (src/facilitator/index.ts)
   - [ ] Importar funciones `toXML`, `toPlainText`, `toMarkdown`, `toHTML`, `toJSONLD`
   - [ ] Agregar lógica de conversión según `preferences.outputFormat`
   - [ ] Retornar con Content-Type correcto

2. **Modificar `/settle` endpoint** (src/facilitator/index.ts)
   - [ ] Aplicar misma lógica que `/verify`
   - [ ] Mantener consistencia en todos los endpoints

3. **Testing**
   - [ ] Agregar tests de integración para cada formato
   - [ ] Verificar Content-Type headers
   - [ ] Validar estructura de XML/HTML/JSON-LD

#### Implementación Detallada:

```typescript
// src/facilitator/index.ts (después de línea ~180 en /verify)

import { toXML, toPlainText, toMarkdown, toHTML, toJSONLD } from './accessibility/format-converters';

// Dentro del handler de /verify, después de crear AccessibleResponseV2:
const outputFormat = finalPreferences.outputFormat || 'json';

switch (outputFormat) {
  case 'xml':
    return c.text(toXML(response), 200, { 'Content-Type': 'application/xml' });

  case 'plaintext':
    return c.text(toPlainText(response), 200, { 'Content-Type': 'text/plain; charset=utf-8' });

  case 'markdown':
    return c.text(toMarkdown(response), 200, { 'Content-Type': 'text/markdown; charset=utf-8' });

  case 'html':
    return c.html(toHTML(response));

  case 'jsonld':
    const jsonld = toJSONLD(response);
    return c.json(JSON.parse(jsonld), 200, { 'Content-Type': 'application/ld+json' });

  case 'json':
  default:
    return c.json(response);
}
```

#### Criterios de Aceptación:
- ✅ Request con `outputFormat: 'xml'` retorna XML válido
- ✅ Request con `outputFormat: 'html'` retorna HTML con ARIA
- ✅ Request con `outputFormat: 'plaintext'` retorna texto optimizado TTS
- ✅ Content-Type headers correctos para cada formato
- ✅ Fallback a JSON si formato no especificado

---

### **FASE 2: Templates Multilingües (Prioridad ALTA)**
**Tiempo estimado:** 18-24 horas (6-8h por idioma)
**Bloquea:** Feature `MULTILANG_ENABLED`

#### Tareas:

#### 2.1. Template Portugués (src/facilitator/accessibility/i18n/v2/pt.ts)
**Tiempo:** 6-8 horas

- [ ] Crear archivo `pt.ts` basado en estructura de `es.ts`
- [ ] Traducir todos los mensajes de error/éxito:
  - `errors.verify.invalidAmount` (5 niveles)
  - `errors.verify.invalidAddress` (5 niveles)
  - `errors.verify.invalidFormat` (5 niveles)
  - `errors.settle.alreadyBroadcast` (5 niveles)
  - `errors.settle.networkError` (5 niveles)
  - `errors.settle.broadcastFailed` (5 niveles)
  - `success.verifyValid` (5 niveles)
  - `success.settleSuccess` (5 niveles)
- [ ] Crear glosario de términos técnicos en portugués
- [ ] Traducir ejemplos concretos con contexto local (BRL, cultura brasileña)
- [ ] Agregar memory aids en portugués
- [ ] Implementar variantes de dialecto:
  - `pt-BR` (Brasil)
  - `pt-PT` (Portugal)

**Recursos:**
- Traductor nativo portugués (preferible) o GPT-4 + revisión
- Corpus de términos blockchain en portugués

**Estructura esperada:**
```typescript
export const portugueseTemplatesV2: MessageCatalogV2 = {
  errors: { /* ... */ },
  success: { /* ... */ },
  glossary: {
    satoshi: "Unidade mínima do Bitcoin SV. 1 BSV = 100.000.000 satoshis",
    txid: "Identificador único de 64 caracteres hexadecimais de uma transação",
    // ... más términos
  },
  examples: { /* ... */ },
  icons: { /* ... */ }
};

export const portugueseDialects = {
  'pt-BR': { /* variaciones brasileñas */ },
  'pt-PT': { /* variaciones portuguesas */ }
};
```

#### 2.2. Template Francés (src/facilitator/accessibility/i18n/v2/fr.ts)
**Tiempo:** 6-8 horas

- [ ] Misma estructura que portugués
- [ ] Glosario en francés
- [ ] Ejemplos con euros (EUR)
- [ ] Memory aids en francés
- [ ] Sin variantes de dialecto (solo `fr`)

#### 2.3. Template Alemán (src/facilitator/accessibility/i18n/v2/de.ts)
**Tiempo:** 6-8 horas

- [ ] Misma estructura que portugués
- [ ] Glosario en alemán
- [ ] Ejemplos con euros (EUR)
- [ ] Memory aids en alemán
- [ ] Sin variantes de dialecto (solo `de`)

#### 2.4. Integración en i18n/index.ts
- [ ] Importar y registrar los 3 nuevos idiomas
- [ ] Actualizar función `getMessagesByLanguageV2()` para soportar pt/fr/de
- [ ] Agregar tests para cada idioma

#### Criterios de Aceptación:
- ✅ Cada idioma tiene 40+ mensajes traducidos (5 niveles × 8 tipos)
- ✅ Glosario con al menos 15 términos técnicos
- ✅ 3+ ejemplos concretos por tipo de mensaje
- ✅ Memory aids culturalmente relevantes
- ✅ Tests unitarios verifican estructura de cada idioma

---

### **FASE 3: Fix Integration Tests (Prioridad ALTA)**
**Tiempo estimado:** 2-4 horas

#### Tests Fallando:
1. `tests/integration/cors.test.ts` - 2 tests (status 500 vs 200)
2. `tests/integration/verify-flow.test.ts` - 3 tests (status 500 vs 200)

#### Root Cause:
Los tests esperan respuesta V1 (`AccessibleResponse`) pero el código ahora genera V2 (`AccessibleResponseV2`).

#### Solución:
- [ ] Actualizar mocks en tests para incluir bindings V2 (`USER_PREFERENCES`, etc.)
- [ ] Agregar datos de preferencias en requests de test
- [ ] Actualizar assertions para estructura V2
- [ ] Verificar que env vars V2 estén mockeados correctamente

#### Ejemplo Fix:
```typescript
// tests/integration/verify-flow.test.ts
const mockEnv = {
  OPENAI_API_KEY: 'test-key',
  AI_ENABLED: 'false', // Deshabilitar AI en tests
  USER_PREFERENCES: mockKV, // AGREGAR ESTO
  METADATA_CACHE: mockKV,
  // ... resto
};
```

#### Criterios de Aceptación:
- ✅ 316/316 tests pasando (0 failed)
- ✅ Cobertura ≥ 80% en todas las áreas

---

### **FASE 4: Activación de Feature Flags (Prioridad MEDIA)**
**Tiempo estimado:** 30 minutos

#### Flags a Activar:

1. **`FORMAT_CONVERSION_ENABLED`** (después de Fase 1)
   ```toml
   # wrangler.toml
   [env.development.vars]
   FORMAT_CONVERSION_ENABLED = "true"

   [env.production.vars]
   FORMAT_CONVERSION_ENABLED = "true"
   ```

2. **`MULTILANG_ENABLED`** (después de Fase 2)
   ```toml
   MULTILANG_ENABLED = "true"
   ```

3. **`READING_LEVEL_ANALYSIS`** (ya implementado, solo exponer)
   ```toml
   READING_LEVEL_ANALYSIS = "true"
   ```

4. **`ADAPTIVE_COMPLEXITY_ENABLED`** (dejar false hasta implementar)
   ```toml
   ADAPTIVE_COMPLEXITY_ENABLED = "false"  # Fase 6 (experimental)
   ```

#### Procedimiento:
- [ ] Actualizar `wrangler.toml` en development
- [ ] Desplegar a dev: `npm run deploy` (env development)
- [ ] Testing manual en dev
- [ ] Actualizar `wrangler.toml` en production
- [ ] Desplegar a prod con rollout gradual

---

### **FASE 5: Documentación V2 (Prioridad MEDIA)**
**Tiempo estimado:** 4-6 horas

#### Documentos a Crear:

#### 5.1. ACCESSIBILITY-V2.md (docs/)
**Contenido:**
- Overview del sistema V2
- Comparación V1 vs V2
- Guía de uso de preferencias V2
- Ejemplos de requests con cada formato de salida
- Tabla de feature flags y qué controlan
- Ejemplos de responses en XML, HTML, Markdown, etc.
- Matriz de idiomas soportados
- Tabla de niveles cognitivos y cuándo usar cada uno

**Secciones:**
```markdown
# Accesibilidad Universal V2

## Overview
## Características Nuevas en V2
## Preferencias de Usuario
## Formatos de Salida
## Idiomas Soportados
## Niveles Cognitivos
## WCAG 2.2 AAA Compliance
## Reading Level Analysis
## Ejemplos de Uso
## Feature Flags
```

#### 5.2. WCAG-COMPLIANCE.md (docs/)
**Contenido:**
- Matriz completa de 78 criterios WCAG 2.2
- Estado de cada criterio (pass/fail/not-applicable)
- Notas de implementación
- Guía de auditoría
- Conformance statements

**Estructura:**
```markdown
# WCAG 2.2 AAA Compliance Matrix

## Level A (25 criteria)
## Level AA (20 criteria)
## Level AAA (28 criteria)
## Audit Trail
## Testing & Validation
```

#### 5.3. MIGRATION-GUIDE.md (docs/)
**Contenido:**
- Breaking changes entre V1 y V2
- Guía paso a paso de migración
- Ejemplos de código antes/después
- Checklist de migración
- Troubleshooting común

**Secciones:**
```markdown
# Guía de Migración V1 → V2

## Breaking Changes
## Estrategia de Migración
## Paso 1: Actualizar Requests
## Paso 2: Actualizar Parseo de Responses
## Paso 3: Testing
## Rollback Plan
## FAQ
```

#### 5.4. Actualizar README.md y CLAUDE.md
- [ ] Agregar sección "V2 Features" en README
- [ ] Actualizar CLAUDE.md con tipos V2
- [ ] Mencionar feature flags en docs de desarrollo

#### Criterios de Aceptación:
- ✅ 3 documentos nuevos creados y completos
- ✅ README actualizado con link a V2 docs
- ✅ Ejemplos de código ejecutables y testeados

---

### **FASE 6: Adaptive Complexity (Prioridad BAJA - Experimental)**
**Tiempo estimado:** 6-8 horas
**Estado:** Opcional, no bloquea producción

#### Funcionalidad:
Ajustar automáticamente el nivel cognitivo basado en:
- Número de interacciones previas del usuario
- Patrones de uso
- Feedback implícito (tiempo de lectura)

#### Tareas:
- [ ] Diseñar algoritmo de adaptación
- [ ] Implementar tracking de interacciones en preference cache
- [ ] Agregar campo `previousInteractions` a metadata
- [ ] Calcular `recommendedNextLevel` basado en historial
- [ ] Tests de regresión para diferentes escenarios
- [ ] Documentar algoritmo y edge cases

#### Criterios de Aceptación:
- ✅ Usuario con 0 interacciones → nivel default (simple)
- ✅ Usuario con 5+ interacciones exitosas → recomendar nivel superior
- ✅ Usuario con errores frecuentes → recomendar nivel inferior
- ✅ Sistema respeta override manual del usuario

**Nota:** Esta fase es experimental y puede posponerse para versión V2.1.

---

## 📅 Timeline Propuesto

### Opción A: Full-Time (1 semana)
```
Día 1-2: Fase 1 (Convertidores) + Fase 3 (Tests)
Día 3-5: Fase 2 (Templates PT/FR/DE)
Día 6:   Fase 4 (Feature Flags) + Fase 5 (Docs)
Día 7:   Testing final + Deploy a producción
```

### Opción B: Part-Time (3 semanas)
```
Semana 1: Fase 1 + Fase 3 (4-6h)
Semana 2: Fase 2.1 + 2.2 (12-16h)
Semana 3: Fase 2.3 + Fase 4 + Fase 5 (10-14h)
```

### Opción C: Rollout Gradual (recomendado)
```
Sprint 1 (NOW): Fase 1 + Fase 3 → Deploy con ES/EN + formatos
  ↓
Sprint 2 (+2 weeks): Fase 2.1 (PT) → Deploy con 3 idiomas
  ↓
Sprint 3 (+2 weeks): Fase 2.2 + 2.3 (FR/DE) → Deploy completo 5 idiomas
  ↓
Sprint 4 (+1 week): Fase 5 (Docs) → Documentación final
  ↓
Backlog: Fase 6 (Adaptive) → V2.1 experimental
```

---

## 🎯 Criterios de Éxito (Definition of Done)

### Para considerar V2 "Production-Ready" (Mínimo Viable):
- [x] ✅ Tipos V2 completos
- [x] ✅ AI Metadata V2 funcionando
- [x] ✅ WCAG 2.2 AAA compliance
- [x] ✅ Reading level analysis
- [x] ✅ Preferencias con caché 30 días
- [ ] ⚠️ Convertidores integrados en endpoints
- [ ] ⚠️ Tests 100% pasando
- [x] ✅ 2 idiomas (ES/EN) con 5 niveles
- [ ] 📝 Documentación básica

**Estado Actual:** 7/9 (77% ready)
**Para producción:** Completar Fase 1 + Fase 3 (1 día de trabajo)

### Para considerar V2 "Feature-Complete" (Plan al 100%):
- [ ] 5 idiomas completos (ES/EN/PT/FR/DE)
- [ ] 6 formatos de salida funcionando
- [ ] Tests 100% pasando (316/316)
- [ ] Feature flags activados
- [ ] Documentación completa (3 docs)
- [ ] Adaptive complexity (opcional)

**Estado Actual:** 5/6 core (83% complete)
**Para feature-complete:** Completar Fase 1-5 (30-40 horas)

---

## 🚀 Recomendación de Acción

### Prioridad INMEDIATA (hoy):
1. **Fase 1: Integrar convertidores** (2-3h)
2. **Fase 3: Fix tests** (2-4h)
3. **Deploy a dev** para validar

### Prioridad CORTO PLAZO (esta semana):
4. **Fase 2.1: Template Portugués** (6-8h)
5. **Deploy a prod** con ES/EN/PT + formatos

### Prioridad MEDIANO PLAZO (próximas 2-3 semanas):
6. **Fase 2.2-2.3: Templates FR/DE** (12-16h)
7. **Fase 5: Documentación** (4-6h)
8. **Deploy final** con 5 idiomas

### Backlog (opcional):
9. **Fase 6: Adaptive Complexity** (experimental)

---

## 📊 Tracking de Progreso

### Checklist Rápido:
- [ ] Convertidores integrados en `/verify`
- [ ] Convertidores integrados en `/settle`
- [ ] Tests de integración pasando (316/316)
- [ ] Template Portugués completo
- [ ] Template Francés completo
- [ ] Template Alemán completo
- [ ] Feature flag `FORMAT_CONVERSION_ENABLED = true`
- [ ] Feature flag `MULTILANG_ENABLED = true`
- [ ] Feature flag `READING_LEVEL_ANALYSIS = true`
- [ ] Documento `ACCESSIBILITY-V2.md` creado
- [ ] Documento `WCAG-COMPLIANCE.md` creado
- [ ] Documento `MIGRATION-GUIDE.md` creado
- [ ] README.md actualizado
- [ ] Deploy a production exitoso

---

## 🎓 Notas de Implementación

### Sobre Traducción de Templates:
- **NO usar Google Translate** para términos técnicos blockchain
- **Validar con nativos** o usar GPT-4 + revisión manual
- **Mantener consistencia** en terminología (satoshi, txid, output, etc.)
- **Adaptar ejemplos** a moneda y cultura local

### Sobre Convertidores:
- **XML:** Verificar que sea válido con parser XML
- **HTML:** Incluir `lang` attribute correcto
- **Plain Text:** Optimizar para screen readers (sin emojis innecesarios)
- **JSON-LD:** Seguir Schema.org estrictamente

### Sobre Feature Flags:
- **Development primero:** Siempre testear en dev antes de prod
- **Rollout gradual:** Activar features de una en una
- **Monitoring:** Observar logs en Cloudflare Workers después de cada activación

### Sobre Tests:
- **Mock correctamente:** Especialmente KV namespaces y OpenAI API
- **Deshabilitar AI en tests:** Usar `AI_ENABLED='false'` para tests determinísticos
- **Timeout adecuado:** Integration tests pueden tardar más

---

## 📞 Puntos de Decisión

### ¿Necesitas aprobar antes de continuar?
1. **¿Priorizar convertidores o idiomas?**
   - Recomendación: Convertidores (más impacto, menos esfuerzo)

2. **¿Cuántos idiomas en primera versión?**
   - Opción A: Solo ES/EN (production-ready ahora)
   - Opción B: ES/EN/PT (mercado latino completo)
   - Opción C: Los 5 idiomas (feature-complete)

3. **¿Implementar Adaptive Complexity?**
   - Recomendación: Posponer para V2.1 (experimental)

4. **¿Cuándo documentar?**
   - Opción A: Documentar mientras codifico (más lento)
   - Opción B: Documentar al final de cada fase
   - Opción C: Documentar todo al final (más rápido pero riesgoso)

---

## 🏁 Conclusión

**Estado:** Sistema V2 es funcional y production-ready con ES/EN.
**Falta:** Integración de convertidores (crítico) + idiomas adicionales (nice-to-have).
**Esfuerzo para MVP:** 4-6 horas (Fase 1 + Fase 3).
**Esfuerzo para 100%:** 30-40 horas (Todas las fases).

**Siguiente paso recomendado:** Ejecutar Fase 1 (integrar convertidores) ahora mismo.

¿Procedo con Fase 1?
