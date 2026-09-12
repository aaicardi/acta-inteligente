const { randomUUID } = require('crypto');
const pool = require('./pool');

function aCamelCase(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    slug: fila.slug,
    nit: fila.nit,
    estado: fila.estado,
    plantillaPublicId: fila.plantilla_public_id,
    creadaEn: fila.creada_en,
  };
}

// UUID como identificador estable fuera de la base de datos (rutas de
// Cloudinary, logs, soporte): no depende del id autoincremental de MySQL, que
// es un detalle interno y podria no sobrevivir una migracion de motor o una
// restauracion de backup. Se llama "slug" por la columna (ver 004), aunque no
// sea un slug legible: la unicidad la garantiza el propio UUID, sin
// normalizacion de texto ni reintentos por colision.
async function crear({ nombre, nit = '' }) {
  const slug = randomUUID();
  const [res] = await pool.query('INSERT INTO empresas (nombre, slug, nit) VALUES (?, ?, ?)', [
    nombre,
    slug,
    nit,
  ]);
  return obtenerPorId(res.insertId);
}

async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
  return filas.length ? aCamelCase(filas[0]) : null;
}

async function listar() {
  const [filas] = await pool.query('SELECT * FROM empresas ORDER BY nombre ASC');
  return filas.map(aCamelCase);
}

// publicId null quita la plantilla personalizada (vuelve a la default).
async function actualizarPlantilla(id, publicId) {
  await pool.query('UPDATE empresas SET plantilla_public_id = ? WHERE id = ?', [publicId, id]);
  return obtenerPorId(id);
}

module.exports = { crear, obtenerPorId, listar, actualizarPlantilla };
