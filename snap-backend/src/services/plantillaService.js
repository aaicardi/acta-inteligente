const cloudinaryService = require('./cloudinaryService');
const { TEMPLATE_PATH } = require('./excelService');

// Cache simple en memoria: la plantilla de una empresa cambia rara vez (solo
// cuando el admin sube una nueva), asi que no vale la pena descargarla de
// Cloudinary en cada acta generada. invalidar() se llama al subir una nueva.
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

// Sin plantilla propia (empresa.plantillaPublicId es null), usa la ruta del
// archivo del proyecto: excelService ya sabe leerla directo del disco.
async function resolverParaEmpresa(empresa) {
  if (!empresa.plantillaPublicId) return TEMPLATE_PATH;

  const enCache = cache.get(empresa.id);
  if (enCache && Date.now() - enCache.en < TTL_MS) return enCache.buffer;

  const buffer = await cloudinaryService.descargarPlantilla(empresa.plantillaPublicId);
  cache.set(empresa.id, { buffer, en: Date.now() });
  return buffer;
}

function invalidar(empresaId) {
  cache.delete(empresaId);
}

module.exports = { resolverParaEmpresa, invalidar };
