import { createMetadataWithAIV3 } from './src/facilitator/accessibility/ai-metadata-v3.ts';

const env = {
  ACCESSIBILITY_V3_ENABLED: 'true',
  OPENAI_API_KEY: 'test-key',
  OPENAI_MODEL_DEFAULT: 'gpt-4o-mini',
  OPENAI_MODEL_COMPLEX: 'gpt-4o-mini',
};

const preferences = {
  primaryLanguage: 'es',
  languages: ['es', 'en'],
  cognitiveLevel: 'simple',
  includeExamples: true,
  includeGlossary: true,
  includeCheckpoints: true,
  wcagLevel: 'AAA',
  audioFriendly: true,
  screenReaderOptimized: true,
  includeKeyboardHints: true,
  includeVoiceHints: false,
  ttsOptimized: true,
  preferredFormats: ['json'],
  brailleOptimized: false,
  includeSemanticMarkup: false,
  adaptiveComplexity: false,
};

const context = {
  amount: '1000',
  address: 'test-address',
};

const metadata = await createMetadataWithAIV3(
  'success.verifyValid',
  context,
  preferences,
  env
);

// Analyze what we're ACTUALLY sending
console.log('\n=== V3 METADATA ANALYSIS ===\n');

// 1. Cognitive Levels
console.log('1. COGNITIVE LEVELS:');
const beginnerContent = metadata.content.byLevel.beginner;
console.log(`   - beginner.glossary: ${beginnerContent.glossary ? Object.keys(beginnerContent.glossary).length + ' terms' : 'MISSING ❌'}`);
console.log(`   - beginner.examples: ${beginnerContent.examples ? beginnerContent.examples.length + ' examples' : 'MISSING ❌'}`);
console.log(`   - beginner.checkpoints: ${beginnerContent.checkpoints ? beginnerContent.checkpoints.length + ' checkpoints' : 'MISSING ❌'}`);
console.log(`   - beginner.memoryAids: ${beginnerContent.memoryAids ? beginnerContent.memoryAids.length + ' aids' : 'MISSING ❌'}`);
console.log(`   - beginner.readingLevel: ${beginnerContent.readingLevel ? 'Present ✅' : 'MISSING ❌'}`);

// 2. Visual Variants
console.log('\n2. VISUAL VARIANTS:');
console.log(`   - Contrast modes: ${Object.keys(metadata.visual.contrast).length} (${Object.keys(metadata.visual.contrast).join(', ')})`);
console.log(`   - ColorBlind types: ${Object.keys(metadata.visual.colorBlind).length} (${Object.keys(metadata.visual.colorBlind).join(', ')})`);
console.log(`   - Font sizes: ${Object.keys(metadata.visual.fontSize).length} (${Object.keys(metadata.visual.fontSize).join(', ')})`);
console.log(`   - Themes: ${Object.keys(metadata.visual.theme).length} (${Object.keys(metadata.visual.theme).join(', ')})`);

const deuteranopia = metadata.visual.colorBlind.deuteranopia;
console.log(`   - deuteranopia.colorPalette: ${deuteranopia.colorPalette ? deuteranopia.colorPalette.length + ' colors' : 'MISSING ❌'}`);

// 3. Motor Guidance
console.log('\n3. MOTOR GUIDANCE:');
console.log(`   - Methods: ${Object.keys(metadata.motor).length} (${Object.keys(metadata.motor).join(', ')})`);
const keyboardGuidance = metadata.motor.keyboard;
console.log(`   - keyboard.instructions: ${keyboardGuidance.instructions ? keyboardGuidance.instructions.length + ' instructions' : 'MISSING ❌'}`);
console.log(`   - keyboard.shortcuts: ${keyboardGuidance.shortcuts ? Object.keys(keyboardGuidance.shortcuts).length + ' shortcuts' : 'MISSING ❌'}`);

// 4. Audio Variants
console.log('\n4. AUDIO VARIANTS:');
console.log(`   - Variants: ${Object.keys(metadata.audio).length} (${Object.keys(metadata.audio).join(', ')})`);
const ttsOptimized = metadata.audio.ttsOptimized;
console.log(`   - ttsOptimized.ssml: ${ttsOptimized.ssml ? 'Present ✅' : 'MISSING ❌'}`);
console.log(`   - ttsOptimized.pauses: ${ttsOptimized.pauses ? ttsOptimized.pauses.length + ' pauses' : 'MISSING ❌'}`);

// 5. Formats
console.log('\n5. OUTPUT FORMATS:');
console.log(`   - Available: ${Object.keys(metadata.formats).length} (${Object.keys(metadata.formats).join(', ')})`);
console.log(`   - braille: ${metadata.formats.braille ? 'Present ✅' : 'MISSING ❌'}`);
console.log(`   - ssml: ${metadata.formats.ssml ? 'Present ✅' : 'MISSING ❌'}`);

// 6. Languages
console.log('\n6. LANGUAGES:');
console.log(`   - Available: ${Object.keys(metadata.languages).length} (${Object.keys(metadata.languages).join(', ')})`);

// 7. Metadata
console.log('\n7. METADATA:');
console.log(`   - wcagLevel: ${metadata.metadata.wcagLevel}`);
console.log(`   - generatedBy: ${metadata.metadata.generatedBy}`);
console.log(`   - version: ${metadata.metadata.version}`);

console.log('\n=== SUMMARY ===');
console.log(`Total structure size: ${JSON.stringify(metadata).length} bytes`);
console.log('\n');
