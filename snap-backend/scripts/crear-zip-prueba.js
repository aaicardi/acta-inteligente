// Construye un ZIP pequeño de prueba: 2 carpetas reales con fotos, 1 carpeta
// con solo Thumbs.db, y 1 carpeta vacía. Sirve para probar /procesar-zip
// end-to-end sin gastar cuota de IA en las 239 carpetas del zip real completo.
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ORIGEN = 'C:/Users/Lenovo/Downloads/REGISTRO FOTOGRAFICO/REGISTRO FOTOGRAFICO';
const zip = new AdmZip();

function agregarCarpeta(nombre, maxFotos) {
  const dir = path.join(ORIGEN, nombre);
  const archivos = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).slice(0, maxFotos);
  archivos.forEach((f) => {
    zip.addLocalFile(path.join(dir, f), `prueba/${nombre}/`);
  });
}

agregarCarpeta('07', 3);
agregarCarpeta('100', 3);

zip.addFile('prueba/119_solo_basura/Thumbs.db', Buffer.from('basura'));
zip.addFile('prueba/120_vacia/', Buffer.alloc(0));

zip.writeZip(path.join(__dirname, '..', 'zip_prueba.zip'));
console.log('Creado zip_prueba.zip');
