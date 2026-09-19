const express = require('express');
const multer = require('multer');
const consumoIaDb = require('../db/consumoIa');
const auditoriaDb = require('../db/auditoria');
const empresasDb = require('../db/empresas');
const cloudinaryService = require('../services/cloudinaryService');
const plantillaService = require('../services/plantillaService');
const excelService = require('../services/excelService');
const auditoriaService = require('../services/auditoriaService');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { crearManejadorError } = require('../middleware/manejarError');
const logger = require('../services/logger');

const router = express.Router();

const manejarError = crearManejadorError();


const subidaPlantilla = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, 
});


router.use('/empresa', requireAuth, requireAdmin);


router.get('/empresa/consumo-ia', async (req, res) => {
  try {
    const { desde } = req.query;
    const resumen = await consumoIaDb.resumenPorEmpresa(req.auth.empresaId, { desde });
    return res.json(resumen);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar el consumo de IA.');
  }
});

router.get('/empresa/auditoria', async (req, res) => {
  try {
    const { limite, antesDe } = req.query;
    const eventos = await auditoriaDb.listarPorEmpresa(req.auth.empresaId, {
      limite: limite ? Number(limite) : undefined,
      antesDe: antesDe ? Number(antesDe) : undefined,
    });
    return res.json(eventos);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar la auditoría.');
  }
});

router.get('/empresa/plantilla', async (req, res) => {
  try {
    const empresa = await empresasDb.obtenerPorId(req.auth.empresaId);
    return res.json({ personalizada: !!empresa.plantillaPublicId });
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar la plantilla.');
  }
});


router.post('/empresa/plantilla', subidaPlantilla.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere el archivo de la plantilla (.xlsx).' });
  }

  try {
    const errorValidacion = await excelService.validarPlantillaBuffer(req.file.buffer);
    if (errorValidacion) {
      return res.status(400).json({ error: errorValidacion });
    }

    const { empresaId } = req.auth;
    const empresa = await empresasDb.obtenerPorId(empresaId);


    const plantillaAnterior = empresa.plantillaPublicId;
    const { publicId } = await cloudinaryService.subirPlantilla(req.file.buffer, empresa.slug);
    await empresasDb.actualizarPlantilla(empresaId, publicId);
    plantillaService.invalidar(empresaId);

    if (plantillaAnterior) {
      await cloudinaryService.eliminarPlantilla(plantillaAnterior).catch((err) =>
        logger.warn('No se pudo eliminar la plantilla anterior en Cloudinary', { publicId: plantillaAnterior, error: err.message })
      );
    }

    await auditoriaService.registrar({
      empresaId,
      usuarioId: req.auth.userId,
      accion: 'empresa.plantilla_actualizar',
      recursoTipo: 'empresa',
      recursoId: empresaId,
    });

    return res.status(201).json({ personalizada: true });
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo subir la plantilla.');
  }
});


router.delete('/empresa/plantilla', async (req, res) => {
  try {
    const { empresaId } = req.auth;
    const empresa = await empresasDb.obtenerPorId(empresaId);
    if (!empresa.plantillaPublicId) return res.status(204).send();

    const publicIdAnterior = empresa.plantillaPublicId;
    await empresasDb.actualizarPlantilla(empresaId, null);
    plantillaService.invalidar(empresaId);
    await cloudinaryService.eliminarPlantilla(publicIdAnterior).catch((err) =>
      logger.warn('No se pudo eliminar la plantilla en Cloudinary', { publicId: publicIdAnterior, error: err.message })
    );

    await auditoriaService.registrar({
      empresaId,
      usuarioId: req.auth.userId,
      accion: 'empresa.plantilla_restaurar',
      recursoTipo: 'empresa',
      recursoId: empresaId,
    });

    return res.status(204).send();
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo restaurar la plantilla.');
  }
});

module.exports = router;
