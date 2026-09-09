const OpenAI = require('openai');
const { SYSTEM_PROMPT, JSON_SCHEMA } = require('./prompt');

const MODEL = process.env.OPENAI_VISION_MODEL;

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      const err = new Error('Falta OPENAI_API_KEY en el backend (.env).');
      err.code = 'SIN_API_KEY';
      throw err;
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

function aImageUrl(foto) {
  return { type: 'image_url', image_url: { url: foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}` } };
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reintenta ante 429 (rate limit) respetando la espera sugerida por OpenAI.
// Es importante porque el inspector puede analizar muchos productos seguidos
// y no debe ver un error definitivo por un límite temporal de la API.
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

// Envía las fotos a OpenAI y devuelve el JSON ya parseado según JSON_SCHEMA.
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
