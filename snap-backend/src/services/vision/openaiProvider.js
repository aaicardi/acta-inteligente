const OpenAI = require('openai');
const { SYSTEM_PROMPT, JSON_SCHEMA } = require('./prompt');

// Se resuelve en cada llamada (no al importar) para que el default aplique
// aunque la variable llegue vacia, que es lo que promete .env.example.
function modelo() {
  return process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
}

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

// Acepta tanto un data URL/base64 crudo (fotos analizadas en el momento de
// subirlas) como una URL http(s) ya alojada en Cloudinary (subida directa
// desde el navegador, ver cloudinaryService.firmarSubida): OpenAI descarga la
// imagen de la URL igual que si fuera un data URL.
function aImageUrl(foto) {
  const esUrl = foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:');
  return { type: 'image_url', image_url: { url: esUrl ? foto : `data:image/jpeg;base64,${foto}` } };
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

// Envía las fotos a OpenAI y devuelve el JSON ya parseado según JSON_SCHEMA,
// junto al `usage` (tokens) que devuelve la API — se propaga para poder medir
// el costo de IA por empresa (ver services/consumoIaService.js), en vez de
// descartarlo como se hacia antes.
async function extraerDatosProducto(fotosBase64) {
  const response = await crearCompletionConReintentos({
    model: modelo(),
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

  return {
    datos: JSON.parse(response.choices[0].message.content),
    usage: response.usage,
    modelo: modelo(),
  };
}

module.exports = { extraerDatosProducto };
