const bcrypt = require('bcrypt');
const pool = require('./pool');

const COSTE_BCRYPT = 12;

// El hash nunca sale de este módulo: quien consulta un usuario recibe sus
// datos públicos, y la comparación de contraseña se hace aquí dentro.
function aCamelCase(fila) {
  return {
    id: fila.id,
    empresaId: fila.empresa_id,
    email: fila.email,
    nombre: fila.nombre,
    rol: fila.rol,
    estado: fila.estado,
    creadoEn: fila.creado_en,
  };
}

function relanzarSiEmailDuplicado(err, email) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    const duplicado = new Error(`Ya existe un usuario con el email ${email}.`);
    duplicado.code = 'EMAIL_DUPLICADO';
    throw duplicado;
  }
  throw err;
}

function normalizarEmail(email) {
  return String(email).trim().toLowerCase();
}

async function crear({ empresaId, email, password, nombre = '', rol = 'inspector' }) {
  const hash = await bcrypt.hash(password, COSTE_BCRYPT);
  try {
    const [res] = await pool.query(
      'INSERT INTO usuarios (empresa_id, email, password_hash, nombre, rol) VALUES (?, ?, ?, ?, ?)',
      [empresaId, normalizarEmail(email), hash, nombre, rol]
    );
    return obtenerPorId(res.insertId, empresaId);
  } catch (err) {
    relanzarSiEmailDuplicado(err, email);
  }
}

async function obtenerPorId(id, empresaId) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE id = ? AND empresa_id = ?', [id, empresaId]);
  return filas.length ? aCamelCase(filas[0]) : null;
}

async function listarPorEmpresa(empresaId) {
  const [filas] = await pool.query(
    'SELECT * FROM usuarios WHERE empresa_id = ? ORDER BY nombre ASC, email ASC',
    [empresaId]
  );
  return filas.map(aCamelCase);
}

// Única función que busca sin empresaId: el login no puede conocer la empresa
// antes de identificar al usuario. Por eso el email es UNIQUE global.
async function verificarCredenciales(email, password) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [normalizarEmail(email)]);
  if (filas.length === 0) {
    // Se compara igual contra un hash descartable para que un email inexistente
    // tarde lo mismo que uno real y no se pueda enumerar usuarios por tiempo.
    await bcrypt.compare(password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return null;
  }
  const fila = filas[0];
  if (!(await bcrypt.compare(password, fila.password_hash))) return null;
  if (fila.estado !== 'activo') return null;
  return aCamelCase(fila);
}

const CAMPOS_ACTUALIZABLES = { nombre: 'nombre', rol: 'rol', estado: 'estado' };

async function actualizar(id, empresaId, cambios) {
  const columnas = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    const columna = CAMPOS_ACTUALIZABLES[campo];
    if (!columna) continue;
    columnas.push(`${columna} = ?`);
    valores.push(valor);
  }
  if (columnas.length === 0) return obtenerPorId(id, empresaId);
  valores.push(id, empresaId);
  await pool.query(`UPDATE usuarios SET ${columnas.join(', ')} WHERE id = ? AND empresa_id = ?`, valores);
  return obtenerPorId(id, empresaId);
}

async function cambiarPassword(id, empresaId, password) {
  const hash = await bcrypt.hash(password, COSTE_BCRYPT);
  await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ? AND empresa_id = ?', [hash, id, empresaId]);
  return obtenerPorId(id, empresaId);
}

module.exports = {
  crear,
  obtenerPorId,
  listarPorEmpresa,
  verificarCredenciales,
  actualizar,
  cambiarPassword,
};
