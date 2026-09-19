
const test = require('node:test');
const assert = require('node:assert');

process.env.DB_HOST = process.env.DB_HOST || 'mysql';
process.env.DB_SSL = process.env.DB_SSL || 'false';

const pool = require('../src/db/pool');
const empresasDb = require('../src/db/empresas');
const usuariosDb = require('../src/db/usuarios');
const actasDb = require('../src/db/actas');
const itemsDb = require('../src/db/items');

const sufijo = Date.now();
let empresa;
let usuario;
let acta;

test.before(async () => {
  empresa = await empresasDb.crear({ nombre: `Test Huerfanos ${sufijo}` });
  usuario = await usuariosDb.crear({
    empresaId: empresa.id,
    email: `huerfanos-${sufijo}@test.local`,
    password: 'password-de-prueba',
  });
  acta = await actasDb.crear(empresa.id, usuario.id);
});

test.after(async () => {
  await pool.query('DELETE FROM actas WHERE empresa_id = ?', [empresa.id]);
  await pool.query('DELETE FROM usuarios WHERE empresa_id = ?', [empresa.id]);
  await pool.query('DELETE FROM empresas WHERE id = ?', [empresa.id]);
  await pool.end();
});

test('un item atascado en analizando hace mas del umbral se marca revisar', async () => {
  const item = await itemsDb.crear(acta.id, empresa.id, { orden: 1 });
  await pool.query(
    "UPDATE items SET actualizado_en = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
    [item.id]
  );

  const recuperados = await itemsDb.sistema.marcarHuerfanosComoRevisar(5);

  assert.ok(recuperados.some((r) => r.itemId === item.id));
  const actualizado = await itemsDb.obtenerPorId(item.id, empresa.id);
  assert.equal(actualizado.estado, 'revisar');
  assert.equal(actualizado.motivoRevision, 'El análisis se interrumpió. Vuelve a intentarlo.');
});

test('un item analizando reciente no se toca', async () => {
  const item = await itemsDb.crear(acta.id, empresa.id, { orden: 2 });

  const recuperados = await itemsDb.sistema.marcarHuerfanosComoRevisar(5);

  assert.ok(!recuperados.some((r) => r.itemId === item.id));
  const sinTocar = await itemsDb.obtenerPorId(item.id, empresa.id);
  assert.equal(sinTocar.estado, 'analizando');
});
