// Prueba puntual del campo "datosAdicionales" (Code / Lote / etc.) con una
// foto de etiqueta real. Uso: node scripts/test-datos-adicionales.js <ruta-foto>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { analizarProducto } = require('../src/services/visionService');

const rutaFoto = process.argv[2];
if (!rutaFoto) {
  console.error('Uso: node scripts/test-datos-adicionales.js <ruta-a-la-foto>');
  process.exit(1);
}

async function run() {
  const buffer = fs.readFileSync(path.resolve(rutaFoto));
  const foto = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  const resultado = await analizarProducto([foto]);
  console.log(JSON.stringify(resultado, null, 2));
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
