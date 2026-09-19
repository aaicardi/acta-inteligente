const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const TIPO = 'authenticated';
const VIGENCIA_URL_SEG = 60 * 60; 


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


async function descargarPlantilla(publicId) {
  const url = cloudinary.url(publicId, {
    type: TIPO,
    resource_type: 'raw',
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60, 
  });
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
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
