# Ejemplos de Uso - Facilitador BSV X402 Accesible

Este documento contiene ejemplos prácticos de cómo usar el Facilitador BSV X402 con accesibilidad universal.

## Tabla de Contenidos

- [Verificar Transacción (User Story 1)](#verificar-transacción-user-story-1)
- [Procesar Pago (User Story 2)](#procesar-pago-user-story-2)
- [Estructura de Respuestas Accesibles](#estructura-de-respuestas-accesibles)
- [Manejo de Errores](#manejo-de-errores)

---

## Verificar Transacción (User Story 1)

### Ejemplo 1: Verificación exitosa

**Request:**
```bash
curl -X POST https://tu-facilitador.com/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB",
      "maxAmountRequired": "500"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "isValid": true,
    "verifiedAt": "2025-11-28T08:00:00Z"
  },
  "accessibility": {
    "plainLanguage": "El pago es válido",
    "explanation": "La transacción cumple con todos los requisitos: el monto de 500 satoshis coincide con lo solicitado y la dirección de destino es correcta.",
    "stepByStep": [
      "El monto enviado (500 satoshis) coincide con lo requerido",
      "La dirección de destino es correcta",
      "La transacción está lista para ser procesada"
    ],
    "hints": {
      "nextSteps": "Puedes proceder a enviar la transacción usando el endpoint /settle"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Ejemplo 2: Monto incorrecto

**Request:**
```bash
curl -X POST https://tu-facilitador.com/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB",
      "maxAmountRequired": "1000"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "isValid": false,
    "invalidReason": "invalid_amount"
  },
  "accessibility": {
    "plainLanguage": "El monto enviado no es correcto",
    "explanation": "Se esperaban 1000 satoshis pero se recibieron 500 satoshis. Por favor, verifica el monto y crea una nueva transacción.",
    "stepByStep": [
      "Revisa que el monto sea exactamente 1000 satoshis",
      "Crea una nueva transacción con el monto correcto",
      "Intenta verificar nuevamente"
    ],
    "hints": {
      "commonMistakes": [
        "Confundir satoshis con BSV (1 BSV = 100,000,000 satoshis)",
        "No incluir fees de transacción en el cálculo"
      ]
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Ejemplo 3: Dirección inválida

**Request:**
```bash
curl -X POST https://tu-facilitador.com/verify \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "1MainnetAddress...",
      "maxAmountRequired": "500"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "isValid": false,
    "invalidReason": "invalid_address"
  },
  "accessibility": {
    "plainLanguage": "La dirección de destino no es correcta",
    "explanation": "La dirección proporcionada no coincide con la dirección esperada o no es válida para testnet. Se esperaba mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB.",
    "stepByStep": [
      "Verifica que estés usando una dirección de testnet",
      "Confirma que la dirección coincide con la solicitada",
      "Crea una nueva transacción con la dirección correcta"
    ],
    "hints": {
      "commonMistakes": [
        "Usar dirección de mainnet en lugar de testnet",
        "Copiar mal la dirección (falta/sobra un carácter)"
      ]
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

---

## Procesar Pago (User Story 2)

### Ejemplo 4: Broadcast exitoso

**Request:**
```bash
curl -X POST https://tu-facilitador.com/settle \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB",
      "maxAmountRequired": "500"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "success": true,
    "transaction": "abc123def456...",
    "broadcastedAt": "2025-11-28T08:00:00Z"
  },
  "accessibility": {
    "plainLanguage": "Tu pago fue procesado correctamente",
    "explanation": "La transacción se envió exitosamente a la red BSV testnet. El identificador de tu transacción es abc123def456...",
    "stepByStep": [
      "La transacción fue validada",
      "Se envió a la red BSV testnet",
      "Fue aceptada por la red"
    ],
    "hints": {
      "nextSteps": "Guarda el ID de transacción (abc123def456...) como comprobante"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

### Ejemplo 5: Error de red

**Request:**
```bash
curl -X POST https://tu-facilitador.com/settle \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB",
      "maxAmountRequired": "500"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "success": false,
    "errorReason": "network_error"
  },
  "accessibility": {
    "plainLanguage": "No se pudo enviar la transacción a la red",
    "explanation": "Hubo un problema al intentar comunicarse con la red BSV. Esto puede deberse a problemas temporales de conectividad.",
    "stepByStep": [
      "Verifica tu conexión a internet",
      "Espera unos minutos",
      "Intenta enviar la transacción nuevamente"
    ],
    "hints": {
      "ifError": "Si el error persiste después de varios intentos, contacta soporte",
      "nextSteps": "Puedes reintentar el envío con el mismo txHex"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "medium"
  }
}
```

### Ejemplo 6: Transacción ya procesada

**Request:**
```bash
curl -X POST https://tu-facilitador.com/settle \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "network": "bsv-testnet",
      "scheme": "exact",
      "txHex": "0100000001..."
    },
    "paymentRequirements": {
      "payTo": "mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB",
      "maxAmountRequired": "500"
    }
  }'
```

**Response (200 OK):**
```json
{
  "data": {
    "success": false,
    "errorReason": "already_broadcast",
    "transaction": "abc123def456..."
  },
  "accessibility": {
    "plainLanguage": "Esta transacción ya fue procesada",
    "explanation": "La transacción con ID abc123def456... ya existe en la red BSV. No es necesario enviarla nuevamente.",
    "stepByStep": [
      "La transacción ya está en la blockchain",
      "Puedes verificar su estado con el ID: abc123def456...",
      "No necesitas hacer nada más"
    ],
    "hints": {
      "nextSteps": "Usa el ID de transacción para consultar su estado en un explorador de bloques"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

---

## Estructura de Respuestas Accesibles

Todas las respuestas del facilitador incluyen un objeto `accessibility` con información en español claro:

```typescript
{
  "data": { /* Datos específicos del endpoint */ },
  "accessibility": {
    "plainLanguage": string,      // Mensaje conciso (≤100 caracteres)
    "explanation": string,         // Descripción detallada (≤300 caracteres)
    "stepByStep": string[],        // Pasos en orden (≤5 items, 80 chars cada uno)
    "hints": {
      "ifError": string,           // Qué hacer si hay error
      "commonMistakes": string[],  // Errores comunes a evitar
      "nextSteps": string          // Siguiente acción sugerida
    },
    "language": "es",              // Idioma (siempre español)
    "audioFriendly": boolean,      // Compatible con lectores de pantalla
    "cognitiveLevel": "simple" | "medium" | "advanced"
  }
}
```

### Límites de Longitud

- `plainLanguage`: máximo 100 caracteres
- `explanation`: máximo 300 caracteres
- `stepByStep`: máximo 5 items de 80 caracteres cada uno
- Sin jerga técnica (no usar términos como "API", "JSON", "HTTP", etc.)

---

## Manejo de Errores

### Error de validación (400)

**Request con JSON malformado:**
```bash
curl -X POST https://tu-facilitador.com/verify \
  -H "Content-Type: application/json" \
  -d 'invalid-json{'
```

**Response (400 Bad Request):**
```json
{
  "error": "Malformed JSON in request body",
  "metadata": {
    "accessible": {
      "plainLanguage": "Los datos proporcionados no son correctos",
      "explanation": "La información que ingresaste no cumple con los requisitos necesarios. Por favor, revisa que todos los campos estén completos y sean válidos.",
      "stepByStep": [
        "Revisa que todos los campos estén completos",
        "Verifica que los datos sean del formato correcto",
        "Intenta enviar la información nuevamente"
      ],
      "hints": {
        "ifError": "Revisa los detalles del error y contacta soporte si es necesario",
        "nextSteps": "Intenta realizar la operación nuevamente"
      },
      "language": "es",
      "audioFriendly": true,
      "cognitiveLevel": "simple"
    },
    "i18n": {
      "lang": "es"
    }
  },
  "status": 400
}
```

### Error del servidor (500)

**Response (500 Internal Server Error):**
```json
{
  "error": "Error del sistema",
  "metadata": {
    "accessible": {
      "plainLanguage": "Ocurrió un problema inesperado",
      "explanation": "El sistema encontró un error que no pudo procesar. Este problema ha sido registrado y será revisado por el equipo técnico.",
      "stepByStep": [
        "Intenta realizar la acción nuevamente",
        "Si el error persiste, espera unos minutos",
        "Contacta soporte si el problema continúa"
      ],
      "hints": {
        "ifError": "Revisa los detalles del error y contacta soporte si es necesario",
        "nextSteps": "Intenta realizar la operación nuevamente"
      },
      "language": "es",
      "audioFriendly": true,
      "cognitiveLevel": "simple"
    },
    "i18n": {
      "lang": "es"
    }
  },
  "status": 500
}
```

---

## Verificar Redes Soportadas

**Request:**
```bash
curl https://tu-facilitador.com/
```

**Response (200 OK):**
```json
{
  "data": {
    "networks": ["bsv-testnet"]
  },
  "accessibility": {
    "plainLanguage": "Redes soportadas: bsv-testnet",
    "explanation": "Este facilitador soporta pagos en la red de prueba de BSV (testnet). Puedes enviar transacciones de prueba sin usar dinero real.",
    "stepByStep": [
      "Verifica que tu transacción use la red bsv-testnet",
      "Obtén satoshis de testnet de un faucet",
      "Usa los endpoints /verify y /settle para procesar pagos"
    ],
    "hints": {
      "nextSteps": "Consulta la documentación para ver ejemplos de uso"
    },
    "language": "es",
    "audioFriendly": true,
    "cognitiveLevel": "simple"
  }
}
```

---

## CORS y Clientes LLM

Este facilitador está configurado para aceptar requests desde cualquier origen (`Access-Control-Allow-Origin: *`), lo que permite integraciones con:

- Claude Desktop
- ChatGPT
- Otros clientes LLM
- Aplicaciones web y móviles

**Ejemplo de request desde navegador:**
```javascript
fetch('https://tu-facilitador.com/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payload: {
      network: 'bsv-testnet',
      scheme: 'exact',
      txHex: '0100000001...'
    },
    paymentRequirements: {
      payTo: 'mtZBZacoN7S2KW6aP6YXm9FMfNYFztS1oB',
      maxAmountRequired: '500'
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('Resultado:', data.accessibility.plainLanguage);
  console.log('Explicación:', data.accessibility.explanation);
  console.log('Pasos:', data.accessibility.stepByStep);
});
```

---

## Notas Importantes

1. **Red de prueba**: Este facilitador opera en `bsv-testnet`, no uses dinero real.
2. **Idioma español**: Todas las respuestas están en español claro, sin jerga técnica.
3. **Accesibilidad**: Las respuestas están optimizadas para lectores de pantalla y personas con discapacidades cognitivas.
4. **Sin información sensible**: Los errores nunca exponen contraseñas, claves privadas u otra información sensible.

---

Para más información, consulta el [README.md](./README.md) del proyecto.
