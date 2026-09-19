const pool = require('./pool');
const { urlFirmada } = require('../services/cloudinaryService');


function aCamelCase(fila) {
  return {
    id: fila.id,
    itemId: fila.item_id,
    url: urlFirmada(fila.public_id),
    publicId: fila.public_id,
    orden: fila.orden,
  };
}

async function crear({ itemId, url, publicId, orden }, conn = pool) {
  const [res] = await conn.query('INSERT INTO fotos (item_id, url, public_id, orden) VALUES (?, ?, ?, ?)', [
    itemId,
    url,
    publicId,
    orden,
  ]);
  return { id: res.insertId, itemId, url, publicId, orden };
}

async function listarPorItem(itemId) {
  const [filas] = await pool.query('SELECT * FROM fotos WHERE item_id = ? ORDER BY orden ASC, id ASC', [itemId]);
  return filas.map(aCamelCase);
}


async function listarPorItems(itemIds) {
  if (itemIds.length === 0) return new Map();

  const [filas] = await pool.query(
    `SELECT * FROM fotos WHERE item_id IN (${itemIds.map(() => '?').join(',')}) ORDER BY orden ASC, id ASC`,
    itemIds
  );

  const porItem = new Map();
  for (const fila of filas) {
    const foto = aCamelCase(fila);
    if (!porItem.has(foto.itemId)) porItem.set(foto.itemId, []);
    porItem.get(foto.itemId).push(foto);
  }
  return porItem;
}

async function eliminarPorItem(itemId) {
  const fotos = await listarPorItem(itemId);
  await pool.query('DELETE FROM fotos WHERE item_id = ?', [itemId]);
  return fotos;
}



module.exports = { crear, listarPorItem, listarPorItems, eliminarPorItem };
