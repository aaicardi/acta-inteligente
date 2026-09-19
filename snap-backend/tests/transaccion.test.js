
const test = require('node:test');
const assert = require('node:assert');

process.env.DB_HOST = process.env.DB_HOST || 'mysql';
process.env.DB_SSL = process.env.DB_SSL || 'false';

const pool = require('../src/db/pool');
const empresasDb = require('../src/db/empresas');
const usuariosDb = require('../src/db/usuarios');
const actasDb = require('../src/db/actas');
const itemsDb = require('../src/db/items');
const fotosDb = require('../src/db/fotos');
const { ejecutarEnTransaccion } = require('../src/db/transaccion');

const sufijo = Date.now();
let empresa;
let usuario;
let acta;
let item;

test.before(async () => {
  empresa = await empresasDb.crear({ nombre: `Test Transaccion ${sufijo}` });
  usuario = await usuariosDb.crear({
    empresaId: empresa.id,
    email: `transaccion-${sufijo}@test.local`,
    password: 'password-de-prueba',
  });
  acta = await actasDb.crear(empresa.id, usuario.id);
  item = await itemsDb.crear(acta.id, empresa.id, { orden: 1 });
});

test.after(async () => {
  await pool.query('DELETE FROM actas WHERE empresa_id = ?', [empresa.id]);
  await pool.query('DELETE FROM usuarios WHERE empresa_id = ?', [empresa.id]);
  await pool.query('DELETE FROM empresas WHERE id = ?', [empresa.id]);
  await pool.end();
});

test('si una insercion falla a mitad del lote, ninguna foto queda guardada', async () => {
  const fotos = [
    { url: 'https://ejemplo.test/a.jpg', publicId: 'a' },
    { url: 'https://ejemplo.test/b.jpg', publicId: null }, // publicId NULL viola NOT NULL: fuerza el fallo
    { url: 'https://ejemplo.test/c.jpg', publicId: 'c' },
  ];

  await assert.rejects(
    ejecutarEnTransaccion(async (conn) => {
      for (const [idx, f] of fotos.entries()) {
        await fotosDb.crear({ itemId: item.id, url: f.url, publicId: f.publicId, orden: idx }, conn);
      }
    })
  );

  const restantes = await fotosDb.listarPorItem(item.id);
  assert.equal(restantes.length, 0, 'ninguna foto del lote debe haber quedado guardada (rollback completo)');
});

test('si todas las inserciones tienen exito, la transaccion hace commit', async () => {
  const fotos = [
    { url: 'https://ejemplo.test/x.jpg', publicId: `x-${sufijo}` },
    { url: 'https://ejemplo.test/y.jpg', publicId: `y-${sufijo}` },
  ];

  const guardadas = await ejecutarEnTransaccion(async (conn) => {
    const resultado = [];
    for (const [idx, f] of fotos.entries()) {
      resultado.push(await fotosDb.crear({ itemId: item.id, url: f.url, publicId: f.publicId, orden: idx }, conn));
    }
    return resultado;
  });

  assert.equal(guardadas.length, 2);
  const persistidas = await fotosDb.listarPorItem(item.id);
  assert.equal(persistidas.length, 2);
});
