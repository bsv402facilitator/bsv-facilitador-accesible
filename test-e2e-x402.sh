#!/bin/bash

# Script de prueba End-to-End del flujo X402 completo
# Prueba la integración entre MCP Wallet y Facilitador

set -e  # Exit on error

echo "=========================================="
echo "🧪 Prueba End-to-End X402"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
FACILITATOR_URL="https://facilitador-bsv-x402-accesible.andresleontest.workers.dev"
RESOURCE_SERVER_URL="https://x402-resource-server-accesible-prod.andresleontest.workers.dev"
PAYOUT_ADDRESS="mhSDV8SPswwXCGFpkE8pTWUftVnSW6g3qk"

echo "📍 Configuración:"
echo "  Facilitador: $FACILITATOR_URL"
echo "  Resource Server: $RESOURCE_SERVER_URL"
echo "  Dirección de pago: $PAYOUT_ADDRESS"
echo ""

# Paso 1: Health check del facilitador
echo "1️⃣  Health check del facilitador..."
FACILITATOR_HEALTH=$(curl -s "$FACILITATOR_URL/")
if echo "$FACILITATOR_HEALTH" | grep -q "bsv-testnet"; then
    echo -e "${GREEN}✅ Facilitador disponible${NC}"
    echo "   $(echo "$FACILITATOR_HEALTH" | jq -r '.accessibility.plainLanguage')"
else
    echo -e "${RED}❌ Facilitador no responde correctamente${NC}"
    echo "Respuesta: $FACILITATOR_HEALTH"
    exit 1
fi
echo ""

# Paso 2: Health check del resource server
echo "2️⃣  Health check del resource server..."
RESOURCE_HEALTH=$(curl -s "$RESOURCE_SERVER_URL/")
if echo "$RESOURCE_HEALTH" | grep -q "X402 Resource Server"; then
    echo -e "${GREEN}✅ Resource Server disponible${NC}"
else
    echo -e "${RED}❌ Resource Server no responde correctamente${NC}"
    exit 1
fi
echo ""

# Paso 3: Obtener PaymentRequirements del endpoint protegido
echo "3️⃣  Solicitando acceso sin pago (debe retornar 402)..."
PAYMENT_REQUIREMENTS=$(curl -s -w "\n%{http_code}" "$RESOURCE_SERVER_URL/api/data")
HTTP_CODE=$(echo "$PAYMENT_REQUIREMENTS" | tail -n 1)
REQUIREMENTS_BODY=$(echo "$PAYMENT_REQUIREMENTS" | head -n -1)

if [ "$HTTP_CODE" = "402" ]; then
    echo -e "${GREEN}✅ Recibido 402 Payment Required${NC}"
    echo "Payment Requirements:"
    echo "$REQUIREMENTS_BODY" | jq '.'
else
    echo -e "${RED}❌ Se esperaba 402, recibido: $HTTP_CODE${NC}"
    exit 1
fi
echo ""

# Paso 4: Crear transacción de pago usando el MCP wallet
echo "4️⃣  Creando transacción de pago BSV..."
echo -e "${YELLOW}ℹ️  Usando wallet importada desde wallet-imported.json${NC}"

# Cambiar al directorio del MCP wallet (con el código compilado)
cd /c/Users/andre/programacion/x402/bsv/mcp-wallet

if [ ! -f "wallet-imported.json" ]; then
    echo -e "${RED}❌ No se encontró wallet-imported.json${NC}"
    exit 1
fi

# Usar el script quick-payment
echo "   Creando payload con quick-payment.ts..."

# Ejecutar y capturar el payload
PAYMENT_PAYLOAD=$(PAY_TO="$PAYOUT_ADDRESS" AMOUNT="1000" npx tsx scripts/quick-payment.ts 2>&1)

# Verificar que no sea un error
if echo "$PAYMENT_PAYLOAD" | grep -qi "error\|failed"; then
    echo -e "${RED}❌ Error al generar el payment payload${NC}"
    echo "$PAYMENT_PAYLOAD"
    exit 1
fi

if [ -z "$PAYMENT_PAYLOAD" ]; then
    echo -e "${RED}❌ No se pudo generar el payment payload${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Payload de pago generado${NC}"
echo "   Primeros 80 caracteres: ${PAYMENT_PAYLOAD:0:80}..."
echo ""

# Paso 5: Verificar el formato del payload
echo "5️⃣  Validando formato del payload..."

# Decodificar el payload y verificar que tenga transaction en HEX
DECODED_PAYLOAD=$(echo "$PAYMENT_PAYLOAD" | base64 -d)
echo "   Estructura del payload:"
echo "$DECODED_PAYLOAD" | jq '.'

# Verificar que transaction está en HEX (no en BASE64)
TX_HEX=$(echo "$DECODED_PAYLOAD" | jq -r '.payload.transaction')
if [[ "$TX_HEX" =~ ^[0-9a-fA-F]+$ ]]; then
    echo -e "${GREEN}✅ Transaction está en formato HEX correcto${NC}"
    echo "   Longitud: ${#TX_HEX} caracteres"
else
    echo -e "${RED}❌ Transaction no está en formato HEX${NC}"
    exit 1
fi
echo ""

# Paso 6: Enviar pago al resource server
echo "6️⃣  Enviando pago al resource server..."
PAYMENT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "X-PAYMENT: $PAYMENT_PAYLOAD" \
    "$RESOURCE_SERVER_URL/api/data")

HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$PAYMENT_RESPONSE" | head -n -1)

echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ ¡Pago exitoso! Datos protegidos recibidos${NC}"
    echo ""
    echo "📦 Respuesta del servidor:"
    echo "$RESPONSE_BODY" | jq '.'
    echo ""

    # Extraer información del pago
    TXID=$(echo "$RESPONSE_BODY" | jq -r '.payment.txid')
    PAYER=$(echo "$RESPONSE_BODY" | jq -r '.payment.payer')
    AMOUNT=$(echo "$RESPONSE_BODY" | jq -r '.payment.amount')

    echo -e "${GREEN}✅ Información del pago:${NC}"
    echo "   TXID: $TXID"
    echo "   Payer: $PAYER"
    echo "   Amount: $AMOUNT satoshis"
    echo ""

    # Mostrar metadata de accesibilidad
    echo "♿ Metadata de accesibilidad:"
    echo "$RESPONSE_BODY" | jq '.accessibility'

elif [ "$HTTP_CODE" = "402" ]; then
    echo -e "${YELLOW}⚠️  Pago rechazado (402)${NC}"
    echo ""
    echo "Respuesta del servidor:"
    echo "$RESPONSE_BODY" | jq '.'
    echo ""

    # Verificar si hay metadata de accesibilidad en el error
    if echo "$RESPONSE_BODY" | jq -e '.accessibility' > /dev/null 2>&1; then
        echo "♿ Metadata de accesibilidad del error:"
        echo "$RESPONSE_BODY" | jq '.accessibility'
    fi
else
    echo -e "${RED}❌ Error inesperado: $HTTP_CODE${NC}"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Prueba End-to-End completada"
echo "=========================================="
