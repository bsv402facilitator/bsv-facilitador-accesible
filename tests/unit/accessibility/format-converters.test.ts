/**
 * Format Converters Tests
 *
 * Tests para conversión de AccessibleResponseV2 a múltiples formatos:
 * - JSON → XML
 * - JSON → Plain Text
 * - JSON → Markdown
 * - JSON → HTML
 * - JSON → JSON-LD
 * - Optimización para Braille
 */

import { describe, it, expect } from 'vitest';
import {
  toXML,
  toPlainText,
  toMarkdown,
  toHTML,
  toJSONLD,
  optimizeForBraille,
} from '../../../src/facilitator/accessibility/format-converters';
import type { AccessibleResponseV2, UniversalAccessibilityMetadataV2, WCAGComplianceMetadataV2 } from '../../../src/facilitator/types';

// ==================== Test Fixtures ====================

function createMinimalMetadata(): UniversalAccessibilityMetadataV2 {
  return {
    content: {
      plainLanguage: 'Transacción verificada exitosamente',
      explanation: 'La transacción BSV cumple con todos los requisitos de pago.',
      stepByStep: [
        { text: 'Transacción validada', icon: '✓' },
        { text: 'Monto verificado', icon: '💰' },
      ],
      hints: {
        nextSteps: 'Proceder con el broadcast de la transacción',
      },
    },
    visual: {
      contrastMode: 'normal',
      colorBlindSafe: true,
      fontSize: 'medium',
      screenReaderOptimized: true,
      darkMode: false,
      altTextProvided: true,
    },
    cognitive: {
      level: 'simple',
      readingLevel: {
        fleschKincaidGrade: 8,
        fleschReadingEase: 70,
        estimatedReadingTime: '1 minuto',
      },
      memoryAids: ['Verificar siempre el monto antes de broadcast'],
      checkpoints: [],
      abstractionLevel: 'concrete',
      iconSupport: true,
    },
    language: {
      code: 'es',
      direction: 'ltr',
      locale: 'es-ES',
    },
    motor: {
      keyboardNavigationHints: ['Tab para navegar', 'Enter para confirmar'],
      voiceCommandHints: [],
      timingAdjustable: true,
    },
    format: {
      availableFormats: ['json', 'xml', 'plaintext', 'markdown', 'html', 'jsonld'],
      currentFormat: 'json',
      brailleOptimized: false,
      semanticMarkup: true,
    },
    personalization: {
      userPreferencesApplied: false,
      adaptiveComplexity: false,
    },
    metadata: {
      audioFriendly: true,
      version: 2,
      generatedBy: 'ai',
      generatedAt: '2024-01-15T10:30:00Z',
      cacheHit: false,
    },
  };
}

function createFullMetadata(): UniversalAccessibilityMetadataV2 {
  const minimal = createMinimalMetadata();
  return {
    ...minimal,
    content: {
      ...minimal.content,
      detailedExplanation: 'Esta es una explicación detallada de la transacción BSV que incluye información técnica adicional.',
      stepByStep: [
        { text: 'Validar formato de transacción', icon: '📋', context: 'Verificar estructura hexadecimal', estimatedTime: '~1 segundo' },
        { text: 'Verificar firma digital', icon: '🔐', context: 'Validar ECDSA signature', estimatedTime: '~2 segundos' },
        { text: 'Confirmar monto', icon: '💰', context: 'Comparar con requisitos de pago', estimatedTime: 'inmediato' },
      ],
      hints: {
        ifError: 'Verificar que la transacción esté firmada correctamente',
        commonMistakes: [
          'No incluir fee suficiente',
          'Usar formato incorrecto para el monto',
          'Firmar con la clave privada equivocada',
        ],
        nextSteps: 'Proceder con el broadcast usando /settle',
        troubleshooting: 'Si el error persiste, verificar que la red sea la correcta (mainnet vs testnet)',
        relatedResources: [
          { title: 'Documentación de X402', url: 'https://x402.org', type: 'documentation' },
          { title: 'Tutorial de BSV', url: 'https://bsv.academy', type: 'tutorial' },
        ],
        safeguards: [
          'No compartir claves privadas',
          'No hacer broadcast sin verificar primero',
        ],
      },
      glossary: {
        'BSV': 'Bitcoin SV - Bitcoin Satoshi Vision',
        'satoshi': 'Unidad mínima de BSV (1 BSV = 100,000,000 satoshis)',
        'TXID': 'Transaction ID - Identificador único de 64 caracteres',
      },
      examples: [
        {
          scenario: 'Pago por café con BSV',
          input: 'Envías 5000 satoshis al comerciante',
          output: 'Transacción verificada y lista para broadcast',
          explanation: 'El monto es correcto y la firma es válida',
        },
      ],
    },
    visual: {
      ...minimal.visual,
      contrastMode: 'high',
      colorBlindType: 'deuteranopia',
      darkMode: true,
    },
    cognitive: {
      ...minimal.cognitive,
      level: 'advanced',
      memoryAids: [
        'Verificar siempre el monto antes de broadcast',
        'Comprobar que la red sea correcta (mainnet/testnet)',
      ],
      checkpoints: [
        {
          question: '¿Qué es un satoshi?',
          expectedAnswer: 'La unidad mínima de BSV',
          hint: 'Ver glosario',
        },
      ],
    },
    motor: {
      ...minimal.motor,
      voiceCommandHints: ['Decir "verificar transacción"', 'Decir "confirmar broadcast"'],
      focusOrder: [1, 2, 3, 4],
    },
    personalization: {
      userPreferencesApplied: true,
      adaptiveComplexity: true,
      previousInteractions: 5,
      recommendedNextLevel: 'expert',
    },
  };
}

function createWCAGMetadata(): WCAGComplianceMetadataV2 {
  return {
    version: '2.2',
    level: 'AAA',
    successCriteria: [
      { id: '1.1.1', name: 'Non-text Content', level: 'A', status: 'pass' },
      { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', status: 'pass' },
      { id: '1.4.6', name: 'Contrast (Enhanced)', level: 'AAA', status: 'pass' },
      { id: '3.1.5', name: 'Reading Level', level: 'AAA', status: 'pass' },
    ],
    conformanceStatement: 'Este contenido cumple con WCAG 2.2 Nivel AAA. Se satisfacen todos los 4 criterios de éxito aplicables.',
    auditTrail: {
      criteriaChecked: ['1.1.1', '1.4.3', '1.4.6', '3.1.5'],
      criteriaPass: ['1.1.1', '1.4.3', '1.4.6', '3.1.5'],
      criteriaNotApplicable: [],
    },
  };
}

function createResponse(metadata: UniversalAccessibilityMetadataV2): AccessibleResponseV2<{ success: boolean; txid: string }> {
  return {
    data: {
      success: true,
      txid: 'a1b2c3d4e5f6...',
    },
    accessibility: metadata,
    wcag: createWCAGMetadata(),
  };
}

// ==================== XML Conversion Tests ====================

describe('toXML', () => {
  it('should convert minimal metadata to valid XML', () => {
    const response = createResponse(createMinimalMetadata());
    const xml = toXML(response);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<AccessibleResponse>');
    expect(xml).toContain('</AccessibleResponse>');
    expect(xml).toContain('<Data>');
    expect(xml).toContain('<Accessibility>');
    expect(xml).toContain('<WCAG>');
  });

  it('should escape special XML characters', () => {
    const metadata = createMinimalMetadata();
    metadata.content.plainLanguage = 'Test <with> & "quotes" \'and\' symbols';
    const response = createResponse(metadata);
    const xml = toXML(response);

    expect(xml).toContain('&lt;with&gt;');
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&quot;quotes&quot;');
    expect(xml).toContain('&apos;and&apos;');
    expect(xml).not.toContain('<with>');
  });

  it('should include all content fields in XML', () => {
    const response = createResponse(createFullMetadata());
    const xml = toXML(response);

    expect(xml).toContain('<PlainLanguage>');
    expect(xml).toContain('<Explanation>');
    expect(xml).toContain('<DetailedExplanation>');
    expect(xml).toContain('<StepByStep>');
    expect(xml).toContain('<Step>');
    expect(xml).toContain('<Icon>');
    expect(xml).toContain('<Context>');
    expect(xml).toContain('<EstimatedTime>');
  });

  it('should include glossary in XML', () => {
    const response = createResponse(createFullMetadata());
    const xml = toXML(response);

    expect(xml).toContain('<Glossary>');
    expect(xml).toContain('<Term>');
    expect(xml).toContain('<Name>BSV</Name>');
    expect(xml).toContain('<Definition>');
  });

  it('should include WCAG compliance in XML', () => {
    const response = createResponse(createMinimalMetadata());
    const xml = toXML(response);

    expect(xml).toContain('<WCAG>');
    expect(xml).toContain('<Version>2.2</Version>');
    expect(xml).toContain('<Level>AAA</Level>');
    expect(xml).toContain('<SuccessCriteria>');
    expect(xml).toContain('<ConformanceStatement>');
  });

  it('should omit optional fields when not present', () => {
    const response = createResponse(createMinimalMetadata());
    const xml = toXML(response);

    expect(xml).not.toContain('<DetailedExplanation>');
    expect(xml).not.toContain('<Glossary>');
    expect(xml).not.toContain('<Examples>');
  });
});

// ==================== Plain Text Conversion Tests ====================

describe('toPlainText', () => {
  it('should convert to TTS-friendly plain text', () => {
    const response = createResponse(createMinimalMetadata());
    const text = toPlainText(response);

    expect(text).toContain('=== RESPUESTA ACCESIBLE ===');
    expect(text).toContain('RESUMEN: Transacción verificada exitosamente');
    expect(text).toContain('PASOS A SEGUIR:');
    expect(text).toContain('1. ✓ Transacción validada');
  });

  it('should include all sections in order', () => {
    const response = createResponse(createFullMetadata());
    const text = toPlainText(response);

    const sections = [
      'RESUMEN:',
      'EXPLICACIÓN:',
      'DETALLES:',
      'PASOS A SEGUIR:',
      'ERRORES COMUNES:',
      'QUÉ NO HACER:',
      'PRÓXIMOS PASOS:',
      'GLOSARIO:',
      'EJEMPLOS:',
      'AYUDAS DE MEMORIA:',
      'DATOS DE LA RESPUESTA',
      'INFORMACIÓN DE ACCESIBILIDAD',
    ];

    sections.forEach((section) => {
      expect(text).toContain(section);
    });
  });

  it('should format steps with numbers', () => {
    const response = createResponse(createFullMetadata());
    const text = toPlainText(response);

    expect(text).toContain('1. 📋 Validar formato de transacción');
    expect(text).toContain('   Contexto: Verificar estructura hexadecimal');
    expect(text).toContain('   Tiempo: ~1 segundo');
    expect(text).toContain('2. 🔐 Verificar firma digital');
    expect(text).toContain('3. 💰 Confirmar monto');
  });

  it('should include metadata footer', () => {
    const response = createResponse(createMinimalMetadata());
    const text = toPlainText(response);

    expect(text).toContain('Idioma: ES');
    expect(text).toContain('Nivel cognitivo: simple');
    expect(text).toContain('Nivel de lectura: Grado 8');
    expect(text).toContain('WCAG 2.2: AAA');
  });

  it('should handle minimal metadata without optional fields', () => {
    const response = createResponse(createMinimalMetadata());
    const text = toPlainText(response);

    expect(text).not.toContain('DETALLES:');
    expect(text).not.toContain('GLOSARIO:');
    expect(text).not.toContain('EJEMPLOS:');
  });
});

// ==================== Markdown Conversion Tests ====================

describe('toMarkdown', () => {
  it('should convert to valid Markdown', () => {
    const response = createResponse(createMinimalMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('# Respuesta Accesible');
    expect(md).toContain('## Resumen');
    expect(md).toContain('**Transacción verificada exitosamente**');
  });

  it('should format steps as ordered list', () => {
    const response = createResponse(createFullMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('## Pasos a Seguir');
    expect(md).toContain('1. **📋 Validar formato de transacción**');
    expect(md).toContain('   - *Contexto:* Verificar estructura hexadecimal');
    expect(md).toContain('   - *Tiempo:* ~1 segundo');
  });

  it('should include glossary as definition list', () => {
    const response = createResponse(createFullMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('## Glosario');
    expect(md).toContain('- **BSV:** Bitcoin SV - Bitcoin Satoshi Vision');
    expect(md).toContain('- **satoshi:** Unidad mínima de BSV');
  });

  it('should format examples with headers', () => {
    const response = createResponse(createFullMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('## Ejemplos');
    expect(md).toContain('### 1. Pago por café con BSV');
    expect(md).toContain('- **Entrada:** Envías 5000 satoshis');
    expect(md).toContain('- **Salida:** Transacción verificada');
  });

  it('should include code block for data', () => {
    const response = createResponse(createMinimalMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('## Datos de la Respuesta');
    expect(md).toContain('```json');
    expect(md).toContain('"success": true');
    expect(md).toContain('```');
  });

  it('should include accessibility footer', () => {
    const response = createResponse(createMinimalMetadata());
    const md = toMarkdown(response);

    expect(md).toContain('---');
    expect(md).toContain('### Información de Accesibilidad');
    expect(md).toContain('- **Idioma:** ES');
    expect(md).toContain('- **WCAG 2.2:** AAA');
  });
});

// ==================== HTML Conversion Tests ====================

describe('toHTML', () => {
  it('should generate valid HTML5', () => {
    const response = createResponse(createMinimalMetadata());
    const html = toHTML(response);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="es" dir="ltr">');
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('</html>');
  });

  it('should include ARIA attributes', () => {
    const response = createResponse(createMinimalMetadata());
    const html = toHTML(response);

    expect(html).toContain('role="main"');
    expect(html).toContain('aria-label="Contenido principal"');
    expect(html).toContain('aria-labelledby="summary-heading"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('role="list"');
    expect(html).toContain('role="listitem"');
  });

  it('should escape HTML entities', () => {
    const metadata = createMinimalMetadata();
    metadata.content.plainLanguage = 'Test <script>alert("XSS")</script> & "quotes"';
    const response = createResponse(metadata);
    const html = toHTML(response);

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;quotes&quot;');
    expect(html).not.toContain('<script>');
  });

  it('should apply dark mode styles', () => {
    const metadata = createFullMetadata();
    metadata.visual.darkMode = true;
    const response = createResponse(metadata);
    const html = toHTML(response);

    expect(html).toContain('background-color: #1a1a1a');
    expect(html).toContain('color: #f0f0f0');
  });

  it('should apply font size styles', () => {
    const metadata = createMinimalMetadata();
    metadata.visual.fontSize = 'x-large';
    const response = createResponse(metadata);
    const html = toHTML(response);

    expect(html).toContain('font-size: 20px');
  });

  it('should include semantic HTML5 elements', () => {
    const response = createResponse(createFullMetadata());
    const html = toHTML(response);

    expect(html).toContain('<main role="main"');
    expect(html).toContain('<section aria-labelledby');
    expect(html).toContain('<footer class="metadata" role="contentinfo">');
  });

  it('should include accessibility metadata in footer', () => {
    const response = createResponse(createMinimalMetadata());
    const html = toHTML(response);

    expect(html).toContain('<h3>Información de Accesibilidad</h3>');
    expect(html).toContain('<li>WCAG 2.2: AAA');
  });
});

// ==================== JSON-LD Conversion Tests ====================

describe('toJSONLD', () => {
  it('should generate valid JSON-LD with Schema.org', () => {
    const response = createResponse(createMinimalMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Action');
    expect(parsed.actionStatus).toBe('CompletedActionStatus');
  });

  it('should include HowToStep for stepByStep', () => {
    const response = createResponse(createFullMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed.step).toBeDefined();
    expect(parsed.step.length).toBe(3);
    expect(parsed.step[0]['@type']).toBe('HowToStep');
    expect(parsed.step[0].position).toBe(1);
    expect(parsed.step[0].name).toBe('Validar formato de transacción');
    expect(parsed.step[0].estimatedTime).toBe('~1 segundo');
  });

  it('should include language information', () => {
    const response = createResponse(createMinimalMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed.inLanguage).toBeDefined();
    expect(parsed.inLanguage['@type']).toBe('Language');
    expect(parsed.inLanguage.name).toBe('es');
  });

  it('should include accessibility features', () => {
    const response = createResponse(createFullMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed.accessMode).toContain('textual');
    expect(parsed.accessMode).toContain('auditory');
    expect(parsed.accessModeSufficient).toBe('textual');
    expect(parsed.accessibilityAPI).toBe('ARIA');
    expect(parsed.accessibilityControl).toContain('fullKeyboardControl');
    expect(parsed.accessibilityControl).toContain('voiceControl');
    expect(parsed.accessibilityFeature).toContain('structuralNavigation');
    expect(parsed.accessibilityFeature).toContain('glossary');
    expect(parsed.accessibilityHazard).toBe('noFlashingHazard');
  });

  it('should include WCAG conformance statement', () => {
    const response = createResponse(createMinimalMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed.accessibilitySummary).toContain('WCAG 2.2 AAA');
  });

  it('should merge data into result', () => {
    const response = createResponse(createMinimalMetadata());
    const jsonld = toJSONLD(response);
    const parsed = JSON.parse(jsonld);

    expect(parsed.result).toBeDefined();
    expect(parsed.result['@type']).toBe('Thing');
    expect(parsed.result.success).toBe(true);
    expect(parsed.result.txid).toBe('a1b2c3d4e5f6...');
  });
});

// ==================== Braille Optimization Tests ====================

describe('optimizeForBraille', () => {
  it('should remove emojis', () => {
    const text = 'Test ✓ with 💰 emojis 🔐 here';
    const optimized = optimizeForBraille(text);

    expect(optimized).not.toContain('✓');
    expect(optimized).not.toContain('💰');
    expect(optimized).not.toContain('🔐');
    expect(optimized).toContain('Test');
    expect(optimized).toContain('with');
  });

  it('should expand common abbreviations', () => {
    const text = 'Ver ej. en pág. 5 aprox.';
    const optimized = optimizeForBraille(text);

    expect(optimized).toContain('ejemplo');
    expect(optimized).toContain('página');
    expect(optimized).toContain('aproximadamente');
    expect(optimized).not.toContain('ej.');
    expect(optimized).not.toContain('pág.');
  });

  it('should expand BSV/TXID/WIF', () => {
    const text = 'La transacción BSV tiene un TXID único. Use formato WIF.';
    const optimized = optimizeForBraille(text);

    expect(optimized).toContain('Bitcoin SV');
    expect(optimized).toContain('identificador de transacción');
    expect(optimized).toContain('formato de importación de billetera');
  });

  it('should remove special characters', () => {
    const text = 'Test ★ with ○ symbols ■ here';
    const optimized = optimizeForBraille(text);

    expect(optimized).not.toContain('★');
    expect(optimized).not.toContain('○');
    expect(optimized).not.toContain('■');
  });

  it('should normalize quotes and dashes', () => {
    const text = 'Test "curly" and \'single\' quotes with — dashes';
    const optimized = optimizeForBraille(text);

    expect(optimized).toContain('"curly"');
    expect(optimized).toContain("'single'");
    expect(optimized).toContain('-');
    expect(optimized).not.toContain('\u201C');
    expect(optimized).not.toContain('\u2019');
    expect(optimized).not.toContain('\u2014');
  });

  it('should remove excessive whitespace', () => {
    const text = 'Test   with    extra     spaces';
    const optimized = optimizeForBraille(text);

    expect(optimized).toBe('Test with extra spaces');
  });

  it('should handle empty input', () => {
    expect(optimizeForBraille('')).toBe('');
  });

  it('should handle input with only emojis', () => {
    const text = '✓💰🔐';
    const optimized = optimizeForBraille(text);

    expect(optimized).toBe('');
  });

  it('should preserve Spanish characters', () => {
    const text = 'Texto con ñ, á, é, í, ó, ú y ü';
    const optimized = optimizeForBraille(text);

    expect(optimized).toContain('ñ');
    expect(optimized).toContain('á');
    expect(optimized).toContain('ü');
  });
});

// ==================== Integration Tests ====================

describe('Format Converters Integration', () => {
  it('should handle full metadata in all formats', () => {
    const response = createResponse(createFullMetadata());

    const xml = toXML(response);
    const plainText = toPlainText(response);
    const markdown = toMarkdown(response);
    const html = toHTML(response);
    const jsonld = toJSONLD(response);

    expect(xml.length).toBeGreaterThan(1000);
    expect(plainText.length).toBeGreaterThan(500);
    expect(markdown.length).toBeGreaterThan(500);
    expect(html.length).toBeGreaterThan(1000);
    expect(jsonld.length).toBeGreaterThan(500);

    // All formats should contain key content
    const keyContent = 'Transacción verificada';
    expect(xml).toContain(keyContent);
    expect(plainText).toContain(keyContent);
    expect(markdown).toContain(keyContent);
    expect(html).toContain(keyContent);

    const jsonldParsed = JSON.parse(jsonld);
    expect(jsonldParsed.name).toContain('Transacción verificada');
  });

  it('should produce outputs under 50KB limit', () => {
    const response = createResponse(createFullMetadata());

    const xml = toXML(response);
    const plainText = toPlainText(response);
    const markdown = toMarkdown(response);
    const html = toHTML(response);
    const jsonld = toJSONLD(response);

    const maxSize = 50 * 1024; // 50KB

    expect(Buffer.byteLength(xml, 'utf8')).toBeLessThan(maxSize);
    expect(Buffer.byteLength(plainText, 'utf8')).toBeLessThan(maxSize);
    expect(Buffer.byteLength(markdown, 'utf8')).toBeLessThan(maxSize);
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(maxSize);
    expect(Buffer.byteLength(jsonld, 'utf8')).toBeLessThan(maxSize);
  });
});
