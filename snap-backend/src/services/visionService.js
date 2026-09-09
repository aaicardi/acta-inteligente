const { obtenerProveedor } = require('./vision/providers');
const { extraerDatosProducto } = obtenerProveedor();

const CONFIANZA_UMBRAL = 0.75;
const TAMANO_MAXIMO_FOTO_BYTES = 20 * 1024 * 1024; // límite de tamaño de imagen de la API de OpenAI

// El acta oficial solo tiene columna "DESCRIPCION" (no hay columnas propias
// para color/material/medidas/modelo/serial), así que esos datos se
// concatenan aquí dentro del texto de descripción — ver objetivo del ajuste.
function construirDescripcion(parsed) {
  const base = parsed.descripcionProducto || 'no dice';
  let descripcion =
    `${base}. Color: ${parsed.color || 'no dice'}. Material: ${parsed.material || 'no dice'}. ` +
    `Medidas: ${parsed.medidas || 'no dice'}. Modelo: ${parsed.modelo || 'no dice'}. Serial: ${parsed.serial || 'no dice'}.`;

  if (Array.isArray(parsed.datosAdicionales) && parsed.datosAdicionales.length > 0) {
    const extra = parsed.datosAdicionales
      .filter((d) => d && d.etiqueta && d.valor)
      .map((d) => `${d.etiqueta}: ${d.valor}`)
      .join(', ');
    if (extra) descripcion += ` ${extra}.`;
  }

  return descripcion;
}

// El base64 pesa ~4/3 del binario original; calculamos el tamaño real sin decodificarlo.
function tamanoBase64Bytes(foto) {
  const datos = foto.startsWith('data:') ? foto.slice(foto.indexOf(',') + 1) : foto;
  const relleno = datos.endsWith('==') ? 2 : datos.endsWith('=') ? 1 : 0;
  return Math.floor((datos.length * 3) / 4) - relleno;
}

// Valida fotos antes de gastar cualquier operación costosa (subida a
// Cloudinary, llamada a la IA). Se expone aparte para que la ruta pueda
// llamarla antes de subir las fotos, no solo antes de analizarlas.
function validarFotos(fotosBase64) {
  if (!Array.isArray(fotosBase64) || fotosBase64.length === 0) {
    const err = new Error('Se requiere al menos una foto.');
    err.code = 'SIN_FOTOS';
    throw err;
  }

  const fotoGrande = fotosBase64.find((foto) => tamanoBase64Bytes(foto) > TAMANO_MAXIMO_FOTO_BYTES);
  if (fotoGrande) {
    const err = new Error('Una de las fotos supera el tamaño máximo permitido (20MB).');
    err.code = 'FOTO_MUY_GRANDE';
    throw err;
  }
}

async function analizarProducto(fotosBase64) {
  validarFotos(fotosBase64);

  const parsed = await extraerDatosProducto(fotosBase64);
  const estado = parsed.confianza < CONFIANZA_UMBRAL || parsed.motivoRevision ? 'revisar' : 'listo';

  return {
    referencia: parsed.referencia,
    modelo: parsed.modelo,
    serial: parsed.serial,
    paisOrigen: parsed.paisOrigen,
    descripcion: construirDescripcion(parsed),
    marca: parsed.marca,
    datosAdicionales: parsed.datosAdicionales,
    confianza: parsed.confianza,
    motivoRevision: parsed.motivoRevision,
    estado,
  };
}

module.exports = { analizarProducto, validarFotos, CONFIANZA_UMBRAL };
