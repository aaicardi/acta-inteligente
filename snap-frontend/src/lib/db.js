import { openDB } from 'idb';

const DB_NAME = 'acta-inteligente';
const DB_VERSION = 1;

let dbPromise = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      },
    });
  }
  return dbPromise;
}

export async function guardarEncabezado(encabezado) {
  const db = await getDb();
  await db.put('meta', encabezado, 'encabezado');
}

export async function leerEncabezado() {
  const db = await getDb();
  return (await db.get('meta', 'encabezado')) || null;
}

export async function guardarUltimosValores(valores) {
  const db = await getDb();
  await db.put('meta', valores, 'ultimosValores');
}

export async function leerUltimosValores() {
  const db = await getDb();
  return (await db.get('meta', 'ultimosValores')) || null;
}

export async function guardarItem(item) {
  const db = await getDb();
  await db.put('items', item);
}

export async function eliminarItem(id) {
  const db = await getDb();
  await db.delete('items', id);
}

export async function leerItems() {
  const db = await getDb();
  const items = await db.getAll('items');
  return items.sort((a, b) => a.orden - b.orden);
}

export async function vaciarActa() {
  const db = await getDb();
  await db.clear('items');
  await db.delete('meta', 'encabezado');
}
