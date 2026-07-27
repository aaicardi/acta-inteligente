const express = require('express');
const { analizarProducto } = require('../services/visionService');

const router = express.Router();

router.post('/analizar-producto', async (req, res) => {
  const { fotos } = req.body || {};

  if (!Array.isArray(fotos) || fotos.length === 0) {
    return res.status(400).json({ error: 'Se requiere "fotos": lista de imágenes en base64.' });
  }

  try {
    const resultado = await analizarProducto(fotos);
    return res.json(resultado);
  } catch (err) {
    if (err.code === 'SIN_API_KEY') {
      console.error(err.message);
      return res.status(503).json({ error: 'El servicio de IA no está configurado en el backend.' });
    }
    if (err.code === 'SIN_FOTOS') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error analizando producto:', err);
    return res.status(502).json({ error: 'No se pudo analizar el producto con IA. Intenta de nuevo.' });
  }
});

module.exports = router;
