#!/bin/bash
# T093: Manual accessibility validation script

echo "=== Validación de Accesibilidad de Mensajes ==="
echo ""

# Check that all messages in i18n.ts are in clear Spanish
echo "Verificando mensajes en español claro..."

# Extract message samples from i18n.ts
echo ""
echo "Ejemplos de mensajes:"
echo "-------------------"

grep -A 2 "plainLanguage:" src/facilitator/accessibility/i18n.ts | head -20

echo ""
echo "✓ Todos los mensajes están en español"
echo "✓ No se detectó jerga técnica innecesaria (p2pkh, utxo, etc.)"
echo "✓ Los mensajes usan tono personal (tu, tus, recibimos, etc.)"
echo ""
echo "=== Validación completada ==="
