/**
 * Preference Detector
 * Detecta preferencias de accesibilidad desde HTTP headers y query params
 */

import type { CognitiveLevelV3 } from '../types';

export interface DetectedPreferences {
  language?: string;
  contrast?: 'high' | 'normal' | 'low';
  fontSize?: 'small' | 'medium' | 'large' | 'x-large';
  cognitiveLevel?: CognitiveLevelV3;
  darkMode?: boolean;
  colorBlindType?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  motorInput?: 'keyboard' | 'voice' | 'switch' | 'eye';
  ttsEnabled?: boolean;
  screenReader?: boolean;
  reduceMotion?: boolean;
  source: 'http-headers' | 'query-params' | 'default';
}

/**
 * Detecta preferencias de accesibilidad desde el request
 */
export function detectPreferencesFromRequest(request: Request): DetectedPreferences {
  const headers = request.headers;
  const url = new URL(request.url);
  const params = url.searchParams;

  // Detectar idioma preferido
  const language = parseAcceptLanguage(headers.get('accept-language'));

  // Detectar preferencias de contraste
  const contrast = parseContrastPreference(headers, params);

  // Detectar tamaño de fuente
  const fontSize = parseFontSizePreference(headers, params);

  // Detectar nivel cognitivo
  const cognitiveLevel = parseCognitiveLevel(headers, params);

  // Detectar modo oscuro
  const darkMode = parseDarkMode(headers, params);

  // Detectar tipo de daltonismo
  const colorBlindType = parseColorBlindType(headers, params);

  // Detectar método de entrada motora
  const motorInput = parseMotorInput(headers, params);

  // Detectar TTS (Text-to-Speech)
  const ttsEnabled = parseTTSEnabled(headers, params);

  // Detectar screen reader
  const screenReader = parseScreenReader(headers);

  // Detectar preferencia de reducción de movimiento
  const reduceMotion = parseReduceMotion(headers, params);

  // Determinar fuente de detección
  const source = determineSource(headers, params);

  return {
    language,
    contrast,
    fontSize,
    cognitiveLevel,
    darkMode,
    colorBlindType,
    motorInput,
    ttsEnabled,
    screenReader,
    reduceMotion,
    source,
  };
}

/**
 * Parsea el header Accept-Language
 * Ejemplo: "es-ES,es;q=0.9,en;q=0.8" → "es"
 */
function parseAcceptLanguage(header: string | null): string {
  if (!header) return 'es';

  const primary = header.split(',')[0]?.split(';')[0]?.split('-')[0];
  return primary || 'es';
}

/**
 * Parsea preferencias de contraste
 * Headers: X-Prefer-Contrast, Sec-CH-Prefers-Contrast
 * Query: ?contrast=high
 */
function parseContrastPreference(
  headers: Headers,
  params: URLSearchParams
): 'high' | 'normal' | 'low' {
  const queryValue = params.get('contrast');
  if (queryValue && ['high', 'normal', 'low'].includes(queryValue)) {
    return queryValue as 'high' | 'normal' | 'low';
  }

  const headerValue =
    headers.get('x-prefer-contrast') || headers.get('sec-ch-prefers-contrast');
  if (headerValue && ['high', 'normal', 'low'].includes(headerValue)) {
    return headerValue as 'high' | 'normal' | 'low';
  }

  return 'normal';
}

/**
 * Parsea preferencias de tamaño de fuente
 */
function parseFontSizePreference(
  headers: Headers,
  params: URLSearchParams
): 'small' | 'medium' | 'large' | 'x-large' {
  const queryValue = params.get('fontsize') || params.get('fontSize');
  if (queryValue && ['small', 'medium', 'large', 'x-large'].includes(queryValue)) {
    return queryValue as 'small' | 'medium' | 'large' | 'x-large';
  }

  const headerValue = headers.get('x-prefer-fontsize');
  if (headerValue && ['small', 'medium', 'large', 'x-large'].includes(headerValue)) {
    return headerValue as 'small' | 'medium' | 'large' | 'x-large';
  }

  return 'medium';
}

/**
 * Parsea nivel cognitivo preferido
 */
function parseCognitiveLevel(
  headers: Headers,
  params: URLSearchParams
): CognitiveLevelV3 | undefined {
  const queryValue = params.get('level') || params.get('cognitiveLevel');
  if (
    queryValue &&
    ['beginner', 'simple', 'medium', 'advanced', 'expert'].includes(queryValue)
  ) {
    return queryValue as CognitiveLevelV3;
  }

  const headerValue = headers.get('x-cognitive-level');
  if (
    headerValue &&
    ['beginner', 'simple', 'medium', 'advanced', 'expert'].includes(headerValue)
  ) {
    return headerValue as CognitiveLevelV3;
  }

  return undefined;
}

/**
 * Parsea preferencia de modo oscuro
 * Headers: Sec-CH-Prefers-Color-Scheme, X-Prefer-Darkmode
 * Query: ?dark=true
 */
function parseDarkMode(headers: Headers, params: URLSearchParams): boolean {
  const queryValue = params.get('dark') || params.get('darkMode');
  if (queryValue === 'true' || queryValue === '1') return true;
  if (queryValue === 'false' || queryValue === '0') return false;

  const customHeader = headers.get('x-prefer-darkmode');
  if (customHeader === 'true' || customHeader === '1') return true;

  const colorScheme = headers.get('sec-ch-prefers-color-scheme');
  if (colorScheme === 'dark') return true;

  return false;
}

/**
 * Parsea tipo de daltonismo
 */
function parseColorBlindType(
  headers: Headers,
  params: URLSearchParams
): 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none' {
  const queryValue = params.get('colorBlind') || params.get('colorBlindType');
  if (
    queryValue &&
    ['protanopia', 'deuteranopia', 'tritanopia', 'none'].includes(queryValue)
  ) {
    return queryValue as 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  }

  const headerValue = headers.get('x-colorblind-type');
  if (
    headerValue &&
    ['protanopia', 'deuteranopia', 'tritanopia', 'none'].includes(headerValue)
  ) {
    return headerValue as 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none';
  }

  return 'none';
}

/**
 * Parsea método de entrada motora
 */
function parseMotorInput(
  headers: Headers,
  params: URLSearchParams
): 'keyboard' | 'voice' | 'switch' | 'eye' {
  const queryValue = params.get('input') || params.get('motorInput');
  if (queryValue && ['keyboard', 'voice', 'switch', 'eye'].includes(queryValue)) {
    return queryValue as 'keyboard' | 'voice' | 'switch' | 'eye';
  }

  const headerValue = headers.get('x-motor-input');
  if (headerValue && ['keyboard', 'voice', 'switch', 'eye'].includes(headerValue)) {
    return headerValue as 'keyboard' | 'voice' | 'switch' | 'eye';
  }

  return 'keyboard';
}

/**
 * Parsea si TTS está habilitado
 */
function parseTTSEnabled(headers: Headers, params: URLSearchParams): boolean {
  const queryValue = params.get('tts') || params.get('ttsEnabled');
  if (queryValue === 'true' || queryValue === '1') return true;
  if (queryValue === 'false' || queryValue === '0') return false;

  const headerValue = headers.get('x-tts-enabled');
  if (headerValue === 'true' || headerValue === '1') return true;

  return false;
}

/**
 * Parsea si está usando screen reader
 * Detecta User-Agent de screen readers comunes
 */
function parseScreenReader(headers: Headers): boolean {
  const userAgent = headers.get('user-agent')?.toLowerCase() || '';

  // Detectar screen readers conocidos
  const screenReaders = [
    'jaws',
    'nvda',
    'voiceover',
    'talkback',
    'narrator',
    'orca',
    'chromevox',
  ];

  return screenReaders.some((sr) => userAgent.includes(sr));
}

/**
 * Parsea preferencia de reducción de movimiento
 * Header: Sec-CH-Prefers-Reduced-Motion
 */
function parseReduceMotion(headers: Headers, params: URLSearchParams): boolean {
  const queryValue = params.get('reduceMotion');
  if (queryValue === 'true' || queryValue === '1') return true;
  if (queryValue === 'false' || queryValue === '0') return false;

  const headerValue = headers.get('sec-ch-prefers-reduced-motion');
  if (headerValue === 'reduce') return true;

  return false;
}

/**
 * Determina la fuente de preferencias
 */
function determineSource(
  headers: Headers,
  params: URLSearchParams
): 'http-headers' | 'query-params' | 'default' {
  // Si hay query params de accesibilidad, esa es la fuente principal
  const hasQueryParams = !!(
    params.get('level') ||
    params.get('contrast') ||
    params.get('dark') ||
    params.get('tts')
  );

  if (hasQueryParams) return 'query-params';

  // Si hay headers personalizados, esa es la fuente
  const hasCustomHeaders = !!(
    headers.get('x-cognitive-level') ||
    headers.get('x-prefer-contrast') ||
    headers.get('x-tts-enabled')
  );

  if (hasCustomHeaders) return 'http-headers';

  return 'default';
}

/**
 * Convierte preferencias detectadas a formato de AccessibilityPreferencesV3
 */
export function preferencesToAccessibilityFormat(prefs: DetectedPreferences): Record<string, any> {
  return {
    primaryLanguage: prefs.language,
    cognitiveLevel: prefs.cognitiveLevel,
    contrastMode: prefs.contrast,
    fontSize: prefs.fontSize,
    darkMode: prefs.darkMode,
    colorBlindType: prefs.colorBlindType,
    motorInput: prefs.motorInput,
    ttsEnabled: prefs.ttsEnabled,
    screenReaderMode: prefs.screenReader,
    reduceMotion: prefs.reduceMotion,
    voiceControlEnabled: prefs.motorInput === 'voice',
  };
}

/**
 * Genera recomendaciones basadas en preferencias detectadas
 */
export function generateRecommendations(prefs: DetectedPreferences): string[] {
  const recommendations: string[] = [];

  if (prefs.screenReader) {
    recommendations.push('Modo lector de pantalla detectado - contenido optimizado para ARIA');
  }

  if (prefs.ttsEnabled) {
    recommendations.push('TTS habilitado - texto optimizado para síntesis de voz');
  }

  if (prefs.motorInput === 'voice') {
    recommendations.push('Control por voz habilitado - comandos disponibles');
  }

  if (prefs.colorBlindType !== 'none') {
    recommendations.push(
      `Ajuste de colores para ${prefs.colorBlindType} - paleta adaptada`
    );
  }

  if (prefs.reduceMotion) {
    recommendations.push('Reducción de movimiento - animaciones deshabilitadas');
  }

  if (prefs.contrast === 'high') {
    recommendations.push('Alto contraste habilitado - mejor legibilidad');
  }

  return recommendations;
}
