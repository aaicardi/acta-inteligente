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

function esUrlHttp(foto) {
  return foto.startsWith('http://') || foto.startsWith('https://');
}

// Valida fotos antes de gastar cualquier operación costosa (subida a
// Cloudinary, llamada a la IA). Se expone aparte para que la ruta pueda
// llamarla antes de subir las fotos, no solo antes de analizarlas.
//
// El límite de tamaño solo aplica a base64 crudo: una foto ya subida a
// Cloudinary (subida directa desde el navegador) llega como URL, y el tamaño
// ya lo validó Cloudinary del lado del cliente al recibirla.
function validarFotos(fotos) {
  if (!Array.isArray(fotos) || fotos.length === 0) {
    const err = new Error('Se requiere al menos una foto.');
    err.code = 'SIN_FOTOS';
    throw err;
  }

  const fotoGrande = fotos.find((foto) => !esUrlHttp(foto) && tamanoBase64Bytes(foto) > TAMANO_MAXIMO_FOTO_BYTES);
  if (fotoGrande) {
    const err = new Error('Una de las fotos supera el tamaño máximo permitido (20MB).');
    err.code = 'FOTO_MUY_GRANDE';
    throw err;
  }
}

// El extractor es un parametro opcional (por defecto el proveedor activo) para
// que los tests puedan inyectar uno de prueba sin tocar variables de entorno
// ni credenciales reales — ver tests/visionService.test.js.
//
// extractor() devuelve { datos, usage, modelo }: usage/modelo se propagan tal
// cual para que la ruta los registre en consumoIaService sin que esta funcion
// tenga que conocer esa tabla ni el empresaId/itemId (eso es contexto de la
// ruta, no del analisis en si).
async function analizarProducto(fotosBase64, extractor = extraerDatosProducto) {
  validarFotos(fotosBase64);

  const { datos: parsed, usage, modelo } = await extractor(fotosBase64);
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
    usage,
    modeloIa: modelo,
  };
}

module.exports = { analizarProducto, validarFotos, construirDescripcion, CONFIANZA_UMBRAL };
