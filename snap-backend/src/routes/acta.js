const express = require('express');
const { generarActa } = require('../services/excelService');

const router = express.Router();

router.post('/generar-acta', async (req, res) => {
  const { encabezado, items } = req.body || {};

  if (!encabezado || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Se requiere "encabezado" (objeto) y "items" (lista no vacía).',
    });
  }

  try {
    const buffer = await generarActa({ encabezado, items });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="acta_${encabezado.doNo || 'sin_do'}.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generando acta:', err);
    return res.status(500).json({ error: 'Error interno generando el acta.' });
  }
});

module.exports = router;
