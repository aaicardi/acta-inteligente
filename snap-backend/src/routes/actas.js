const express = require('express');
const actasDb = require('../db/actas');
const itemsDb = require('../db/items');
const fotosDb = require('../db/fotos');
const empresasDb = require('../db/empresas');
const cloudinaryService = require('../services/cloudinaryService');
const { analizarProducto, validarFotos } = require('../services/visionService');
const colaAnalisis = require('../services/colaAnalisis');
const consumoIaService = require('../services/consumoIaService');
const auditoriaService = require('../services/auditoriaService');
const { generarActa } = require('../services/excelService');
const plantillaService = require('../services/plantillaService');
const { requireAuth, requireInspector } = require('../middleware/auth');
const { validarBody } = require('../middleware/validar');
const esquemas = require('../schemas/actas');
const logger = require('../services/logger');

const router = express.Router();

// Todas las rutas de actas exigen sesión: de req.auth sale el empresaId que
// la capa de datos necesita para aislar los datos de cada cliente.
router.use(requireAuth);

function manejarError(req, res, err, mensajePorDefecto) {
  if (err.code === 'ITEM_DUPLICADO') {
    return res.status(409).json({ error: err.message });
  }
  logger.error(mensajePorDefecto, err, { empresaId: req.auth?.empresaId, ruta: req.originalUrl });
  return res.status(500).json({ error: mensajePorDefecto });
}

const NO_ENCONTRADA = { error: 'Acta no encontrada.' };
const ITEM_NO_ENCONTRADO = { error: 'Producto no encontrado.' };

async function borrarFotosEnCloudinary(fotos) {
  await Promise.all(fotos.map((foto) => cloudinaryService.eliminarFoto(foto.publicId).catch(() => {})));
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

// Firma para que el navegador suba las fotos de este item directo a
// Cloudinary (sin pasar por el backend, ver cloudinaryService.firmarSubida).
// Una sola firma cubre todas las fotos del lote: el folder+timestamp firmados
// son los mismos para todas.
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

// Traduce los errores conocidos de analizarProducto al estado 'revisar' del
// item, para que el trabajo en segundo plano deje rastro visible en vez de
// morir en silencio (el inspector ya recibio el 202 y no vera esta excepcion).
function motivoDeError(err, contexto) {
  if (err.code === 'SIN_API_KEY') {
    logger.error('Falta la clave de API del proveedor de IA', err, contexto);
    return 'El servicio de IA no está configurado en el backend.';
  }
  if (err.code === 'FOTO_MUY_GRANDE') return err.message;
  logger.error('Error analizando producto', err, contexto);
  return 'No se pudo analizar el producto con IA. Intenta de nuevo.';
}

// Recibe fotos que el navegador ya subio directo a Cloudinary (url+publicId),
// las persiste y responde 202 de inmediato dejando el item en 'analizando':
// el analisis con la IA corre en segundo plano (ver colaAnalisis) para que la
// peticion HTTP no quede bloqueada esperando a OpenAI. El frontend consulta
// GET /actas/:id hasta que el item deje de estar 'analizando'.
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
      fotosGuardadas = await Promise.all(
        fotos.map((f, idx) => fotosDb.crear({ itemId, url: f.url, publicId: f.publicId, orden: idx }))
      );
    }

    const marcadoAnalizando = await itemsDb.actualizar(itemId, empresaId, { estado: 'analizando' });

    colaAnalisis.encolar(async () => {
      try {
        // Las URLs firmadas guardadas son las que se le pasan a la IA, no las
        // del body: asi la IA siempre lee la misma foto que quedo persistida,
        // aunque el body traiga una firma con TTL distinto.
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

// Generar mientras el acta sigue 'en_curso' es diligenciarla (el admin no lo
// hace); volver a descargar el Excel de un acta ya 'generada' es una simple
// consulta del documento, y esa sí se permite a cualquier rol.
router.post('/actas/:id/generar', async (req, res) => {
  try {
    const { empresaId } = req.auth;
    const acta = await actasDb.obtenerPorId(req.params.id, empresaId);
    if (!acta) return res.status(404).json(NO_ENCONTRADA);

    if (acta.estado === 'en_curso' && req.auth.rol === 'admin') {
      return res.status(403).json({ error: 'Los administradores no diligencian actas. Usa una cuenta de inspector.' });
    }

    const empresa = await empresasDb.obtenerPorId(empresaId);
    const fuentePlantilla = await plantillaService.resolverParaEmpresa(empresa);
    const buffer = await generarActa({ encabezado: acta, items: acta.items }, fuentePlantilla);
    const nombreArchivo = `acta_${acta.doNo || 'sin_do'}.xlsx`;
    await actasDb.marcarGenerada(acta.id, empresaId, nombreArchivo);

    // El evento mas relevante para una auditoria en aduanas: quien genero el
    // documento oficial, y con que datos de despacho (do_no) en ese momento.
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
