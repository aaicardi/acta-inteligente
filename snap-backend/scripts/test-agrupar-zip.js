// Prueba (sin llamadas a IA): valida que el agrupador de carpetas del ZIP
// real del inspector detecte todas las carpetas-producto en orden y reporte
// las que no tienen fotos válidas.
const fs = require('fs');
const path = require('path');

// Reexponemos agruparCarpetas para probarla aislada (no está exportada por defecto).
const zipServicePath = path.join(__dirname, '..', 'src', 'services', 'zipService.js');
const AdmZip = require('adm-zip');

const ZIP_PATH = 'C:/Users/Lenovo/Downloads/REGISTRO FOTOGRAFICO.zip';

// Cargamos el módulo y accedemos a la función interna vía un pequeño monkey-patch:
// como no está exportada, la extraemos evaluando el archivo en un contexto propio.
const codigoFuente = fs.readFileSync(zipServicePath, 'utf8');
const codigoExpuesto = codigoFuente.replace(
  'module.exports = { procesarZip };',
  'module.exports = { procesarZip, agruparCarpetas };'
);
const Module = require('module');
const m = new Module(zipServicePath);
m.filename = zipServicePath;
m.paths = Module._nodeModulePaths(path.dirname(zipServicePath));
m._compile(codigoExpuesto, zipServicePath);
const { agruparCarpetas } = m.exports;

const buffer = fs.readFileSync(ZIP_PATH);
const { carpetasProducto, carpetasIgnoradas } = agruparCarpetas(buffer);

console.log(`Carpetas-producto detectadas: ${carpetasProducto.length}`);
console.log('Primeras 10:', carpetasProducto.slice(0, 10).map((c) => `${c.nombre} (${c.fotos.length} fotos)`));
console.log('Últimas 5:', carpetasProducto.slice(-5).map((c) => `${c.nombre} (${c.fotos.length} fotos)`));
console.log(`\nCarpetas ignoradas (sin fotos válidas): ${carpetasIgnoradas.length}`);
console.log(carpetasIgnoradas);
