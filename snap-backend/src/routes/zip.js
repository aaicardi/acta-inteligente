const express = require('express');
const multer = require('multer');
const { procesarZip } = require('../services/zipService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB, suficiente para cientos de fotos
});

router.post('/procesar-zip', upload.single('zip'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere un archivo "zip".' });
  }

  try {
    const resultado = await procesarZip(req.file.buffer);
    if (resultado.items.length === 0) {
      return res.status(400).json({
        error: 'El ZIP no contiene carpetas con fotos válidas.',
        carpetasIgnoradas: resultado.carpetasIgnoradas,
      });
    }
    return res.json(resultado);
  } catch (err) {
    console.error('Error procesando ZIP:', err);
    return res.status(500).json({ error: 'No se pudo procesar el archivo ZIP.' });
  }
});

module.exports = router;
