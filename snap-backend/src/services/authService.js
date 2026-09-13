const jwt = require('jsonwebtoken');
const usuariosDb = require('../db/usuarios');

// 12h cubre una jornada de inspección completa sin obligar al inspector a
// volver a entrar en mitad de un acta.
const EXPIRACION = '12h';

function secreto() {
  const valor = process.env.JWT_SECRET;
  if (!valor) {
    const err = new Error('Falta JWT_SECRET en el backend (.env).');
    err.code = 'SIN_JWT_SECRET';
    throw err;
  }
  return valor;
}

function firmar(usuario) {
  return jwt.sign(
    { userId: usuario.id, empresaId: usuario.empresaId, rol: usuario.rol },
    secreto(),
    { expiresIn: EXPIRACION }
  );
}

function verificar(token) {
  return jwt.verify(token, secreto());
}

async function login(email, password) {
  const usuario = await usuariosDb.verificarCredenciales(email, password);
  if (!usuario) return null;
  return { token: firmar(usuario), usuario };
}

module.exports = { login, verificar, firmar };
