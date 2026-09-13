const express = require('express');
const authService = require('../services/authService');
const { validarBody } = require('../middleware/validar');
const esquemas = require('../schemas/auth');
const logger = require('../services/logger');

const router = express.Router();

router.post('/auth/login', validarBody(esquemas.login), async (req, res) => {
  const { email, password } = req.body;

  try {
    const sesion = await authService.login(email, password);
    // Mismo mensaje para email inexistente, contraseña incorrecta y usuario
    // inactivo: distinguirlos permitiría enumerar cuentas válidas.
    if (!sesion) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });

    return res.json({
      token: sesion.token,
      usuario: {
        id: sesion.usuario.id,
        email: sesion.usuario.email,
        nombre: sesion.usuario.nombre,
        rol: sesion.usuario.rol,
        empresaId: sesion.usuario.empresaId,
      },
    });
  } catch (err) {
    if (err.code === 'SIN_JWT_SECRET') {
      logger.error('Falta JWT_SECRET', err);
      return res.status(503).json({ error: 'La autenticación no está configurada en el backend.' });
    }
    logger.error('Error en login', err);
    return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
});

module.exports = router;
