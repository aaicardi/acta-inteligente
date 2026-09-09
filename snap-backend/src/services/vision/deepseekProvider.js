// Proveedor DeepSeek — implementado para poder cambiar de proveedor sin tocar
// visionService.js, pero NO validado en producción todavía. Antes de activarlo:
//
// 1. DeepSeek expone su API con el mismo formato que OpenAI (chat.completions),
//    por eso reutilizamos el SDK `openai` apuntando a otro baseURL.
// 2. Solo el modelo `deepseek-v4-flash-vision-exp` acepta imágenes, y es EXPERIMENTAL
//    (puede cambiar o dejar de existir). Los modelos normales (deepseek-chat,
//    deepseek-reasoner) rechazan imágenes con error 400.
// 3. Ese modelo de visión limita cada imagen a 384 tokens, lo cual puede ser
//    insuficiente para leer texto pequeño en etiquetas (referencia/serial/modelo),
//    que es justo lo más importante de este caso de uso.
// 4. No hay confirmación de que soporte response_format json_schema con strict:true
//    igual que OpenAI — probablemente haya que validar/reparar el JSON manualmente
//    o usar json_object en su lugar.
//
// Antes de usar esto en real: probar con fotos reales de etiquetas y comparar
// precisión de referencia/serial/modelo contra el proveedor de OpenAI.

const OpenAI = require('openai');
const { SYSTEM_PROMPT, JSON_SCHEMA } = require('./prompt');

const MODEL = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.DEEPSEEK_API_KEY) {
      const err = new Error('Falta DEEPSEEK_API_KEY en el backend (.env).');
      err.code = 'SIN_API_KEY';
      throw err;
    }
    _client = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: BASE_URL });
  }
  return _client;
}

function aImageUrl(foto) {
  return { type: 'image_url', image_url: { url: foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}` } };
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mismo patrón de reintentos que openaiProvider. DeepSeek también responde 429
// en rate limit; si su header de espera sugerida difiere, ajustar aquí.
async function crearCompletionConReintentos(payload, intentosRestantes = 3) {
  try {
    return await client().chat.completions.create(payload);
  } catch (err) {
    const esRateLimit = err instanceof OpenAI.RateLimitError;
    if (esRateLimit && intentosRestantes > 0) {
      const sugeridaSeg = parseFloat(err.headers?.get?.('retry-after') ?? '');
      const esperaMs = Number.isFinite(sugeridaSeg) ? Math.ceil(sugeridaSeg * 1000) + 250 : 2000;
      await esperar(esperaMs);
      return crearCompletionConReintentos(payload, intentosRestantes - 1);
    }
    throw err;
  }
}

// Envía las fotos a DeepSeek y devuelve el JSON ya parseado según JSON_SCHEMA.
async function extraerDatosProducto(fotosBase64) {
  const response = await crearCompletionConReintentos({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Estas son ${fotosBase64.length} foto(s) del mismo producto. Extrae la información combinando todas las fotos.`,
          },
          ...fotosBase64.map(aImageUrl),
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { extraerDatosProducto };
