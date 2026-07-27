// Prueba de aceptación (Fase 2): analiza carpetas reales del
// REGISTRO_FOTOGRAFICO.zip del inspector para validar que la extracción
// sea coherente y que los casos difíciles caigan en "revisar" sin inventar datos.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { analizarProducto } = require('../src/services/visionService');

const ZIP_EXTRAIDO =
  'C:/Users/Lenovo/Downloads/REGISTRO FOTOGRAFICO/REGISTRO FOTOGRAFICO';
const CARPETAS = process.argv.slice(2).length ? process.argv.slice(2) : ['07', '100', '01', '118'];
const MAX_FOTOS_POR_CARPETA = 4; // límite para no disparar el costo/tiempo en la prueba
const PAUSA_ENTRE_CARPETAS_MS = 5000; // evitar 429 por rate limit del plan de OpenAI

function esImagen(nombre) {
  return /\.(jpe?g|png|webp)$/i.test(nombre);
}

function leerFotosBase64(carpeta) {
  const dir = path.join(ZIP_EXTRAIDO, carpeta);
  const archivos = fs.readdirSync(dir).filter(esImagen).slice(0, MAX_FOTOS_POR_CARPETA);
  return archivos.map((archivo) => {
    const buffer = fs.readFileSync(path.join(dir, archivo));
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  });
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  for (const carpeta of CARPETAS) {
    console.log(`\n=== Carpeta ${carpeta} ===`);
    try {
      const fotos = leerFotosBase64(carpeta);
      console.log(`Fotos usadas: ${fotos.length}`);
      const resultado = await analizarProducto(fotos);
      console.log(JSON.stringify(resultado, null, 2));
    } catch (err) {
      console.error(`Error en carpeta ${carpeta}:`, err.message);
    }
    await esperar(PAUSA_ENTRE_CARPETAS_MS);
  }
}

run();
