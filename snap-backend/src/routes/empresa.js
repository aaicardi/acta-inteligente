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
const logger = require('../services/logger');

const router = express.Router();

// En memoria (no disco): el archivo es chico (una plantilla .xlsx, no fotos)
// y se valida y reenvia a Cloudinary en el mismo request, sin necesidad de
// persistir un temporal.
const subidaPlantilla = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB: de sobra para un .xlsx de plantilla
});

// Rutas administrativas sobre la empresa propia del admin logueado (consumo
// de IA hoy; plantilla de acta mas adelante, ver 3.5 del spec). Distinto de
// /usuarios porque no es CRUD de usuarios, es configuracion/estado de la
// empresa como unidad.
router.use('/empresa', requireAuth, requireAdmin);

// Solo lectura: registra consumo (services/consumoIaService.js) pero no
// bloquea ni limita a nadie todavia — ver decision de producto en el spec.
router.get('/empresa/consumo-ia', async (req, res) => {
  try {
    const { desde } = req.query;
    const resumen = await consumoIaDb.resumenPorEmpresa(req.auth.empresaId, { desde });
    return res.json(resumen);
  } catch (err) {
    logger.error('No se pudo consultar el consumo de IA', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo consultar el consumo de IA.' });
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
    logger.error('No se pudo consultar la auditoría', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo consultar la auditoría.' });
  }
});

router.get('/empresa/plantilla', async (req, res) => {
  try {
    const empresa = await empresasDb.obtenerPorId(req.auth.empresaId);
    return res.json({ personalizada: !!empresa.plantillaPublicId });
  } catch (err) {
    logger.error('No se pudo consultar la plantilla', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo consultar la plantilla.' });
  }
});

// La plantilla subida DEBE conservar el mismo esqueleto de filas que la
// plantilla original (ver excelService.js): solo puede cambiar textos fijos,
// logo, colores. Se valida antes de subir a Cloudinary, para no gastar esa
// subida con un archivo que de todas formas se va a rechazar.
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

    // Si ya habia una plantilla propia, se reemplaza: se borra la anterior
    // despues de que la nueva quedo guardada, no antes (para no perder la
    // vieja si la subida nueva fallara a mitad).
    const plantillaAnterior = empresa.plantillaPublicId;
    const { publicId } = await cloudinaryService.subirPlantilla(req.file.buffer, empresa.slug);
    await empresasDb.actualizarPlantilla(empresaId, publicId);
    plantillaService.invalidar(empresaId);

    if (plantillaAnterior) {
      await cloudinaryService.eliminarPlantilla(plantillaAnterior).catch(() => {});
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
    logger.error('No se pudo subir la plantilla', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo subir la plantilla.' });
  }
});

// Vuelve a la plantilla por defecto.
router.delete('/empresa/plantilla', async (req, res) => {
  try {
    const { empresaId } = req.auth;
    const empresa = await empresasDb.obtenerPorId(empresaId);
    if (!empresa.plantillaPublicId) return res.status(204).send();

    const publicIdAnterior = empresa.plantillaPublicId;
    await empresasDb.actualizarPlantilla(empresaId, null);
    plantillaService.invalidar(empresaId);
    await cloudinaryService.eliminarPlantilla(publicIdAnterior).catch(() => {});

    await auditoriaService.registrar({
      empresaId,
      usuarioId: req.auth.userId,
      accion: 'empresa.plantilla_restaurar',
      recursoTipo: 'empresa',
      recursoId: empresaId,
    });

    return res.status(204).send();
  } catch (err) {
    logger.error('No se pudo restaurar la plantilla', err, { empresaId: req.auth.empresaId });
    return res.status(500).json({ error: 'No se pudo restaurar la plantilla.' });
  }
});

module.exports = router;
