/**
 * V2 Spanish Templates - 5 cognitive levels (beginner → expert)
 * Includes: plain language, detailed explanations, examples, glossary, memory aids
 */

import type { MessageCatalogV2 } from '../types';

export const spanishTemplatesV2: MessageCatalogV2 = {
  errors: {
    verify: {
      invalidAmount: {
        beginner: {
          plainLanguage: 'No enviaste suficiente dinero',
          explanation:
            'El pago requiere más dinero del que enviaste. Es como intentar pagar 5€ con solo 2€.',
          detailedExplanation:
            'Cada pago necesita una cantidad mínima específica. Tu transacción incluye menos dinero del necesario. Esto pasa cuando el monto es menor al requerido o cuando olvidas incluir las comisiones de red.',
          stepByStep: [
            'Revisa cuánto dinero requiere el pago',
            'Verifica cuánto incluiste en tu transacción',
            'Suma la diferencia que falta',
            'Crea una nueva transacción con el monto correcto',
          ],
          hints: {
            ifError: 'Verifica que el monto incluya también las comisiones de red (fees)',
            commonMistakes: [
              'Olvidar sumar las comisiones de red al monto',
              'Confundir satoshis con BSV (1 BSV = 100 millones de satoshis)',
              'Copiar mal el número del monto requerido',
            ],
            nextSteps: 'Verifica el monto requerido y crea un nuevo pago con la cantidad correcta',
          },
          examples: [
            {
              scenario: 'Comprar un café con BSV',
              input: 'Envías 1000 satoshis pero se requieren 5000 satoshis',
              output: 'Error: monto insuficiente',
              explanation: 'Es como pagar 1€ por un café de 5€. Necesitas enviar 4000 satoshis más',
            },
          ],
          memoryAids: [
            '💡 Siempre verifica el monto ANTES de enviar',
            '💡 Monto total = precio + comisión de red',
          ],
        },
        simple: {
          plainLanguage: 'El monto del pago es menor al requerido',
          explanation:
            'La transacción BSV que enviaste incluye menos satoshis de los necesarios. El output hacia la dirección del vendedor no alcanza el monto mínimo especificado.',
          detailedExplanation:
            'Cada transacción BSV tiene outputs (salidas) que especifican cuántos satoshis va a recibir cada dirección. Para que el pago sea válido, al menos uno de estos outputs debe enviar el monto exacto o mayor a la dirección especificada en los requisitos del pago. Tu transacción no cumple este criterio.',
          stepByStep: [
            'Identifica el monto requerido en satoshis',
            'Localiza el output que paga al vendedor en tu transacción',
            'Compara: monto enviado vs. monto requerido',
            'Ajusta la transacción para incluir el monto correcto',
          ],
          hints: {
            ifError:
              'Verifica que estés usando la misma unidad (satoshis). 1 BSV = 100,000,000 satoshis',
            commonMistakes: [
              'Confundir el orden de los outputs en la transacción',
              'No incluir suficientes satoshis para cubrir monto + fees',
              'Usar BSV en vez de satoshis en el cálculo',
            ],
            nextSteps:
              'Recalcula el output hacia la dirección del vendedor y asegúrate que sea >= monto requerido',
          },
          examples: [
            {
              scenario: 'Pago de 5000 satoshis',
              input: 'Output[0]: 3000 sats a dirección vendedor, Output[1]: 1000 sats cambio',
              output: 'Error: se requieren 5000 sats pero solo enviaste 3000',
              explanation: 'El output principal tiene 3000 sats, faltan 2000 para cumplir el requisito',
            },
          ],
          memoryAids: ['📌 Monto en output >= monto requerido', '📌 Siempre en satoshis, no BSV'],
        },
        medium: {
          plainLanguage: 'El output de pago no alcanza el monto especificado',
          explanation:
            'La validación de la transacción detectó que ningún output paga el monto requerido a la dirección destino. Esto puede deberse a un cálculo incorrecto del monto o a la estructura de outputs de la transacción.',
          detailedExplanation:
            'El facilitador valida que exista al menos un output P2PKH que pague exactamente o más satoshis del monto especificado a la dirección del vendedor. La validación falla si: (1) ningún output va a la dirección correcta, (2) el output correcto tiene menos satoshis del requerido, o (3) los fees consumieron parte del monto destinado al pago.',
          stepByStep: [
            'Extrae la dirección destino de los requisitos del pago',
            'Itera sobre todos los outputs de la transacción',
            'Para cada output P2PKH, verifica si paga a la dirección destino',
            'Compara el monto del output con el monto requerido',
            'Ajusta el output o crea uno nuevo con el monto correcto',
          ],
          hints: {
            ifError:
              'Usa @bsv/sdk para decodificar los outputs y verificar direcciones. Asegúrate de comparar en satoshis como strings para evitar pérdida de precisión.',
            commonMistakes: [
              'Usar número flotante en vez de string para montos grandes',
              'No verificar el tipo de output (debe ser P2PKH)',
              'Calcular fees incorrectamente reduciendo el monto del pago',
            ],
            nextSteps:
              'Reconstruye la transacción asegurándote que un output pague >= monto requerido a la dirección correcta',
            troubleshooting:
              '1. Decodifica la tx con Transaction.fromHex()\n2. Itera tx.outputs\n3. Usa output.lockingScript.toAddress() para comparar direcciones',
          },
          examples: [
            {
              scenario: 'Estructura de outputs incorrecta',
              input:
                'Requerido: 10000 sats a 1ABC...\nTx outputs: [8000 sats a 1ABC..., 2000 sats cambio]',
              output: 'Error: output principal solo tiene 8000 sats, se requieren 10000',
              explanation:
                'Aunque la suma total sea 10000, el output individual a 1ABC... debe ser >= 10000',
            },
          ],
          memoryAids: [
            '🔍 Validación: exists(output) where output.address == required.address AND output.amount >= required.amount',
            '🔍 Siempre verificar tipo de script (P2PKH)',
          ],
        },
        advanced: {
          plainLanguage: 'Monto insuficiente en output P2PKH hacia dirección destino',
          explanation:
            'La función isP2PKHToAddress() no encontró ningún output que cumpla: (1) script tipo P2PKH, (2) dirección coincide con paymentRequirements.address, (3) satoshis >= paymentRequirements.amount. Error típico en fee estimation o UTXO selection.',
          detailedExplanation:
            'El algoritmo de validación itera sobre tx.outputs usando @bsv/sdk, decodifica cada lockingScript, extrae la address con toAddress(), y compara con la dirección requerida. Si encuentra coincidencia, valida que output.satoshis (BigInt) sea >= amount requerido. Posibles causas del fallo: (1) fee mal calculado que consumió parte del output principal, (2) UTXO selection insuficiente, (3) mismatch entre mainnet/testnet addresses, (4) error en construcción del locking script.',
          stepByStep: [
            'Parsear transaction hex: Transaction.fromHex(payload.transaction)',
            'Iterar outputs: for (const output of tx.outputs)',
            'Verificar tipo P2PKH: lockingScript matches OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG',
            'Extraer address: const addr = output.lockingScript.toAddress()',
            'Comparar: addr.toString() === requirements.address',
            'Validar monto: BigInt(output.satoshis) >= BigInt(requirements.amount)',
          ],
          hints: {
            ifError:
              'Revisa fee estimation. Usa tx.getFee() para calcular el fee real y ajusta inputs/outputs. Verifica que usas la red correcta (testnet/mainnet) para derivar addresses.',
            commonMistakes: [
              'Fee estimation incorrecta que reduce el output principal',
              'Usar address de mainnet en testnet (o viceversa)',
              'Precisión perdida al convertir satoshis a number en vez de BigInt',
              'No validar el tipo de script antes de llamar toAddress()',
            ],
            nextSteps:
              'Usa un constructor de transacciones robusto (ej: @bsv/sdk Transaction Builder) que maneje fees automáticamente',
            troubleshooting:
              '1. Loggea tx.outputs.map(o => ({addr: o.lockingScript.toAddress()?.toString(), sats: o.satoshis}))\n2. Compara con requirements.address y requirements.amount\n3. Si address es null, el script no es P2PKH válido',
            relatedResources: [
              {
                title: 'BSV SDK Transaction Builder',
                url: 'https://docs.bsvblockchain.org/sdk/transactions',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Fee mal calculado',
              input:
                'UTXO: 15000 sats, Required: 10000 sats, Fee calculado: 200 sats\nOutput construido: 14800 sats a vendor, pero required es 10000',
              output: 'Error: output tiene 14800 pero se interpretó como < 10000 por error lógico',
              explanation:
                'Error de comparación: si se comparó strings sin parsear, "14800" < "10000" lexicográficamente',
            },
          ],
          memoryAids: [
            '⚙️ Siempre: BigInt(output.satoshis) >= BigInt(required.amount)',
            '⚙️ toAddress() puede retornar null si script no es P2PKH',
          ],
        },
        expert: {
          plainLanguage: 'Output validation failed: insufficient satoshis in P2PKH output to target address',
          explanation:
            'Transaction output validation using @bsv/sdk failed at isP2PKHToAddress() predicate. No output satisfies: script.isP2PKH() ∧ script.toAddress() == req.addr ∧ output.satoshis >= req.amount. Root cause: fee miscalculation, UTXO selection algorithm failure, or script construction error.',
          detailedExplanation:
            'The facilitator implements a strict output validation policy: it iterates over all transaction outputs, decodes the locking script, checks for P2PKH pattern (OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG), extracts the embedded public key hash, derives the address using Base58Check with appropriate network prefix, and compares against requirements.address. Amount validation uses string-based BigInt comparison to avoid floating-point precision loss. Common failure modes: (1) fee estimation algorithm consumed the payment amount, (2) UTXO selection produced insufficient inputs, (3) network mismatch (mainnet vs testnet address derivation), (4) malformed script that fails P2PKH pattern matching, (5) off-by-one error in satoshi calculation due to improper integer handling.',
          stepByStep: [
            'Decode transaction: tx = Transaction.fromHex(payload.transaction)',
            'Iterate outputs with early termination: for (const [idx, output] of tx.outputs.entries())',
            'Pattern match locking script for P2PKH: verify OP codes sequence',
            'Extract pubKeyHash: const pkh = lockingScript.chunks[2].data (20 bytes)',
            'Derive address: const addr = Address.fromPublicKeyHash(pkh, network)',
            'Validate address match: addr.toString() === requirements.address',
            'Validate amount using BigInt: BigInt(output.satoshis) >= BigInt(requirements.amount)',
            'If match found, return true; else continue iteration',
            'If loop completes without match, throw InvalidAmountError',
          ],
          hints: {
            ifError:
              'Profile the transaction construction pipeline. Check: (1) UTXO selection: sum(inputs) >= sum(outputs) + fee, (2) fee calculation: use accurate fee-per-byte rate, (3) network prefix: 0x00 for mainnet, 0x6F for testnet, (4) script generation: verify OP code sequence matches P2PKH template.',
            commonMistakes: [
              'Using JavaScript number type for satoshis (loses precision above 2^53)',
              'Hardcoding fee instead of calculating dynamically based on tx size',
              'Not accounting for change output in UTXO selection',
              'Comparing addresses without normalizing network prefix',
              'Forgetting to validate script type before calling toAddress() (throws on non-P2PKH)',
            ],
            nextSteps:
              'Implement a robust transaction builder: use @bsv/sdk Transaction.from() with automatic fee calculation, UTXO selection via greedy algorithm, and change output generation. Validate in testnet before mainnet deployment.',
            troubleshooting:
              'Debug steps:\n1. tx.outputs.forEach((o,i) => console.log(`Out${i}: ${o.lockingScript.toASM()} → ${o.lockingScript.toAddress()?.toString()} (${o.satoshis} sats)`))\n2. Verify script pattern: should be "OP_DUP OP_HASH160 <pkh> OP_EQUALVERIFY OP_CHECKSIG"\n3. Check network: Address.fromPublicKeyHash(pkh, network) must match expected network\n4. Validate BigInt comparison: BigInt("1000") >= BigInt("500") === true',
            safeguards: [
              'Never use floating-point for satoshi amounts',
              'Always validate script type before address derivation',
              'Use testnet for initial validation',
              'Implement idempotency checks to prevent double-spend',
            ],
            relatedResources: [
              {
                title: 'BSV Transaction Structure',
                url: 'https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions',
                type: 'documentation',
              },
              {
                title: '@bsv/sdk API Reference',
                url: 'https://docs.bsvblockchain.org/sdk/',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Precision loss in JavaScript number',
              input:
                'Required: 9007199254740992 sats (2^53), Sent as number: 9007199254740992\nAfter JSON.parse: 9007199254740992 (rounded)',
              output: 'Validation fails due to precision loss in number representation',
              explanation:
                'JavaScript number can only represent integers up to 2^53-1 precisely. Use string representation for amounts.',
            },
            {
              scenario: 'Network mismatch',
              input:
                'testnet tx with output to mainnet address 1ABC...\nFacilitator expects testnet address mXYZ...',
              output: 'Address derivation produces mXYZ... but tx has 1ABC...',
              explanation:
                'Address prefixes differ: mainnet (1..., 3...) vs testnet (m..., n..., 2...)',
            },
          ],
          memoryAids: [
            '🧠 Validation logic: ∃ output ∈ tx.outputs : (isP2PKH(output.script) ∧ getAddress(output.script) = req.addr ∧ output.satoshis ≥ req.amount)',
            '🧠 Always: string→BigInt for amounts, never number',
            '🧠 toAddress() returns null for non-P2PKH scripts',
          ],
        },
      },

      invalidAddress: {
        beginner: {
          plainLanguage: 'La dirección de pago es incorrecta',
          explanation:
            'La dirección BSV que usaste no es válida o no coincide con la requerida. Es como escribir mal la dirección de envío de un paquete.',
          stepByStep: [
            'Copia nuevamente la dirección completa',
            'Verifica que no falten ni sobren caracteres',
            'Asegúrate de usar la dirección de la red correcta',
            'Intenta el pago de nuevo',
          ],
          hints: {
            ifError: 'Las direcciones BSV son sensibles a mayúsculas/minúsculas',
            commonMistakes: [
              'Copiar solo parte de la dirección',
              'Confundir dirección de testnet con mainnet',
              'Agregar espacios al copiar',
            ],
            nextSteps: 'Copia la dirección completa sin espacios y verifica que sea correcta',
          },
          examples: [
            {
              scenario: 'Dirección incompleta',
              input: '1A1zP1eP5QGefi2DM (falta el resto)',
              output: 'Error: dirección inválida',
              explanation: 'La dirección debe tener entre 26-35 caracteres, esta tiene solo 19',
            },
          ],
          memoryAids: ['💡 Direcciones válidas empiezan con 1 o 3 (mainnet) o m/n (testnet)'],
        },
        simple: {
          plainLanguage: 'Dirección BSV inválida o no coincide con la requerida',
          explanation:
            'La dirección del pagador extraída de la transacción no es válida según el formato BSV o no coincide con la esperada por el vendedor.',
          stepByStep: [
            'Verifica que la dirección use caracteres válidos (Base58)',
            'Confirma que el checksum de la dirección sea correcto',
            'Compara con la dirección requerida caracter por caracter',
            'Si usas testnet, asegúrate que la dirección sea de testnet',
          ],
          hints: {
            ifError:
              'Usa una librería como @bsv/sdk para validar direcciones. No valides manualmente con regex.',
            commonMistakes: [
              'Mezclar direcciones de mainnet y testnet',
              'No validar el checksum de la dirección',
              'Asumir que cualquier string es una dirección válida',
            ],
            nextSteps: 'Usa Address.fromString(addr) de @bsv/sdk para validar antes de enviar',
          },
          examples: [
            {
              scenario: 'Checksum inválido',
              input: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (última letra cambiada)',
              output: 'Error: checksum de dirección inválido',
              explanation: 'La dirección no pasa la validación Base58Check',
            },
          ],
          memoryAids: ['📌 Siempre validar con Address.fromString() antes de usar'],
        },
        medium: {
          plainLanguage: 'Address validation failed: formato inválido o network mismatch',
          explanation:
            'La dirección falló la validación Base58Check o pertenece a una red diferente (testnet vs mainnet) de la esperada por el facilitador.',
          stepByStep: [
            'Decodificar dirección con Base58Check',
            'Verificar que el version byte coincida con la red (0x00 mainnet, 0x6F testnet)',
            'Validar el checksum (últimos 4 bytes = hash256(payload).slice(0,4))',
            'Comparar dirección extraída del input de la tx con la requerida',
          ],
          hints: {
            ifError:
              'El error puede ser: (1) dirección malformada, (2) network mismatch, (3) no es una dirección P2PKH. Usa Address.fromString() con try/catch.',
            commonMistakes: [
              'No capturar la excepción de Address.fromString() en direcciones inválidas',
              'Asumir que todas las direcciones son P2PKH (pueden ser P2SH)',
              'No verificar la red al extraer la dirección del input',
            ],
            nextSteps: 'Implementa validación robusta con manejo de errores apropiado',
            troubleshooting:
              '1. try { Address.fromString(addr) } catch (e) { // invalid }\n2. Verifica network: addr.network === "mainnet" o "testnet"\n3. Compara: extractedAddr === requiredAddr',
          },
          examples: [
            {
              scenario: 'Network mismatch',
              input:
                'Facilitador espera mainnet, pero el input usa dirección de testnet mtXWDB...',
              output: 'Error: dirección de red incorrecta (testnet vs mainnet)',
              explanation: 'El version byte no coincide con la red esperada',
            },
          ],
          memoryAids: [
            '🔍 Validación: (1) Base58Check decode, (2) verify version byte, (3) verify checksum',
          ],
        },
        advanced: {
          plainLanguage: 'P2PKH address extraction o validation failed',
          explanation:
            'extractPayerAddress() no pudo derivar una dirección válida desde los inputs de la transacción, o la dirección extraída no coincide con requirements.address. Causas: inputs sin unlocking script válido, network mismatch, o formato de dirección no soportado.',
          stepByStep: [
            'Iterar sobre tx.inputs: for (const input of tx.inputs)',
            'Parsear unlocking script: input.unlockingScript',
            'Extraer public key del último chunk: const pubKey = chunks[chunks.length - 1]',
            'Derivar address: Address.fromPublicKey(pubKey, network)',
            'Validar formato P2PKH: address debe empezar con 1 (mainnet) o m/n (testnet)',
            'Comparar con requirements.address',
          ],
          hints: {
            ifError:
              'Verifica: (1) que los inputs tengan unlocking scripts correctos, (2) que la public key sea válida (33 o 65 bytes comprimida/descomprimida), (3) que uses el network correcto al derivar la address.',
            commonMistakes: [
              'Asumir que el primer input siempre tiene la dirección del pagador',
              'No manejar inputs con múltiples firmas (P2SH)',
              'Derivar address con network incorrecto',
              'No validar que el último chunk sea realmente una public key',
            ],
            nextSteps:
              'Implementa extractPayerAddress() con validación de cada paso y fallback si no se puede extraer',
            troubleshooting:
              '1. input.unlockingScript.chunks.forEach((chunk, i) => console.log(`Chunk ${i}:`, chunk.data?.toString("hex")))\n2. Validar public key: debe ser 33 bytes (comprimida) o 65 bytes (descomprimida)\n3. Address.fromPublicKey() puede lanzar si la key es inválida',
            relatedResources: [
              {
                title: 'Bitcoin Script Format',
                url: 'https://wiki.bitcoinsv.io/index.php/Script',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Public key inválida en unlocking script',
              input: 'Unlocking script con datos corruptos que no forman una public key válida',
              output: 'Error al derivar dirección: public key inválida',
              explanation: 'Address.fromPublicKey() lanza excepción si los datos no son una key ECDSA válida',
            },
          ],
          memoryAids: [
            '⚙️ extractPayerAddress: input → unlocking script → last chunk → public key → address',
            '⚙️ Siempre validar public key length: 33 o 65 bytes',
          ],
        },
        expert: {
          plainLanguage:
            'Address derivation from tx inputs failed: invalid P2PKH unlocking script or network mismatch',
          explanation:
            'The extractPayerAddress() function failed to derive a valid BSV address from transaction inputs. This occurs when: (1) unlocking script does not conform to standard P2PKH pattern (<signature> <publicKey>), (2) extracted public key is malformed (not 33/65 bytes), (3) Address.fromPublicKey() throws due to invalid ECDSA point, or (4) derived address belongs to different network than facilitator configuration.',
          stepByStep: [
            'Parse transaction: tx = Transaction.fromHex(hex)',
            'Access first input: const input = tx.inputs[0] (assumes single-sig)',
            'Decode unlocking script: const chunks = input.unlockingScript.chunks',
            'Validate chunk count: expect 2 chunks for P2PKH ([sig, pubKey])',
            'Extract public key: const pubKey = PublicKey.fromString(chunks[1].data.toString("hex"))',
            'Derive address: const addr = Address.fromPublicKey(pubKey, network)',
            'Validate network: addr.network must match facilitator network (mainnet/testnet)',
            'Compare: addr.toString() === requirements.address',
          ],
          hints: {
            ifError:
              'Debug pipeline: (1) verify input.unlockingScript is not empty, (2) check chunks.length === 2, (3) validate chunks[1].data is 33 or 65 bytes, (4) catch PublicKey.fromString() exceptions, (5) ensure network parameter matches facilitator config.',
            commonMistakes: [
              'Assuming all inputs have same address (multi-input txs may combine different addresses)',
              'Not handling compressed vs uncompressed public keys (33 vs 65 bytes)',
              'Using wrong network in Address.fromPublicKey() call',
              'Not validating ECDSA point on curve (PublicKey constructor validates this)',
              'Comparing addresses case-sensitively (BSV addresses are case-sensitive)',
            ],
            nextSteps:
              'Implement robust address extraction with: (1) validation at each step, (2) try/catch for PublicKey/Address constructors, (3) network verification, (4) fallback to null if extraction fails.',
            troubleshooting:
              'Debugging checklist:\n1. console.log(input.unlockingScript.toHex()) → should show <sig><pubKey>\n2. console.log(chunks.map(c => c.data?.length)) → [~70-73, 33 or 65]\n3. Validate public key: const isValid = PublicKey.fromString(hex).verify() (checks curve membership)\n4. Network check: addr.network === "mainnet" ? "1" : "m/n" prefix',
            safeguards: [
              'Always validate public key is on secp256k1 curve before deriving address',
              'Never assume input[0] is the payer in multi-input transactions',
              'Handle both compressed (33-byte) and uncompressed (65-byte) keys',
              'Verify network matches facilitator configuration before comparison',
            ],
            relatedResources: [
              {
                title: 'P2PKH Transaction Structure',
                url: 'https://wiki.bitcoinsv.io/index.php/Bitcoin_Transactions#Pay_to_Public_Key_Hash_.28P2PKH.29',
                type: 'documentation',
              },
              {
                title: 'secp256k1 Curve',
                url: 'https://en.bitcoin.it/wiki/Secp256k1',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Compressed vs uncompressed public key mismatch',
              input:
                'Unlocking script has uncompressed key (65 bytes), wallet expects compressed (33 bytes)',
              output: 'Derived addresses differ despite same private key',
              explanation:
                'Compressed key: 02/03 + x-coordinate (33 bytes). Uncompressed: 04 + x + y (65 bytes). Both derive different addresses.',
            },
            {
              scenario: 'Invalid ECDSA point',
              input: 'Unlocking script with 33 bytes data that is not a valid curve point',
              output: 'PublicKey.fromString() throws: point not on secp256k1 curve',
              explanation: 'Random 33 bytes != valid public key. Must satisfy y² = x³ + 7 (mod p)',
            },
          ],
          memoryAids: [
            '🧠 P2PKH unlocking: <sig> <pubKey> (2 chunks)',
            '🧠 Public key formats: compressed (33B: 02/03 + x) | uncompressed (65B: 04 + x + y)',
            '🧠 Address.fromPublicKey(key, network) → different addresses for mainnet/testnet',
          ],
        },
      },

      invalidFormat: {
        beginner: {
          plainLanguage: 'La transacción no tiene el formato correcto',
          explanation:
            'Los datos de la transacción que enviaste no se pueden leer. Es como enviar un documento dañado que no se puede abrir.',
          stepByStep: [
            'Verifica que copiaste la transacción completa',
            'Asegúrate de que sea texto hexadecimal (solo 0-9 y a-f)',
            'Intenta generar la transacción de nuevo',
            'Envía la nueva transacción',
          ],
          hints: {
            ifError: 'Las transacciones BSV deben estar en formato hexadecimal',
            commonMistakes: [
              'Copiar solo parte de la transacción',
              'Incluir espacios o caracteres especiales',
              'Usar un formato diferente (base64 en vez de hex)',
            ],
            nextSteps: 'Genera la transacción de nuevo usando tu wallet y copia el hex completo',
          },
          examples: [
            {
              scenario: 'Transacción con caracteres inválidos',
              input: '01000000G1a2b3... (G no es hexadecimal)',
              output: 'Error: formato inválido',
              explanation: 'Hexadecimal solo acepta 0-9 y a-f (o A-F)',
            },
          ],
          memoryAids: ['💡 Hexadecimal válido: solo caracteres 0-9 y a-f'],
        },
        simple: {
          plainLanguage: 'La transacción no se puede decodificar como BSV válido',
          explanation:
            'El hex de la transacción está malformado o incompleto. La librería BSV SDK no puede parsearlo como una transacción válida.',
          stepByStep: [
            'Verifica que el hex sea válido (longitud par, solo 0-9a-f)',
            'Confirma que la estructura coincida con el formato BSV',
            'Usa una librería para validar antes de enviar',
            'Regenera la transacción si es necesario',
          ],
          hints: {
            ifError: 'Usa Transaction.fromHex() para validar la transacción antes de enviarla al facilitador',
            commonMistakes: [
              'Truncar el hex al copiarlo',
              'Codificar en base64 en vez de hex',
              'No incluir todos los campos requeridos (inputs, outputs, locktime)',
            ],
            nextSteps: 'Valida localmente con @bsv/sdk Transaction.fromHex() antes de enviar',
          },
          examples: [
            {
              scenario: 'Hex truncado',
              input: '0100000001a2b3c4... (falta la mitad de la transacción)',
              output: 'Error: unexpected end of data while parsing',
              explanation: 'El parser esperaba más bytes pero el hex termina prematuramente',
            },
          ],
          memoryAids: ['📌 Longitud del hex debe ser par (2 caracteres hex = 1 byte)'],
        },
        medium: {
          plainLanguage: 'Transaction.fromHex() parsing failed: estructura inválida',
          explanation:
            'La función de parseo de @bsv/sdk lanzó un error al intentar decodificar el hex. Esto indica que la estructura binaria no coincide con el formato esperado de una transacción BSV.',
          stepByStep: [
            'Decodifica el hex a bytes: Buffer.from(hex, "hex")',
            'Verifica longitud mínima: tx BSV mínima ≈ 60 bytes',
            'Intenta parsear: Transaction.fromHex(hex)',
            'Si falla, inspecciona los primeros bytes (version, input count, etc.)',
            'Regenera la transacción con un builder confiable',
          ],
          hints: {
            ifError:
              'El error de parseo puede indicar: (1) hex corrupto, (2) formato no-estándar, (3) campos faltantes. Loggea el error completo para diagnóstico.',
            commonMistakes: [
              'Asumir que cualquier hex válido es una transacción válida',
              'No validar la longitud mínima antes de parsear',
              'Mezclar formatos (raw tx vs signed tx vs PSBT)',
            ],
            nextSteps: 'Usa un transaction builder que genere formato estándar garantizado',
            troubleshooting:
              '1. Validar longitud: hex.length % 2 === 0\n2. try { Transaction.fromHex(hex) } catch (e) { console.error(e.message) }\n3. Inspeccionar primeros bytes: Buffer.from(hex, "hex").slice(0, 4) → version (little-endian)',
          },
          examples: [
            {
              scenario: 'Campo varint malformado',
              input: 'Hex con input count = 0xFD pero solo 1 byte siguiente (necesita 2)',
              output: 'Error: varint decode failed, unexpected end of buffer',
              explanation: 'VarInt 0xFD..0xFE requiere 2 bytes adicionales, 0xFF requiere 8 bytes',
            },
          ],
          memoryAids: [
            '🔍 Estructura BSV tx: version(4) + inputs + outputs + locktime(4)',
            '🔍 VarInt encoding: <0xFD = 1 byte, 0xFD = 3 bytes, 0xFE = 5 bytes, 0xFF = 9 bytes',
          ],
        },
        advanced: {
          plainLanguage: 'BSV transaction deserialization failed: schema validation error',
          explanation:
            'El proceso de deserialización de @bsv/sdk detectó un error estructural en la transacción. Posibles causas: (1) version field inválido, (2) varint encoding incorrecto en input/output counts, (3) scripts mal formados, (4) locktime field faltante.',
          stepByStep: [
            'Parsear version: primeros 4 bytes little-endian (típicamente 0x01000000 o 0x02000000)',
            'Leer input count: varint (1-9 bytes)',
            'Para cada input: parsear outpoint (36 bytes), script length (varint), script, sequence (4 bytes)',
            'Leer output count: varint',
            'Para cada output: parsear satoshis (8 bytes), script length (varint), script',
            'Parsear locktime: últimos 4 bytes',
            'Validar: ningún campo puede estar truncado',
          ],
          hints: {
            ifError:
              'Usa Transaction.fromBinary() con buffer inspection. Si falla, implementa parsing manual para identificar el byte exacto donde falla.',
            commonMistakes: [
              'No manejar correctamente varint encoding (confundir con fixed-size integers)',
              'Endianness incorrecto (BSV usa little-endian para integers)',
              'No validar que cada campo tenga suficientes bytes',
              'Asumir que script length coincide con script data length',
            ],
            nextSteps:
              'Implementa validación exhaustiva antes de parsing: check hex length, validate varint positions, ensure all fields present.',
            troubleshooting:
              'Manual parsing:\n1. const buf = Buffer.from(hex, "hex")\n2. let offset = 0\n3. version = buf.readUInt32LE(offset); offset += 4\n4. inputCount = readVarInt(buf, offset)\n5. For each input: outpoint(36) + scriptLen(varint) + script + sequence(4)\n6. Repeat for outputs\n7. locktime = buf.readUInt32LE(offset)',
            relatedResources: [
              {
                title: 'Bitcoin Transaction Serialization',
                url: 'https://wiki.bitcoinsv.io/index.php/Serialization',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Script length mismatch',
              input:
                'Output script length varint dice 25 bytes pero solo quedan 20 bytes en el buffer',
              output: 'Error: insufficient data for script, expected 25 got 20',
              explanation: 'El varint está corrupto o el script fue truncado',
            },
          ],
          memoryAids: [
            '⚙️ Varint decode: <0xFD→1B, 0xFD→3B, 0xFE→5B, 0xFF→9B',
            '⚙️ Input: prevTxHash(32) + outIndex(4) + scriptLen(varint) + script + sequence(4)',
            '⚙️ Output: satoshis(8) + scriptLen(varint) + script',
          ],
        },
        expert: {
          plainLanguage: 'Transaction binary deserialization error: malformed wire format',
          explanation:
            'The transaction hex does not conform to BSV wire protocol specification. Deserialization failed during binary parsing, likely due to: (1) truncated byte stream, (2) incorrect varint encoding in input/output counts or script lengths, (3) invalid version number, (4) missing locktime field, or (5) non-canonical encoding of integer fields.',
          stepByStep: [
            'Validate hex: must be even length, only [0-9a-fA-F]',
            'Convert to buffer: const buf = Buffer.from(hex, "hex")',
            'Read version: buf.readInt32LE(0) → typically 1 or 2',
            'Read input count varint at offset 4: decode using varint rules',
            'For each input (i=0 to inputCount-1):',
            '  - prevTxHash: 32 bytes (reversed for display)',
            '  - prevOutIndex: 4 bytes LE',
            '  - scriptLen: varint',
            '  - unlockingScript: scriptLen bytes',
            '  - sequence: 4 bytes LE',
            'Read output count varint',
            'For each output (i=0 to outputCount-1):',
            '  - satoshis: 8 bytes LE (use BigInt)',
            '  - scriptLen: varint',
            '  - lockingScript: scriptLen bytes',
            'Read locktime: 4 bytes LE',
            'Verify: offset should equal buf.length (no extra/missing bytes)',
          ],
          hints: {
            ifError:
              'Implement comprehensive validation: (1) assert hex.length % 2 === 0, (2) try/catch around Transaction.fromHex(), (3) on error, manually parse to identify failure point, (4) validate all varint positions, (5) ensure buffer has sufficient bytes at each read.',
            commonMistakes: [
              'Not using BigInt for 8-byte satoshi amounts (JavaScript number has 53-bit precision limit)',
              'Reversing txid hash when not needed (internal representation vs display)',
              'Failing to handle witness/segwit format (BSV doesn\'t use segwit, but some wallets may produce it)',
              'Using big-endian instead of little-endian for integer reads',
              'Not validating varint range (0xFD-0xFE requires 2 bytes, 0xFF requires 8 bytes following)',
            ],
            nextSteps:
              'Use a battle-tested library (@bsv/sdk) for all transaction construction. Never manually construct hex strings. Validate all transactions locally before sending to facilitator.',
            troubleshooting:
              'Debugging pipeline:\n1. Hex validation: /^[0-9a-fA-F]*$/.test(hex) && hex.length % 2 === 0\n2. Minimum length: hex.length >= 120 (≈60 bytes for minimal tx)\n3. Manual parse with error logging:\n   try {\n     const tx = Transaction.fromHex(hex);\n   } catch (e) {\n     console.error("Parse failed at:", e.message);\n     // Implement byte-by-byte manual parsing here\n   }\n4. Compare with known-good tx hex from block explorer',
            safeguards: [
              'Always validate hex before attempting to parse',
              'Use Transaction.fromHex() with try/catch, never assume it succeeds',
              'For critical applications, implement redundant validation (parse twice with different libraries)',
              'Log full error stack trace for debugging',
            ],
            relatedResources: [
              {
                title: 'Bitcoin Protocol Specification',
                url: 'https://wiki.bitcoinsv.io/index.php/Protocol',
                type: 'documentation',
              },
              {
                title: 'VarInt Encoding',
                url: 'https://wiki.bitcoinsv.io/index.php/VarInt',
                type: 'documentation',
              },
              {
                title: '@bsv/sdk Transaction API',
                url: 'https://docs.bsvblockchain.org/sdk/transactions',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Varint encoding error',
              input:
                'Input count = 0xFD (indicates 2 more bytes follow) but only 1 byte available',
              output: 'BufferUnderflow: attempted to read 2 bytes at offset X, only 1 remaining',
              explanation:
                'VarInt 0xFD..0xFE format: 0xFD + 2 bytes LE. If buffer ends prematurely, parse fails.',
            },
            {
              scenario: 'Endianness mismatch',
              input: 'Version read as BE instead of LE: 0x01000000 → 16777216 instead of 1',
              output: 'Invalid version number: 16777216 (expected 1 or 2)',
              explanation: 'BSV integers are little-endian. buf.readUInt32BE() is wrong, use readUInt32LE()',
            },
          ],
          memoryAids: [
            '🧠 Tx wire format: version(4) + #in(varint) + inputs + #out(varint) + outputs + locktime(4)',
            '🧠 All integers: little-endian (except txid hash display)',
            '🧠 VarInt: <253→1B | 253→0xFD+2B | 65536→0xFE+4B | 4B→0xFF+8B',
            '🧠 Always: validate buffer length before each read to prevent underflow',
          ],
        },
      },
    },

    settle: {
      alreadyBroadcast: {
        beginner: {
          plainLanguage: 'Esta transacción ya fue enviada anteriormente',
          explanation:
            'La transacción que intentas enviar ya existe en la blockchain. No puedes enviar la misma transacción dos veces.',
          stepByStep: [
            'Verifica si el pago ya se procesó antes',
            'Consulta el estado del pago con el vendedor',
            'Si necesitas pagar de nuevo, crea una transacción nueva',
          ],
          hints: {
            ifError: 'Guarda el ID de transacción (txid) para rastrear pagos',
            commonMistakes: [
              'Hacer clic en "pagar" varias veces',
              'No verificar si el pago ya se completó',
              'Intentar reenviar la misma transacción',
            ],
            nextSteps: 'Verifica el estado del pago antes de crear uno nuevo',
          },
          examples: [
            {
              scenario: 'Doble click en botón de pago',
              input: 'Usuario hace clic 2 veces en "Pagar"',
              output: 'Primera vez: éxito. Segunda vez: ya procesado',
              explanation: 'La blockchain rechaza transacciones duplicadas automáticamente',
            },
          ],
          memoryAids: ['💡 Cada transacción solo se puede enviar una vez'],
        },
        simple: {
          plainLanguage: 'La transacción ya existe en la blockchain BSV',
          explanation:
            'El facilitador detectó que esta transacción (identificada por su txid) ya fue broadcast anteriormente y existe en la blockchain.',
          stepByStep: [
            'Obtén el txid de la transacción: SHA256(SHA256(tx))',
            'Consulta la blockchain para ver si existe',
            'Si existe, no intentes rebroadcast',
            'Si necesitas un nuevo pago, genera una transacción diferente',
          ],
          hints: {
            ifError: 'Usa un explorador de bloques (e.g., whatsonchain.com) para verificar el txid',
            commonMistakes: [
              'No verificar el estado antes de broadcast',
              'Asumir que un error de red significa que no se envió',
              'Reenviar sin cambiar los inputs',
            ],
            nextSteps: 'Implementa verificación de estado antes de broadcast para evitar duplicados',
          },
          examples: [
            {
              scenario: 'Reintento después de timeout',
              input: 'Timeout en primera llamada, usuario reintenta',
              output: 'Transacción ya en blockchain, segundo intento rechazado',
              explanation: 'El primer intento tuvo éxito a pesar del timeout percibido',
            },
          ],
          memoryAids: ['📌 Txid = SHA256(SHA256(raw_tx)) → identificador único'],
        },
        medium: {
          plainLanguage: 'Duplicate transaction detected: txid already on-chain',
          explanation:
            'El facilitador ejecutó una verificación pre-broadcast llamando a getTransaction(txid) de WhatsOnChain. La respuesta indica que la transacción ya existe, por lo que el broadcast se omite.',
          stepByStep: [
            'Calcular txid: hash256(serialized_tx).reverse()',
            'Llamar GET /tx/{txid}/hex en WhatsOnChain API',
            'Si retorna 200 con hex: transacción ya existe',
            'Si retorna 404: transacción no existe, proceder con broadcast',
            'Implementar lógica de idempotencia para evitar retries',
          ],
          hints: {
            ifError:
              'Implementa detección de duplicados antes de broadcast para ahorrar fees y evitar errores',
            commonMistakes: [
              'No implementar verificación pre-broadcast',
              'Confiar solo en el error del API de broadcast (puede ser muy tarde)',
              'No cachear el resultado de broadcasts exitosos',
            ],
            nextSteps: 'Usa getTransaction() antes de broadcastTransaction() como patrón estándar',
            troubleshooting:
              '1. const txid = tx.hash("hex")\n2. const existing = await getTransaction(txid)\n3. if (existing.found) return { alreadyBroadcast: true, txid }\n4. else await broadcastTransaction(txHex)',
          },
          examples: [
            {
              scenario: 'Race condition en broadcast',
              input: 'Dos requests simultáneos con la misma tx',
              output: 'Primera llamada: éxito, segunda llamada: already_broadcast',
              explanation: 'La verificación pre-broadcast detecta que la primera ya se procesó',
            },
          ],
          memoryAids: [
            '🔍 Pattern: check getTransaction() BEFORE broadcastTransaction()',
            '🔍 Txid calculation: SHA256(SHA256(tx_bytes)).reverse()',
          ],
        },
        advanced: {
          plainLanguage: 'Idempotency check passed: transaction with this txid already mined/mempool',
          explanation:
            'El sistema implementa idempotencia verificando si el txid ya existe en la blockchain o mempool antes del broadcast. Esto previene errores de doble gasto y permite retries seguros del cliente.',
          stepByStep: [
            'Serializar transacción: const txHex = tx.toHex()',
            'Calcular txid: const txid = tx.id (o tx.hash().reverse().toString("hex"))',
            'Verificar existencia: const { found, data } = await getTransaction(txid)',
            'Si found === true: retornar { success: true, alreadyBroadcast: true, txid }',
            'Si found === false: proceder con broadcastTransaction(txHex)',
            'Cachear resultado en KV para optimización',
          ],
          hints: {
            ifError:
              'Implementa caching de txids broadcasted exitosamente. Usa KV con TTL de 24h para evitar verificaciones redundantes.',
            commonMistakes: [
              'No implementar idempotency, causando errores en retries',
              'Confiar solo en manejo de errores del broadcast API',
              'No distinguir entre "en blockchain" vs "en mempool"',
              'No manejar reorganizaciones de blockchain (muy raro pero posible)',
            ],
            nextSteps:
              'Implementa capa de idempotencia con: (1) verificación pre-broadcast, (2) cache de txids exitosos, (3) manejo de retries con exponential backoff',
            troubleshooting:
              '1. Implementar cache: await KV.get(`tx:${txid}:status`)\n2. Si cache hit: retornar cached response\n3. Si cache miss: verificar blockchain\n4. Si en blockchain: cachear y retornar\n5. Si no existe: broadcast y cachear resultado',
            relatedResources: [
              {
                title: 'WhatsOnChain API - Get Transaction',
                url: 'https://developers.whatsonchain.com/#get-transaction-by-hash',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Retry after network timeout',
              input:
                'Cliente timeout en broadcast, reintenta después de 10s',
              output: 'getTransaction() encuentra la tx en blockchain, retorna alreadyBroadcast',
              explanation:
                'El timeout fue del lado cliente, el broadcast ya tuvo éxito en el servidor',
            },
          ],
          memoryAids: [
            '⚙️ Idempotency pattern: check → broadcast → cache',
            '⚙️ Cache key: tx:{txid}:status, TTL: 24h',
          ],
        },
        expert: {
          plainLanguage:
            'Transaction idempotency verification: txid collision detected in blockchain state',
          explanation:
            'Pre-broadcast verification via WhatsOnChain GET /tx/{txid}/hex returned 200 OK, indicating transaction with identical txid already exists in confirmed blocks or mempool. This triggers idempotent response without re-broadcasting, preventing double-spend attempts and ensuring safe client retries. The system guarantees at-most-once semantics for transaction broadcast.',
          stepByStep: [
            'Compute txid: const txid = Buffer.from(sha256(sha256(txBytes))).reverse().toString("hex")',
            'Check KV cache: const cached = await env.METADATA_CACHE.get(`txid:${txid}`)',
            'If cache hit: return JSON.parse(cached) (skip API call)',
            'If cache miss: query WhatsOnChain: GET https://api.whatsonchain.com/v1/bsv/{network}/tx/{txid}/hex',
            'If status 200: parse response, cache result, return { success: true, alreadyBroadcast: true, txid, blockHeight: ... }',
            'If status 404: transaction not found, proceed to broadcast',
            'If status 429/500: implement exponential backoff retry (1s, 2s, 4s)',
            'After successful broadcast: cache txid with TTL=86400s (24h)',
          ],
          hints: {
            ifError:
              'Implement multi-layer idempotency: (1) in-memory cache (Worker script lifetime), (2) KV cache (cross-request), (3) blockchain query (source of truth). Handle edge case: txid in mempool but not yet confirmed → still idempotent.',
            commonMistakes: [
              'Not caching negative results (txid not found) → redundant API calls',
              'Using txid as-is without reversing byte order (internal vs display format)',
              'Not handling mempool vs confirmed distinction (both should trigger idempotency)',
              'Failing to invalidate cache on blockchain reorg (extremely rare on BSV)',
              'Not implementing circuit breaker for WhatsOnChain API downtime',
            ],
            nextSteps:
              'Implement robust idempotency layer: (1) KV-backed cache with 24h TTL, (2) exponential backoff for API failures, (3) metrics tracking (cache hit rate, API latency), (4) fallback to broadcast if verification fails (fail-open pattern).',
            troubleshooting:
              'Debug pipeline:\n1. Log txid calculation: console.log("txid:", tx.id)\n2. Check KV cache: const cached = await KV.get(`txid:${txid}`); console.log("cached:", cached)\n3. Query API with timeout: const res = await fetchWithTimeout(`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`, { timeout: 5000 })\n4. Handle responses: 200→exists, 404→not found, 429→rate limit, 500→server error\n5. Implement retry logic for transient failures',
            safeguards: [
              'Always reverse txid byte order when computing from raw tx (internal→display)',
              'Cache both positive (tx exists) and negative (tx not found) results with different TTLs',
              'Implement circuit breaker: if WhatsOnChain fails 3 times, skip verification for 60s',
              'Monitor cache hit rate: should be >70% in steady state',
            ],
            relatedResources: [
              {
                title: 'WhatsOnChain API Documentation',
                url: 'https://developers.whatsonchain.com/',
                type: 'documentation',
              },
              {
                title: 'Bitcoin Transaction ID Calculation',
                url: 'https://wiki.bitcoinsv.io/index.php/TXID',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Txid byte order confusion',
              input:
                'Raw tx hash: 0xabcd1234... (internal), Display txid: 0x...3412cdab (reversed)',
              output: 'Query with internal hash returns 404, query with reversed returns 200',
              explanation:
                'Txid for display/APIs is byte-reversed from internal hash representation',
            },
            {
              scenario: 'Mempool vs confirmed',
              input: 'Transaction in mempool (unconfirmed), client retries',
              output: 'getTransaction() returns tx hex (status 200), idempotency triggered',
              explanation:
                'WhatsOnChain returns tx even if unconfirmed, idempotency works for mempool txs',
            },
          ],
          memoryAids: [
            '🧠 Txid = SHA256d(tx).reverse() → display format for APIs',
            '🧠 Idempotency guarantee: same txid → same outcome (broadcast once)',
            '🧠 Cache strategy: positive (24h TTL) | negative (5min TTL) | API failure (skip cache)',
          ],
        },
      },

      networkError: {
        beginner: {
          plainLanguage: 'No se pudo conectar con la red BSV',
          explanation:
            'Hubo un problema de conexión al intentar enviar tu transacción a la blockchain. Es como cuando internet no funciona.',
          stepByStep: [
            'Verifica tu conexión a internet',
            'Espera unos segundos e intenta de nuevo',
            'Si el problema persiste, espera unos minutos',
          ],
          hints: {
            ifError: 'El problema suele ser temporal. Espera e intenta nuevamente.',
            commonMistakes: [
              'Rendirse después del primer error',
              'No verificar la conexión a internet',
              'Intentar demasiado rápido sin esperar',
            ],
            nextSteps: 'Espera 30 segundos y vuelve a intentar el pago',
          },
          examples: [
            {
              scenario: 'Timeout de red',
              input: 'API de blockchain no responde en 10 segundos',
              output: 'Error: tiempo de espera agotado',
              explanation: 'La red está lenta o sobrecargada temporalmente',
            },
          ],
          memoryAids: ['💡 Los errores de red suelen ser temporales'],
        },
        simple: {
          plainLanguage: 'Error de conexión al comunicarse con WhatsOnChain API',
          explanation:
            'El facilitador no pudo conectarse con el servicio de blockchain (WhatsOnChain) para broadcast. Puede ser timeout, rate limit, o servicio temporalmente caído.',
          stepByStep: [
            'El sistema reintenta automáticamente 3 veces',
            'Usa backoff exponencial: espera 1s, 2s, 4s entre reintentos',
            'Si todos fallan, retorna error de red',
            'El cliente debe reintentar la operación completa',
          ],
          hints: {
            ifError: 'Implementa retry en el cliente con exponential backoff',
            commonMistakes: [
              'No implementar retries del lado cliente',
              'Reintentar demasiado rápido causando rate limiting',
              'No distinguir entre errores recuperables y permanentes',
            ],
            nextSteps: 'Espera 30-60 segundos e intenta el broadcast nuevamente',
          },
          examples: [
            {
              scenario: 'Rate limiting de API',
              input: 'Múltiples requests rápidos a WhatsOnChain',
              output: 'HTTP 429 Too Many Requests',
              explanation: 'El API tiene límites de frecuencia para prevenir abuso',
            },
          ],
          memoryAids: [
            '📌 Reintentos automáticos: 3 veces con backoff 1s, 2s, 4s',
            '📌 Errores de red son típicamente temporales',
          ],
        },
        medium: {
          plainLanguage: 'WhatsOnChain API request failed after retries',
          explanation:
            'La llamada a broadcastTransaction() falló después de 3 reintentos con backoff exponencial. Causas posibles: timeout (>10s), rate limiting (429), servicio caído (500-503), o problema de red.',
          stepByStep: [
            'Detectar tipo de error: timeout, rate limit, server error',
            'Aplicar backoff: 1s después del primer fallo, 2s después del segundo, 4s después del tercero',
            'Loggear errores para diagnóstico',
            'Retornar error al cliente con hint de reintentar',
            'Cliente debe implementar retry con backoff mayor (30s+)',
          ],
          hints: {
            ifError:
              'Diferencia entre errores recuperables (429, 503, timeout) y permanentes (400, 404). Solo reintenta los recuperables.',
            commonMistakes: [
              'Reintentar errors 400 (Bad Request) que nunca tendrán éxito',
              'No implementar circuit breaker para servicios caídos',
              'No loggear suficiente información para debug',
            ],
            nextSteps:
              'Implementa circuit breaker: si falla X veces en Y minutos, deja de intentar temporalmente',
            troubleshooting:
              '1. Check error type: timeout vs HTTP status\n2. If 429: espera más tiempo antes de reintentar\n3. If 500-503: problema del servidor, reintentar con backoff\n4. If timeout: aumentar timeout o verificar conectividad',
          },
          examples: [
            {
              scenario: 'Servicio de blockchain temporalmente caído',
              input: 'WhatsOnChain retorna 503 Service Unavailable',
              output: 'Reintentos con backoff: 1s, 2s, 4s → todos fallan',
              explanation: 'El servicio está en mantenimiento o sobrecargado',
            },
          ],
          memoryAids: [
            '🔍 Retry only: 429 (rate limit), 503 (unavailable), timeout',
            '🔍 Never retry: 400 (bad request), 401 (unauthorized)',
          ],
        },
        advanced: {
          plainLanguage:
            'Broadcast failed: WhatsOnChain API unreachable after exponential backoff retries',
          explanation:
            'fetchWithTimeout() ejecutó 3 intentos de broadcast con backoff (1s, 2s, 4s) pero todos fallaron. Posibles causas: (1) timeout excedido (10s), (2) HTTP 429/503, (3) DNS resolution failure, (4) TLS handshake failure, (5) AbortController timeout.',
          stepByStep: [
            'Configurar timeout: AbortController con 10s timeout',
            'Intento 1: POST /tx/raw con tx hex en body',
            'Si falla: esperar delay = 1000ms * Math.pow(2, attempt)',
            'Intento 2: después de 1s backoff',
            'Intento 3: después de 2s backoff adicional',
            'Si todos fallan: lanzar NetworkError con detalles',
            'Cliente: implementar retry con backoff mayor (30s, 60s, 120s)',
          ],
          hints: {
            ifError:
              'Implementa observability: loggea attempt number, delay, error type, elapsed time. Usa métricas para detectar degradación del servicio.',
            commonMistakes: [
              'No usar AbortController para timeout (timeout no confiable sin eso)',
              'No diferenciar entre timeout del cliente vs timeout del servidor',
              'Hardcodear URLs en vez de usar configuración',
              'No implementar fallback a APIs alternativas (e.g., otros exploradores)',
            ],
            nextSteps:
              'Implementa multi-provider fallback: si WhatsOnChain falla, intenta con otro API (ej: Satoshi.io)',
            troubleshooting:
              '1. const controller = new AbortController()\n2. const timeoutId = setTimeout(() => controller.abort(), 10000)\n3. try { await fetch(url, { signal: controller.signal }) } catch (e) { if (e.name === "AbortError") → timeout }\n4. clearTimeout(timeoutId)\n5. Implementar retry con: await sleep(delay); delay *= 2',
            relatedResources: [
              {
                title: 'WhatsOnChain Status Page',
                url: 'https://status.whatsonchain.com/',
                type: 'support',
              },
            ],
          },
          examples: [
            {
              scenario: 'AbortController timeout',
              input: 'API responde después de 12s, pero timeout es 10s',
              output: 'AbortError: The operation was aborted',
              explanation: 'fetch() fue abortado por el AbortController antes de completar',
            },
          ],
          memoryAids: [
            '⚙️ Timeout implementation: AbortController + setTimeout',
            '⚙️ Backoff formula: delay = initialDelay * Math.pow(2, attempt)',
          ],
        },
        expert: {
          plainLanguage:
            'Broadcast request exhausted retry budget: persistent network-layer failure',
          explanation:
            'The broadcastTransaction() function failed after exhausting the configured retry budget (3 attempts with exponential backoff: 1s, 2s, 4s). Network-layer diagnostics indicate one of: (1) AbortSignal timeout at 10s boundary, (2) DNS resolution failure for api.whatsonchain.com, (3) TLS handshake timeout/failure, (4) TCP connection refused, (5) HTTP 429 rate limiting persisting across retries, or (6) HTTP 503 service degradation. This represents a transient infrastructure failure requiring client-side retry with extended backoff.',
          stepByStep: [
            'Initialize retry context: { maxRetries: 3, baseDelay: 1000ms, maxDelay: 10000ms }',
            'For attempt in [0, 1, 2]:',
            '  - Create AbortController with 10s timeout',
            '  - Execute: fetch(WHATSONCHAIN_URL, { method: "POST", body: txHex, signal })',
            '  - If success (status 200): parse JSON, return { txid }',
            '  - If failure (non-200 or exception):',
            '    - If attempt < maxRetries - 1: calculate delay = min(baseDelay * 2^attempt, maxDelay)',
            '    - await sleep(delay)',
            '    - Continue to next attempt',
            '  - If all attempts exhausted: throw NetworkError with diagnostic data',
            'Client-side recovery: implement retry with extended backoff (30s, 60s, 120s)',
          ],
          hints: {
            ifError:
              'Implement comprehensive error classification: (1) timeout → retryable with longer timeout, (2) 429 → retryable with extended backoff, (3) 503 → retryable, check status page, (4) 400 → non-retryable (bad request), (5) DNS/TLS → infrastructure issue, alert ops. Use structured logging: { attempt, delay, errorType, statusCode, latency }.',
            commonMistakes: [
              'Not implementing circuit breaker pattern (keeps hammering failing service)',
              'Using setTimeout-based timeout instead of AbortController (unreliable)',
              'Not logging enough context for post-mortem analysis (need: attempt#, delay, error type, latency)',
              'Hardcoding retry params instead of making them configurable via env vars',
              'Not implementing fallback to alternative blockchain APIs (vendor lock-in)',
            ],
            nextSteps:
              'Production-grade implementation checklist: (1) Multi-provider fallback (WhatsOnChain primary, Satoshi.io secondary), (2) Circuit breaker (fail-fast after N consecutive failures), (3) Exponential backoff with jitter (prevent thundering herd), (4) Comprehensive metrics (success rate, p95 latency, error breakdown), (5) Alerting on sustained failure rate >5%.',
            troubleshooting:
              'Diagnostic procedure:\n1. Check network: curl -v https://api.whatsonchain.com/v1/bsv/main/tx/raw (should return 400 with "Missing tx hex")\n2. Verify DNS: nslookup api.whatsonchain.com (should resolve)\n3. Check TLS: openssl s_client -connect api.whatsonchain.com:443 (should complete handshake)\n4. Test from Worker: implement /debug/network endpoint that tries broadcast with verbose logging\n5. Monitor WhatsOnChain status: https://status.whatsonchain.com/\n6. Check Cloudflare Workers metrics: network errors, timeout rate',
            safeguards: [
              'Never retry non-idempotent operations without verification (use getTransaction() first)',
              'Implement rate limiting on client side to prevent self-DDoS',
              'Use jittered backoff: delay = baseDelay * (2^attempt) * (0.5 + random()*0.5)',
              'Monitor and alert on: retry rate >10%, timeout rate >5%, circuit breaker open',
            ],
            relatedResources: [
              {
                title: 'Circuit Breaker Pattern',
                url: 'https://martinfowler.com/bliki/CircuitBreaker.html',
                type: 'documentation',
              },
              {
                title: 'Exponential Backoff with Jitter',
                url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
                type: 'documentation',
              },
              {
                title: 'WhatsOnChain API Status',
                url: 'https://status.whatsonchain.com/',
                type: 'support',
              },
            ],
          },
          examples: [
            {
              scenario: 'Thundering herd after service recovery',
              input:
                'WhatsOnChain down for 60s, 1000 clients retry simultaneously when it recovers',
              output: 'Recovered service immediately overwhelmed, returns 503 again',
              explanation:
                'Without jitter, all clients retry at same time → synchronized failure pattern',
            },
            {
              scenario: 'Circuit breaker activation',
              input: '5 consecutive failures → circuit opens → skip retries for 60s',
              output: 'Immediate failure without network call during cooldown period',
              explanation:
                'Circuit breaker prevents cascading failures and gives service time to recover',
            },
          ],
          memoryAids: [
            '🧠 Retry budget: attempts=3, backoff=[1s, 2s, 4s], timeout=10s/attempt',
            '🧠 Error classification: timeout|429|503 → retryable | 400|404 → permanent',
            '🧠 Production pattern: multi-provider + circuit breaker + jittered backoff',
            '🧠 Observability: log {attempt, delay, errorType, latency, statusCode}',
          ],
        },
      },

      broadcastFailed: {
        beginner: {
          plainLanguage: 'La red BSV rechazó tu transacción',
          explanation:
            'La blockchain no aceptó tu transacción. Puede ser por un problema con los datos o porque ya gastaste esas monedas.',
          stepByStep: [
            'Verifica que tu wallet tenga fondos suficientes',
            'Asegúrate de no haber usado esas monedas en otro pago',
            'Crea una transacción nueva desde cero',
            'Intenta el pago nuevamente',
          ],
          hints: {
            ifError: 'No reutilices la misma transacción. Crea una nueva.',
            commonMistakes: [
              'Intentar usar monedas ya gastadas (doble gasto)',
              'No tener suficientes fondos en el wallet',
              'Usar firmas inválidas',
            ],
            nextSteps: 'Revisa tu wallet y crea una transacción completamente nueva',
          },
          examples: [
            {
              scenario: 'Intentar gastar monedas ya usadas',
              input: 'Transacción con input que ya fue gastado',
              output: 'Error: input ya gastado (double-spend)',
              explanation: 'No puedes gastar la misma moneda dos veces',
            },
          ],
          memoryAids: ['💡 Cada moneda solo se puede gastar una vez'],
        },
        simple: {
          plainLanguage: 'El broadcast fue rechazado por la red BSV',
          explanation:
            'WhatsOnChain retornó un error indicando que la transacción es inválida según las reglas de consenso de BSV. Causas comunes: doble gasto, firma inválida, script que no valida, fees insuficientes.',
          stepByStep: [
            'Lee el mensaje de error de WhatsOnChain',
            'Identifica el problema: double-spend, invalid script, etc.',
            'Corrige el problema en la transacción',
            'Genera una nueva transacción válida',
          ],
          hints: {
            ifError: 'El mensaje de error de WhatsOnChain suele indicar exactamente qué está mal',
            commonMistakes: [
              'No validar la transacción localmente antes de broadcast',
              'Usar UTXOs que ya fueron gastados',
              'Calcular firmas incorrectamente',
            ],
            nextSteps: 'Valida la transacción localmente con @bsv/sdk antes de broadcast',
          },
          examples: [
            {
              scenario: 'Script que falla validación',
              input: 'Unlocking script que no satisface el locking script',
              output: 'Error: script evaluation failed',
              explanation: 'El script no ejecuta correctamente o retorna false',
            },
          ],
          memoryAids: ['📌 Siempre validar transacción antes de broadcast'],
        },
        medium: {
          plainLanguage: 'Transaction rejected by blockchain consensus rules',
          explanation:
            'El nodo BSV rechazó la transacción porque viola reglas de consenso: double-spend detection, invalid signature, script execution failure, insufficient fees, o malformed transaction structure.',
          stepByStep: [
            'Parsear error de WhatsOnChain: extraer código y mensaje',
            'Clasificar error: double-spend, invalid sig, script fail, etc.',
            'Si es double-spend: verificar si los UTXOs siguen disponibles',
            'Si es firma: verificar proceso de signing',
            'Si es script: debuggear ejecución del script',
            'Regenerar transacción corrigiendo el problema',
          ],
          hints: {
            ifError:
              'Implementa validación local que replique las reglas de consenso antes de broadcast',
            commonMistakes: [
              'No verificar UTXO disponibility antes de construir tx',
              'Firmar con la private key incorrecta',
              'No incluir suficientes fees (tx puede quedar stuck)',
            ],
            nextSteps: 'Usa transaction builder que valide automáticamente antes de broadcast',
            troubleshooting:
              '1. Validar localmente: tx.verify()\n2. Verificar UTXOs: await getTransaction(prevTxId)\n3. Verificar firmas: cada input debe tener firma válida\n4. Simular script execution localmente',
          },
          examples: [
            {
              scenario: 'UTXO ya gastado en otra transacción',
              input: 'Input referencia UTXO que fue gastado hace 5 minutos',
              output: 'Error: Missing inputs (double-spend detected)',
              explanation: 'El UTXO ya no existe en el UTXO set',
            },
          ],
          memoryAids: [
            '🔍 Consensus rules: valid signatures, unspent inputs, correct scripts',
          ],
        },
        advanced: {
          plainLanguage: 'Consensus validation failure: transaction violates BSV protocol rules',
          explanation:
            'El nodo full node rechazó la transacción durante validación de consenso. Errores comunes: (1) double-spend (input ya gastado), (2) signature verification failed, (3) script execution returned false, (4) fees insuficientes para mempool acceptance, (5) non-standard transaction structure.',
          stepByStep: [
            'Capturar error completo de WhatsOnChain API response',
            'Parsear error message para identificar tipo específico',
            'Si "missing inputs": UTXO ya fue gastado → query UTXO set',
            'Si "signature verification failed": revisar signing process',
            'Si "script failed": ejecutar script localmente para debug',
            'Si "insufficient priority": aumentar fees',
            'Reconstruir transacción desde UTXOs frescos',
          ],
          hints: {
            ifError:
              'Implementa pre-validation layer que simule consensus rules: verify signatures, execute scripts, check UTXO existence. Usa @bsv/sdk tx.verify() antes de broadcast.',
            commonMistakes: [
              'No refrescar UTXO set antes de construir tx (usar UTXOs stale)',
              'Asumir que todas las signatures son válidas sin verificar',
              'No simular script execution antes de broadcast',
              'Calcular fees incorrectamente (muy bajos → rejected)',
            ],
            nextSteps:
              'Implementa validation pipeline: (1) UTXO freshness check, (2) signature verification, (3) script simulation, (4) fee calculation, (5) consensus rules validation',
            troubleshooting:
              '1. Query UTXO status: GET /tx/{prevTxId}/out/{outIndex}/spent\n2. Verify signature locally: tx.inputs[i].verify()\n3. Execute script: simulate with BSV script interpreter\n4. Calculate required fee: txSize * feeRate (≥0.5 sat/byte)\n5. Check mempool acceptance policies',
            relatedResources: [
              {
                title: 'BSV Consensus Rules',
                url: 'https://wiki.bitcoinsv.io/index.php/Protocol_Rules',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'Signature con wrong sighash flag',
              input: 'SIGHASH_ALL usado pero transacción modificada después de firmar',
              output: 'Error: signature verification failed',
              explanation:
                'La firma no coincide con el hash de la transacción actual',
            },
          ],
          memoryAids: [
            '⚙️ Pre-validate: UTXOs exist, signatures valid, scripts pass, fees sufficient',
          ],
        },
        expert: {
          plainLanguage:
            'Blockchain consensus rejection: transaction failed validation at mempool or block inclusion stage',
          explanation:
            'The transaction was rejected by BSV full nodes during consensus validation. Root causes classified: (1) Double-spend: input UTXO already consumed in confirmed transaction or competing mempool tx, (2) Signature failure: ECDSA verification failed for one or more inputs, sighash mismatch, or wrong public key, (3) Script execution failure: unlocking script does not satisfy locking script predicate (OP_VERIFY failed, stack not clean, or false on top), (4) Fee market rejection: transaction fee below mempool minimum threshold (typically 0.5 sat/byte), (5) Non-standard transaction: uses non-whitelisted opcodes or script patterns, (6) Consensus rule violation: locktime/sequence constraints, output amount exceeds input amount.',
          stepByStep: [
            'Parse WhatsOnChain error response: extract errorCode and message',
            'Classify error type using pattern matching:',
            '  - "missing inputs" | "already spent" → UTXO_SPENT',
            '  - "signature.*failed" | "non-mandatory-script-verify-flag" → SIG_INVALID',
            '  - "script failed" | "stack.*not clean" → SCRIPT_FAILED',
            '  - "insufficient priority" | "fee.*too low" → FEE_INSUFFICIENT',
            'For UTXO_SPENT: query /tx/{prevTxId}/out/{outIdx}/spent to confirm consumption',
            'For SIG_INVALID: re-validate signature generation:',
            '  - Recompute sighash: tx.signature(inputIdx, prevOutScript, sighashType)',
            '  - Verify ECDSA: publicKey.verify(sighash, signature)',
            'For SCRIPT_FAILED: execute script interpreter locally:',
            '  - Concatenate unlocking + locking scripts',
            '  - Execute opcode by opcode, track stack state',
            '  - Identify failing opcode',
            'For FEE_INSUFFICIENT: recalculate fee: (sumInputs - sumOutputs) / txSize >= minFeeRate',
            'Reconstruct transaction addressing root cause',
          ],
          hints: {
            ifError:
              'Implement comprehensive pre-broadcast validation suite: (1) UTXO availability check via blockchain query, (2) signature verification using @bsv/sdk PublicKey.verify(), (3) script execution simulation with BSV script interpreter, (4) fee rate calculation and comparison with network minimums (query mempool info), (5) consensus rules validation (locktime, sequence, amount bounds). Log all validation steps with structured data for forensic analysis.',
            commonMistakes: [
              'Race condition: UTXO spent between tx construction and broadcast (use optimistic locking or UTXO reservation)',
              'Signature generation bugs: wrong sighash type (ALL vs SINGLE vs NONE), incorrect preimage format, endianness errors',
              'Script complexity: non-standard opcodes (OP_RETURN with >220 bytes), stack size limits (1000 elements), opcode count limits (201 ops)',
              'Fee calculation errors: not accounting for signature size variability (71-73 bytes), forgetting to include witness data in weight calculation',
              'Timing issues: using stale UTXO set, not accounting for mempool transactions',
            ],
            nextSteps:
              'Production validation pipeline: (1) Fetch fresh UTXO set with mempool awareness, (2) Build transaction with UTXO locking (reserve for 60s), (3) Sign with comprehensive sighash validation, (4) Execute full script simulation, (5) Calculate dynamic fee based on network congestion, (6) Pre-validate with local consensus rules engine, (7) Broadcast with retry/rollback strategy, (8) Monitor mempool for inclusion confirmation.',
            troubleshooting:
              'Comprehensive debugging workflow:\n1. UTXO validation:\n   - GET /tx/{txid}/out/{idx}/spent → {"spent": true/false}\n   - If spent: query spending txid for forensics\n2. Signature debugging:\n   - Extract: sig = input.unlockingScript.chunks[0].data\n   - Extract: pubKey = input.unlockingScript.chunks[1].data\n   - Recompute: sighash = tx.signature(idx, prevLockingScript, SIGHASH_ALL)\n   - Verify: secp256k1.verify(sighash, sig, pubKey) → should be true\n3. Script execution tracing:\n   - Implement stack trace logger for each opcode\n   - Log: { opcode, stackBefore, stackAfter, success }\n   - Identify: first opcode where success=false\n4. Fee analysis:\n   - Calculate: totalFee = sumInputs - sumOutputs\n   - Calculate: feeRate = totalFee / txSize\n   - Compare: feeRate >= networkMinFeeRate (query /api/v1/bsv/{network}/mempool/info)\n5. Network monitoring:\n   - Check mempool congestion: high congestion → higher min fee required\n   - Check for chain reorgs: rare but can invalidate UTXOs',
            safeguards: [
              'Implement UTXO locking mechanism to prevent race conditions (reserve UTXO for tx construction)',
              'Use deterministic signature generation (RFC 6979) to ensure reproducibility',
              'Simulate all scripts locally before broadcast (never trust, always verify)',
              'Implement dynamic fee estimation based on real-time mempool analysis',
              'Never reuse signatures across different transactions (sighash uniqueness)',
            ],
            relatedResources: [
              {
                title: 'BSV Script Language Reference',
                url: 'https://wiki.bitcoinsv.io/index.php/Script',
                type: 'documentation',
              },
              {
                title: 'Transaction Signature Validation',
                url: 'https://wiki.bitcoinsv.io/index.php/SIGHASH_flags',
                type: 'documentation',
              },
              {
                title: 'Mempool and Fee Estimation',
                url: 'https://wiki.bitcoinsv.io/index.php/Fee_and_block_space_market',
                type: 'documentation',
              },
              {
                title: 'ECDSA Signature Verification',
                url: 'https://en.bitcoin.it/wiki/Elliptic_Curve_Digital_Signature_Algorithm',
                type: 'documentation',
              },
            ],
          },
          examples: [
            {
              scenario: 'UTXO double-spend race condition',
              input:
                'Two transactions using same UTXO broadcast simultaneously, first confirms in block',
              output: 'Second tx rejected with "missing inputs" error',
              explanation:
                'UTXO was consumed by first tx, second tx now references non-existent output',
            },
            {
              scenario: 'Sighash type mismatch',
              input:
                'Transaction signed with SIGHASH_SINGLE but outputs modified before broadcast',
              output: 'Signature verification failed: sighash does not match',
              explanation:
                'SIGHASH_SINGLE commits to specific output index, modification invalidates signature',
            },
            {
              scenario: 'Script stack not clean',
              input:
                'Unlocking script executes correctly but leaves 2 elements on stack instead of 1',
              output: 'Script failed: stack size not 1 after execution (got 2)',
              explanation:
                'BSV consensus requires exactly 1 true element on stack after script execution',
            },
          ],
          memoryAids: [
            '🧠 Rejection taxonomy: UTXO_SPENT | SIG_INVALID | SCRIPT_FAILED | FEE_LOW | NON_STANDARD',
            '🧠 Signature validation: sighash = SHA256d(tx preimage), verify(sighash, sig, pubKey)',
            '🧠 Script validation: concat(unlocking, locking) → execute → stack == [true]',
            '🧠 Fee calculation: (ΣinputAmounts - ΣoutputAmounts) / txSizeBytes ≥ minFeeRate',
            '🧠 Always: fresh UTXO query + local validation + retry budget',
          ],
        },
      },
    },
  },

  success: {
    verifyValid: {
      beginner: {
        plainLanguage: 'Tu pago es válido',
        explanation:
          'La transacción que enviaste cumple con todos los requisitos. El dinero, la dirección y el formato son correctos.',
        stepByStep: [
          'Tu transacción fue revisada',
          'Se verificó el monto, la dirección y el formato',
          'Todo está correcto',
          'Ahora puedes proceder con el siguiente paso',
        ],
        hints: {
          nextSteps: 'Procede a confirmar el pago para enviarlo a la blockchain',
        },
        examples: [
          {
            scenario: 'Pago de café validado',
            input: '5000 satoshis a dirección correcta',
            output: 'Pago válido',
            explanation: 'El monto y la dirección coinciden con lo requerido',
          },
        ],
        memoryAids: ['✅ Transacción válida = lista para enviar'],
      },
      simple: {
        plainLanguage: 'Verificación exitosa: transacción BSV válida',
        explanation:
          'El facilitador validó que la transacción cumple todos los requisitos: monto correcto, dirección válida, y formato BSV estándar.',
        stepByStep: [
          'Monto verificado: coincide o excede el requerido',
          'Dirección verificada: válida y en la red correcta',
          'Formato verificado: transacción BSV bien formada',
          'Resultado: isValid = true',
        ],
        hints: {
          nextSteps: 'Puedes proceder a /settle para broadcastear la transacción',
        },
        examples: [
          {
            scenario: 'Validación completa exitosa',
            input: 'Transaction con 10000 sats a dirección testnet válida',
            output: '{ isValid: true }',
            explanation: 'Todas las validaciones pasaron correctamente',
          },
        ],
        memoryAids: ['📌 isValid: true → listo para broadcast'],
      },
      medium: {
        plainLanguage: 'Transaction verification passed: all requirements satisfied',
        explanation:
          'verifyTransaction() ejecutó todas las validaciones exitosamente: (1) formato BSV válido, (2) monto en output >= requerido, (3) dirección destino coincide con requirements.address.',
        stepByStep: [
          'Paso 1: parseTransaction(hex) → Transaction object',
          'Paso 2: validateBsvAddress() → dirección válida',
          'Paso 3: isP2PKHToAddress() → output encontrado con monto correcto',
          'Paso 4: extractPayerAddress() → dirección del pagador (opcional)',
          'Resultado: { isValid: true, txid }',
        ],
        hints: {
          nextSteps:
            'Con isValid=true, el cliente puede llamar /settle para broadcast',
        },
        examples: [
          {
            scenario: 'Validación multi-output',
            input: 'Tx con outputs: [5000 sats a vendor, 3000 sats cambio]',
            output: 'isValid: true (primer output cumple requisito de 5000 sats)',
            explanation: 'El validador encuentra el output correcto entre varios',
          },
        ],
        memoryAids: [
          '🔍 Validation pipeline: format → address → amount',
        ],
      },
      advanced: {
        plainLanguage:
          'Comprehensive transaction validation successful: all consensus and payment rules satisfied',
        explanation:
          'verifyTransaction() ejecutó validación exhaustiva sin errores: (1) Transaction.fromHex() parseó exitosamente, (2) validateBsvAddress() confirmó dirección en red correcta, (3) isP2PKHToAddress() encontró output P2PKH con satoshis >= required amount, (4) extractPayerAddress() derivó dirección del input exitosamente.',
        stepByStep: [
          'Parse: tx = Transaction.fromHex(payload.transaction)',
          'Address validation: Address.fromString(requirements.address, network)',
          'Output search: for output in tx.outputs where isP2PKH(output)',
          'Amount check: output.satoshis >= BigInt(requirements.amount)',
          'Payer extraction: extractPayerAddress(tx) → input[0] public key → address',
          'Response: { isValid: true, txid: tx.id, amount, address, payerAddress }',
        ],
        hints: {
          nextSteps:
            'Transaction ready for broadcast via /settle endpoint. Ensure idempotency by checking txid before broadcast.',
        },
        examples: [
          {
            scenario: 'Validación con address extraction',
            input: 'Valid P2PKH transaction with correct amount and address',
            output:
              '{ isValid: true, txid: "abc...", payerAddress: "1ABC..." }',
            explanation:
              'All validations passed including optional payer address extraction',
          },
        ],
        memoryAids: [
          '⚙️ Validation steps: parse → address → output → amount → payer',
        ],
      },
      expert: {
        plainLanguage:
          'Transaction validation pipeline completed: format, address, amount, and script validation passed',
        explanation:
          'The verifyTransaction() function successfully executed the complete validation pipeline without throwing errors: (1) Binary deserialization via Transaction.fromHex() confirmed valid BSV wire format, (2) Address validation via Address.fromString() with network parameter confirmed target address is valid for configured network (mainnet/testnet), (3) Output iteration located a P2PKH output with lockingScript.toAddress() matching requirements.address and satoshis >= requirements.amount (BigInt comparison), (4) Optional payer address extraction via extractPayerAddress() derived address from first input\'s public key. Result: { isValid: true, txid, amount, address, payerAddress?, invalidReason: null }.',
        stepByStep: [
          'Deserialize: const tx = Transaction.fromHex(payload.transaction) → validate wire format',
          'Network validation: const addr = Address.fromString(requirements.address, network) → throws if invalid or wrong network',
          'Output iteration: for (const output of tx.outputs)',
          '  - Extract address: const outAddr = output.lockingScript.toAddress()',
          '  - Compare: outAddr?.toString() === requirements.address',
          '  - Validate amount: BigInt(output.satoshis) >= BigInt(requirements.amount)',
          '  - If match: validationPassed = true, break',
          'Payer extraction (optional): const payerAddr = extractPayerAddress(tx) → derive from input[0].unlockingScript',
          'Response construction: { isValid: true, txid: tx.id, amount: requirements.amount, address: requirements.address, payerAddress }',
        ],
        hints: {
          nextSteps:
            'Transaction validated and ready for broadcast. Client should: (1) store txid for idempotency checks, (2) call /settle endpoint with same payload, (3) implement retry with idempotency (check getTransaction(txid) before rebroadcast), (4) monitor mempool/blockchain for confirmation.',
        },
        examples: [
          {
            scenario: 'Multi-output transaction validation',
            input:
              'Transaction with 3 outputs: [10000 sats to vendor, 5000 sats to self, 2000 sats change]',
            output:
              '{ isValid: true, txid: "abc123...", amount: "10000", address: "1VendorAddr..." }',
            explanation:
              'Validator iterated outputs, found first matching address with sufficient amount',
          },
        ],
        memoryAids: [
          '🧠 Validation guarantees: format valid ∧ address valid ∧ output exists ∧ amount sufficient',
          '🧠 No blockchain state check (UTXO existence not verified until broadcast)',
        ],
      },
    },

    settleSuccess: {
      beginner: {
        plainLanguage: 'Tu pago fue enviado exitosamente',
        explanation:
          'La transacción fue enviada a la blockchain BSV y fue aceptada. Tu pago está siendo procesado.',
        stepByStep: [
          'Tu transacción fue enviada a la red BSV',
          'La red la aceptó correctamente',
          'Ahora está esperando confirmación en un bloque',
          'Guarda el ID de transacción para rastrearlo',
        ],
        hints: {
          nextSteps:
            'Puedes ver el estado de tu pago en un explorador de bloques usando el txid',
        },
        examples: [
          {
            scenario: 'Pago exitoso',
            input: 'Transacción válida enviada a blockchain',
            output: 'Pago confirmado, txid: abc123...',
            explanation: 'El pago fue aceptado por la red',
          },
        ],
        memoryAids: ['✅ Pago enviado = esperando confirmación en bloque'],
      },
      simple: {
        plainLanguage: 'Broadcast exitoso: transacción en blockchain BSV',
        explanation:
          'La transacción fue broadcasted exitosamente a través de WhatsOnChain y fue aceptada por la red BSV. Está ahora en el mempool esperando ser incluida en un bloque.',
        stepByStep: [
          'Transacción enviada a WhatsOnChain API',
          'API retornó éxito (status 200)',
          'Transacción ahora en mempool de BSV',
          'Será incluida en el próximo bloque (≈10 minutos)',
        ],
        hints: {
          nextSteps:
            'Monitorea el txid en whatsonchain.com para ver confirmaciones',
        },
        examples: [
          {
            scenario: 'Broadcast a mempool',
            input: 'POST /tx/raw con transacción válida',
            output: '{ success: true, txid: "abc..." }',
            explanation: 'Transacción aceptada en mempool, esperando bloque',
          },
        ],
        memoryAids: ['📌 Broadcast = en mempool, confirmación ≈ 10 min'],
      },
      medium: {
        plainLanguage:
          'Broadcast completed: transaction accepted into BSV mempool',
        explanation:
          'broadcastTransaction() ejecutó exitosamente: (1) verificación pre-broadcast (txid no existe), (2) POST a WhatsOnChain /tx/raw, (3) respuesta 200 OK con txid, (4) transacción ahora en mempool esperando inclusión en bloque.',
        stepByStep: [
          'Pre-verificación: getTransaction(txid) → 404 (no existe)',
          'Broadcast: POST /tx/raw con transaction hex',
          'Respuesta: { txid: "..." } con status 200',
          'Resultado: { success: true, txid, message: "..." }',
          'Monitoreo: tx entrará en próximo bloque',
        ],
        hints: {
          nextSteps:
            'Cliente puede monitorear confirmaciones via GET /tx/{txid} periódicamente',
        },
        examples: [
          {
            scenario: 'Broadcast con idempotencia',
            input: 'Primera llamada: broadcast exitoso. Segunda llamada: ya existe',
            output:
              'Primera: { success: true, txid }. Segunda: { success: true, alreadyBroadcast: true }',
            explanation: 'Sistema idempotente permite retries seguros',
          },
        ],
        memoryAids: [
          '🔍 Broadcast pipeline: check existence → POST → mempool → block',
        ],
      },
      advanced: {
        plainLanguage:
          'Transaction broadcast successful: accepted into network mempool with retry resilience',
        explanation:
          'broadcastTransaction() completó exitosamente con retry logic: (1) getTransaction() pre-check retornó 404 (tx no existe), (2) POST /tx/raw ejecutado con exponential backoff (hasta 3 intentos), (3) WhatsOnChain retornó 200 OK, (4) respuesta parseada con txid, (5) transacción ahora en mempool de nodos BSV, (6) será incluida en próximo bloque (tiempo promedio: 10 minutos, depende de fee rate).',
        stepByStep: [
          'Pre-broadcast check: await getTransaction(txid) → { found: false }',
          'Attempt 1: POST https://api.whatsonchain.com/v1/bsv/{network}/tx/raw',
          'If success (200): parse { txid } from response body',
          'If transient failure (429/503/timeout): wait backoff delay (1s, 2s, 4s)',
          'Retry with exponential backoff hasta maxRetries (3)',
          'On success: return { success: true, txid, broadcastedAt: ISO timestamp }',
          'Cache result in KV for idempotency: key=txid, TTL=24h',
        ],
        hints: {
          nextSteps:
            'Client should: (1) store txid for future reference, (2) poll GET /tx/{txid} for confirmations, (3) wait for 1-6 confirmations depending on risk tolerance (1 conf ≈ 10min, 6 conf ≈ 60min).',
        },
        examples: [
          {
            scenario: 'Broadcast con retry por timeout',
            input: 'Attempt 1: timeout, Attempt 2: success',
            output: '{ success: true, txid, attempts: 2 }',
            explanation: 'Retry logic manejó timeout transitorio exitosamente',
          },
        ],
        memoryAids: [
          '⚙️ Broadcast guarantee: at-most-once with idempotency checks',
          '⚙️ Retry: 3 attempts, backoff [1s, 2s, 4s]',
        ],
      },
      expert: {
        plainLanguage:
          'Transaction successfully propagated to BSV network: mempool acceptance confirmed with retry resilience',
        explanation:
          'The broadcastTransaction() function completed the full broadcast lifecycle: (1) Idempotency check via getTransaction(txid) returned 404 (transaction does not exist in blockchain or mempool), (2) HTTP POST to WhatsOnChain /tx/raw endpoint with transaction hex in request body, (3) Exponential backoff retry logic handled transient failures (network timeouts, rate limiting, service unavailability) with delays [1s, 2s, 4s], (4) WhatsOnChain returned HTTP 200 with JSON body containing txid, (5) Transaction now propagated across BSV node network and residing in mempool, (6) Expected block inclusion time: ≈10 minutes (assuming sufficient fee rate ≥0.5 sat/byte), (7) Result cached in KV namespace for 24h to optimize subsequent idempotency checks.',
        stepByStep: [
          'Compute txid: const txid = Buffer.from(sha256(sha256(txBytes))).reverse().toString("hex")',
          'Idempotency check: const existing = await env.METADATA_CACHE.get(`txid:${txid}`)',
          'If cache hit: return cached result (skip broadcast)',
          'If cache miss: query blockchain: GET /tx/{txid}/hex',
          'If 404 (not found): proceed to broadcast',
          'If 200 (exists): return { success: true, alreadyBroadcast: true }',
          'Broadcast with retry: for (let attempt = 0; attempt < 3; attempt++)',
          '  - POST /tx/raw with body: transaction hex',
          '  - Timeout: 10s via AbortController',
          '  - On success (200): parse { txid } from response',
          '  - On failure (timeout, 429, 503): await backoff (1s * 2^attempt)',
          '  - If all retries fail: throw NetworkError',
          'On broadcast success: cache result in KV',
          'Return: { success: true, txid, broadcastedAt: new Date().toISOString() }',
        ],
        hints: {
          nextSteps:
            'Post-broadcast workflow: (1) Store txid in client-side persistence for tracking, (2) Implement confirmation monitoring: poll GET /tx/{txid} every 30s until confirmations >= desired threshold, (3) Consider using webhooks if available (WhatsOnChain may offer callback APIs), (4) For high-value transactions: wait for 6 confirmations (≈60 min) to ensure finality against chain reorgs, (5) Update UI with mempool → confirmed state transitions.',
        },
        examples: [
          {
            scenario: 'Broadcast with confirmation monitoring',
            input: 'Broadcast txid abc123, poll every 30s for confirmations',
            output:
              't=0s: mempool (0 conf), t=10min: 1 conf, t=20min: 2 conf, t=60min: 6 conf',
            explanation:
              'Transaction progresses from mempool to confirmed with increasing depth',
          },
        ],
        memoryAids: [
          '🧠 Broadcast lifecycle: idempotency check → POST /tx/raw → mempool → block inclusion',
          '🧠 Confirmation timeline: mempool (0 conf) → 1 conf (~10min) → 6 conf (~60min)',
          '🧠 Retry strategy: 3 attempts, exponential backoff [1s, 2s, 4s], fail on permanent errors',
          '🧠 Cache optimization: KV cache (txid → result) with 24h TTL',
        ],
      },
    },

    supportedNetworks: {
      beginner: {
        plainLanguage: 'Este servicio funciona con la red de prueba de BSV',
        explanation:
          'El facilitador está configurado para trabajar con BSV testnet. Testnet usa monedas de prueba sin valor real.',
        stepByStep: [
          'El servicio acepta pagos en BSV testnet',
          'Testnet es para pruebas, no dinero real',
          'Usa direcciones que empiezan con "m" o "n"',
          'Para dinero real, necesitas la red principal (mainnet)',
        ],
        hints: {
          nextSteps: 'Asegúrate de usar una wallet de testnet para hacer pruebas',
        },
        examples: [
          {
            scenario: 'Consulta de redes soportadas',
            input: 'GET / endpoint',
            output: '{ networks: ["bsv-testnet"] }',
            explanation: 'El servicio solo acepta transacciones de testnet',
          },
        ],
        memoryAids: ['💡 testnet = red de prueba, mainnet = red real'],
      },
      simple: {
        plainLanguage: 'Facilitador configurado para BSV testnet',
        explanation:
          'Este endpoint retorna las redes BSV soportadas. Actualmente solo testnet está habilitado. Testnet permite pruebas sin riesgo financiero.',
        stepByStep: [
          'GET / retorna lista de redes',
          'Redes soportadas: ["bsv-testnet"]',
          'Testnet usa direcciones con prefijo "m" o "n"',
          'Mainnet usa direcciones con prefijo "1" o "3"',
        ],
        hints: {
          nextSteps: 'Configura tu wallet para usar BSV testnet',
        },
        examples: [
          {
            scenario: 'Diferencia testnet vs mainnet',
            input: 'Network query',
            output: 'testnet: direcciones m.../n..., mainnet: direcciones 1.../3...',
            explanation: 'El prefijo indica la red',
          },
        ],
        memoryAids: ['📌 Prefijos: testnet (m/n), mainnet (1/3)'],
      },
      medium: {
        plainLanguage: 'Network configuration: BSV testnet enabled',
        explanation:
          'El facilitador está configurado vía wrangler.toml para operar en BSV testnet. Esto significa que todas las validaciones de direcciones usan el network prefix 0x6F (testnet) en vez de 0x00 (mainnet).',
        stepByStep: [
          'Configuración en wrangler.toml: NETWORK=testnet',
          'Todas las validaciones usan testnet parameters',
          'Address validation espera prefijo m/n (testnet)',
          'GET / endpoint retorna ["bsv-testnet"]',
        ],
        hints: {
          nextSteps:
            'Para cambiar a mainnet, actualizar NETWORK en wrangler.toml y redesplegar',
        },
        examples: [
          {
            scenario: 'Network mismatch error',
            input: 'Transacción con dirección mainnet (1...) enviada a facilitador testnet',
            output: 'Error: dirección de red incorrecta (mainnet vs testnet)',
            explanation: 'El facilitador rechaza direcciones de red incorrecta',
          },
        ],
        memoryAids: [
          '🔍 Network config en wrangler.toml determina validaciones',
        ],
      },
      advanced: {
        plainLanguage:
          'Network configuration enforced: testnet-only address validation',
        explanation:
          'El facilitador implementa network awareness a través de la configuración NETWORK en wrangler.toml. Esto afecta: (1) validateBsvAddress() usa network="testnet", (2) Address.fromString() valida version byte 0x6F, (3) Address.fromPublicKey() genera direcciones con prefijo testnet, (4) GET / endpoint expone ["bsv-testnet"] para client discovery.',
        stepByStep: [
          'Configuración: env.NETWORK = "testnet" (desde wrangler.toml)',
          'Address validation: Address.fromString(addr, "testnet")',
          'Version byte enforcement: testnet = 0x6F, mainnet = 0x00',
          'GET / response: { networks: ["bsv-testnet"] }',
          'Para cambiar a mainnet: (1) update NETWORK="mainnet", (2) update WALLET_ADDRESS, (3) redeploy',
        ],
        hints: {
          nextSteps:
            'Para production mainnet: (1) verificar WALLET_ADDRESS es mainnet, (2) actualizar NETWORK en [env.production], (3) desplegar con --env production',
        },
        examples: [
          {
            scenario: 'Network-aware address validation',
            input:
              'Address "1ABC..." validated with network="testnet"',
            output:
              'Error: Invalid address version byte (expected 0x6F, got 0x00)',
            explanation:
              'Address.fromString() enforces network-specific version byte',
          },
        ],
        memoryAids: [
          '⚙️ Network param propagates: config → validation → address generation',
        ],
      },
      expert: {
        plainLanguage:
          'Network configuration: testnet-enforced validation with client discovery',
        explanation:
          'The facilitator implements comprehensive network awareness: (1) Environment variable NETWORK (from wrangler.toml) controls network selection ("mainnet" | "testnet"), (2) All address validation functions (validateBsvAddress, extractPayerAddress, isP2PKHToAddress) use network parameter from env, (3) Address.fromString(addr, network) enforces version byte validation (0x6F for testnet, 0x00 for mainnet P2PKH), (4) GET / endpoint exposes supported networks array for client discovery, (5) Prevents accidental mixing of mainnet and testnet addresses through strict validation.',
        stepByStep: [
          'Configuration loading: const network = c.env.NETWORK as "mainnet" | "testnet"',
          'Address validation with network: Address.fromString(address, network)',
          'Version byte validation: testnet P2PKH = 0x6F, mainnet P2PKH = 0x00',
          'If mismatch: throw "Invalid address for network {network}"',
          'GET / handler: return { networks: [`bsv-${network}`] }',
          'Client discovery: client can query GET / to determine supported network',
          'Network migration: (1) update wrangler.toml [env.production].NETWORK, (2) update WALLET_ADDRESS to mainnet address, (3) deploy with --env production',
        ],
        hints: {
          nextSteps:
            'Production deployment checklist: (1) Verify WALLET_ADDRESS is valid mainnet address, (2) Set NETWORK="mainnet" in [env.production], (3) Test with mainnet testnet transactions first, (4) Monitor for address validation errors in logs, (5) Implement network-aware error messages for users.',
        },
        examples: [
          {
            scenario: 'Cross-network address rejection',
            input:
              'Facilitator configured for testnet, client sends mainnet address 1A1zP1eP...',
            output:
              'validateBsvAddress() throws: Invalid address for network testnet (version byte 0x00, expected 0x6F)',
            explanation:
              'Version byte mismatch detected, transaction rejected before further validation',
          },
        ],
        memoryAids: [
          '🧠 Network propagation: env.NETWORK → validation → address derivation',
          '🧠 Version bytes: testnet P2PKH (0x6F) | mainnet P2PKH (0x00)',
          '🧠 Client discovery: GET / → { networks: ["bsv-{network}"] }',
        ],
      },
    },
  },

  glossary: {
    satoshi: 'Unidad mínima de Bitcoin SV. 1 BSV = 100,000,000 satoshis',
    txid: 'Identificador único de 64 caracteres hexadecimales de una transacción',
    blockchain: 'Registro distribuido e inmutable de transacciones',
    testnet: 'Red de prueba de Bitcoin SV con monedas sin valor real',
    mainnet: 'Red principal de Bitcoin SV con monedas de valor real',
    output: 'Dirección de destino y monto en una transacción BSV',
    input: 'Referencia a fondos previos que se gastan en una transacción',
    fee: 'Pequeña cantidad pagada a mineros por procesar una transacción',
    hexadecimal: 'Sistema numérico base-16 usando dígitos 0-9 y letras A-F',
    p2pkh: 'Pay to Public Key Hash: tipo estándar de transacción BSV',
    utxo: 'Unspent Transaction Output: monedas disponibles para gastar',
    mempool: 'Conjunto de transacciones esperando ser incluidas en un bloque',
    'locking script': 'Script que define las condiciones para gastar un output',
    'unlocking script': 'Script que satisface las condiciones del locking script',
    sighash: 'Hash de la transacción usado para generar firmas',
    'base58check': 'Codificación usada para direcciones BSV con checksum integrado',
  },

  icons: {
    verify: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    success: '✅',
    pending: '⏳',
    network: '🌐',
    blockchain: '⛓',
    transaction: '💸',
    wallet: '👛',
    broadcast: '📡',
    confirmed: '🔒',
  },
};
