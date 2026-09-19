const express = require('express');
const usuariosDb = require('../db/usuarios');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validarBody } = require('../middleware/validar');
const { crearManejadorError } = require('../middleware/manejarError');
const esquemas = require('../schemas/usuarios');
const auditoriaService = require('../services/auditoriaService');

const router = express.Router();

const manejarError = crearManejadorError({ EMAIL_DUPLICADO: 409 });


router.use('/usuarios', requireAuth, requireAdmin);

router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await usuariosDb.listarPorEmpresa(req.auth.empresaId);
    return res.json(usuarios);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo listar los usuarios.');
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
    return manejarError(req, res, err, 'No se pudo crear el usuario.');
  }
});

router.patch('/usuarios/:id', validarBody(esquemas.actualizar), async (req, res) => {
  try {
    const usuario = await usuariosDb.actualizar(req.params.id, req.auth.empresaId, req.body);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

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
    return manejarError(req, res, err, 'No se pudo actualizar el usuario.');
  }
});

router.post('/usuarios/:id/password', validarBody(esquemas.cambiarPassword), async (req, res) => {
  try {
    const usuario = await usuariosDb.cambiarPassword(req.params.id, req.auth.empresaId, req.body.password);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(usuario);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo cambiar la contraseña.');
  }
});

module.exports = router;
