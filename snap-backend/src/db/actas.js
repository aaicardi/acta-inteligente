const pool = require('./pool');
const items = require('./items');
const fotos = require('./fotos');

function aCamelCase(fila) {
  return {
    id: fila.id,
    estado: fila.estado,
    doNo: fila.do_no,
    cliente: fila.cliente,
    documentoTransporte: fila.documento_transporte,
    deposito: fila.deposito,
    ciudad: fila.ciudad,
    fecha: fila.fecha,
    horaInicio: fila.hora_inicio,
    horaFin: fila.hora_fin,
    bultos: fila.bultos,
    peso: fila.peso,
    observaciones: fila.observaciones,
    nombreArchivo: fila.nombre_archivo,
    creadaEn: fila.creada_en,
    generadaEn: fila.generada_en,
  };
}

// Prellena ciudad/deposito con los de la ultima acta generada, igual que
// antes lo hacia `ultimosValores` en IndexedDB (ver App.jsx historico).
async function obtenerUltimaGenerada() {
  const [filas] = await pool.query(
    "SELECT ciudad, deposito FROM actas WHERE estado = 'generada' ORDER BY generada_en DESC LIMIT 1"
  );
  return filas[0] || null;
}

async function crear() {
  const ultima = await obtenerUltimaGenerada();
  const [res] = await pool.query(
    'INSERT INTO actas (estado, ciudad, deposito, fecha) VALUES (?, ?, ?, ?)',
    ['en_curso', ultima?.ciudad || '', ultima?.deposito || '', new Date().toISOString().slice(0, 10)]
  );
  return obtenerPorId(res.insertId);
}

async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM actas WHERE id = ?', [id]);
  if (filas.length === 0) return null;
  const acta = aCamelCase(filas[0]);
  acta.items = await items.listarPorActa(id);
  return acta;
}

async function obtenerEnCurso() {
  const [filas] = await pool.query(
    "SELECT id FROM actas WHERE estado = 'en_curso' ORDER BY creada_en DESC LIMIT 1"
  );
  if (filas.length === 0) return null;
  return obtenerPorId(filas[0].id);
}

async function listar({ q, estado } = {}) {
  const condiciones = [];
  const valores = [];
  if (estado) {
    condiciones.push('a.estado = ?');
    valores.push(estado);
  }
  if (q) {
    condiciones.push('(a.do_no LIKE ? OR a.cliente LIKE ?)');
    valores.push(`%${q}%`, `%${q}%`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await pool.query(
    `SELECT a.*,
            COUNT(DISTINCT i.id) AS total_items,
            COUNT(DISTINCT f.id) AS total_fotos
     FROM actas a
     LEFT JOIN items i ON i.acta_id = a.id
     LEFT JOIN fotos f ON f.item_id = i.id
     ${where}
     GROUP BY a.id
     ORDER BY a.creada_en DESC`,
    valores
  );
  return filas.map((fila) => ({
    ...aCamelCase(fila),
    totalItems: Number(fila.total_items),
    totalFotos: Number(fila.total_fotos),
  }));
}

const CAMPOS_ACTUALIZABLES = {
  doNo: 'do_no',
  cliente: 'cliente',
  documentoTransporte: 'documento_transporte',
  deposito: 'deposito',
  ciudad: 'ciudad',
  fecha: 'fecha',
  horaInicio: 'hora_inicio',
  horaFin: 'hora_fin',
  bultos: 'bultos',
  peso: 'peso',
  observaciones: 'observaciones',
};

async function actualizarEncabezado(id, cambios) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(valor === '' && campo === 'fecha' ? null : valor);
  }
  if (columnas.length === 0) return obtenerPorId(id);
  valores.push(id);
  await pool.query(`UPDATE actas SET ${columnas.join(', ')} WHERE id = ?`, valores);
  return obtenerPorId(id);
}

async function marcarGenerada(id, nombreArchivo) {
  await pool.query(
    "UPDATE actas SET estado = 'generada', generada_en = NOW(), nombre_archivo = ? WHERE id = ?",
    [nombreArchivo, id]
  );
  return obtenerPorId(id);
}

// Recolecta los public_id de Cloudinary de TODAS las fotos del acta antes de
// borrarla, para que la ruta pueda destruirlas en Cloudinary (el CASCADE de
// MySQL limpia las filas, pero no sabe nada de Cloudinary).
async function eliminar(id) {
  const acta = await obtenerPorId(id);
  if (!acta) return null;
  const todasLasFotos = acta.items.flatMap((item) => item.fotos);
  await pool.query('DELETE FROM actas WHERE id = ?', [id]); // cascade limpia items + fotos
  return todasLasFotos;
}

module.exports = {
  crear,
  obtenerPorId,
  obtenerEnCurso,
  obtenerUltimaGenerada,
  listar,
  actualizarEncabezado,
  marcarGenerada,
  eliminar,
};
