const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Las fotos de inventario son datos del cliente: se suben como 'authenticated',
// de modo que la URL publica no sirve por si sola y hay que firmarla. La
// carpeta incluye la empresa para que el arbol refleje el aislamiento.
const TIPO = 'authenticated';
const VIGENCIA_URL_SEG = 60 * 60; // 1h: cubre la revision de un acta sin dejar enlaces eternos

// El primer nivel es el slug de la empresa, no su id de MySQL: asi la carpeta
// es legible y estable aunque algun dia cambie el motor de base de datos o se
// restaure un backup con ids distintos.
function carpeta({ empresaSlug, actaId, itemId }) {
  return `acta-inteligente/${empresaSlug}/${actaId}/${itemId}`;
}

async function subirFoto(dataUrl, destino) {
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder: carpeta(destino),
    resource_type: 'image',
    type: TIPO,
  });
  return { url: res.secure_url, publicId: res.public_id };
}

// Firma para que el navegador suba directo a Cloudinary sin pasar las fotos
// por el backend: evita que Render retenga en RAM cada base64 (hasta 20MB por
// foto) solo para reenviarlo, y evita el ~33% de sobrecarga de codificar a
// base64 en un movil con mala señal de bodega.
//
// Una firma cubre el lote de fotos de UN item (no una por foto): el
// timestamp+folder es lo que se firma, y esos dos valores son los mismos para
// todas las fotos de ese item, asi que la misma firma sirve para subirlas
// todas sin pedir una nueva por cada una.
function firmarSubida(destino) {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsAFirmar = { folder: carpeta(destino), timestamp, type: TIPO };
  const signature = cloudinary.utils.api_sign_request(paramsAFirmar, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: paramsAFirmar.folder,
    type: TIPO,
  };
}

// Genera una URL temporal para una foto privada. Se llama al servir el acta,
// no al guardarla: asi el enlace caduca aunque la fila viva para siempre.
function urlFirmada(publicId) {
  return cloudinary.url(publicId, {
    type: TIPO,
    resource_type: 'image',
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + VIGENCIA_URL_SEG,
  });
}

async function eliminarFoto(publicId) {
  await cloudinary.uploader.destroy(publicId, { type: TIPO });
}

// Plantillas de acta (.xlsx) por empresa: un recurso 'raw' (no es imagen), en
// una carpeta propia separada de las fotos de inventario, privado igual que
// las fotos — es el documento con el que la empresa genera sus actas, no
// tiene por que ser publico.
function carpetaPlantillas(empresaSlug) {
  return `acta-inteligente-plantillas/${empresaSlug}`;
}

async function subirPlantilla(buffer, empresaSlug) {
  const res = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: carpetaPlantillas(empresaSlug), resource_type: 'raw', type: TIPO },
      (err, resultado) => (err ? reject(err) : resolve(resultado))
    );
    stream.end(buffer);
  });
  return { publicId: res.public_id };
}

// Descarga el buffer de una plantilla ya subida: excelService la necesita
// como archivo para abrirla con ExcelJS, no como URL.
async function descargarPlantilla(publicId) {
  const url = cloudinary.url(publicId, {
    type: TIPO,
    resource_type: 'raw',
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60, // solo para esta descarga interna, no se expone al cliente
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la plantilla (HTTP ${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

async function eliminarPlantilla(publicId) {
  await cloudinary.uploader.destroy(publicId, { type: TIPO, resource_type: 'raw' });
}

module.exports = {
  subirFoto,
  firmarSubida,
  eliminarFoto,
  urlFirmada,
  subirPlantilla,
  descargarPlantilla,
  eliminarPlantilla,
};
