const logger = require('../services/logger');


function crearManejadorError(codigosConocidos = {}) {
  return function manejarError(req, res, err, mensajePorDefecto) {
    const status = codigosConocidos[err.code];
    if (status) {
      return res.status(status).json({ error: err.message });
    }
    logger.error(mensajePorDefecto, err, { empresaId: req.auth?.empresaId, ruta: req.originalUrl });
    return res.status(500).json({ error: mensajePorDefecto });
  };
}

module.exports = { crearManejadorError };
