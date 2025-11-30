/**
 * Voice Commands Generator
 * Genera comandos de voz contextuales para usuarios con discapacidad motora
 */

import type { CognitiveLevelV3 } from '../types';

export interface VoiceCommandHints {
  commands: Array<{
    trigger: string; // "verificar pago"
    action: string; // "ver el estado de la transacción"
    context?: string; // Cuándo usar este comando
  }>;
  examples: string[]; // "Di 'verificar pago' para..."
  wakePhrases?: string[]; // ["Hey Bitcoin", "Ok BSV"]
}

/**
 * Genera comandos de voz contextuales según el escenario
 */
export function generateVoiceCommands(
  scenario: string,
  level: CognitiveLevelV3
): VoiceCommandHints {
  const baseCommands = [
    {
      trigger: 'repetir información',
      action: 'Escuchar los detalles de nuevo',
      context: 'Cuando no entendiste algo',
    },
    {
      trigger: 'ayuda',
      action: 'Ver más opciones disponibles',
      context: 'Cuando necesites orientación',
    },
    {
      trigger: 'glosario',
      action: 'Escuchar definiciones de términos técnicos',
      context: 'Para entender conceptos nuevos',
    },
  ];

  // Comandos específicos según el escenario
  if (scenario.includes('verify')) {
    baseCommands.push({
      trigger: 'verificar pago',
      action: 'Ver el estado de la transacción',
      context: 'Para confirmar que todo está correcto antes de enviar',
    });
    baseCommands.push({
      trigger: 'siguiente paso',
      action: 'Saber qué hacer después de verificar',
      context: 'Cuando la verificación fue exitosa',
    });
  }

  if (scenario.includes('settle')) {
    baseCommands.push({
      trigger: 'ver txid',
      action: 'Escuchar el identificador de transacción',
      context: 'Para guardar o verificar el pago en blockchain',
    });
    baseCommands.push({
      trigger: 'copiar txid',
      action: 'Copiar el identificador al portapapeles',
      context: 'Para compartir o guardar la referencia',
    });
    baseCommands.push({
      trigger: 'siguiente paso',
      action: 'Saber qué hacer ahora',
      context: 'Después de que el pago se confirmó',
    });
  }

  if (scenario.includes('error')) {
    baseCommands.push({
      trigger: 'solución',
      action: 'Escuchar cómo resolver el error',
      context: 'Cuando hay un problema con el pago',
    });
    baseCommands.push({
      trigger: 'contactar soporte',
      action: 'Ver opciones para obtener ayuda',
      context: 'Si no puedes resolver el error tú mismo',
    });
  }

  // Comandos de navegación generales
  baseCommands.push(
    {
      trigger: 'pausa',
      action: 'Pausar la lectura en voz alta',
      context: 'Para procesar la información',
    },
    {
      trigger: 'continuar',
      action: 'Reanudar la lectura',
      context: 'Después de pausar',
    },
    {
      trigger: 'más lento',
      action: 'Reducir la velocidad de lectura',
      context: 'Si habla muy rápido',
    },
    {
      trigger: 'más rápido',
      action: 'Aumentar la velocidad de lectura',
      context: 'Si habla muy lento',
    }
  );

  // Generar ejemplos de uso
  const examples = baseCommands.slice(0, 5).map((c) => `Di "${c.trigger}" para ${c.action}`);

  // Wake phrases solo para usuarios beginners
  const wakePhrases =
    level === 'beginner' || level === 'simple'
      ? ['Hey Bitcoin', 'Ok BSV', 'Asistente de pagos']
      : undefined;

  return {
    commands: baseCommands,
    examples,
    wakePhrases,
  };
}

/**
 * Genera comandos de voz específicos para navegación de contenido
 */
export function generateNavigationCommands(hasSteps: boolean, hasGlossary: boolean): VoiceCommandHints {
  const commands = [];

  if (hasSteps) {
    commands.push(
      {
        trigger: 'leer pasos',
        action: 'Escuchar la lista de pasos',
        context: 'Para conocer el proceso completo',
      },
      {
        trigger: 'paso siguiente',
        action: 'Ir al siguiente paso',
        context: 'Durante la navegación de pasos',
      },
      {
        trigger: 'paso anterior',
        action: 'Volver al paso anterior',
        context: 'Si necesitas revisar algo',
      }
    );
  }

  if (hasGlossary) {
    commands.push({
      trigger: 'definición de [término]',
      action: 'Escuchar qué significa un término específico',
      context: 'Para entender vocabulario técnico',
    });
  }

  return {
    commands,
    examples: commands.map((c) => `Di "${c.trigger}" para ${c.action}`),
  };
}

/**
 * Genera instrucciones de configuración de voz
 */
export function generateVoiceSetupInstructions(level: CognitiveLevelV3): string[] {
  if (level === 'beginner') {
    return [
      '1. Activa el asistente de voz de tu dispositivo',
      '2. Di "Hey Bitcoin" para despertar el asistente',
      '3. Pronuncia claramente el comando que desees usar',
      '4. Espera la respuesta del sistema',
      '5. Si no funcionó, intenta de nuevo más despacio',
    ];
  }

  if (level === 'simple' || level === 'medium') {
    return [
      '1. Habilita control por voz en configuración',
      '2. Usa las frases de activación: "Hey Bitcoin" u "Ok BSV"',
      '3. Di el comando deseado (ver lista de comandos disponibles)',
      '4. Ajusta velocidad con "más lento" o "más rápido"',
    ];
  }

  return [
    'Comandos de voz disponibles para control manos libres',
    'Configuración de asistente de voz recomendada para accesibilidad',
    'Uso de frases de activación personalizables',
  ];
}
