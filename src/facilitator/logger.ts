/**
 * Sistema de logging estructurado en formato JSON a stderr
 *
 * Levels:
 * - info: Información general de operaciones exitosas
 * - warn: Advertencias que no impiden la operación
 * - error: Errores que requieren atención
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Escribe un log estructurado a stderr
 */
function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  // Escribir a stderr en formato JSON
  console.error(JSON.stringify(entry));
}

/**
 * Log de nivel info
 */
export function info(message: string, context?: Record<string, unknown>): void {
  writeLog('info', message, context);
}

/**
 * Log de nivel warn
 */
export function warn(message: string, context?: Record<string, unknown>): void {
  writeLog('warn', message, context);
}

/**
 * Log de nivel error
 */
export function error(message: string, context?: Record<string, unknown>): void {
  writeLog('error', message, context);
}

export const logger = {
  info,
  warn,
  error,
};
