const itemsDb = require('../db/items');
const logger = require('./logger');


const UMBRAL_MINUTOS = Number(process.env.UMBRAL_ANALISIS_HUERFANO_MIN) || 5;


async function recuperarItemsHuerfanos() {
  try {
    const recuperados = await itemsDb.sistema.marcarHuerfanosComoRevisar(UMBRAL_MINUTOS);
    for (const item of recuperados) {
      logger.warn('Item huérfano recuperado tras reinicio', item);
    }
    if (recuperados.length > 0) {
      logger.info(`Recuperados ${recuperados.length} ítem(s) atascados en 'analizando'.`);
    }
  } catch (err) {
    logger.error('No se pudo ejecutar la recuperación de análisis huérfanos', err);
  }
}

module.exports = { recuperarItemsHuerfanos };
