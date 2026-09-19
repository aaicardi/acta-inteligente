const express = require('express');
const actasDb = require('../db/actas');
const itemsDb = require('../db/items');
const fotosDb = require('../db/fotos');
const empresasDb = require('../db/empresas');
const { ejecutarEnTransaccion } = require('../db/transaccion');
const cloudinaryService = require('../services/cloudinaryService');
const { analizarProducto, validarFotos } = require('../services/visionService');
const colaAnalisis = require('../services/colaAnalisis');
const consumoIaService = require('../services/consumoIaService');
const auditoriaService = require('../services/auditoriaService');
const { generarActa } = require('../services/excelService');
const plantillaService = require('../services/plantillaService');
const { requireAuth, requireInspector, bloquearAdminSiEnCurso } = require('../middleware/auth');
const { validarBody } = require('../middleware/validar');
const { crearManejadorError } = require('../middleware/manejarError');
const esquemas = require('../schemas/actas');
const logger = require('../services/logger');

const router = express.Router();


router.use(requireAuth);

const manejarError = crearManejadorError({ ITEM_DUPLICADO: 409 });

const NO_ENCONTRADA = { error: 'Acta no encontrada.' };
const ITEM_NO_ENCONTRADO = { error: 'Producto no encontrado.' };

async function borrarFotosEnCloudinary(fotos) {
  await Promise.all(
    fotos.map((foto) =>
      cloudinaryService.eliminarFoto(foto.publicId).catch((err) =>
        logger.warn('No se pudo eliminar foto en Cloudinary', { publicId: foto.publicId, error: err.message })
      )
    )
  );
}

router.post('/actas', requireInspector, async (req, res) => {
  try {
    const acta = await actasDb.crear(req.auth.empresaId, req.auth.userId);
    return res.status(201).json(acta);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo crear el acta.');
  }
});

router.get('/actas/en-curso', async (req, res) => {
  try {
    const acta = await actasDb.obtenerEnCurso(req.auth.empresaId, req.auth.userId);
    return res.json(acta);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar el acta en curso.');
  }
});

router.get('/actas', async (req, res) => {
  try {
    const { q, estado } = req.query;
    const actas = await actasDb.listar(req.auth.empresaId, { q, estado });
    return res.json(actas);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo listar el histórico de actas.');
  }
});

router.get('/actas/:id', async (req, res) => {
  try {
    const acta = await actasDb.obtenerPorId(req.params.id, req.auth.empresaId);
    if (!acta) return res.status(404).json(NO_ENCONTRADA);
    return res.json(acta);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar el acta.');
  }
});


router.get('/actas/:id/items/:itemId/estado', async (req, res) => {
  try {
    const item = await itemsDb.obtenerPorId(req.params.itemId, req.auth.empresaId);
    if (!item || item.actaId !== Number(req.params.id)) return res.status(404).json(ITEM_NO_ENCONTRADO);
    return res.json(item);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo consultar el estado del producto.');
  }
});

router.patch('/actas/:id', requireInspector, validarBody(esquemas.actualizarEncabezado), async (req, res) => {
  try {
    const acta = await actasDb.actualizarEncabezado(req.params.id, req.auth.empresaId, req.body);
    if (!acta) return res.status(404).json(NO_ENCONTRADA);
    return res.json(acta);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo actualizar el encabezado.');
  }
});

router.delete('/actas/:id', requireInspector, async (req, res) => {
  try {
    const fotos = await actasDb.eliminar(req.params.id, req.auth.empresaId);
    if (fotos === null) return res.status(404).json(NO_ENCONTRADA);
    await borrarFotosEnCloudinary(fotos);
    await auditoriaService.registrar({
      empresaId: req.auth.empresaId,
      usuarioId: req.auth.userId,
      accion: 'acta.eliminar',
      recursoTipo: 'acta',
      recursoId: Number(req.params.id),
    });
    return res.status(204).send();
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo eliminar el acta.');
  }
});

router.post('/actas/:id/items', requireInspector, validarBody(esquemas.crearItem), async (req, res) => {
  try {
    const { orden } = req.body;
    const item = await itemsDb.crear(req.params.id, req.auth.empresaId, { orden });
    if (!item) return res.status(404).json(NO_ENCONTRADA);
    return res.status(201).json(item);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo agregar el producto.');
  }
});

router.patch('/actas/:id/items/:itemId', requireInspector, validarBody(esquemas.actualizarItem), async (req, res) => {
  try {
    const item = await itemsDb.actualizar(req.params.itemId, req.auth.empresaId, req.body);
    if (!item) return res.status(404).json(ITEM_NO_ENCONTRADO);
    return res.json(item);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo actualizar el producto.');
  }
});

router.patch('/actas/:id/items/:itemId/orden', requireInspector, validarBody(esquemas.actualizarOrdenItem), async (req, res) => {
  try {
    const { orden } = req.body;
    const item = await itemsDb.actualizarOrden(req.params.itemId, req.auth.empresaId, orden);
    if (!item) return res.status(404).json(ITEM_NO_ENCONTRADO);
    return res.json(item);
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo actualizar el número de ítem.');
  }
});

router.delete('/actas/:id/items/:itemId', requireInspector, async (req, res) => {
  try {
    const fotos = await itemsDb.eliminar(req.params.itemId, req.auth.empresaId);
    if (fotos === null) return res.status(404).json(ITEM_NO_ENCONTRADO);
    await borrarFotosEnCloudinary(fotos);
    await auditoriaService.registrar({
      empresaId: req.auth.empresaId,
      usuarioId: req.auth.userId,
      accion: 'item.eliminar',
      recursoTipo: 'item',
      recursoId: Number(req.params.itemId),
      detalle: { actaId: Number(req.params.id) },
    });
    return res.status(204).send();
  } catch (err) {
    return manejarError(req, res, err, 'No se pudo eliminar el producto.');
  }
});


router.post('/actas/:id/items/:itemId/firma-subida', requireInspector, async (req, res) => {
  try {
    const { empresaId } = req.auth;
    const item = await itemsDb.obtenerPorId(req.params.itemId, empresaId);
    if (!item) return res.status(404).json(ITEM_NO_ENCONTRADO);

    const empresa = await empresasDb.obtenerPorId(empresaId);
    const firma = cloudinaryService.firmarSubida({
      empresaSlug: empresa.slug,
      actaId: req.params.id,
      itemId: req.params.itemId,
    });
    return res.json(firma);
  } catch (err) {
    logger.error('No se pudo generar la firma de subida', err, {
      empresaId: req.auth?.empresaId,
      actaId: req.params.id,
      itemId: req.params.itemId,
    });
    return res.status(500).json({ error: 'No se pudo preparar la subida de fotos.' });
  }
});


function motivoDeError(err, contexto) {
  if (err.code === 'SIN_API_KEY') {
    logger.error('Falta la clave de API del proveedor de IA', err, contexto);
    return 'El servicio de IA no está configurado en el backend.';
  }
  if (err.code === 'FOTO_MUY_GRANDE') return err.message;
  logger.error('Error analizando producto', err, contexto);
  return 'No se pudo analizar el producto con IA. Intenta de nuevo.';
}


router.post('/actas/:id/items/:itemId/analizar', requireInspector, validarBody(esquemas.analizarItem), async (req, res) => {
  const { itemId } = req.params;
  const { empresaId } = req.auth;
  const { fotos } = req.body;

  try {
    validarFotos(fotos.map((f) => f.url));

    const item = await itemsDb.obtenerPorId(itemId, empresaId);
    if (!item) return res.status(404).json(ITEM_NO_ENCONTRADO);

    let fotosGuardadas = item.fotos;

    if (fotosGuardadas.length === 0) {

      fotosGuardadas = await ejecutarEnTransaccion(async (conn) => {
        const guardadas = [];
        for (const [idx, f] of fotos.entries()) {
          guardadas.push(await fotosDb.crear({ itemId, url: f.url, publicId: f.publicId, orden: idx }, conn));
        }
        return guardadas;
      });
    }

    const marcadoAnalizando = await itemsDb.actualizar(itemId, empresaId, { estado: 'analizando' });

    colaAnalisis.encolar(async () => {
      try {

        const resultado = await consumoIaService.conRegistro(
          { empresaId, itemId, numFotos: fotosGuardadas.length },
          () => analizarProducto(fotosGuardadas.map((f) => f.url))
        );
        await itemsDb.actualizar(itemId, empresaId, {
          referencia: resultado.referencia,
          modelo: resultado.modelo,
          serial: resultado.serial,
          paisOrigen: resultado.paisOrigen,
          descripcion: resultado.descripcion,
          marca: resultado.marca,
          datosAdicionales: resultado.datosAdicionales,
          confianza: resultado.confianza,
          motivoRevision: resultado.motivoRevision,
          estado: resultado.estado,
        });
      } catch (err) {
        await itemsDb.actualizar(itemId, empresaId, {
          estado: 'revisar',
          motivoRevision: motivoDeError(err, { empresaId, itemId }),
        });
      }
    });

    return res.status(202).json(marcadoAnalizando);
  } catch (err) {
    if (err.code === 'FOTO_MUY_GRANDE') {
      return res.status(413).json({ error: err.message });
    }
    logger.error('Error preparando el análisis', err, { empresaId, itemId });
    return res.status(502).json({ error: 'No se pudo analizar el producto con IA. Intenta de nuevo.' });
  }
});


router.post('/actas/:id/generar', async (req, res) => {
  try {
    const { empresaId } = req.auth;
    const acta = await actasDb.obtenerPorId(req.params.id, empresaId);
    if (!acta) return res.status(404).json(NO_ENCONTRADA);

    const motivoBloqueo = bloquearAdminSiEnCurso(acta, req.auth.rol);
    if (motivoBloqueo) return res.status(403).json({ error: motivoBloqueo });

    const empresa = await empresasDb.obtenerPorId(empresaId);
    const fuentePlantilla = await plantillaService.resolverParaEmpresa(empresa);
    const buffer = await generarActa({ encabezado: acta, items: acta.items }, fuentePlantilla);
    const nombreArchivo = `acta_${acta.doNo || 'sin_do'}.xlsx`;
    await actasDb.marcarGenerada(acta.id, empresaId, nombreArchivo);


    await auditoriaService.registrar({
      empresaId,
      usuarioId: req.auth.userId,
      accion: 'acta.generar',
      recursoTipo: 'acta',
      recursoId: acta.id,
      detalle: { doNo: acta.doNo, nombreArchivo, totalItems: acta.items.length },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.send(buffer);
  } catch (err) {
    return manejarError(req, res, err, 'Error interno generando el acta.');
  }
});

module.exports = router;
