const pool = require('./pool');
const fotos = require('./fotos');

function aCamelCase(fila) {
  return {
    id: fila.id,
    actaId: fila.acta_id,
    orden: fila.orden,
    referencia: fila.referencia,
    modelo: fila.modelo,
    serial: fila.serial,
    paisOrigen: fila.pais_origen,
    descripcion: fila.descripcion,
    marca: fila.marca,
    datosAdicionales: fila.datos_adicionales || [],
    cantidad: fila.cantidad,
    confianza: fila.confianza === null ? null : Number(fila.confianza),
    motivoRevision: fila.motivo_revision,
    estado: fila.estado,
  };
}

// Traduce el error de UNIQUE KEY (acta_id, orden) a un error de negocio legible,
// para que la ruta pueda responder 409 sin conocer detalles de MySQL.
function relanzarSiDuplicado(err, orden) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    const duplicado = new Error(`El ítem ${orden} ya existe.`);
    duplicado.code = 'ITEM_DUPLICADO';
    throw duplicado;
  }
  throw err;
}

// items y fotos no tienen empresa_id propio: heredan de actas, así que el
// aislamiento va por JOIN. Un item de otra empresa se comporta como
// inexistente (null), igual que en la capa de actas.
async function crear(actaId, empresaId, { orden }) {
  const [actas] = await pool.query('SELECT id FROM actas WHERE id = ? AND empresa_id = ?', [actaId, empresaId]);
  if (actas.length === 0) return null;

  try {
    const [res] = await pool.query('INSERT INTO items (acta_id, orden, estado) VALUES (?, ?, ?)', [
      actaId,
      orden,
      'analizando',
    ]);
    return obtenerPorId(res.insertId, empresaId);
  } catch (err) {
    relanzarSiDuplicado(err, orden);
  }
}

async function obtenerPorId(id, empresaId) {
  const [filas] = await pool.query(
    `SELECT i.* FROM items i
     JOIN actas a ON a.id = i.acta_id
     WHERE i.id = ? AND a.empresa_id = ?`,
    [id, empresaId]
  );
  if (filas.length === 0) return null;
  const item = aCamelCase(filas[0]);
  item.fotos = await fotos.listarPorItem(id);
  return item;
}

async function listarPorActa(actaId) {
  const [filas] = await pool.query('SELECT * FROM items WHERE acta_id = ? ORDER BY orden ASC', [actaId]);
  const items = filas.map(aCamelCase);

  // Una sola query para las fotos de todos los items del acta, en vez de una
  // por item: un acta de 80 items pasaba de 81 queries secuenciales a 2.
  const fotosPorItem = await fotos.listarPorItems(items.map((item) => item.id));
  for (const item of items) {
    item.fotos = fotosPorItem.get(item.id) || [];
  }
  return items;
}

const CAMPOS_ACTUALIZABLES = {
  referencia: 'referencia',
  modelo: 'modelo',
  serial: 'serial',
  paisOrigen: 'pais_origen',
  descripcion: 'descripcion',
  marca: 'marca',
  datosAdicionales: 'datos_adicionales',
  cantidad: 'cantidad',
  confianza: 'confianza',
  motivoRevision: 'motivo_revision',
  estado: 'estado',
};

// El UPDATE/DELETE filtra por empresa con un subselect sobre actas: MySQL no
// admite JOIN y LIMIT juntos aquí, y así la condición viaja en la misma
// sentencia en vez de depender de una comprobación previa.
const PERTENECE_A_EMPRESA = 'acta_id IN (SELECT id FROM actas WHERE empresa_id = ?)';

async function actualizar(id, empresaId, cambios) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(campo === 'datosAdicionales' ? JSON.stringify(valor ?? []) : valor);
  }
  if (columnas.length === 0) return obtenerPorId(id, empresaId);
  valores.push(id, empresaId);
  await pool.query(
    `UPDATE items SET ${columnas.join(', ')} WHERE id = ? AND ${PERTENECE_A_EMPRESA}`,
    valores
  );
  return obtenerPorId(id, empresaId);
}

async function actualizarOrden(id, empresaId, orden) {
  try {
    await pool.query(`UPDATE items SET orden = ? WHERE id = ? AND ${PERTENECE_A_EMPRESA}`, [
      orden,
      id,
      empresaId,
    ]);
    return obtenerPorId(id, empresaId);
  } catch (err) {
    relanzarSiDuplicado(err, orden);
  }
}

async function eliminar(id, empresaId) {
  const item = await obtenerPorId(id, empresaId);
  if (!item) return null;
  await pool.query(`DELETE FROM items WHERE id = ? AND ${PERTENECE_A_EMPRESA}`, [id, empresaId]); // ON DELETE CASCADE limpia fotos
  return item.fotos;
}

module.exports = { crear, obtenerPorId, listarPorActa, actualizar, actualizarOrden, eliminar };
