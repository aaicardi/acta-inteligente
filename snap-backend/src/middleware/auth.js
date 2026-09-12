const authService = require('../services/authService');
const logger = require('../services/logger');

// Monta req.auth = { userId, empresaId, rol }. Todas las rutas de negocio
// cuelgan de aquí: sin req.auth no hay empresaId, y sin empresaId la capa de
// datos no puede resolver ninguna consulta.
function requireAuth(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Se requiere autenticación.' });
  }

  try {
    const payload = authService.verificar(token);
    req.auth = { userId: payload.userId, empresaId: payload.empresaId, rol: payload.rol };
    return next();
  } catch (err) {
    if (err.code === 'SIN_JWT_SECRET') {
      logger.error('Falta JWT_SECRET', err);
      return res.status(503).json({ error: 'La autenticación no está configurada en el backend.' });
    }
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador.' });
  }
  return next();
}

// Separacion estricta de responsabilidades: el admin gestiona la empresa
// (usuarios, plantilla, consumo, auditoria) pero no diligencia actas — eso es
// trabajo del inspector. Se aplica solo a las rutas de escritura (crear,
// analizar, generar); la lectura del historico sigue abierta a ambos roles.
function requireInspector(req, res, next) {
  if (req.auth?.rol === 'admin') {
    return res.status(403).json({ error: 'Los administradores no diligencian actas. Usa una cuenta de inspector.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin, requireInspector };
