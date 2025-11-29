/**
 * Cliente de Ejemplo - X402 Resource Server
 *
 * Este es un ejemplo de cómo un cliente (navegador, CLI, etc.) puede
 * interactuar con el resource server usando el protocolo X402.
 *
 * Flujo:
 * 1. Hacer request sin pago → Recibir PaymentRequirements
 * 2. Crear transacción BSV que pague a la dirección especificada
 * 3. Hacer request con header X-PAYMENT → Recibir datos protegidos
 */

import type {
  PaymentRequirements,
  PaymentPayload,
} from '../types';

// Configuración
const RESOURCE_SERVER_URL = 'http://localhost:8788';
const PROTECTED_ENDPOINT = '/api/data';

/**
 * Ejemplo 1: Request sin pago (debería retornar 402)
 */
async function exampleRequestWithoutPayment() {
  console.log('📋 Ejemplo 1: Request sin pago\n');

  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}${PROTECTED_ENDPOINT}`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 402) {
      const requirements: PaymentRequirements = await response.json();

      console.log('\n💰 PaymentRequirements recibidos:');
      console.log(`  Scheme: ${requirements.scheme}`);
      console.log(`  Network: ${requirements.network}`);
      console.log(`  Amount: ${requirements.maxAmountRequired} satoshis`);
      console.log(`  Pay to: ${requirements.payTo}`);
      console.log(`  Resource: ${requirements.resource}`);
      console.log(`  Description: ${requirements.description}`);
      console.log(`  Timeout: ${requirements.maxTimeoutSeconds} segundos`);

      return requirements;
    } else {
      console.error('❌ Se esperaba 402, se obtuvo:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al hacer request:', error);
    return null;
  }
}

/**
 * Ejemplo 2: Crear PaymentPayload (simplificado)
 *
 * NOTA: En producción, usa el MCP wallet o @bsv/sdk para crear
 * transacciones reales. Este es solo un ejemplo de la estructura.
 */
function exampleCreatePaymentPayload(
  requirements: PaymentRequirements
): PaymentPayload {
  console.log('\n\n🔧 Ejemplo 2: Crear PaymentPayload\n');

  // En producción, aquí crearías una transacción BSV real
  // que pague a requirements.payTo con la cantidad requirements.maxAmountRequired
  const payload: PaymentPayload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'bsv-testnet',
    payload: {
      // NOTA: Esto es un placeholder. En producción, usa una transacción real.
      transaction: '0100000001abcd...', // Transaction hex
      // Opcional: raw transaction bytes
      // rawTransaction: Uint8Array,
    },
  };

  console.log('✅ PaymentPayload creado (estructura de ejemplo)');
  console.log('⚠️  En producción, usa MCP wallet o @bsv/sdk para crear la transacción real\n');

  return payload;
}

/**
 * Ejemplo 3: Codificar PaymentPayload en base64 para header X-PAYMENT
 */
function encodePaymentPayload(payload: PaymentPayload): string {
  console.log('\n📦 Ejemplo 3: Codificar PaymentPayload en base64\n');

  const jsonString = JSON.stringify(payload);
  const base64Encoded = Buffer.from(jsonString).toString('base64');

  console.log('✅ PaymentPayload codificado en base64');
  console.log(`Length: ${base64Encoded.length} caracteres\n`);

  return base64Encoded;
}

/**
 * Ejemplo 4: Request con pago (debería retornar 200 con datos)
 */
async function exampleRequestWithPayment(paymentPayload: string) {
  console.log('\n\n💳 Ejemplo 4: Request con pago\n');

  try {
    const response = await fetch(`${RESOURCE_SERVER_URL}${PROTECTED_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-PAYMENT': paymentPayload,
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.status === 200) {
      const data = await response.json();

      console.log('\n✅ ¡Pago exitoso! Datos recibidos:');
      console.log(`  Message: ${data.message}`);
      console.log('\n  📊 Data:');
      console.log(`    Timestamp: ${data.data.timestamp}`);
      console.log(`    Content: ${data.data.content}`);
      console.log(`    Fun Fact: ${data.data.funFact}`);

      if (data.payment) {
        console.log('\n  💰 Payment Info:');
        console.log(`    TXID: ${data.payment.txid}`);
        console.log(`    Payer: ${data.payment.payer}`);
        console.log(`    Network: ${data.payment.network}`);
        console.log(`    Amount: ${data.payment.amount} satoshis`);
      }

      if (data.accessibility) {
        console.log('\n  ♿ Accessibility Metadata:');
        console.log(`    Plain Language: ${data.accessibility.plainLanguage}`);
        console.log(`    Explanation: ${data.accessibility.explanation}`);
        if (data.accessibility.stepByStep) {
          console.log(`    Step-by-Step:`);
          data.accessibility.stepByStep.forEach((step: string, i: number) => {
            console.log(`      ${i + 1}. ${step}`);
          });
        }
        if (data.accessibility.hints) {
          console.log(`    Hints:`);
          data.accessibility.hints.forEach((hint: string) => {
            console.log(`      💡 ${hint}`);
          });
        }
      }

      return data;
    } else if (response.status === 402) {
      const error = await response.json();

      console.log('\n❌ Pago inválido o insuficiente:');
      console.log(`  Error: ${error.error}`);

      if (error.accessibility) {
        console.log(`  Plain Language: ${error.accessibility.plainLanguage}`);
        console.log(`  Explanation: ${error.accessibility.explanation}`);
      }

      return null;
    } else {
      console.error('❌ Error inesperado:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al hacer request:', error);
    return null;
  }
}

/**
 * Ejemplo 5: Flujo completo (solo estructura, sin transacción real)
 */
async function exampleCompleteFlow() {
  console.log('🚀 Ejemplo 5: Flujo Completo X402\n');
  console.log('='.repeat(60));

  // Paso 1: Request sin pago
  const requirements = await exampleRequestWithoutPayment();
  if (!requirements) {
    console.error('❌ No se pudieron obtener PaymentRequirements');
    return;
  }

  // Paso 2: Crear PaymentPayload (estructura de ejemplo)
  const payload = exampleCreatePaymentPayload(requirements);

  // Paso 3: Codificar en base64
  const encodedPayload = encodePaymentPayload(payload);

  // Paso 4: Request con pago
  console.log('⚠️  NOTA: Este request fallará porque el payload es de ejemplo,');
  console.log('   no una transacción BSV real. Para un test completo, usa:');
  console.log('   - MCP wallet con Claude Desktop');
  console.log('   - O el script de integration test');
  console.log('');

  // Comentado porque fallará con payload de ejemplo
  // await exampleRequestWithPayment(encodedPayload);

  console.log('\n='.repeat(60));
  console.log('✅ Flujo de ejemplo completado\n');
}

/**
 * Ejemplo 6: Cliente web (HTML + JavaScript)
 */
function exampleWebClientCode() {
  console.log('\n\n🌐 Ejemplo 6: Cliente Web (HTML + JavaScript)\n');

  const htmlExample = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cliente X402 - Demo</title>
</head>
<body>
  <h1>Cliente X402 Resource Server</h1>

  <div id="status">Cargando...</div>
  <div id="data"></div>

  <script>
    async function accessProtectedResource() {
      const resourceUrl = 'http://localhost:8788/api/data';

      // Paso 1: Request sin pago
      const response1 = await fetch(resourceUrl);

      if (response1.status === 402) {
        const requirements = await response1.json();
        console.log('Payment Required:', requirements);

        document.getElementById('status').innerHTML = \`
          <h2>Pago Requerido</h2>
          <p>Amount: \${requirements.maxAmountRequired} satoshis</p>
          <p>Pay to: \${requirements.payTo}</p>
        \`;

        // Aquí crearías la transacción BSV usando MCP wallet o similar
        // y luego harías el segundo request con el header X-PAYMENT

        // Ejemplo (simplificado):
        // const paymentPayload = await createBSVTransaction(requirements);
        // const base64Payload = btoa(JSON.stringify(paymentPayload));
        //
        // const response2 = await fetch(resourceUrl, {
        //   headers: { 'X-PAYMENT': base64Payload }
        // });
        //
        // if (response2.ok) {
        //   const data = await response2.json();
        //   document.getElementById('data').innerHTML = \`
        //     <h2>Datos Protegidos</h2>
        //     <p>\${data.message}</p>
        //     <pre>\${JSON.stringify(data.data, null, 2)}</pre>
        //   \`;
        // }
      }
    }

    accessProtectedResource();
  </script>
</body>
</html>
  `;

  console.log('Código de ejemplo para cliente web:');
  console.log(htmlExample);
}

/**
 * Ejemplo 7: Cliente CLI (Node.js)
 */
function exampleCLIClientCode() {
  console.log('\n\n💻 Ejemplo 7: Cliente CLI (Node.js)\n');

  const cliExample = `
// cli-client.js
import fetch from 'node-fetch';

async function fetchProtectedData() {
  const resourceUrl = 'http://localhost:8788/api/data';

  // Request sin pago
  const response = await fetch(resourceUrl);

  if (response.status === 402) {
    const requirements = await response.json();

    console.log('Payment Requirements:');
    console.log(\`  Amount: \${requirements.maxAmountRequired} satoshis\`);
    console.log(\`  Pay to: \${requirements.payTo}\`);
    console.log(\`  Network: \${requirements.network}\`);

    // Aquí integrarías con @bsv/sdk para crear la transacción
    // const tx = await createBSVTransaction(requirements);
    // const paymentPayload = { x402Version: 1, ... };
    // const encoded = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    //
    // const response2 = await fetch(resourceUrl, {
    //   headers: { 'X-PAYMENT': encoded }
    // });
    //
    // const data = await response2.json();
    // console.log('Protected Data:', data);
  }
}

fetchProtectedData();
  `;

  console.log('Código de ejemplo para cliente CLI:');
  console.log(cliExample);
}

// Ejecutar ejemplos
async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  EJEMPLOS DE CLIENTE - X402 RESOURCE SERVER');
  console.log('═'.repeat(60));
  console.log('\n');

  // Solo ejecutar el ejemplo completo (estructura, sin request real con pago)
  await exampleCompleteFlow();

  // Mostrar ejemplos de código
  exampleWebClientCode();
  exampleCLIClientCode();

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  FIN DE LOS EJEMPLOS');
  console.log('═'.repeat(60));
  console.log('\n');
  console.log('Para ejecutar este archivo:');
  console.log('  npx tsx src/resource-server/example-client.ts');
  console.log('\n');
  console.log('Para probar con transacciones reales:');
  console.log('  1. Usa MCP wallet con Claude Desktop');
  console.log('  2. O ejecuta: npm run test:e2e');
  console.log('\n');
}

// Solo ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Exportar funciones para uso en otros módulos
export {
  exampleRequestWithoutPayment,
  exampleCreatePaymentPayload,
  encodePaymentPayload,
  exampleRequestWithPayment,
  exampleCompleteFlow,
};
