const pool = require('./pool');
const { urlFirmada } = require('../services/cloudinaryService');

// La url guardada en la fila es la que devolvio Cloudinary al subir; para las
// fotos privadas no sirve por si sola. Se firma al leer, no al guardar, para
// que el enlace caduque aunque la fila viva para siempre.
function aCamelCase(fila) {
  return {
    id: fila.id,
    itemId: fila.item_id,
    url: urlFirmada(fila.public_id),
    publicId: fila.public_id,
    orden: fila.orden,
  };
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

// Trae las fotos de varios items en una sola query (evita el N+1 de pedirlas
// item por item al listar un acta) y las agrupa por item_id para que el
// llamador solo tenga que indexar el mapa resultante.
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

// listarPorItem y crear no reciben empresaId a proposito: solo se llaman desde
// items.js/actas.js, que ya resolvieron la pertenencia del item a la empresa.
// Exponerlas a una ruta directamente saltaria ese control.

module.exports = { crear, listarPorItem, listarPorItems, eliminarPorItem };
