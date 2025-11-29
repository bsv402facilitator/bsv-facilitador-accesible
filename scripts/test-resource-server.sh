#!/bin/bash

# Script para probar el resource server end-to-end
# Requiere: facilitador corriendo en localhost:8787
#          resource server corriendo en localhost:8788

set -e

echo "🧪 Testing X402 Resource Server - End to End"
echo "=============================================="
echo ""

# URLs
RESOURCE_URL="http://localhost:8788/api/data"
FACILITATOR_URL="http://localhost:8787"

# Colors para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para print con color
print_step() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Health check del resource server
print_step "Step 1: Health check del resource server"
HEALTH_RESPONSE=$(curl -s http://localhost:8788/)
echo "$HEALTH_RESPONSE" | jq .

if echo "$HEALTH_RESPONSE" | jq -e '.service' > /dev/null; then
    print_success "Resource server está funcionando"
else
    print_error "Resource server no responde correctamente"
    exit 1
fi

echo ""

# Step 2: Request sin pago (debería retornar 402)
print_step "Step 2: Request sin pago (debería retornar 402)"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "$RESOURCE_URL")

if [ "$HTTP_CODE" -eq 402 ]; then
    print_success "Retornó 402 Payment Required como esperado"
    echo "PaymentRequirements:"
    cat /tmp/response.json | jq .
else
    print_error "Se esperaba 402, se obtuvo: $HTTP_CODE"
    exit 1
fi

echo ""

# Step 3: Verificar que el facilitador esté funcionando
print_step "Step 3: Verificar que el facilitador esté funcionando"
FACILITATOR_HEALTH=$(curl -s "$FACILITATOR_URL/")

if echo "$FACILITATOR_HEALTH" | jq -e '.service' > /dev/null; then
    print_success "Facilitador está funcionando"
else
    print_error "Facilitador no responde correctamente"
    exit 1
fi

echo ""

# Step 4: Obtener PaymentRequirements
print_step "Step 4: Parsear PaymentRequirements"
PAYMENT_REQUIREMENTS=$(cat /tmp/response.json)
PAY_TO=$(echo "$PAYMENT_REQUIREMENTS" | jq -r '.payTo')
AMOUNT=$(echo "$PAYMENT_REQUIREMENTS" | jq -r '.maxAmountRequired')
NETWORK=$(echo "$PAYMENT_REQUIREMENTS" | jq -r '.network')

echo "  Pay to: $PAY_TO"
echo "  Amount: $AMOUNT satoshis"
echo "  Network: $NETWORK"

echo ""

# Step 5: Crear una transacción de prueba (simplificado)
print_step "Step 5: Crear transacción de prueba"
echo "⚠️  NOTA: Para un test completo, necesitas:"
echo "   1. Wallet BSV testnet con fondos"
echo "   2. MCP wallet configurado"
echo "   3. O usar el script de test integration que crea transacciones reales"
echo ""
echo "Este script solo verifica que:"
echo "  ✓ Resource server retorna 402 cuando no hay pago"
echo "  ✓ PaymentRequirements son correctos"
echo "  ✓ Facilitador está accesible"

echo ""

# Step 6: Verificar estructura de PaymentRequirements
print_step "Step 6: Validar estructura de PaymentRequirements"

REQUIRED_FIELDS=("scheme" "network" "maxAmountRequired" "resource" "payTo" "maxTimeoutSeconds")
ALL_VALID=true

for field in "${REQUIRED_FIELDS[@]}"; do
    if echo "$PAYMENT_REQUIREMENTS" | jq -e ".$field" > /dev/null; then
        print_success "Campo '$field' presente"
    else
        print_error "Campo '$field' faltante"
        ALL_VALID=false
    fi
done

echo ""

# Step 7: Verificar valores correctos
print_step "Step 7: Verificar valores de PaymentRequirements"

SCHEME=$(echo "$PAYMENT_REQUIREMENTS" | jq -r '.scheme')
if [ "$SCHEME" = "exact" ]; then
    print_success "Scheme es 'exact'"
else
    print_error "Scheme debería ser 'exact', es: $SCHEME"
    ALL_VALID=false
fi

if [ "$NETWORK" = "bsv-testnet" ]; then
    print_success "Network es 'bsv-testnet'"
else
    print_error "Network debería ser 'bsv-testnet', es: $NETWORK"
    ALL_VALID=false
fi

if [ ! -z "$PAY_TO" ]; then
    print_success "PayTo address presente: $PAY_TO"
else
    print_error "PayTo address faltante"
    ALL_VALID=false
fi

echo ""

# Summary
print_step "📊 Resumen del Test"
if [ "$ALL_VALID" = true ]; then
    print_success "Todas las validaciones pasaron ✅"
    echo ""
    echo "El resource server está funcionando correctamente y retorna"
    echo "PaymentRequirements válidos según la especificación X402."
    echo ""
    echo "Para probar el flujo completo de pago, ejecuta:"
    echo "  npm run test:e2e"
    echo ""
    echo "O usa el MCP wallet con Claude Desktop para crear pagos reales."
    exit 0
else
    print_error "Algunas validaciones fallaron ❌"
    exit 1
fi
