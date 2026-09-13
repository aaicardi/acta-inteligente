// Verifica la regla de aislamiento del spec: ninguna operación puede alcanzar
// datos de otra empresa. Es la prueba que protege el modelo de negocio — si
// esto falla, un cliente ve las actas de otro.
//
// Corre contra la base real (docker compose). Crea sus propias empresas y las
// borra al terminar.
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
let empresaA;
let empresaB;
let usuarioA1;
let usuarioA2;
let usuarioB;
let actaDeA;
let itemDeA;

test.before(async () => {
  empresaA = await empresasDb.crear({ nombre: `Test A ${sufijo}` });
  empresaB = await empresasDb.crear({ nombre: `Test B ${sufijo}` });

  usuarioA1 = await usuariosDb.crear({
    empresaId: empresaA.id,
    email: `a1-${sufijo}@test.local`,
    password: 'password-de-prueba',
  });
  usuarioA2 = await usuariosDb.crear({
    empresaId: empresaA.id,
    email: `a2-${sufijo}@test.local`,
    password: 'password-de-prueba',
  });
  usuarioB = await usuariosDb.crear({
    empresaId: empresaB.id,
    email: `b-${sufijo}@test.local`,
    password: 'password-de-prueba',
  });

  actaDeA = await actasDb.crear(empresaA.id, usuarioA1.id);
  itemDeA = await itemsDb.crear(actaDeA.id, empresaA.id, { orden: 1 });
});

test.after(async () => {
  await pool.query('DELETE FROM actas WHERE empresa_id IN (?, ?)', [empresaA.id, empresaB.id]);
  await pool.query('DELETE FROM usuarios WHERE empresa_id IN (?, ?)', [empresaA.id, empresaB.id]);
  await pool.query('DELETE FROM empresas WHERE id IN (?, ?)', [empresaA.id, empresaB.id]);
  await pool.end();
});

test('un acta de otra empresa no se puede leer', async () => {
  assert.ok(await actasDb.obtenerPorId(actaDeA.id, empresaA.id), 'la empresa dueña sí debe verla');
  assert.equal(await actasDb.obtenerPorId(actaDeA.id, empresaB.id), null);
});

test('el listado solo devuelve actas de la empresa', async () => {
  const deA = await actasDb.listar(empresaA.id);
  const deB = await actasDb.listar(empresaB.id);

  assert.ok(deA.some((acta) => acta.id === actaDeA.id));
  assert.ok(deA.every((acta) => acta.empresaId === empresaA.id));
  assert.equal(deB.length, 0);
});

test('un acta de otra empresa no se puede modificar', async () => {
  assert.equal(await actasDb.actualizarEncabezado(actaDeA.id, empresaB.id, { cliente: 'intruso' }), null);

  const acta = await actasDb.obtenerPorId(actaDeA.id, empresaA.id);
  assert.notEqual(acta.cliente, 'intruso');
});

test('un acta de otra empresa no se puede eliminar', async () => {
  assert.equal(await actasDb.eliminar(actaDeA.id, empresaB.id), null);
  assert.ok(await actasDb.obtenerPorId(actaDeA.id, empresaA.id), 'el acta debe seguir existiendo');
});

test('un item de otra empresa no se puede leer ni modificar', async () => {
  assert.ok(await itemsDb.obtenerPorId(itemDeA.id, empresaA.id));
  assert.equal(await itemsDb.obtenerPorId(itemDeA.id, empresaB.id), null);

  assert.equal(await itemsDb.actualizar(itemDeA.id, empresaB.id, { marca: 'intruso' }), null);
  const item = await itemsDb.obtenerPorId(itemDeA.id, empresaA.id);
  assert.notEqual(item.marca, 'intruso');
});

test('no se puede crear un item dentro del acta de otra empresa', async () => {
  assert.equal(await itemsDb.crear(actaDeA.id, empresaB.id, { orden: 99 }), null);
});

test('el acta en curso es por usuario, no global', async () => {
  // actaDeA la creó usuarioA1 y sigue en_curso.
  const paraA1 = await actasDb.obtenerEnCurso(empresaA.id, usuarioA1.id);
  assert.equal(paraA1?.id, actaDeA.id);

  // Su compañero de empresa no hereda el acta a medio hacer.
  assert.equal(await actasDb.obtenerEnCurso(empresaA.id, usuarioA2.id), null);

  // Y desde otra empresa no existe en absoluto.
  assert.equal(await actasDb.obtenerEnCurso(empresaB.id, usuarioB.id), null);
});

test('un usuario de otra empresa no se puede leer ni modificar', async () => {
  assert.ok(await usuariosDb.obtenerPorId(usuarioA1.id, empresaA.id));
  assert.equal(await usuariosDb.obtenerPorId(usuarioA1.id, empresaB.id), null);

  assert.equal(await usuariosDb.actualizar(usuarioA1.id, empresaB.id, { nombre: 'intruso' }), null);
});

test('el login rechaza credenciales incorrectas y usuarios inactivos', async () => {
  const email = `a1-${sufijo}@test.local`;

  assert.ok(await usuariosDb.verificarCredenciales(email, 'password-de-prueba'));
  assert.equal(await usuariosDb.verificarCredenciales(email, 'password-incorrecta'), null);
  assert.equal(await usuariosDb.verificarCredenciales(`noexiste-${sufijo}@test.local`, 'x'), null);

  await usuariosDb.actualizar(usuarioA1.id, empresaA.id, { estado: 'inactivo' });
  assert.equal(await usuariosDb.verificarCredenciales(email, 'password-de-prueba'), null);
  await usuariosDb.actualizar(usuarioA1.id, empresaA.id, { estado: 'activo' });
});
