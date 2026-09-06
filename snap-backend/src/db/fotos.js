const pool = require('./pool');

function aCamelCase(fila) {
  return { id: fila.id, itemId: fila.item_id, url: fila.url, publicId: fila.public_id, orden: fila.orden };
}

async function crear({ itemId, url, publicId, orden }) {
  const [res] = await pool.query('INSERT INTO fotos (item_id, url, public_id, orden) VALUES (?, ?, ?, ?)', [
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

async function eliminarPorItem(itemId) {
  const fotos = await listarPorItem(itemId);
  await pool.query('DELETE FROM fotos WHERE item_id = ?', [itemId]);
  return fotos;
}

module.exports = { crear, listarPorItem, eliminarPorItem };
