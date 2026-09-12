const express = require('express');
const usuariosDb = require('../db/usuarios');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validarBody } = require('../middleware/validar');
const esquemas = require('../schemas/usuarios');
const logger = require('../services/logger');
const auditoriaService = require('../services/auditoriaService');

const router = express.Router();

// El admin solo administra usuarios de SU empresa: el empresaId sale siempre
// de la sesión, nunca del body, para que no se pueda crear un usuario dentro
// de otra empresa manipulando la petición.
router.use('/usuarios', requireAuth, requireAdmin);

router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await usuariosDb.listarPorEmpresa(req.auth.empresaId);
    return res.json(usuarios);
  } catch (err) {
    logger.error('No se pudo listar usuarios', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo listar los usuarios.' });
  }
});

router.post('/usuarios', validarBody(esquemas.crear), async (req, res) => {
  const { email, password, nombre, rol } = req.body;

  try {
    const usuario = await usuariosDb.crear({
      empresaId: req.auth.empresaId,
      email,
      password,
      nombre,
      rol,
    });
    await auditoriaService.registrar({
      empresaId: req.auth.empresaId,
      usuarioId: req.auth.userId,
      accion: 'usuario.crear',
      recursoTipo: 'usuario',
      recursoId: usuario.id,
      detalle: { email: usuario.email, rol: usuario.rol },
    });
    return res.status(201).json(usuario);
  } catch (err) {
    if (err.code === 'EMAIL_DUPLICADO') return res.status(409).json({ error: err.message });
    logger.error('No se pudo crear el usuario', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo crear el usuario.' });
  }
});

router.patch('/usuarios/:id', validarBody(esquemas.actualizar), async (req, res) => {
  try {
    const usuario = await usuariosDb.actualizar(req.params.id, req.auth.empresaId, req.body);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    // Solo si cambio rol o estado: son los campos con implicacion de permisos,
    // no cada edicion trivial del nombre.
    if (req.body.rol !== undefined || req.body.estado !== undefined) {
      await auditoriaService.registrar({
        empresaId: req.auth.empresaId,
        usuarioId: req.auth.userId,
        accion: 'usuario.actualizar',
        recursoTipo: 'usuario',
        recursoId: usuario.id,
        detalle: { rol: req.body.rol, estado: req.body.estado },
      });
    }
    return res.json(usuario);
  } catch (err) {
    logger.error('No se pudo actualizar el usuario', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
  }
});

router.post('/usuarios/:id/password', validarBody(esquemas.cambiarPassword), async (req, res) => {
  try {
    const usuario = await usuariosDb.cambiarPassword(req.params.id, req.auth.empresaId, req.body.password);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(usuario);
  } catch (err) {
    logger.error('No se pudo cambiar la contraseña', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo cambiar la contraseña.' });
  }
});

module.exports = router;
