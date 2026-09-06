const express = require('express');
const actasDb = require('../db/actas');
const itemsDb = require('../db/items');
const fotosDb = require('../db/fotos');
const cloudinaryService = require('../services/cloudinaryService');
const { analizarProducto } = require('../services/visionService');
const { generarActa } = require('../services/excelService');

const router = express.Router();

function manejarError(res, err, mensajePorDefecto) {
  if (err.code === 'ITEM_DUPLICADO') {
    return res.status(409).json({ error: err.message });
  }
  console.error(mensajePorDefecto, err);
  return res.status(500).json({ error: mensajePorDefecto });
}

async function borrarFotosEnCloudinary(fotos) {
  await Promise.all(fotos.map((foto) => cloudinaryService.eliminarFoto(foto.publicId).catch(() => {})));
}

router.post('/actas', async (_req, res) => {
  try {
    const acta = await actasDb.crear();
    return res.status(201).json(acta);
  } catch (err) {
    return manejarError(res, err, 'No se pudo crear el acta.');
  }
});

router.get('/actas/en-curso', async (_req, res) => {
  try {
    const acta = await actasDb.obtenerEnCurso();
    return res.json(acta);
  } catch (err) {
    return manejarError(res, err, 'No se pudo consultar el acta en curso.');
  }
});

router.get('/actas', async (req, res) => {
  try {
    const { q, estado } = req.query;
    const actas = await actasDb.listar({ q, estado });
    return res.json(actas);
  } catch (err) {
    return manejarError(res, err, 'No se pudo listar el histórico de actas.');
  }
});

router.get('/actas/:id', async (req, res) => {
  try {
    const acta = await actasDb.obtenerPorId(req.params.id);
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada.' });
    return res.json(acta);
  } catch (err) {
    return manejarError(res, err, 'No se pudo consultar el acta.');
  }
});

router.patch('/actas/:id', async (req, res) => {
  try {
    const acta = await actasDb.actualizarEncabezado(req.params.id, req.body || {});
    return res.json(acta);
  } catch (err) {
    return manejarError(res, err, 'No se pudo actualizar el encabezado.');
  }
});

router.delete('/actas/:id', async (req, res) => {
  try {
    const fotos = await actasDb.eliminar(req.params.id);
    if (fotos === null) return res.status(404).json({ error: 'Acta no encontrada.' });
    await borrarFotosEnCloudinary(fotos);
    return res.status(204).send();
  } catch (err) {
    return manejarError(res, err, 'No se pudo eliminar el acta.');
  }
});

router.post('/actas/:id/items', async (req, res) => {
  try {
    const { orden } = req.body || {};
    if (orden === undefined || orden === null || orden === '') {
      return res.status(400).json({ error: 'Se requiere "orden" (número de ítem).' });
    }
    const item = await itemsDb.crear(req.params.id, { orden });
    return res.status(201).json(item);
  } catch (err) {
    return manejarError(res, err, 'No se pudo agregar el producto.');
  }
});

router.patch('/actas/:id/items/:itemId', async (req, res) => {
  try {
    const item = await itemsDb.actualizar(req.params.itemId, req.body || {});
    return res.json(item);
  } catch (err) {
    return manejarError(res, err, 'No se pudo actualizar el producto.');
  }
});

router.patch('/actas/:id/items/:itemId/orden', async (req, res) => {
  try {
    const { orden } = req.body || {};
    if (orden === undefined || orden === null || orden === '') {
      return res.status(400).json({ error: 'Se requiere "orden".' });
    }
    const item = await itemsDb.actualizarOrden(req.params.itemId, orden);
    return res.json(item);
  } catch (err) {
    return manejarError(res, err, 'No se pudo actualizar el número de ítem.');
  }
});

router.delete('/actas/:id/items/:itemId', async (req, res) => {
  try {
    const fotos = await itemsDb.eliminar(req.params.itemId);
    await borrarFotosEnCloudinary(fotos);
    return res.status(204).send();
  } catch (err) {
    return manejarError(res, err, 'No se pudo eliminar el producto.');
  }
});

// Sube fotos nuevas a Cloudinary (si el item ya tenia fotos de un intento
// anterior, se reusan sin volver a subir — evita duplicados en reintentos
// por fallo de red) y llama a la IA. Si Cloudinary falla no tiene sentido
// seguir: sin fotos persistidas no hay nada que ofrecerle al inspector.
router.post('/actas/:id/items/:itemId/analizar', async (req, res) => {
  const { itemId } = req.params;
  const { fotos: fotosBase64 } = req.body || {};

  if (!Array.isArray(fotosBase64) || fotosBase64.length === 0) {
    return res.status(400).json({ error: 'Se requiere "fotos": lista de imágenes en base64.' });
  }

  try {
    let fotosGuardadas = await fotosDb.listarPorItem(itemId);

    if (fotosGuardadas.length === 0) {
      let subidas;
      try {
        subidas = await Promise.all(
          fotosBase64.map((foto) => cloudinaryService.subirFoto(foto, { actaId: req.params.id, itemId }))
        );
      } catch (err) {
        console.error('Error subiendo fotos a Cloudinary:', err);
        return res.status(502).json({ error: 'No se pudieron guardar las fotos. Intenta de nuevo.' });
      }
      fotosGuardadas = await Promise.all(
        subidas.map((s, idx) => fotosDb.crear({ itemId, url: s.url, publicId: s.publicId, orden: idx }))
      );
    }

    const resultado = await analizarProducto(fotosBase64);

    const item = await itemsDb.actualizar(itemId, {
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

    return res.json(item);
  } catch (err) {
    if (err.code === 'SIN_API_KEY') {
      console.error(err.message);
      return res.status(503).json({ error: 'El servicio de IA no está configurado en el backend.' });
    }
    console.error('Error analizando producto:', err);
    return res.status(502).json({ error: 'No se pudo analizar el producto con IA. Intenta de nuevo.' });
  }
});

router.post('/actas/:id/generar', async (req, res) => {
  try {
    const acta = await actasDb.obtenerPorId(req.params.id);
    if (!acta) return res.status(404).json({ error: 'Acta no encontrada.' });

    const buffer = await generarActa({ encabezado: acta, items: acta.items });
    const nombreArchivo = `acta_${acta.doNo || 'sin_do'}.xlsx`;
    await actasDb.marcarGenerada(acta.id, nombreArchivo);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    return res.send(buffer);
  } catch (err) {
    return manejarError(res, err, 'Error interno generando el acta.');
  }
});

module.exports = router;
