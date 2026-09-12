const auditoriaDb = require('../db/auditoria');
const logger = require('./logger');

// Registrar auditoria nunca debe tumbar la accion real que se esta
// auditando: si el INSERT falla, se loguea y se continua — perder un
// registro de auditoria es menos grave que fallarle una peticion real al
// inspector por un problema en una tabla secundaria.
async function registrar(datos) {
  try {
    await auditoriaDb.registrar(datos);
  } catch (err) {
    logger.error('No se pudo registrar auditoría', err, {
      empresaId: datos.empresaId,
      accion: datos.accion,
    });
  }
}

module.exports = { registrar };
