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

async function crear(actaId, empresaId, { orden }, creadaPor) {
  const condiciones = ['id = ?', 'empresa_id = ?'];
  const valores = [actaId, empresaId];
  if (creadaPor) {
    condiciones.push('creada_por = ?');
    valores.push(creadaPor);
  }
  const [actas] = await pool.query(`SELECT id FROM actas WHERE ${condiciones.join(' AND ')}`, valores);
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

async function obtenerPorId(id, empresaId, creadaPor) {
  const condiciones = ['i.id = ?', 'a.empresa_id = ?'];
  const valores = [id, empresaId];
  if (creadaPor) {
    condiciones.push('a.creada_por = ?');
    valores.push(creadaPor);
  }
  const [filas] = await pool.query(
    `SELECT i.* FROM items i
     JOIN actas a ON a.id = i.acta_id
     WHERE ${condiciones.join(' AND ')}`,
    valores
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

function perteneceACondicion(creadaPor) {
  const condiciones = ['empresa_id = ?'];
  if (creadaPor) condiciones.push('creada_por = ?');
  return {
    clausula: `acta_id IN (SELECT id FROM actas WHERE ${condiciones.join(' AND ')})`,
    valores: creadaPor ? (empresaId) => [empresaId, creadaPor] : (empresaId) => [empresaId],
  };
}

async function actualizar(id, empresaId, cambios, creadaPor) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(campo === 'datosAdicionales' ? JSON.stringify(valor ?? []) : valor);
  }
  if (columnas.length === 0) return obtenerPorId(id, empresaId, creadaPor);
  const pertenece = perteneceACondicion(creadaPor);
  valores.push(id, ...pertenece.valores(empresaId));
  await pool.query(
    `UPDATE items SET ${columnas.join(', ')} WHERE id = ? AND ${pertenece.clausula}`,
    valores
  );
  return obtenerPorId(id, empresaId, creadaPor);
}

async function actualizarOrden(id, empresaId, orden, creadaPor) {
  const pertenece = perteneceACondicion(creadaPor);
  try {
    await pool.query(`UPDATE items SET orden = ? WHERE id = ? AND ${pertenece.clausula}`, [
      orden,
      id,
      ...pertenece.valores(empresaId),
    ]);
    return obtenerPorId(id, empresaId, creadaPor);
  } catch (err) {
    relanzarSiDuplicado(err, orden);
  }
}

async function eliminar(id, empresaId, creadaPor) {
  const item = await obtenerPorId(id, empresaId, creadaPor);
  if (!item) return null;
  const pertenece = perteneceACondicion(creadaPor);
  await pool.query(`DELETE FROM items WHERE id = ? AND ${pertenece.clausula}`, [id, ...pertenece.valores(empresaId)]); // ON DELETE CASCADE limpia fotos
  return item.fotos;
}


async function marcarHuerfanosComoRevisar(umbralMinutos) {

  const [huerfanos] = await pool.query(
    `SELECT i.id, i.acta_id, a.empresa_id FROM items i
     JOIN actas a ON a.id = i.acta_id
     WHERE i.estado = 'analizando' AND i.actualizado_en < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [umbralMinutos]
  );
  if (huerfanos.length === 0) return [];

  await pool.query(
    `UPDATE items SET estado = 'revisar', motivo_revision = ?
     WHERE id IN (${huerfanos.map(() => '?').join(',')})`,
    ['El análisis se interrumpió. Vuelve a intentarlo.', ...huerfanos.map((h) => h.id)]
  );

  return huerfanos.map((h) => ({ itemId: h.id, actaId: h.acta_id, empresaId: h.empresa_id }));
}

module.exports = { crear, obtenerPorId, listarPorActa, actualizar, actualizarOrden, eliminar };
module.exports.sistema = { marcarHuerfanosComoRevisar };
