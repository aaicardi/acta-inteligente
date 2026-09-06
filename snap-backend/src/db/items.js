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

async function crear(actaId, { orden }) {
  try {
    const [res] = await pool.query('INSERT INTO items (acta_id, orden, estado) VALUES (?, ?, ?)', [
      actaId,
      orden,
      'analizando',
    ]);
    return obtenerPorId(res.insertId);
  } catch (err) {
    relanzarSiDuplicado(err, orden);
  }
}

async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
  if (filas.length === 0) return null;
  const item = aCamelCase(filas[0]);
  item.fotos = await fotos.listarPorItem(id);
  return item;
}

async function listarPorActa(actaId) {
  const [filas] = await pool.query('SELECT * FROM items WHERE acta_id = ? ORDER BY orden ASC', [actaId]);
  const items = filas.map(aCamelCase);
  for (const item of items) {
    item.fotos = await fotos.listarPorItem(item.id);
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

async function actualizar(id, cambios) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(campo === 'datosAdicionales' ? JSON.stringify(valor ?? []) : valor);
  }
  if (columnas.length === 0) return obtenerPorId(id);
  valores.push(id);
  await pool.query(`UPDATE items SET ${columnas.join(', ')} WHERE id = ?`, valores);
  return obtenerPorId(id);
}

async function actualizarOrden(id, orden) {
  try {
    await pool.query('UPDATE items SET orden = ? WHERE id = ?', [orden, id]);
    return obtenerPorId(id);
  } catch (err) {
    relanzarSiDuplicado(err, orden);
  }
}

async function eliminar(id) {
  const fotosDelItem = await fotos.listarPorItem(id);
  await pool.query('DELETE FROM items WHERE id = ?', [id]); // ON DELETE CASCADE limpia fotos
  return fotosDelItem;
}

module.exports = { crear, obtenerPorId, listarPorActa, actualizar, actualizarOrden, eliminar };
