const pool = require('./pool');
const items = require('./items');
const fotos = require('./fotos');

// REGLA DE AISLAMIENTO: ninguna función de esta capa acepta un id sin recibir
// también el empresaId, y toda consulta lo lleva en el WHERE. El filtro no se
// aplica en las rutas: vive aquí, en un solo lugar, para que sea auditable de
// un vistazo. Un recurso de otra empresa devuelve null (la ruta responde 404),
// nunca 403: no se confirma la existencia de recursos ajenos.
function aCamelCase(fila) {
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    creadaPor: fila.creada_por,
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

// Prellena ciudad/deposito con los de la ultima acta generada de la empresa,
// igual que antes lo hacia `ultimosValores` en IndexedDB (ver App.jsx historico).
async function obtenerUltimaGenerada(empresaId) {
  const [filas] = await pool.query(
    "SELECT ciudad, deposito FROM actas WHERE empresa_id = ? AND estado = 'generada' ORDER BY generada_en DESC LIMIT 1",
    [empresaId]
  );
  return filas[0] || null;
}

async function crear(empresaId, usuarioId) {
  const ultima = await obtenerUltimaGenerada(empresaId);
  const [res] = await pool.query(
    'INSERT INTO actas (empresa_id, creada_por, estado, ciudad, deposito, fecha) VALUES (?, ?, ?, ?, ?, ?)',
    [
      empresaId,
      usuarioId,
      'en_curso',
      ultima?.ciudad || '',
      ultima?.deposito || '',
      new Date().toISOString().slice(0, 10),
    ]
  );
  return obtenerPorId(res.insertId, empresaId);
}

async function obtenerPorId(id, empresaId) {
  const [filas] = await pool.query('SELECT * FROM actas WHERE id = ? AND empresa_id = ?', [id, empresaId]);
  if (filas.length === 0) return null;
  const acta = aCamelCase(filas[0]);
  acta.items = await items.listarPorActa(id);
  return acta;
}

// El acta en curso es por usuario, no global: dos inspectores de la misma
// empresa trabajan en paralelo sin robarse el acta.
async function obtenerEnCurso(empresaId, usuarioId) {
  const [filas] = await pool.query(
    "SELECT id FROM actas WHERE empresa_id = ? AND creada_por = ? AND estado = 'en_curso' ORDER BY creada_en DESC LIMIT 1",
    [empresaId, usuarioId]
  );
  if (filas.length === 0) return null;
  return obtenerPorId(filas[0].id, empresaId);
}

async function listar(empresaId, { q, estado } = {}) {
  const condiciones = ['a.empresa_id = ?'];
  const valores = [empresaId];
  if (estado) {
    condiciones.push('a.estado = ?');
    valores.push(estado);
  }
  if (q) {
    condiciones.push('(a.do_no LIKE ? OR a.cliente LIKE ?)');
    valores.push(`%${q}%`, `%${q}%`);
  }
  const where = `WHERE ${condiciones.join(' AND ')}`;
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

async function actualizarEncabezado(id, empresaId, cambios) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(valor === '' && campo === 'fecha' ? null : valor);
  }
  if (columnas.length === 0) return obtenerPorId(id, empresaId);
  valores.push(id, empresaId);
  await pool.query(
    `UPDATE actas SET ${columnas.join(', ')} WHERE id = ? AND empresa_id = ?`,
    valores
  );
  return obtenerPorId(id, empresaId);
}

async function marcarGenerada(id, empresaId, nombreArchivo) {
  await pool.query(
    "UPDATE actas SET estado = 'generada', generada_en = NOW(), nombre_archivo = ? WHERE id = ? AND empresa_id = ?",
    [nombreArchivo, id, empresaId]
  );
  return obtenerPorId(id, empresaId);
}

// Recolecta los public_id de Cloudinary de TODAS las fotos del acta antes de
// borrarla, para que la ruta pueda destruirlas en Cloudinary (el CASCADE de
// MySQL limpia las filas, pero no sabe nada de Cloudinary).
async function eliminar(id, empresaId) {
  const acta = await obtenerPorId(id, empresaId);
  if (!acta) return null;
  const todasLasFotos = acta.items.flatMap((item) => item.fotos);
  await pool.query('DELETE FROM actas WHERE id = ? AND empresa_id = ?', [id, empresaId]); // cascade limpia items + fotos
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
