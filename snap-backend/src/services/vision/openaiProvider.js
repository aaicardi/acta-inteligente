const OpenAI = require('openai');
const { SYSTEM_PROMPT, JSON_SCHEMA } = require('./prompt');

function modelo() {
  return process.env.OPENAI_VISION_MODEL || 'gpt-5.6-luna';
}


const MODELOS_SIN_TEMPERATURA = [/^gpt-5/, /^o1/, /^o3/];

function soportaTemperatura(nombreModelo) {
  return !MODELOS_SIN_TEMPERATURA.some((re) => re.test(nombreModelo));
}

let _client = null;
function client() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      const err = new Error('Falta OPENAI_API_KEY en el backend (.env).');
      err.code = 'SIN_API_KEY';
      throw err;
    }

    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000 });
  }
  return _client;
}


function aImageUrl(foto) {
  const esUrl = foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:');
  return { type: 'image_url', image_url: { url: esUrl ? foto : `data:image/jpeg;base64,${foto}` } };
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


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


async function extraerDatosProducto(fotosBase64) {
  const nombreModelo = modelo();

  const payload = {
    model: nombreModelo,
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
  };

  if (soportaTemperatura(nombreModelo)) {
    payload.temperature = 0;
  }

  const response = await crearCompletionConReintentos(payload);

  return {
    datos: JSON.parse(response.choices[0].message.content),
    usage: response.usage,
    modelo: nombreModelo,
  };
}

module.exports = { extraerDatosProducto };
