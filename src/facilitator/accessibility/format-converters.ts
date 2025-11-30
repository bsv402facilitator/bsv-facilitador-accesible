/**
 * Format Converters for AccessibleResponseV2
 *
 * Converts JSON responses to multiple accessible formats:
 * - XML (with valid schema)
 * - Plain Text (TTS/Braille optimized)
 * - Markdown (human readable)
 * - HTML (with ARIA and semantic markup)
 * - JSON-LD (Schema.org for structured data)
 * - Braille optimization utilities
 */

import type { AccessibleResponseV2, UniversalAccessibilityMetadataV2 } from '../types';

// ==================== JSON → XML ====================

export function toXML(response: AccessibleResponseV2<unknown>): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const root = buildXMLElement('AccessibleResponse', [
    buildXMLElement('Data', [xmlEscape(JSON.stringify(response.data))]),
    accessibilityToXML(response.accessibility),
    wcagToXML(response.wcag),
  ]);

  return `${xmlHeader}\n${root}`;
}

function accessibilityToXML(meta: UniversalAccessibilityMetadataV2): string {
  return buildXMLElement('Accessibility', [
    // Content
    buildXMLElement('Content', [
      buildXMLElement('PlainLanguage', [xmlEscape(meta.content.plainLanguage)]),
      buildXMLElement('Explanation', [xmlEscape(meta.content.explanation)]),
      meta.content.detailedExplanation
        ? buildXMLElement('DetailedExplanation', [xmlEscape(meta.content.detailedExplanation)])
        : '',
      buildXMLElement('StepByStep', meta.content.stepByStep.map((step) =>
        buildXMLElement('Step', [
          buildXMLElement('Text', [xmlEscape(step.text)]),
          step.icon ? buildXMLElement('Icon', [xmlEscape(step.icon)]) : '',
          step.context ? buildXMLElement('Context', [xmlEscape(step.context)]) : '',
          step.estimatedTime ? buildXMLElement('EstimatedTime', [xmlEscape(step.estimatedTime)]) : '',
        ])
      )),
      buildXMLElement('Hints', [
        meta.content.hints.ifError
          ? buildXMLElement('IfError', [xmlEscape(meta.content.hints.ifError)])
          : '',
        meta.content.hints.commonMistakes
          ? buildXMLElement('CommonMistakes', meta.content.hints.commonMistakes.map((m) =>
            buildXMLElement('Mistake', [xmlEscape(m)])
          ))
          : '',
        meta.content.hints.nextSteps
          ? buildXMLElement('NextSteps', [xmlEscape(meta.content.hints.nextSteps)])
          : '',
        meta.content.hints.troubleshooting
          ? buildXMLElement('Troubleshooting', [xmlEscape(meta.content.hints.troubleshooting)])
          : '',
        meta.content.hints.relatedResources
          ? buildXMLElement('RelatedResources', meta.content.hints.relatedResources.map((r) =>
            buildXMLElement('Resource', [
              buildXMLElement('Title', [xmlEscape(r.title)]),
              buildXMLElement('URL', [xmlEscape(r.url)]),
              buildXMLElement('Type', [xmlEscape(r.type)]),
            ])
          ))
          : '',
        meta.content.hints.safeguards
          ? buildXMLElement('Safeguards', meta.content.hints.safeguards.map((s) =>
            buildXMLElement('Safeguard', [xmlEscape(s)])
          ))
          : '',
      ]),
      meta.content.glossary
        ? buildXMLElement('Glossary', Object.entries(meta.content.glossary).map(([term, def]) =>
          buildXMLElement('Term', [
            buildXMLElement('Name', [xmlEscape(term)]),
            buildXMLElement('Definition', [xmlEscape(def)]),
          ])
        ))
        : '',
      meta.content.examples
        ? buildXMLElement('Examples', meta.content.examples.map((ex) =>
          buildXMLElement('Example', [
            buildXMLElement('Scenario', [xmlEscape(ex.scenario)]),
            buildXMLElement('Input', [xmlEscape(ex.input)]),
            buildXMLElement('Output', [xmlEscape(ex.output)]),
            buildXMLElement('ExplanationText', [xmlEscape(ex.explanation)]),
          ])
        ))
        : '',
    ]),

    // Visual
    buildXMLElement('Visual', [
      buildXMLElement('ContrastMode', [xmlEscape(meta.visual.contrastMode)]),
      buildXMLElement('ColorBlindSafe', [String(meta.visual.colorBlindSafe)]),
      meta.visual.colorBlindType
        ? buildXMLElement('ColorBlindType', [xmlEscape(meta.visual.colorBlindType)])
        : '',
      buildXMLElement('FontSize', [xmlEscape(meta.visual.fontSize)]),
      buildXMLElement('ScreenReaderOptimized', [String(meta.visual.screenReaderOptimized)]),
      buildXMLElement('DarkMode', [String(meta.visual.darkMode)]),
      buildXMLElement('AltTextProvided', [String(meta.visual.altTextProvided)]),
    ]),

    // Cognitive
    buildXMLElement('Cognitive', [
      buildXMLElement('Level', [xmlEscape(meta.cognitive.level)]),
      buildXMLElement('ReadingLevel', [
        buildXMLElement('FleschKincaidGrade', [String(meta.cognitive.readingLevel.fleschKincaidGrade)]),
        buildXMLElement('FleschReadingEase', [String(meta.cognitive.readingLevel.fleschReadingEase)]),
        buildXMLElement('EstimatedReadingTime', [xmlEscape(meta.cognitive.readingLevel.estimatedReadingTime)]),
      ]),
      buildXMLElement('MemoryAids', meta.cognitive.memoryAids.map((aid) =>
        buildXMLElement('Aid', [xmlEscape(aid)])
      )),
      buildXMLElement('Checkpoints', meta.cognitive.checkpoints.map((cp) =>
        buildXMLElement('Checkpoint', [
          buildXMLElement('Question', [xmlEscape(cp.question)]),
          buildXMLElement('ExpectedAnswer', [xmlEscape(cp.expectedAnswer)]),
          cp.hint ? buildXMLElement('Hint', [xmlEscape(cp.hint)]) : '',
        ])
      )),
      buildXMLElement('AbstractionLevel', [xmlEscape(meta.cognitive.abstractionLevel)]),
      buildXMLElement('IconSupport', [String(meta.cognitive.iconSupport)]),
    ]),

    // Language
    buildXMLElement('Language', [
      buildXMLElement('Code', [xmlEscape(meta.language.code)]),
      meta.language.dialect
        ? buildXMLElement('Dialect', [xmlEscape(meta.language.dialect)])
        : '',
      buildXMLElement('Direction', [xmlEscape(meta.language.direction)]),
      buildXMLElement('Locale', [xmlEscape(meta.language.locale)]),
      meta.language.culturalContext
        ? buildXMLElement('CulturalContext', [xmlEscape(meta.language.culturalContext)])
        : '',
    ]),

    // Motor
    buildXMLElement('Motor', [
      buildXMLElement('KeyboardNavigationHints', meta.motor.keyboardNavigationHints.map((h) =>
        buildXMLElement('Hint', [xmlEscape(h)])
      )),
      buildXMLElement('VoiceCommandHints', meta.motor.voiceCommandHints.map((h) =>
        buildXMLElement('Hint', [xmlEscape(h)])
      )),
      buildXMLElement('TimingAdjustable', [String(meta.motor.timingAdjustable)]),
      meta.motor.focusOrder
        ? buildXMLElement('FocusOrder', meta.motor.focusOrder.map((idx) =>
          buildXMLElement('Index', [String(idx)])
        ))
        : '',
    ]),

    // Format
    buildXMLElement('Format', [
      buildXMLElement('AvailableFormats', meta.format.availableFormats.map((fmt) =>
        buildXMLElement('FormatType', [xmlEscape(fmt)])
      )),
      buildXMLElement('CurrentFormat', [xmlEscape(meta.format.currentFormat)]),
      buildXMLElement('BrailleOptimized', [String(meta.format.brailleOptimized)]),
      buildXMLElement('SemanticMarkup', [String(meta.format.semanticMarkup)]),
    ]),

    // Personalization
    buildXMLElement('Personalization', [
      buildXMLElement('UserPreferencesApplied', [String(meta.personalization.userPreferencesApplied)]),
      buildXMLElement('AdaptiveComplexity', [String(meta.personalization.adaptiveComplexity)]),
      meta.personalization.previousInteractions !== undefined
        ? buildXMLElement('PreviousInteractions', [String(meta.personalization.previousInteractions)])
        : '',
      meta.personalization.recommendedNextLevel
        ? buildXMLElement('RecommendedNextLevel', [xmlEscape(meta.personalization.recommendedNextLevel)])
        : '',
    ]),

    // Metadata
    buildXMLElement('Metadata', [
      buildXMLElement('AudioFriendly', [String(meta.metadata.audioFriendly)]),
      buildXMLElement('Version', [String(meta.metadata.version)]),
      buildXMLElement('GeneratedBy', [xmlEscape(meta.metadata.generatedBy)]),
      buildXMLElement('GeneratedAt', [xmlEscape(meta.metadata.generatedAt)]),
      buildXMLElement('CacheHit', [String(meta.metadata.cacheHit)]),
    ]),
  ]);
}

function wcagToXML(wcag: AccessibleResponseV2<unknown>['wcag']): string {
  return buildXMLElement('WCAG', [
    buildXMLElement('Version', [xmlEscape(wcag.version)]),
    buildXMLElement('Level', [xmlEscape(wcag.level)]),
    buildXMLElement('SuccessCriteria', wcag.successCriteria.map((sc) =>
      buildXMLElement('Criterion', [
        buildXMLElement('ID', [xmlEscape(sc.id)]),
        buildXMLElement('Name', [xmlEscape(sc.name)]),
        buildXMLElement('CriterionLevel', [xmlEscape(sc.level)]),
        buildXMLElement('Status', [xmlEscape(sc.status)]),
        sc.notes ? buildXMLElement('Notes', [xmlEscape(sc.notes)]) : '',
      ])
    )),
    buildXMLElement('ConformanceStatement', [xmlEscape(wcag.conformanceStatement)]),
    buildXMLElement('AuditTrail', [
      buildXMLElement('CriteriaChecked', wcag.auditTrail.criteriaChecked.map((id) =>
        buildXMLElement('CriterionID', [xmlEscape(id)])
      )),
      buildXMLElement('CriteriaPass', wcag.auditTrail.criteriaPass.map((id) =>
        buildXMLElement('CriterionID', [xmlEscape(id)])
      )),
      buildXMLElement('CriteriaNotApplicable', wcag.auditTrail.criteriaNotApplicable.map((id) =>
        buildXMLElement('CriterionID', [xmlEscape(id)])
      )),
    ]),
  ]);
}

function buildXMLElement(tag: string, children: (string | string[])[]): string {
  const flatChildren = children.flat().filter((c) => c.length > 0);
  if (flatChildren.length === 0) return '';

  const content = flatChildren.join('\n');

  // If content is a single line without XML tags, keep it inline
  if (flatChildren.length === 1 && !flatChildren[0].includes('<')) {
    return `<${tag}>${content}</${tag}>`;
  }

  // Otherwise, format with newlines for readability
  return `<${tag}>\n${content}\n</${tag}>`;
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== JSON → Plain Text ====================

export function toPlainText(response: AccessibleResponseV2<unknown>): string {
  const meta = response.accessibility;
  const sections: string[] = [];

  // Title and summary
  sections.push('=== RESPUESTA ACCESIBLE ===\n');
  sections.push(`RESUMEN: ${meta.content.plainLanguage}\n`);
  sections.push(`EXPLICACIÓN: ${meta.content.explanation}\n`);

  if (meta.content.detailedExplanation) {
    sections.push(`DETALLES: ${meta.content.detailedExplanation}\n`);
  }

  // Steps
  if (meta.content.stepByStep.length > 0) {
    sections.push('PASOS A SEGUIR:');
    meta.content.stepByStep.forEach((step, idx) => {
      const stepText = step.icon ? `${step.icon} ${step.text}` : step.text;
      sections.push(`${idx + 1}. ${stepText}`);
      if (step.context) {
        sections.push(`   Contexto: ${step.context}`);
      }
      if (step.estimatedTime) {
        sections.push(`   Tiempo: ${step.estimatedTime}`);
      }
    });
    sections.push('');
  }

  // Hints
  if (meta.content.hints.ifError) {
    sections.push(`SI HAY ERROR: ${meta.content.hints.ifError}\n`);
  }

  if (meta.content.hints.commonMistakes && meta.content.hints.commonMistakes.length > 0) {
    sections.push('ERRORES COMUNES:');
    meta.content.hints.commonMistakes.forEach((mistake) => {
      sections.push(`- ${mistake}`);
    });
    sections.push('');
  }

  if (meta.content.hints.safeguards && meta.content.hints.safeguards.length > 0) {
    sections.push('QUÉ NO HACER:');
    meta.content.hints.safeguards.forEach((safeguard) => {
      sections.push(`- ${safeguard}`);
    });
    sections.push('');
  }

  if (meta.content.hints.nextSteps) {
    sections.push(`PRÓXIMOS PASOS: ${meta.content.hints.nextSteps}\n`);
  }

  // Glossary
  if (meta.content.glossary && Object.keys(meta.content.glossary).length > 0) {
    sections.push('GLOSARIO:');
    Object.entries(meta.content.glossary).forEach(([term, definition]) => {
      sections.push(`- ${term}: ${definition}`);
    });
    sections.push('');
  }

  // Examples
  if (meta.content.examples && meta.content.examples.length > 0) {
    sections.push('EJEMPLOS:');
    meta.content.examples.forEach((example, idx) => {
      sections.push(`${idx + 1}. ${example.scenario}`);
      sections.push(`   Entrada: ${example.input}`);
      sections.push(`   Salida: ${example.output}`);
      sections.push(`   Explicación: ${example.explanation}`);
    });
    sections.push('');
  }

  // Memory aids
  if (meta.cognitive.memoryAids.length > 0) {
    sections.push('AYUDAS DE MEMORIA:');
    meta.cognitive.memoryAids.forEach((aid) => {
      sections.push(`- ${aid}`);
    });
    sections.push('');
  }

  // Data
  sections.push('=== DATOS DE LA RESPUESTA ===');
  sections.push(JSON.stringify(response.data, null, 2));
  sections.push('');

  // Metadata footer
  sections.push('=== INFORMACIÓN DE ACCESIBILIDAD ===');
  sections.push(`Idioma: ${meta.language.code.toUpperCase()}`);
  sections.push(`Nivel cognitivo: ${meta.cognitive.level}`);
  sections.push(`Nivel de lectura: Grado ${meta.cognitive.readingLevel.fleschKincaidGrade}`);
  sections.push(`Tiempo de lectura: ${meta.cognitive.readingLevel.estimatedReadingTime}`);
  sections.push(`Optimizado para audio: ${meta.metadata.audioFriendly ? 'Sí' : 'No'}`);
  sections.push(`WCAG 2.2: ${response.wcag.level}`);
  sections.push(`Generado: ${meta.metadata.generatedAt}`);

  return sections.join('\n');
}

// ==================== JSON → Markdown ====================

export function toMarkdown(response: AccessibleResponseV2<unknown>): string {
  const meta = response.accessibility;
  const sections: string[] = [];

  // Title
  sections.push('# Respuesta Accesible\n');

  // Summary
  sections.push('## Resumen\n');
  sections.push(`**${meta.content.plainLanguage}**\n`);
  sections.push(`${meta.content.explanation}\n`);

  if (meta.content.detailedExplanation) {
    sections.push('## Explicación Detallada\n');
    sections.push(`${meta.content.detailedExplanation}\n`);
  }

  // Steps
  if (meta.content.stepByStep.length > 0) {
    sections.push('## Pasos a Seguir\n');
    meta.content.stepByStep.forEach((step, idx) => {
      const stepText = step.icon ? `${step.icon} ${step.text}` : step.text;
      sections.push(`${idx + 1}. **${stepText}**`);
      if (step.context) {
        sections.push(`   - *Contexto:* ${step.context}`);
      }
      if (step.estimatedTime) {
        sections.push(`   - *Tiempo:* ${step.estimatedTime}`);
      }
    });
    sections.push('');
  }

  // Hints
  if (meta.content.hints.ifError || meta.content.hints.commonMistakes || meta.content.hints.nextSteps) {
    sections.push('## Ayuda\n');

    if (meta.content.hints.ifError) {
      sections.push(`**Si hay error:** ${meta.content.hints.ifError}\n`);
    }

    if (meta.content.hints.commonMistakes && meta.content.hints.commonMistakes.length > 0) {
      sections.push('**Errores comunes:**');
      meta.content.hints.commonMistakes.forEach((mistake) => {
        sections.push(`- ${mistake}`);
      });
      sections.push('');
    }

    if (meta.content.hints.safeguards && meta.content.hints.safeguards.length > 0) {
      sections.push('**Qué NO hacer:**');
      meta.content.hints.safeguards.forEach((safeguard) => {
        sections.push(`- ${safeguard}`);
      });
      sections.push('');
    }

    if (meta.content.hints.nextSteps) {
      sections.push(`**Próximos pasos:** ${meta.content.hints.nextSteps}\n`);
    }

    if (meta.content.hints.troubleshooting) {
      sections.push(`**Diagnóstico:** ${meta.content.hints.troubleshooting}\n`);
    }
  }

  // Glossary
  if (meta.content.glossary && Object.keys(meta.content.glossary).length > 0) {
    sections.push('## Glosario\n');
    Object.entries(meta.content.glossary).forEach(([term, definition]) => {
      sections.push(`- **${term}:** ${definition}`);
    });
    sections.push('');
  }

  // Examples
  if (meta.content.examples && meta.content.examples.length > 0) {
    sections.push('## Ejemplos\n');
    meta.content.examples.forEach((example, idx) => {
      sections.push(`### ${idx + 1}. ${example.scenario}\n`);
      sections.push(`- **Entrada:** ${example.input}`);
      sections.push(`- **Salida:** ${example.output}`);
      sections.push(`- **Explicación:** ${example.explanation}\n`);
    });
  }

  // Memory aids
  if (meta.cognitive.memoryAids.length > 0) {
    sections.push('## Ayudas de Memoria\n');
    meta.cognitive.memoryAids.forEach((aid) => {
      sections.push(`- ${aid}`);
    });
    sections.push('');
  }

  // Data
  sections.push('## Datos de la Respuesta\n');
  sections.push('```json');
  sections.push(JSON.stringify(response.data, null, 2));
  sections.push('```\n');

  // Footer
  sections.push('---\n');
  sections.push('### Información de Accesibilidad\n');
  sections.push(`- **Idioma:** ${meta.language.code.toUpperCase()}`);
  sections.push(`- **Nivel cognitivo:** ${meta.cognitive.level}`);
  sections.push(`- **Nivel de lectura:** Grado ${meta.cognitive.readingLevel.fleschKincaidGrade} (${meta.cognitive.readingLevel.estimatedReadingTime})`);
  sections.push(`- **WCAG 2.2:** ${response.wcag.level} - ${response.wcag.conformanceStatement}`);
  sections.push(`- **Generado:** ${meta.metadata.generatedAt}`);

  return sections.join('\n');
}

// ==================== JSON → HTML ====================

export function toHTML(response: AccessibleResponseV2<unknown>): string {
  const meta = response.accessibility;
  const sections: string[] = [];

  // HTML Header with WCAG metadata
  sections.push('<!DOCTYPE html>');
  sections.push(`<html lang="${meta.language.code}" dir="${meta.language.direction}">`);
  sections.push('<head>');
  sections.push('<meta charset="UTF-8">');
  sections.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  sections.push('<title>Respuesta Accesible</title>');
  sections.push('<style>');
  sections.push('  body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }');
  sections.push(`  body { font-size: ${getFontSizeCSS(meta.visual.fontSize)}; }`);
  sections.push(`  body { ${meta.visual.darkMode ? 'background-color: #1a1a1a; color: #f0f0f0;' : 'background-color: #fff; color: #333;'} }`);
  sections.push('  h1, h2, h3 { margin-top: 1.5em; }');
  sections.push('  .summary { font-size: 1.2em; font-weight: bold; margin: 1em 0; }');
  sections.push('  .steps { counter-reset: step-counter; list-style: none; padding-left: 0; }');
  sections.push('  .steps li { counter-increment: step-counter; margin: 0.5em 0; }');
  sections.push('  .steps li::before { content: counter(step-counter) ". "; font-weight: bold; }');
  sections.push('  .glossary dt { font-weight: bold; margin-top: 0.5em; }');
  sections.push('  .glossary dd { margin-left: 2em; }');
  sections.push('  .metadata { border-top: 2px solid #ccc; padding-top: 1em; margin-top: 2em; font-size: 0.9em; color: #666; }');
  sections.push('</style>');
  sections.push('</head>');
  sections.push('<body>');

  // Main content
  sections.push('<main role="main" aria-label="Contenido principal">');

  // Summary
  sections.push('<section aria-labelledby="summary-heading">');
  sections.push('<h1 id="summary-heading">Respuesta Accesible</h1>');
  sections.push(`<p class="summary" aria-live="polite">${htmlEscape(meta.content.plainLanguage)}</p>`);
  sections.push(`<p>${htmlEscape(meta.content.explanation)}</p>`);
  if (meta.content.detailedExplanation) {
    sections.push(`<p>${htmlEscape(meta.content.detailedExplanation)}</p>`);
  }
  sections.push('</section>');

  // Steps
  if (meta.content.stepByStep.length > 0) {
    sections.push('<section aria-labelledby="steps-heading">');
    sections.push('<h2 id="steps-heading">Pasos a Seguir</h2>');
    sections.push('<ol class="steps" role="list">');
    meta.content.stepByStep.forEach((step) => {
      const stepText = step.icon ? `<span aria-hidden="true">${htmlEscape(step.icon)}</span> ${htmlEscape(step.text)}` : htmlEscape(step.text);
      sections.push(`<li role="listitem">${stepText}`);
      if (step.context) {
        sections.push(`<br><small><em>Contexto: ${htmlEscape(step.context)}</em></small>`);
      }
      if (step.estimatedTime) {
        sections.push(`<br><small><em>Tiempo: ${htmlEscape(step.estimatedTime)}</em></small>`);
      }
      sections.push('</li>');
    });
    sections.push('</ol>');
    sections.push('</section>');
  }

  // Hints
  if (meta.content.hints.ifError || meta.content.hints.commonMistakes) {
    sections.push('<section aria-labelledby="hints-heading">');
    sections.push('<h2 id="hints-heading">Ayuda</h2>');

    if (meta.content.hints.ifError) {
      sections.push(`<p><strong>Si hay error:</strong> ${htmlEscape(meta.content.hints.ifError)}</p>`);
    }

    if (meta.content.hints.commonMistakes && meta.content.hints.commonMistakes.length > 0) {
      sections.push('<h3>Errores comunes:</h3>');
      sections.push('<ul role="list">');
      meta.content.hints.commonMistakes.forEach((mistake) => {
        sections.push(`<li role="listitem">${htmlEscape(mistake)}</li>`);
      });
      sections.push('</ul>');
    }

    if (meta.content.hints.safeguards && meta.content.hints.safeguards.length > 0) {
      sections.push('<h3>Qué NO hacer:</h3>');
      sections.push('<ul role="list">');
      meta.content.hints.safeguards.forEach((safeguard) => {
        sections.push(`<li role="listitem">${htmlEscape(safeguard)}</li>`);
      });
      sections.push('</ul>');
    }

    sections.push('</section>');
  }

  // Glossary
  if (meta.content.glossary && Object.keys(meta.content.glossary).length > 0) {
    sections.push('<section aria-labelledby="glossary-heading">');
    sections.push('<h2 id="glossary-heading">Glosario</h2>');
    sections.push('<dl class="glossary">');
    Object.entries(meta.content.glossary).forEach(([term, definition]) => {
      sections.push(`<dt>${htmlEscape(term)}</dt>`);
      sections.push(`<dd>${htmlEscape(definition)}</dd>`);
    });
    sections.push('</dl>');
    sections.push('</section>');
  }

  // Data
  sections.push('<section aria-labelledby="data-heading">');
  sections.push('<h2 id="data-heading">Datos de la Respuesta</h2>');
  sections.push('<pre><code>');
  sections.push(htmlEscape(JSON.stringify(response.data, null, 2)));
  sections.push('</code></pre>');
  sections.push('</section>');

  sections.push('</main>');

  // Footer with metadata
  sections.push('<footer class="metadata" role="contentinfo">');
  sections.push('<h3>Información de Accesibilidad</h3>');
  sections.push('<ul>');
  sections.push(`<li>Idioma: ${meta.language.code.toUpperCase()}</li>`);
  sections.push(`<li>Nivel cognitivo: ${meta.cognitive.level}</li>`);
  sections.push(`<li>Nivel de lectura: Grado ${meta.cognitive.readingLevel.fleschKincaidGrade}</li>`);
  sections.push(`<li>WCAG 2.2: ${response.wcag.level} - ${htmlEscape(response.wcag.conformanceStatement)}</li>`);
  sections.push(`<li>Generado: ${meta.metadata.generatedAt}</li>`);
  sections.push('</ul>');
  sections.push('</footer>');

  sections.push('</body>');
  sections.push('</html>');

  return sections.join('\n');
}

function htmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFontSizeCSS(size: string): string {
  const sizeMap: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
    'x-large': '20px',
  };
  return sizeMap[size] || '16px';
}

// ==================== JSON → JSON-LD ====================

export function toJSONLD(response: AccessibleResponseV2<unknown>): string {
  const meta = response.accessibility;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Action',
    name: meta.content.plainLanguage,
    description: meta.content.explanation,
    actionStatus: 'CompletedActionStatus',
    startTime: meta.metadata.generatedAt,
    result: {
      '@type': 'Thing',
      name: 'Accessible Response',
      description: meta.content.explanation,
      ...(response.data && typeof response.data === 'object' ? response.data : {}),
    },
    ...(meta.content.stepByStep.length > 0 && {
      step: meta.content.stepByStep.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: step.text,
        text: step.context || step.text,
        ...(step.estimatedTime && { estimatedTime: step.estimatedTime }),
      })),
    }),
    inLanguage: {
      '@type': 'Language',
      name: meta.language.code,
      ...(meta.language.dialect && { alternateName: meta.language.dialect }),
    },
    accessMode: ['textual', ...(meta.metadata.audioFriendly ? ['auditory'] : [])],
    accessModeSufficient: 'textual',
    accessibilityAPI: 'ARIA',
    accessibilityControl: ['fullKeyboardControl', 'fullMouseControl', ...(meta.motor.voiceCommandHints.length > 0 ? ['voiceControl'] : [])],
    accessibilityFeature: [
      'structuralNavigation',
      'readingOrder',
      ...(meta.content.glossary ? ['glossary'] : []),
      ...(meta.visual.altTextProvided ? ['alternativeText'] : []),
      ...(meta.visual.screenReaderOptimized ? ['screenReader'] : []),
    ],
    accessibilityHazard: 'noFlashingHazard',
    accessibilitySummary: `WCAG 2.2 ${response.wcag.level} - ${response.wcag.conformanceStatement}`,
  };

  return JSON.stringify(jsonld, null, 2);
}

// ==================== Braille Optimization ====================

export function optimizeForBraille(text: string): string {
  let optimized = text;

  // Remove emojis (not representable in Braille)
  // Cover all Unicode emoji ranges
  optimized = optimized.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '');

  // Expand common abbreviations
  const expansions: Record<string, string> = {
    'ej.': 'ejemplo',
    'etc.': 'etcétera',
    'Dr.': 'Doctor',
    'Dra.': 'Doctora',
    'Sr.': 'Señor',
    'Sra.': 'Señora',
    'pág.': 'página',
    'págs.': 'páginas',
    'aprox.': 'aproximadamente',
    'max.': 'máximo',
    'min.': 'mínimo',
    'BSV': 'Bitcoin SV',
    'TXID': 'identificador de transacción',
    'WIF': 'formato de importación de billetera',
  };

  Object.entries(expansions).forEach(([abbr, expansion]) => {
    // For abbreviations with dots, use word boundary before and space/punctuation after
    // For words without dots (BSV, TXID, WIF), use strict word boundaries
    if (abbr.includes('.')) {
      const regex = new RegExp(`\\b${abbr.replace(/\./g, '\\.')}(?=\\s|$)`, 'g');
      optimized = optimized.replace(regex, expansion);
    } else {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      optimized = optimized.replace(regex, expansion);
    }
  });

  // Remove special characters not representable in Braille Grade 2
  optimized = optimized.replace(/[★☆♦◆●○▪▫■□]/g, '');

  // Normalize quotes
  optimized = optimized.replace(/[""]/g, '"');
  optimized = optimized.replace(/['']/g, "'");

  // Normalize dashes
  optimized = optimized.replace(/[—–]/g, '-');

  // Remove excessive whitespace
  optimized = optimized.replace(/\s+/g, ' ').trim();

  return optimized;
}

// ==================== V3 FORMAT CONVERTERS ====================

import type {
  AccessibleResponseV3,
  ContentSectionV3,
  CognitiveLevelV3,
} from '../types';

/**
 * Convert V3 response to XML format
 */
export function toXMLV3(response: AccessibleResponseV3<unknown>): string {
  const meta = response.accessibility;
  const primaryLang = Object.keys(meta.languages)[0] || 'es';
  const langContent = meta.languages[primaryLang];
  const simpleContent = langContent?.byLevel.simple;

  if (!simpleContent) {
    throw new Error('No simple level content found for XML conversion');
  }

  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const root = buildXMLElement('AccessibleResponseV3', [
    buildXMLElement('Data', [xmlEscape(JSON.stringify(response.data))]),
    buildXMLElement('Content', [
      buildXMLElement('PlainLanguage', [xmlEscape(simpleContent.plainLanguage)]),
      buildXMLElement('Explanation', [xmlEscape(simpleContent.explanation)]),
      buildXMLElement('Steps', simpleContent.stepByStep.map((s) =>
        buildXMLElement('Step', [
          s.icon ? buildXMLElement('Icon', [xmlEscape(s.icon)]) : '',
          buildXMLElement('Text', [xmlEscape(s.text)]),
          s.status ? buildXMLElement('Status', [xmlEscape(s.status)]) : '',
        ])
      )),
    ]),
    buildXMLElement('Languages', Object.entries(meta.languages).map(([code, _]) =>
      buildXMLElement('Language', [buildXMLElement('Code', [code])])
    )),
    buildXMLElement('Metadata', [
      buildXMLElement('Version', [String(meta.metadata.version)]),
      buildXMLElement('GeneratedBy', [xmlEscape(meta.metadata.generatedBy)]),
      buildXMLElement('WCAGLevel', [xmlEscape(meta.metadata.wcagLevel)]),
    ]),
  ]);

  return `${xmlHeader}\n${root}`;
}

/**
 * Convert V3 response to Markdown format
 */
export function toMarkdownV3(response: AccessibleResponseV3<unknown>): string {
  const meta = response.accessibility;
  const primaryLang = Object.keys(meta.languages)[0] || 'es';
  const langContent = meta.languages[primaryLang];
  const simpleContent = langContent?.byLevel.simple;

  if (!simpleContent) {
    throw new Error('No simple level content found for Markdown conversion');
  }

  let md = `# ${simpleContent.plainLanguage}\n\n`;
  md += `${simpleContent.explanation}\n\n`;

  if (simpleContent.detailedExplanation) {
    md += `## Explicación Detallada\n\n${simpleContent.detailedExplanation}\n\n`;
  }

  if (simpleContent.stepByStep.length) {
    md += `## Pasos\n\n`;
    simpleContent.stepByStep.forEach((s, i) => {
      md += `${i + 1}. ${s.icon || ''} ${s.text}`;
      if (s.status) {
        md += ` _(${s.status})_`;
      }
      md += '\n';
    });
    md += '\n';
  }

  if (simpleContent.glossary && Object.keys(simpleContent.glossary).length) {
    md += `## Glosario\n\n`;
    Object.entries(simpleContent.glossary).forEach(([term, def]) => {
      md += `- **${term}**: ${def}\n`;
    });
    md += '\n';
  }

  if (simpleContent.hints?.nextSteps) {
    md += `## Siguiente Paso\n\n${simpleContent.hints.nextSteps}\n`;
  }

  return md;
}

/**
 * Convert V3 response to Plain Text format
 */
export function toPlainTextV3(response: AccessibleResponseV3<unknown>): string {
  const meta = response.accessibility;
  const primaryLang = Object.keys(meta.languages)[0] || 'es';
  const langContent = meta.languages[primaryLang];
  const simpleContent = langContent?.byLevel.simple;

  if (!simpleContent) {
    throw new Error('No simple level content found for Plain Text conversion');
  }

  const sections: string[] = [];

  sections.push('=== RESPUESTA ACCESIBLE V3 ===\n');
  sections.push(`RESUMEN: ${simpleContent.plainLanguage}\n`);
  sections.push(`EXPLICACIÓN: ${simpleContent.explanation}\n`);

  if (simpleContent.detailedExplanation) {
    sections.push(`DETALLES: ${simpleContent.detailedExplanation}\n`);
  }

  if (simpleContent.stepByStep.length > 0) {
    sections.push('PASOS:');
    simpleContent.stepByStep.forEach((step, idx) => {
      const stepText = step.icon ? `${step.icon} ${step.text}` : step.text;
      sections.push(`${idx + 1}. ${stepText}`);
    });
    sections.push('');
  }

  if (simpleContent.hints?.ifError) {
    sections.push(`SI HAY ERROR: ${simpleContent.hints.ifError}\n`);
  }

  if (simpleContent.glossary && Object.keys(simpleContent.glossary).length > 0) {
    sections.push('GLOSARIO:');
    Object.entries(simpleContent.glossary).forEach(([term, definition]) => {
      sections.push(`- ${term}: ${definition}`);
    });
    sections.push('');
  }

  sections.push('=== DATOS ===');
  sections.push(JSON.stringify(response.data, null, 2));
  sections.push('');

  sections.push(`Generado: ${meta.metadata.generatedAt}`);
  sections.push(`WCAG: ${meta.metadata.wcagLevel}`);

  return sections.join('\n');
}

/**
 * Convert V3 response to HTML format
 */
export function toHTMLV3(response: AccessibleResponseV3<unknown>): string {
  const meta = response.accessibility;
  const primaryLang = Object.keys(meta.languages)[0] || 'es';
  const langContent = meta.languages[primaryLang];
  const simpleContent = langContent?.byLevel.simple;

  if (!simpleContent) {
    throw new Error('No simple level content found for HTML conversion');
  }

  const sections: string[] = [];

  sections.push('<!DOCTYPE html>');
  sections.push(`<html lang="${primaryLang}">`);
  sections.push('<head>');
  sections.push('<meta charset="UTF-8">');
  sections.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  sections.push('<title>Respuesta Accesible V3</title>');
  sections.push('<style>');
  sections.push('  body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }');
  sections.push('  h1 { color: #333; }');
  sections.push('  .summary { font-size: 1.2em; font-weight: bold; margin: 1em 0; }');
  sections.push('  .steps { list-style: none; padding-left: 0; }');
  sections.push('  .steps li { margin: 0.5em 0; }');
  sections.push('</style>');
  sections.push('</head>');
  sections.push('<body>');

  sections.push('<main role="main">');
  sections.push(`<h1>${htmlEscape(simpleContent.plainLanguage)}</h1>`);
  sections.push(`<p class="summary">${htmlEscape(simpleContent.explanation)}</p>`);

  if (simpleContent.stepByStep.length > 0) {
    sections.push('<h2>Pasos</h2>');
    sections.push('<ol class="steps">');
    simpleContent.stepByStep.forEach((step) => {
      const stepText = step.icon
        ? `<span aria-hidden="true">${htmlEscape(step.icon)}</span> ${htmlEscape(step.text)}`
        : htmlEscape(step.text);
      sections.push(`<li>${stepText}</li>`);
    });
    sections.push('</ol>');
  }

  if (simpleContent.glossary && Object.keys(simpleContent.glossary).length > 0) {
    sections.push('<h2>Glosario</h2>');
    sections.push('<dl>');
    Object.entries(simpleContent.glossary).forEach(([term, definition]) => {
      sections.push(`<dt>${htmlEscape(term)}</dt>`);
      sections.push(`<dd>${htmlEscape(definition)}</dd>`);
    });
    sections.push('</dl>');
  }

  sections.push('</main>');
  sections.push('</body>');
  sections.push('</html>');

  return sections.join('\n');
}

/**
 * Convert V3 response to SSML (Speech Synthesis Markup Language)
 */
export function toSSMLV3(response: AccessibleResponseV3<unknown>): string {
  const meta = response.accessibility;
  const primaryLang = Object.keys(meta.languages)[0] || 'es';
  const langContent = meta.languages[primaryLang];
  const simpleContent = langContent?.byLevel.simple;

  if (!simpleContent) {
    throw new Error('No simple level content found for SSML conversion');
  }

  let ssml = `<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${primaryLang}">`;

  // Main summary with slower rate for clarity
  ssml += `<prosody rate="slow">${simpleContent.plainLanguage}</prosody>`;
  ssml += '<break time="500ms"/>';

  // Explanation
  ssml += `<p>${simpleContent.explanation}</p>`;
  ssml += '<break time="1s"/>';

  // Steps with pauses
  if (simpleContent.stepByStep.length > 0) {
    ssml += '<p>Pasos a seguir:</p>';
    simpleContent.stepByStep.forEach((step, idx) => {
      // Remove emoji icons from TTS (they don't read well)
      const textWithoutEmoji = step.text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
      ssml += `<s>Paso ${idx + 1}: ${textWithoutEmoji}</s>`;
      ssml += '<break time="500ms"/>';
    });
  }

  ssml += '</speak>';

  return ssml;
}

/**
 * Optimize text for Braille V3
 */
export function optimizeForBrailleV3(content: ContentSectionV3, level: CognitiveLevelV3 = 'simple'): string {
  const levelContent = content.byLevel[level];
  if (!levelContent) return '';

  let text = `${levelContent.plainLanguage}. ${levelContent.explanation}`;

  if (levelContent.stepByStep.length > 0) {
    text += ' Pasos: ';
    levelContent.stepByStep.forEach((step, idx) => {
      // Remove emojis for Braille
      const textWithoutEmoji = step.text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '');
      text += `${idx + 1}. ${textWithoutEmoji}. `;
    });
  }

  return optimizeForBraille(text);
}
