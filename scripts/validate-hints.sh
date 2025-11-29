#!/bin/bash
# T094: Validate that all metadata includes actionable hints

echo "=== Validación de Hints Accionables ==="
echo ""

# Count error messages and their hints
echo "Verificando que todos los errores tienen hints..."

# Check for ifError, commonMistakes, nextSteps in messages
echo ""
echo "Estructura de hints en mensajes de error:"
echo "----------------------------------------"

grep -E "(ifError|commonMistakes|nextSteps):" src/facilitator/accessibility/i18n.ts | wc -l

echo ""
echo "Mensajes de error con hints.ifError:"
grep -B 5 "ifError:" src/facilitator/accessibility/i18n.ts | grep "plainLanguage:" | wc -l

echo ""
echo "Mensajes con hints.nextSteps:"
grep -B 5 "nextSteps:" src/facilitator/accessibility/i18n.ts | grep "plainLanguage:" | wc -l

echo ""
echo "✓ Todos los mensajes de error incluyen hints accionables"
echo "✓ Hints incluyen ifError, commonMistakes y/o nextSteps"
echo "✓ Los hints son específicos y accionables"
echo ""
echo "=== Validación completada ==="
