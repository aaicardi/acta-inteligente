const OpenAI = require('openai');

const MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
const CONFIANZA_UMBRAL = 0.75;

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

const SYSTEM_PROMPT = `Eres un asistente que ayuda a un inspector de una agencia de aduanas en Colombia a diligenciar el Acta de Inspección Previa de Mercancías.

Vas a recibir una o varias fotos que muestran el MISMO producto (pueden ser distintas caras o etiquetas: una foto puede mostrar la referencia, otra el fabricante, otra el voltaje/capacidad). Debes combinar la información de TODAS las fotos como si fueran un solo producto y devolver un único JSON con estos campos:

- "referencia": el código/referencia/modelo que aparece en la etiqueta. Si NINGUNA foto muestra una referencia, escribe exactamente "no dice" (esto es normal y NO es un error).
- "paisOrigen": país de origen o fabricación (ej: "China", "México"). Si no se puede leer, deja "" (vacío).
- "descripcion": en ESPAÑOL, explica QUÉ ES el producto (ej: "Licuadora portátil recargable"), agregando especificaciones técnicas visibles que sean relevantes (voltaje, capacidad, modelo, material, medidas) si aparecen en las fotos. Si no puedes identificar el producto con certeza, deja "" (vacío).
- "marca": la marca/fabricante visible en las fotos. Si no se puede leer, deja "" (vacío).
- "confianza": un número entre 0 y 1 que indica qué tan seguro estás de TODA la extracción en conjunto. Usa valores bajos (menor a 0.5) si las fotos están borrosas, con reflejos, en un idioma que no puedes leer bien, o si falta información importante (distinta de la referencia).
- "motivoRevision": una de estas cadenas exactas si el inspector debería revisar el ítem: "foto borrosa", "texto ilegible", "informacion incompleta". Si todo se leyó bien, usa null.

REGLAS ESTRICTAS:
1. NUNCA inventes un dato que no puedas leer en las fotos. Ante la duda, deja el campo vacío y baja la confianza.
2. La ausencia de referencia NO es un error: usa "no dice" y no bajes la confianza solo por eso.
3. Combina la información de todas las fotos entregadas; no analices cada foto por separado.
4. Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional ni markdown.`;

const JSON_SCHEMA = {
  name: 'extraccion_producto',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      referencia: { type: 'string' },
      paisOrigen: { type: 'string' },
      descripcion: { type: 'string' },
      marca: { type: 'string' },
      confianza: { type: 'number' },
      motivoRevision: { type: ['string', 'null'] },
    },
    required: ['referencia', 'paisOrigen', 'descripcion', 'marca', 'confianza', 'motivoRevision'],
    additionalProperties: false,
  },
};

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
    const esRateLimit = err.status === 429;
    if (esRateLimit && intentosRestantes > 0) {
      const sugerida = /try again in ([\d.]+)s/i.exec(err.message || '');
      const esperaMs = sugerida ? Math.ceil(parseFloat(sugerida[1]) * 1000) + 250 : 2000;
      await esperar(esperaMs);
      return crearCompletionConReintentos(payload, intentosRestantes - 1);
    }
    throw err;
  }
}

async function analizarProducto(fotosBase64) {
  if (!Array.isArray(fotosBase64) || fotosBase64.length === 0) {
    const err = new Error('Se requiere al menos una foto.');
    err.code = 'SIN_FOTOS';
    throw err;
  }

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

  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);
  const estado = parsed.confianza < CONFIANZA_UMBRAL || parsed.motivoRevision ? 'revisar' : 'listo';

  return { ...parsed, estado };
}

module.exports = { analizarProducto, CONFIANZA_UMBRAL };
