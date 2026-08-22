const AdmZip = require('adm-zip');
const { analizarProducto } = require('./visionService');

const EXTENSIONES_IMAGEN = /\.(jpe?g|png|webp|heic)$/i;
const PAUSA_ENTRE_ANALISIS_MS = 1500; // evita 429 al recorrer muchas carpetas seguidas
const MAX_FOTOS_DEVUELTAS = 2; // solo para items "revisar": el inspector necesita ver la foto para corregir

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esImagen(nombreArchivo) {
  return EXTENSIONES_IMAGEN.test(nombreArchivo);
}

function esArchivoIgnorable(nombreArchivo) {
  return nombreArchivo.startsWith('.') || nombreArchivo.toLowerCase() === 'thumbs.db';
}

function esHoja(dir, todasLasCarpetas) {
  return !todasLasCarpetas.some((otra) => otra !== dir && otra.startsWith(`${dir}/`));
}

// Recorre el zip y agrupa las fotos por carpeta (una carpeta = un producto),
// respetando el orden en que aparecen en el archivo. Soporta zips con una
// carpeta raíz "envoltorio" (ej. REGISTRO_FOTOGRAFICO/REGISTRO_FOTOGRAFICO/07/...)
// porque solo cuenta como "producto" a las carpetas hoja (sin subcarpetas).
function agruparCarpetas(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const carpetasConImagen = new Map(); // dirPath -> { nombre, fotos: [Buffer] }
  const ordenCarpetas = [];
  const todasLasCarpetas = new Set();

  for (const entry of entries) {
    const entryName = entry.entryName.replace(/\\/g, '/').replace(/\/$/, '');
    if (!entryName) continue;

    if (entry.isDirectory) {
      todasLasCarpetas.add(entryName);
      continue;
    }

    const partes = entryName.split('/');
    const nombreArchivo = partes[partes.length - 1];
    const dirPath = partes.slice(0, -1).join('/');
    if (!dirPath) continue; // archivo suelto en la raíz del zip, no pertenece a ningún producto
    todasLasCarpetas.add(dirPath);

    if (esArchivoIgnorable(nombreArchivo) || !esImagen(nombreArchivo)) continue;

    if (!carpetasConImagen.has(dirPath)) {
      carpetasConImagen.set(dirPath, { nombre: dirPath.split('/').pop(), fotos: [] });
      ordenCarpetas.push(dirPath);
    }
    carpetasConImagen.get(dirPath).fotos.push(entry.getData());
  }

  const todas = [...todasLasCarpetas];
  const carpetasIgnoradas = todas
    .filter((dir) => esHoja(dir, todas) && !carpetasConImagen.has(dir))
    .map((dir) => dir.split('/').pop());

  const carpetasProducto = ordenCarpetas.map((dirPath) => carpetasConImagen.get(dirPath));

  return { carpetasProducto, carpetasIgnoradas };
}

async function procesarZip(zipBuffer) {
  const { carpetasProducto, carpetasIgnoradas } = agruparCarpetas(zipBuffer);

  const items = [];
  for (const carpeta of carpetasProducto) {
    const fotosBase64 = carpeta.fotos.map((buf) => `data:image/jpeg;base64,${buf.toString('base64')}`);
    // Solo se devuelven fotos para items que el inspector deberá revisar: verlas
    // es necesario para corregir el campo dudoso; los "listo" no las necesitan
    // y omitirlas mantiene la respuesta liviana con cientos de carpetas.
    const fotosParaRevision = fotosBase64.slice(0, MAX_FOTOS_DEVUELTAS);
    try {
      const resultado = await analizarProducto(fotosBase64);
      items.push({
        referenciaCarpeta: carpeta.nombre,
        fotosAnalizadas: fotosBase64.length,
        fotos: resultado.estado === 'revisar' ? fotosParaRevision : [],
        ...resultado,
      });
    } catch (err) {
      console.error(`Error analizando carpeta "${carpeta.nombre}":`, err.message);
      items.push({
        referenciaCarpeta: carpeta.nombre,
        fotosAnalizadas: fotosBase64.length,
        fotos: fotosParaRevision,
        referencia: '',
        modelo: '',
        serial: '',
        paisOrigen: '',
        descripcion: '',
        marca: '',
        confianza: 0,
        motivoRevision: 'error de analisis, revisar manualmente',
        estado: 'revisar',
      });
    }
    await esperar(PAUSA_ENTRE_ANALISIS_MS);
  }

  return { items, carpetasIgnoradas };
}

module.exports = { procesarZip };
